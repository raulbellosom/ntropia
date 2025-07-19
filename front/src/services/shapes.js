// front/src/services/shapes.js
import api from "./api";

// Get all shapes for a layer
export const getShapes = (layerIds) => {
  if (!layerIds || !Array.isArray(layerIds) || layerIds.length === 0)
    return Promise.resolve({ data: { data: [] } }); // No hace petición si el array está vacío

  // Crea la query _in (Directus espera una lista separada por comas)
  const filterParam = encodeURIComponent(layerIds.join(","));
  return api.get(
    `/items/shapes?filter[layer_id][_in]=${filterParam}&sort=order`
  );
};

// Get a single shape
export const getShape = (id) => api.get(`/items/shapes/${id}`);

// Create a shape
export const createShape = (data) => api.post("/items/shapes", data);

// Update a shape
export const updateShape = (id, data) => api.patch(`/items/shapes/${id}`, data);

// Delete a shape
export const deleteShape = (id) => api.delete(`/items/shapes/${id}`);
