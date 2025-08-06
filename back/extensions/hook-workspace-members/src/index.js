// back/extensions/hook-workspace-members/src/index.js

export default ({ filter, action }) => {
  // Función auxiliar para emitir eventos de socket
  const emitSocketEvent = async (type, data, to = null, workspaceId = null) => {
    try {
      const socketUrl =
        process.env.SOCKET_SERVER_URL || "http://localhost:4010";

      const payload = { type, data };
      if (to) payload.to = to;
      if (workspaceId) payload.workspaceId = workspaceId;

      console.log(
        `📤 [WorkspaceMembers] Evento WebSocket enviado: ${type}`,
        payload
      );

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
        console.log(
          `✅ [WorkspaceMembers] Evento ${type} enviado correctamente`
        );
      }
    } catch (error) {
      console.error("Error al conectar con socket server:", error);
    }
  };

  // 1. Después de crear un miembro del workspace
  action("workspace_members.items.create", async (meta, { database }) => {
    console.log("✅ [WorkspaceMembers] Miembro creado:", meta.payload);

    try {
      // Obtener información completa del miembro recién creado
      const member = await database("workspace_members as wm")
        .leftJoin("directus_users as u", "u.id", "wm.user_id")
        .leftJoin("workspaces as w", "w.id", "wm.workspace_id")
        .where("wm.id", meta.key)
        .select(
          "wm.id",
          "wm.user_id",
          "wm.workspace_id",
          "wm.role",
          "wm.created_at",
          "u.first_name",
          "u.last_name",
          "u.email",
          "w.name as workspace_name"
        )
        .first();

      if (member) {
        console.log(
          "🔍 [WorkspaceMembers] Emitiendo evento workspace-member-added:",
          {
            memberId: member.id,
            email: member.email,
            workspaceName: member.workspace_name,
          }
        );

        // Emitir evento para actualizar la lista de miembros del workspace
        await emitSocketEvent(
          "workspace-member-added",
          {
            workspaceId: member.workspace_id,
            member: {
              id: member.id,
              user_id: member.user_id,
              workspace_id: member.workspace_id,
              role: member.role,
              created_at: member.created_at,
              email: member.email,
              workspace_name: member.workspace_name,
              user_id: {
                id: member.user_id,
                first_name: member.first_name,
                last_name: member.last_name,
                email: member.email,
              },
            },
          },
          member.email // to - para notificar al usuario que se unió
        );

        // También emitir a la sala del workspace para que todos los miembros conectados se enteren
        await emitSocketEvent(
          "workspace-member-added",
          {
            workspaceId: member.workspace_id,
            member: {
              id: member.id,
              user_id: member.user_id,
              workspace_id: member.workspace_id,
              role: member.role,
              created_at: member.created_at,
              email: member.email,
              workspace_name: member.workspace_name,
              user_id: {
                id: member.user_id,
                first_name: member.first_name,
                last_name: member.last_name,
                email: member.email,
              },
            },
          },
          null, // to - null para usar workspaceId
          member.workspace_id // workspaceId - para notificar a toda la sala del workspace
        );
      }
    } catch (error) {
      console.error(
        "Error enviando evento WebSocket de miembro agregado:",
        error
      );
    }
  });

  // 2. Después de actualizar un miembro del workspace
  action("workspace_members.items.update", async (meta, { database }) => {
    console.log("🔄 [WorkspaceMembers] Miembro actualizado:", meta.payload);

    try {
      // Obtener información completa del miembro actualizado
      const member = await database("workspace_members as wm")
        .leftJoin("directus_users as u", "u.id", "wm.user_id")
        .leftJoin("workspaces as w", "w.id", "wm.workspace_id")
        .where("wm.id", meta.keys[0])
        .select(
          "wm.id",
          "wm.user_id",
          "wm.workspace_id",
          "wm.role",
          "wm.created_at",
          "u.first_name",
          "u.last_name",
          "u.email",
          "w.name as workspace_name"
        )
        .first();

      if (member) {
        console.log(
          "🔍 [WorkspaceMembers] Emitiendo evento workspace-member-updated:",
          {
            memberId: member.id,
            email: member.email,
            role: member.role,
          }
        );

        // Emitir evento para actualizar la información del miembro
        await emitSocketEvent(
          "workspace-member-updated",
          {
            workspaceId: member.workspace_id,
            member: {
              id: member.id,
              user_id: member.user_id,
              workspace_id: member.workspace_id,
              role: member.role,
              created_at: member.created_at,
              email: member.email,
              user_id: {
                id: member.user_id,
                first_name: member.first_name,
                last_name: member.last_name,
                email: member.email,
              },
            },
          },
          member.email // to - para notificar al usuario afectado
        );

        // También emitir a la sala del workspace
        await emitSocketEvent(
          "workspace-member-updated",
          {
            workspaceId: member.workspace_id,
            member: {
              id: member.id,
              user_id: member.user_id,
              workspace_id: member.workspace_id,
              role: member.role,
              created_at: member.created_at,
              email: member.email,
              user_id: {
                id: member.user_id,
                first_name: member.first_name,
                last_name: member.last_name,
                email: member.email,
              },
            },
          },
          null, // to - null para usar workspaceId
          member.workspace_id // workspaceId - para notificar a toda la sala del workspace
        );
      }
    } catch (error) {
      console.error(
        "Error enviando evento WebSocket de miembro actualizado:",
        error
      );
    }
  });

  // 3. Antes de eliminar un miembro (para obtener datos antes de la eliminación)
  filter("workspace_members.items.delete", async (payload, meta, context) => {
    const { database } = context;

    try {
      // Obtener información de los miembros antes de eliminarlos
      const members = await database("workspace_members as wm")
        .leftJoin("directus_users as u", "u.id", "wm.user_id")
        .leftJoin("workspaces as w", "w.id", "wm.workspace_id")
        .whereIn("wm.id", meta.keys)
        .select(
          "wm.id",
          "wm.user_id",
          "wm.workspace_id",
          "u.email",
          "w.name as workspace_name"
        );

      // Guardar en el contexto para usar en el action posterior
      meta.membersToDelete = members;
    } catch (error) {
      console.error("Error obteniendo miembros para eliminar:", error);
    }

    return payload;
  });

  // 4. Después de eliminar un miembro del workspace
  action("workspace_members.items.delete", async (meta) => {
    console.log("🗑️ [WorkspaceMembers] Miembro(s) eliminado(s):", meta.keys);

    try {
      // Usar la información guardada en el filter
      const membersToDelete = meta.membersToDelete || [];

      for (const member of membersToDelete) {
        console.log(
          "🔍 [WorkspaceMembers] Emitiendo evento workspace-member-removed:",
          {
            memberId: member.id,
            email: member.email,
            workspaceName: member.workspace_name,
          }
        );

        // Emitir evento para actualizar la lista de miembros del workspace
        await emitSocketEvent(
          "workspace-member-removed",
          {
            workspaceId: member.workspace_id,
            memberId: member.id,
            memberEmail: member.email,
            workspaceName: member.workspace_name,
          },
          member.email // to - para notificar al usuario removido
        );

        // También emitir a la sala del workspace
        await emitSocketEvent(
          "workspace-member-removed",
          {
            workspaceId: member.workspace_id,
            memberId: member.id,
            memberEmail: member.email,
            workspaceName: member.workspace_name,
          },
          null, // to - null para usar workspaceId
          member.workspace_id // workspaceId - para notificar a toda la sala del workspace
        );
      }
    } catch (error) {
      console.error(
        "Error enviando evento WebSocket de miembro eliminado:",
        error
      );
    }
  });
};
