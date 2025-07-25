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
   * Marca la invitación como accepted e inserta en workspace_members
   */
  router.post("/", async (req, res, next) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Falta el token de invitación" });
      }

      // 1) Leer invitación
      const inv = await database
        .select("id", "workspace_id", "invited_by", "status")
        .from("invitations")
        .where({ token })
        .first();

      if (!inv) {
        return res.status(404).json({ error: "Invitación no encontrada" });
      }
      if (inv.status === "accepted") {
        return res.status(400).json({ error: "Invitación ya aceptada" });
      }

      // 2) Marcar invitación como accepted
      await database("invitations")
        .where({ id: inv.id })
        .update({ status: "accepted" });
      const roleFromInvitation = inv.role || "viewer";
      console.log("Role from invitation:", roleFromInvitation);
      // 3) Insertar en workspace_members
      await database("workspace_members").insert({
        id: crypto.randomUUID(),
        workspace_id: inv.workspace_id,
        user_id: req.accountability.user,
        invited_by: inv.invited_by,
        role: roleFromInvitation,
        status: "accepted",
        // date_created & user_created los gestiona Directus
      });

      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });
};
