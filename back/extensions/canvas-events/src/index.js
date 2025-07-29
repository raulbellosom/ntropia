// back/extensions/canvas-events/src/index.js
const SOCKET_URL = process.env.SOCKET_SERVER_URL;

/** Extrae un ID cuando el hook delete recibe key en distintos formatos */
function extractId(key) {
  if (typeof key === "object") {
    if (Array.isArray(key)) return key[0];
    if (key.id) return key.id;
    return Object.values(key)[0];
  }
  return key;
}

export default ({ filter, action }, { services }) => {
  console.log("🚀 Canvas Events Extension loaded!");

  // ─── Items Created (Shapes y Layers) ─────────────────────────────
  action(
    "items.create",
    async ({ key, collection, payload }, { schema, accountability }) => {
      console.log(
        `▶ Item create hook fired, collection: ${collection}, key: ${key}`
      );

      if (collection === "shapes") {
        try {
          await fetch(`${SOCKET_URL}/emit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId: payload.workspace_id,
              type: "shape-created",
              data: { ...payload, id: key }, // 👈 Agregar el id del key
            }),
          });
          console.log(`▶ shape-created emitido [${key}]`);
        } catch (err) {
          console.error("❌ Error al emitir shape-created:", err);
        }
      }

      if (collection === "layers") {
        try {
          await fetch(`${SOCKET_URL}/emit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId: payload.workspace_id,
              type: "layer-created",
              data: { ...payload, id: key }, // 👈 Agregar el id del key
            }),
          });
          console.log(`▶ layer-created emitido [${key}]`);
        } catch (err) {
          console.error("❌ Error al emitir layer-created:", err);
        }
      }
    }
  );

  // ─── Items Updated (Shapes, Layers y Workspaces) usando ACTION (después de escribir) ─────────────────────────────
  action(
    "items.update",
    async ({ keys, collection, payload }, { services, database }) => {
      console.log(
        `▶ Item update ACTION fired, collection: ${collection}, keys:`,
        keys
      );

      // Procesar cada key
      if (Array.isArray(keys)) {
        for (const key of keys) {
          if (collection === "shapes" || collection === "layers") {
            // Buscar el registro completo en la base de datos (YA ACTUALIZADO)
            let fullRecord;
            try {
              fullRecord = await database
                .select("*")
                .from(collection)
                .where("id", key)
                .first();
            } catch (err) {
              console.error(
                `❌ Error getting full record for ${collection}:`,
                err
              );
              continue;
            }

            if (!fullRecord) {
              console.warn(`❌ No record found for ${collection}:`, key);
              continue;
            }

            console.log(
              `▶ Emitiendo ${collection.slice(
                0,
                -1
              )}-updated con datos ACTUALIZADOS:`,
              collection === "shapes"
                ? {
                    id: fullRecord.id,
                    name: fullRecord.name,
                    type: fullRecord.type,
                    layer_id: fullRecord.layer_id,
                    data: fullRecord.data,
                    visible: fullRecord.visible,
                  }
                : {
                    id: fullRecord.id,
                    name: fullRecord.name,
                    order: fullRecord.order,
                    visible: fullRecord.visible,
                    locked: fullRecord.locked,
                  }
            );

            // Emitir evento con el registro completo YA ACTUALIZADO
            try {
              await fetch(`${SOCKET_URL}/emit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  workspaceId: fullRecord.workspace_id,
                  type: `${collection.slice(0, -1)}-updated`, // "shapes" -> "shape-updated"
                  data: fullRecord, // Enviar el registro completo ACTUALIZADO
                }),
              });
              console.log(
                `✅ ${collection.slice(
                  0,
                  -1
                )}-updated emitido [${key}] con registro ACTUALIZADO`
              );
            } catch (err) {
              console.error(
                `❌ Error al emitir ${collection.slice(0, -1)}-updated:`,
                err
              );
            }
          }

          // ─── WORKSPACE UPDATES ─────────────────────────────
          if (collection === "workspaces") {
            // Buscar el registro completo del workspace (YA ACTUALIZADO)
            let fullRecord;
            try {
              fullRecord = await database
                .select("*")
                .from("workspaces")
                .where("id", key)
                .first();
            } catch (err) {
              console.error("❌ Error getting workspace record:", err);
              continue;
            }

            if (!fullRecord) {
              console.warn(`❌ No workspace found for key:`, key);
              continue;
            }

            console.log(`▶ Emitiendo workspace-updated:`, {
              id: fullRecord.id,
              background: fullRecord.background,
              backgroundColor: fullRecord.backgroundColor,
              canvasWidth: fullRecord.canvasWidth,
              canvasHeight: fullRecord.canvasHeight,
            });

            // Emitir evento de workspace actualizado
            try {
              await fetch(`${SOCKET_URL}/emit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  workspaceId: fullRecord.id, // El propio workspace es el room
                  type: "workspace-updated",
                  data: fullRecord, // Enviar el workspace completo ACTUALIZADO
                }),
              });
              console.log(`✅ workspace-updated emitido [${key}]`);
            } catch (err) {
              console.error("❌ Error al emitir workspace-updated:", err);
            }
          }
        }
      }
    }
  );

  // ─── Shape Deleted ───────────────────────────────────────────────
  filter("items.delete", async (key, { collection }, { database }) => {
    if (collection !== "shapes") return key;

    const id = extractId(key);
    const record = await database
      .select("workspace_id")
      .from("shapes")
      .where("id", id)
      .first();
    const workspaceId = record?.workspace_id;

    try {
      await fetch(`${SOCKET_URL}/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          type: "shape-deleted",
          data: { id },
        }),
      });
      console.log(`▶ shape-deleted emitido [${id}]`);
    } catch (err) {
      console.error("❌ Error al emitir shape-deleted:", err);
    }

    return key;
  });

  // ─── Layer Deleted ───────────────────────────────────────────────
  filter("items.delete", async (key, { collection }, { database }) => {
    console.log("▶ Layer delete hook fired, collection:", collection);
    if (collection !== "layers") return key;

    const id = extractId(key);
    const record = await database
      .select("workspace_id")
      .from("layers")
      .where("id", id)
      .first();
    const workspaceId = record?.workspace_id;

    try {
      await fetch(`${SOCKET_URL}/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          type: "layer-deleted",
          data: { id },
        }),
      });
      console.log(`▶ layer-deleted emitido [${id}]`);
    } catch (err) {
      console.error("❌ Error al emitir layer-deleted:", err);
    }

    return key;
  });
};
