// back/extensions/endpoint-workspaces/src/index.js
import fetch from "node-fetch";

export default (router, { database, services }) => {
  // Función auxiliar para emitir eventos de socket
  const emitSocketEvent = async (type, data, to = null, workspaceId = null) => {
    try {
      const socketUrl =
        process.env.SOCKET_SERVER_URL || "http://localhost:4010";

      const payload = { type, data };
      if (to) payload.to = to;
      if (workspaceId) payload.workspaceId = workspaceId;

      console.log(`📤 Evento WebSocket enviado: ${type}`, payload);

      const response = await fetch(`${socketUrl}/emit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error emitiendo evento socket:", errorText);
      } else {
        console.log(`✅ Evento ${type} enviado correctamente`);
      }
    } catch (error) {
      console.error("Error al conectar con socket server:", error);
    }
  };
  /**
   * GET /endpoint-workspaces
   * Devuelve todos los workspaces del usuario autenticado (propios y donde fue invitado)
   */
  router.get("/", async (req, res, next) => {
    try {
      const userId = req.accountability?.user;

      if (!userId) {
        return res.status(401).json({ error: "No autorizado" });
      }

      // 1. Workspaces donde el usuario es owner
      const workspacesAsOwner = await database("workspaces")
        .select("*")
        .where("owner", userId);

      // 2. Workspaces donde el usuario es miembro (por workspace_members)
      const workspacesAsMember = await database("workspace_members as wm")
        .join("workspaces as w", "wm.workspace_id", "w.id")
        .select("w.*")
        .where("wm.user_id", userId);

      // 3. Combinar y eliminar duplicados por id
      const all = [...workspacesAsOwner, ...workspacesAsMember];
      const unique = Object.values(
        all.reduce((acc, ws) => {
          acc[ws.id] = ws;
          return acc;
        }, {})
      );

      return res.json({ data: unique });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    const { id } = req.params;
    const userId = req.accountability.user;

    try {
      // 1. Verificar acceso al workspace
      const workspace = await database("workspaces")
        .leftJoin(
          "workspace_members",
          "workspace_members.workspace_id",
          "workspaces.id"
        )
        .where("workspaces.id", id)
        .andWhere((builder) =>
          builder
            .where("workspaces.owner", userId)
            .orWhere("workspace_members.user_id", userId)
        )
        .select("workspaces.*")
        .first();

      if (!workspace) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // 2. Obtener los miembros del workspace con información del usuario
      const members = await database("workspace_members as wm")
        .join("directus_users as u", "wm.user_id", "u.id")
        .where("wm.workspace_id", id)
        .select(
          "wm.id",
          "wm.role",
          "wm.invited_by",
          "wm.date_created",
          "wm.user_id",
          "u.first_name",
          "u.last_name",
          "u.email",
          "u.avatar"
        );

      // 3. Encontrar el rol del usuario actual
      const currentUserMember = members.find((m) => m.user_id === userId);
      const userRole = currentUserMember
        ? currentUserMember.role
        : workspace.owner === userId
        ? "owner"
        : null;

      // 4. Retornar workspace con información adicional
      res.json({
        data: {
          ...workspace,
          members: members,
          userRole: userRole,
          isOwner: workspace.owner === userId,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /:workspaceId/members/:memberId/role
   * Actualiza el rol de un miembro del workspace
   */
  router.post(
    "/:workspaceId/members/:memberId/role",
    async (req, res, next) => {
      try {
        const { workspaceId, memberId } = req.params;
        const { role } = req.body;
        const userId = req.accountability?.user;

        if (!userId) {
          return res.status(401).json({ error: "No autorizado" });
        }

        // Verificar que el usuario es owner del workspace
        const workspace = await database("workspaces")
          .where("id", workspaceId)
          .where("owner", userId)
          .first();

        if (!workspace) {
          return res
            .status(403)
            .json({ error: "Solo el propietario puede cambiar roles" });
        }

        // Actualizar el rol del miembro
        await database("workspace_members")
          .where("id", memberId)
          .where("workspace_id", workspaceId)
          .update({ role });

        // Obtener información completa del miembro actualizado
        const updatedMember = await database("workspace_members as wm")
          .join("directus_users as u", "wm.user_id", "u.id")
          .where("wm.id", memberId)
          .select(
            "wm.id",
            "wm.role",
            "wm.user_id",
            "wm.workspace_id",
            "u.first_name",
            "u.last_name",
            "u.email",
            "u.avatar"
          )
          .first();

        // Emitir evento WebSocket
        await emitSocketEvent(
          "workspace-member-updated",
          {
            workspaceId: workspaceId,
            member: updatedMember,
          },
          updatedMember.email, // to - para notificar al usuario
          workspaceId // workspaceId - para notificar al workspace
        );

        res.json({
          message: "Rol actualizado correctamente",
          data: updatedMember,
        });
      } catch (error) {
        console.error("Error updating member role:", error);
        res.status(500).json({ error: "Error interno del servidor" });
      }
    }
  );

  /**
   * DELETE /:workspaceId/members/:memberId
   * Elimina un miembro del workspace
   */
  router.delete("/:workspaceId/members/:memberId", async (req, res, next) => {
    try {
      const { workspaceId, memberId } = req.params;
      const userId = req.accountability?.user;

      if (!userId) {
        return res.status(401).json({ error: "No autorizado" });
      }

      // Verificar que el usuario es owner del workspace
      const workspace = await database("workspaces")
        .where("id", workspaceId)
        .where("owner", userId)
        .first();

      if (!workspace) {
        return res
          .status(403)
          .json({ error: "Solo el propietario puede eliminar miembros" });
      }

      // Obtener información del miembro antes de eliminarlo
      const memberToDelete = await database("workspace_members as wm")
        .join("directus_users as u", "wm.user_id", "u.id")
        .where("wm.id", memberId)
        .where("wm.workspace_id", workspaceId)
        .select(
          "wm.id",
          "wm.user_id",
          "wm.workspace_id",
          "u.first_name",
          "u.last_name",
          "u.email"
        )
        .first();

      if (!memberToDelete) {
        return res.status(404).json({ error: "Miembro no encontrado" });
      }

      // Eliminar el miembro
      await database("workspace_members")
        .where("id", memberId)
        .where("workspace_id", workspaceId)
        .del();

      // Emitir evento WebSocket
      await emitSocketEvent(
        "workspace-member-removed",
        {
          workspaceId: workspaceId,
          removedMember: memberToDelete,
        },
        memberToDelete.email, // to - para notificar al usuario removido
        workspaceId // workspaceId - para notificar al workspace
      );

      res.json({
        message: "Miembro eliminado correctamente",
        data: memberToDelete,
      });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
};
