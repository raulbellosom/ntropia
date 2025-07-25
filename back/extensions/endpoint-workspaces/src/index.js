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

      res.json({ data: workspace });
    } catch (err) {
      next(err);
    }
  });
};
