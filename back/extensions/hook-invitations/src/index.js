// back/extensions/hooks/invitations-hook/index.js
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import crypto from "crypto";

export default ({ filter, action }) => {
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
          await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
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

  // 3. Después de crear un ítem en 'invitations' (solo logging)
  action("invitations.items.create", (meta) => {
    console.log("✅ Item de invitación creado:", meta.payload);
  });

  // 4. Cuando se actualiza una invitación a 'accepted'
  action(
    "invitations.items.update",
    async ({ key, payload }, { database, accountability, exceptions }) => {
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
    }
  );
};
