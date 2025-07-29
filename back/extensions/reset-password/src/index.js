// back/extensions/reset-password/src/index.js
export default (router, { database, services, getSchema }) => {
  /**
   * POST /reset-password/request
   * Solicita un correo de reset de contraseña para el usuario actual
   */
  router.post("/request", async (req, res, next) => {
    try {
      const userId = req.accountability?.user;

      // Validar que el usuario esté autenticado
      if (!userId) {
        return res.status(401).json({
          error: "No autorizado",
        });
      }

      // Obtener el usuario actual
      const user = await database("directus_users")
        .select("id", "email")
        .where("id", userId)
        .first();

      if (!user) {
        return res.status(404).json({
          error: "Usuario no encontrado",
        });
      }

      // Usar el servicio nativo de Directus para enviar el correo de reset
      try {
        console.log("🔍 Debug - About to send password reset email");
        console.log("🔍 Debug - User email:", user.email);
        console.log("🔍 Debug - Frontend URL:", process.env.FRONTEND_URL);

        const { UsersService, MailService } = services;

        // Crear instancia del servicio de usuarios con permisos de admin
        const usersService = new UsersService({
          accountability: {
            user: null,
            role: null,
            admin: true,
            app: true,
          },
          schema: await getSchema(),
        });

        // Solicitar reset de contraseña
        await usersService.requestPasswordReset(
          user.email,
          `${process.env.FRONTEND_URL}/reset-password`
        );

        console.log("🔍 Debug - Password reset email sent successfully");

        // Respuesta exitosa
        res.json({
          message:
            "Se ha enviado un correo electrónico con las instrucciones para cambiar la contraseña",
        });
      } catch (emailError) {
        console.error("🚨 Error sending reset email:", emailError);
        console.error(
          "🚨 Full error details:",
          JSON.stringify(emailError, null, 2)
        );
        res.status(500).json({
          error: "Error al enviar el correo electrónico",
        });
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  });

  /**
   * POST /reset-password/change
   * Cambia la contraseña usando un token de reset
   */
  router.post("/change", async (req, res, next) => {
    try {
      const { token, password } = req.body;

      // Validar que se proporcione el token y la nueva contraseña
      if (!token || !password) {
        return res.status(400).json({
          error: "Se requiere el token de reset y la nueva contraseña",
        });
      }

      // Validar longitud mínima de nueva contraseña
      if (password.length < 8) {
        return res.status(400).json({
          error: "La nueva contraseña debe tener al menos 8 caracteres",
        });
      }

      // Usar el servicio nativo de Directus para hacer el reset
      try {
        const { UsersService } = services;
        const usersService = new UsersService({
          accountability: {
            user: null,
            role: null,
            admin: true,
            app: true,
          },
          schema: await getSchema(),
        });

        await usersService.resetPassword(token, password);

        // Respuesta exitosa
        res.json({
          message: "Contraseña actualizada correctamente",
        });
      } catch (resetError) {
        console.error("Error resetting password:", resetError);

        if (resetError.message.includes("Invalid token")) {
          res.status(400).json({
            error: "Token de reset inválido o expirado",
          });
        } else {
          res.status(500).json({
            error: "Error al actualizar la contraseña",
          });
        }
      }
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  });

  /**
   * POST /reset-password/public-request
   * Solicita un correo de reset de contraseña para cualquier email (sin autenticación)
   */
  router.post("/public-request", async (req, res, next) => {
    try {
      const { email } = req.body;

      // Validar que se proporcione el email
      if (!email) {
        return res.status(400).json({
          error: "Se requiere un correo electrónico",
        });
      }

      // Buscar el usuario por email (sin revelar si existe)
      const user = await database("directus_users")
        .select("id", "email")
        .where("email", email)
        .first();

      // Si el usuario existe, enviar el correo
      if (user) {
        try {
          console.log("🔍 Debug - About to send password reset email (public)");
          console.log("🔍 Debug - User email:", user.email);
          console.log("🔍 Debug - Frontend URL:", process.env.FRONTEND_URL);

          const { UsersService } = services;

          // Crear instancia del servicio de usuarios con permisos de admin
          const usersService = new UsersService({
            accountability: {
              user: null,
              role: null,
              admin: true,
              app: true,
            },
            schema: await getSchema(),
          });

          // Solicitar reset de contraseña
          await usersService.requestPasswordReset(
            user.email,
            `${process.env.FRONTEND_URL}/reset-password`
          );

          console.log(
            "🔍 Debug - Password reset email sent successfully (public)"
          );
        } catch (emailError) {
          console.error("🚨 Error sending reset email (public):", emailError);
        }
      }

      // Siempre devolver el mismo mensaje por seguridad
      res.json({
        message:
          "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña",
      });
    } catch (error) {
      console.error("Error requesting password reset (public):", error);
      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  });

  // Endpoint de prueba GET
  router.get("/test", (req, res) => {
    res.json({ message: "Reset password endpoint is working!" });
  });
};
