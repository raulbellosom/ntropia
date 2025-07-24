// back/extensions/hooks/invitations-hook/index.js

import nodemailer from "nodemailer";
import crypto from "crypto";

export default ({ filter, action }) => {
  // 1. Debug al iniciar el servidor
  action("server.start", () => {
    console.log("🛠️ [DEBUG] Hook de arranque cargado");
  });

  // 2. Antes de crear un ítem en 'invitations'
  filter("invitations.items.create", async (payload, meta, context) => {
    console.log("🔍 Creating Invitation item:", payload);

    // Autogenerar token si no existe
    if (!payload.token) {
      payload.token = crypto.randomBytes(32).toString("hex");
      console.log("🔑 Token generado:", payload.token);
    }

    // Configurar Nodemailer con SMTP de Hostinger
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g. smtp.hostinger.com
      port: Number(process.env.SMTP_PORT), // e.g. 465 o 587
      secure: process.env.SMTP_PORT === "465", // SSL si usas puerto 465
      auth: {
        user: process.env.SMTP_USER, // tu usuario de email Hostinger
        pass: process.env.SMTP_PASS, // tu contraseña de email
      },
    });

    // Enviar correo de invitación
    if (payload.email && payload.token) {
      const acceptUrl = `http://localhost:5173/accept-invitation?token=${payload.token}`;
      try {
        await transporter.sendMail({
          from: `"ntropia" <${process.env.SMTP_USER}>`,
          to: payload.email,
          subject: "¡Te han invitado a colaborar!",
          html: `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f2f2f2;padding:20px 0;">
  <tr>
    <td align="center">
      <!-- Contenedor principal -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td align="center" style="background-color:#6366f1;padding:20px;">
            <h1 style="color:#ffffff;font-family:Arial,sans-serif;font-size:24px;margin:0;">
              ¡Bienvenido a Ntropia!
            </h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:30px;font-family:Arial,sans-serif;color:#333333;font-size:16px;line-height:1.5;">
            <p>¡Hola!</p>
            <p>Alguien te ha invitado a colaborar en un workspace. Para aceptar tu invitación, haz clic en el botón de abajo:</p>
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
        <!-- Footer -->
        <tr>
          <td align="center" style="background-color:#f2f2f2;padding:20px;font-family:Arial,sans-serif;color:#777777;font-size:12px;">
            <p style="margin:0;">Ntropia • ntropia.com • &copy; ${new Date().getFullYear()}</p>
          </td>
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
        console.log("✅ Correo enviado a", payload.email);
      } catch (err) {
        console.error("❌ Error enviando correo:", err);
      }
    }

    return payload;
  });

  // 3. Después de crear un ítem en 'invitations'
  action("invitations.items.create", (meta) => {
    console.log("✅ Item de invitación creado:", meta.payload);
  });
};
