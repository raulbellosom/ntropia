//back/extensions/endpoint-workspaces/src/index.js
export default (router, { database }) => {
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
};
