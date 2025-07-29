// back/extensions/endpoint-invitations/src/index.js

import crypto from "crypto";

export default (router, { database }) => {
  /**
   * GET /endpoint-invitations?token=...
   * Devuelve la invitación + workspace + datos del invitador
   */
  router.get("/", async (req, res, next) => {
    try {
      const token = req.query.token;
      if (!token) {
        return res.status(400).json({ error: "Falta el token de invitación" });
      }

      const inv = await database
        .select(
          "i.id",
          "i.email",
          "i.token",
          "i.status",
          "i.invited_by",
          "u.first_name    AS inviter_first_name",
          "u.last_name     AS inviter_last_name",
          "u.email         AS inviter_email",
          "w.id            AS workspace_id",
          "w.name          AS workspace_name",
          "w.description   AS workspace_description",
          "w.is_public     AS workspace_is_public"
        )
        .from("invitations AS i")
        .leftJoin("directus_users AS u", "u.id", "i.invited_by")
        .leftJoin("workspaces       AS w", "w.id", "i.workspace_id")
        .where("i.token", token)
        .first();

      if (!inv) {
        return res.status(404).json({ error: "Invitación no encontrada" });
      }
      if (inv.status === "accepted") {
        return res.status(400).json({ error: "Invitación ya aceptada" });
      }

      return res.json({
        data: {
          id: inv.id,
          email: inv.email,
          token: inv.token,
          status: inv.status,
          invited_by: {
            id: inv.invited_by,
            first_name: inv.inviter_first_name,
            last_name: inv.inviter_last_name,
            email: inv.inviter_email,
          },
          workspace: {
            id: inv.workspace_id,
            name: inv.workspace_name,
            description: inv.workspace_description,
            is_public: Boolean(inv.workspace_is_public),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /endpoint-invitations
   * Acepta o rechaza una invitación por token
   */
  router.post("/", async (req, res, next) => {
    try {
      const { token, action = "accept" } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Falta el token de invitación" });
      }

      console.log("🔄 Action received:", action, "for token:", token);

      // 1) Leer invitación
      const inv = await database
        .select("id", "workspace_id", "invited_by", "status", "email")
        .from("invitations")
        .where({ token })
        .first();

      if (!inv) {
        return res.status(404).json({ error: "Invitación no encontrada" });
      }
      if (inv.status === "accepted") {
        return res.status(400).json({ error: "Invitación ya aceptada" });
      }
      if (inv.status === "rejected") {
        return res.status(400).json({ error: "Invitación ya rechazada" });
      }

      // 2) Verificar que el usuario actual es el destinatario de la invitación
      const currentUser = await database
        .select("email")
        .from("directus_users")
        .where({ id: req.accountability.user })
        .first();

      if (!currentUser || currentUser.email !== inv.email) {
        return res
          .status(403)
          .json({ error: "No tienes permiso para modificar esta invitación" });
      }

      // 3) Marcar invitación con el estado correspondiente
      const newStatus = action === "reject" ? "rejected" : "accepted";
      await database("invitations")
        .where({ id: inv.id })
        .update({ status: newStatus });

      console.log(`✅ Invitación marcada como: ${newStatus}`);

      // 4) Si se acepta, insertar en workspace_members
      if (action === "accept") {
        const roleFromInvitation = "viewer"; // Rol por defecto
        await database("workspace_members").insert({
          id: crypto.randomUUID(),
          workspace_id: inv.workspace_id,
          user_id: req.accountability.user,
          invited_by: inv.invited_by,
          role: roleFromInvitation,
          status: "accepted",
        });
        console.log("👥 Usuario añadido al workspace");
      }

      return res.json({ success: true, action });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /endpoint-invitations/validate
   * Valida si se puede enviar una invitación a un email para un workspace
   */
  router.post("/validate", async (req, res, next) => {
    try {
      const { email, workspace_id } = req.body;
      if (!email || !workspace_id) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }

      // 1) Verificar si el usuario ya es miembro del workspace
      const existingMember = await database
        .select("wm.id", "u.email")
        .from("workspace_members AS wm")
        .leftJoin("directus_users AS u", "u.id", "wm.user_id")
        .where({
          "wm.workspace_id": workspace_id,
          "u.email": email,
        })
        .first();

      if (existingMember) {
        return res.status(400).json({
          error: "El usuario ya es miembro de este workspace",
          code: "ALREADY_MEMBER",
        });
      }

      // 2) Verificar si ya existe una invitación pendiente
      const pendingInvitation = await database
        .select("id", "status")
        .from("invitations")
        .where({
          email,
          workspace_id,
          status: "pending",
        })
        .first();

      if (pendingInvitation) {
        return res.status(400).json({
          error: "Ya existe una invitación pendiente para este usuario",
          code: "PENDING_INVITATION",
        });
      }

      // 3) Verificar si el email es del owner del workspace
      const workspace = await database
        .select("w.owner", "u.email")
        .from("workspaces AS w")
        .leftJoin("directus_users AS u", "u.id", "w.owner")
        .where("w.id", workspace_id)
        .first();

      if (workspace && workspace.email === email) {
        return res.status(400).json({
          error: "No puedes invitar al propietario del workspace",
          code: "OWNER_EMAIL",
        });
      }

      return res.json({
        success: true,
        message: "La invitación puede ser enviada",
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /endpoint-invitations/workspace/:workspaceId
   * Obtiene todas las invitaciones de un workspace específico
   */
  router.get("/workspace/:workspaceId", async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      if (!workspaceId) {
        return res.status(400).json({ error: "Falta el ID del workspace" });
      }

      // Verificar que el usuario tiene acceso al workspace
      const userWorkspace = await database
        .select("wm.id")
        .from("workspace_members AS wm")
        .where({
          "wm.workspace_id": workspaceId,
          "wm.user_id": req.accountability.user,
        })
        .first();

      const workspaceOwner = await database
        .select("w.owner")
        .from("workspaces AS w")
        .where({
          "w.id": workspaceId,
          "w.owner": req.accountability.user,
        })
        .first();

      if (!userWorkspace && !workspaceOwner) {
        return res.status(403).json({
          error:
            "No tienes permiso para ver las invitaciones de este workspace",
        });
      }

      const invitations = await database
        .select(
          "i.id",
          "i.email",
          "i.status",
          "i.date_created",
          "i.date_updated",
          "u.first_name AS inviter_first_name",
          "u.last_name AS inviter_last_name",
          "u.email AS inviter_email"
        )
        .from("invitations AS i")
        .leftJoin("directus_users AS u", "u.id", "i.invited_by")
        .where("i.workspace_id", workspaceId)
        .orderBy("i.date_created", "desc");

      return res.json({
        data: invitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          status: inv.status,
          date_created: inv.date_created,
          date_updated: inv.date_updated,
          invited_by: {
            first_name: inv.inviter_first_name,
            last_name: inv.inviter_last_name,
            email: inv.inviter_email,
          },
        })),
      });
    } catch (err) {
      next(err);
    }
  });
};
