// back/extensions/invitations-hook/index.js
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import crypto from "crypto";

export default ({ filter, action }) => {
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
  // 1. Debug al iniciar el servidor
  action("server.start", () => {
    console.log("🛠️ [DEBUG] Hook de arranque cargado");
  });

  // 2. Antes de crear un ítem en 'invitations'
  filter("invitations.items.create", async (payload, meta, context) => {
    const { database } = context;
    console.log("🔍 Creating Invitation item:", payload);

    // Autogenerar token si no existe
    if (!payload.token) {
      payload.token = crypto.randomBytes(32).toString("hex");
      console.log("🔑 Token generado:", payload.token);
    }

    // Consultar nombre completo del que invita
    let inviterName = "Alguien";
    if (payload.invited_by) {
      const inviter = await database
        .select("first_name", "last_name")
        .from("directus_users")
        .where({ id: payload.invited_by })
        .first();
      if (inviter) {
        inviterName = `${inviter.first_name} ${inviter.last_name}`;
      }
    }

    // Consultar nombre del workspace (proyecto)
    let workspaceName = "";
    if (payload.workspace_id) {
      const ws = await database
        .select("name")
        .from("workspaces")
        .where({ id: payload.workspace_id })
        .first();
      if (ws) {
        workspaceName = ws.name;
      }
    }

    // Configurar Nodemailer con SMTP de Hostinger
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g. smtp.hostinger.com
      port: Number(process.env.SMTP_PORT), // e.g. 465 o 587
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Enviar correo de invitación
    if (payload.email && payload.token) {
      const acceptUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${payload.token}`;
      try {
        await transporter.sendMail({
          from: `"Ntropia" <${process.env.SMTP_USER}>`,
          to: payload.email,
          subject: `${inviterName} te ha invitado a colaborar en "${workspaceName}"`,
          html: `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f2f2;padding:20px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
                    <tr>
                      <td align="center" style="background-color:#6366f1;padding:20px;">
                        <h1 style="color:#ffffff;font-family:Arial,sans-serif;font-size:24px;margin:0;">
                          ¡Invitación a Ntropia!
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:30px;font-family:Arial,sans-serif;color:#333333;font-size:16px;line-height:1.5;">
                        <p>¡Hola!</p>
                        <p><strong>${inviterName}</strong> te ha invitado a colaborar en el workspace <strong>"${workspaceName}"</strong>.</p>
                        <p>Para aceptar tu invitación, haz clic en el botón de abajo:</p>
                        <p style="text-align:center;margin:30px 0;">
                          <a
                            href="${acceptUrl}"
                            style="display:inline-block;padding:12px 24px;background-color:#6366f1;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:bold;"
                          >
                            Aceptar Invitación
                          </a>
                        </p>
                        <p>Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
                        <p style="word-break:break-all;"><a href="${acceptUrl}" style="color:#6366f1;">${acceptUrl}</a></p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#f2f2f2;padding:20px;font-family:Arial,sans-serif;color:#777777;font-size:12px;">
                        <p style="margin:0;">Ntropia • ntropia.com • &copy; ${new Date().getFullYear()}</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="background-color:#f2f2f2;padding:20px;font-family:Arial,sans-serif;color:#777777;font-size:12px;">
                        <p style="margin:0;">Un producto de <a href="https://racoondevs.com">Racoondevs.com</a> • <a href="mailto:admin@racoondevs.com">admin@racoondevs.com</a></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `,
        });
        try {
          const socketUrl =
            process.env.SOCKET_SERVER_URL || "http://localhost:4010";
          console.log("🔗 [DEBUG] Socket URL:", socketUrl);
          await fetch(`${socketUrl}/emit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: payload.email,
              type: "new-invitation",
              data: {
                workspaceName,
                inviterName,
                token: payload.token,
              },
            }),
          });
          console.log("📤 Notificación enviada a socket-server");
        } catch (error) {
          console.error("❌ Error enviando a socket-server:", error.message);
        }
        console.log("✅ Correo enviado a", payload.email);
      } catch (err) {
        console.error("❌ Error enviando correo:", err);
      }
    }

    return payload;
  });

  // 3. Después de crear un ítem en 'invitations' (logging + WebSocket event)
  action("invitations.items.create", async (meta, { database }) => {
    console.log("✅ Item de invitación creado:", meta.payload);

    try {
      // Obtener información completa de la invitación
      const invitation = await database("invitations as i")
        .leftJoin("directus_users as u", "u.id", "i.invited_by")
        .leftJoin("workspaces as w", "w.id", "i.workspace_id")
        .where("i.id", meta.key)
        .select(
          "i.id",
          "i.email",
          "i.workspace_id",
          "i.status",
          "i.date_created",
          "u.first_name as inviter_first_name",
          "u.last_name as inviter_last_name",
          "u.email as inviter_email",
          "w.name as workspace_name"
        )
        .first();

      if (invitation) {
        console.log("🔍 [DEBUG] Enviando evento new-invitation:", {
          invitationId: invitation.id,
          email: invitation.email,
          workspaceName: invitation.workspace_name,
          inviterName: `${invitation.inviter_first_name} ${invitation.inviter_last_name}`,
        });

        // Emitir evento para el usuario invitado (notificación personal)
        await emitSocketEvent(
          "new-invitation",
          {
            invitationId: invitation.id,
            workspaceName: invitation.workspace_name,
            inviterName: `${invitation.inviter_first_name} ${invitation.inviter_last_name}`,
            token: meta.payload.token,
            workspaceId: invitation.workspace_id,
          },
          invitation.email // to - para notificar al usuario invitado
        );

        // Emitir evento para actualizar las invitaciones del workspace
        await emitSocketEvent(
          "invitation-created",
          {
            workspaceId: invitation.workspace_id,
            invitation: {
              id: invitation.id,
              email: invitation.email,
              status: invitation.status,
              date_created: invitation.date_created,
              invited_by: {
                first_name: invitation.inviter_first_name,
                last_name: invitation.inviter_last_name,
                email: invitation.inviter_email,
              },
            },
          },
          invitation.email, // to - para notificar al usuario invitado
          invitation.workspace_id // workspaceId - para notificar al workspace
        );
      }
    } catch (error) {
      console.error(
        "Error enviando evento WebSocket de invitación creada:",
        error
      );
    }
  });

  // 4. Hook para cuando se elimina una invitación
  filter("invitations.items.delete", async (payload, meta, context) => {
    const { database } = context;

    try {
      // Obtener información de las invitaciones antes de eliminarlas
      const invitations = await database("invitations")
        .whereIn("id", meta.keys)
        .select("id", "workspace_id", "email");

      // Guardar en el contexto para usar en el action posterior
      meta.invitationsToDelete = invitations;
    } catch (error) {
      console.error("Error obteniendo invitaciones para eliminar:", error);
    }

    return payload;
  });

  // Action para después de eliminar invitaciones
  action("invitations.items.delete", async (meta) => {
    console.log("🗑️ Invitación(es) eliminada(s):", meta.keys);

    try {
      // Usar la información guardada en el filter
      const invitationsToDelete = meta.invitationsToDelete || [];

      for (const invitation of invitationsToDelete) {
        // Emitir evento para actualizar las invitaciones del workspace
        await emitSocketEvent(
          "invitation-deleted",
          {
            workspaceId: invitation.workspace_id,
            invitationId: invitation.id,
          },
          invitation.email, // to - para notificar al usuario invitado
          invitation.workspace_id // workspaceId - para notificar al workspace
        );
      }
    } catch (error) {
      console.error(
        "Error enviando evento WebSocket de invitación eliminada:",
        error
      );
    }
  });

  // 5. Cuando se actualiza una invitación a 'accepted'
  action(
    "invitations.items.update",
    async ({ key, payload }, { database, accountability, exceptions }) => {
      try {
        // Obtener información completa de la invitación actualizada
        const invitation = await database("invitations as i")
          .leftJoin("directus_users as u", "u.id", "i.invited_by")
          .where("i.id", key)
          .select(
            "i.id",
            "i.email",
            "i.workspace_id",
            "i.status",
            "i.date_updated",
            database.raw("COALESCE(i.viewed, false) as viewed"), // Default to false if viewed field doesn't exist
            "u.first_name as inviter_first_name",
            "u.last_name as inviter_last_name",
            "u.email as inviter_email"
          )
          .first();

        if (invitation) {
          // Emitir evento para actualizar las invitaciones del workspace
          await emitSocketEvent(
            "invitation-updated",
            {
              workspaceId: invitation.workspace_id,
              invitationId: invitation.id,
              invitation: {
                id: invitation.id,
                email: invitation.email,
                status: invitation.status,
                date_updated: invitation.date_updated,
                viewed: invitation.viewed,
                invited_by: {
                  first_name: invitation.inviter_first_name,
                  last_name: invitation.inviter_last_name,
                  email: invitation.inviter_email,
                },
              },
            },
            invitation.email, // to - para notificar al usuario invitado
            invitation.workspace_id // workspaceId - para notificar al workspace
          );
        }

        // Lógica original para cuando se acepta
        if (payload.status === "accepted") {
          const inv = await database
            .select("*")
            .from("invitations")
            .where({ id: key })
            .first();
          if (!inv) {
            throw new exceptions.NotFoundException("Invitación no encontrada");
          }
          await database
            .insert({
              workspace_id: inv.workspace_id,
              user_id: accountability.user,
              invited_by: inv.invited_by,
              status: "accepted",
              created_at: new Date(),
            })
            .into("workspace_members");
          console.log(
            `👥 Usuario ${accountability.user} añadido al workspace ${inv.workspace_id}`
          );
        }
      } catch (error) {
        console.error("Error en update de invitación:", error);
        // Re-lanzar errores de negocio pero no errores de WebSocket
        if (error.code) {
          throw error;
        }
      }
    }
  );
};
