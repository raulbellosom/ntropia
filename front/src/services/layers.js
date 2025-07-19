// front/src/services/layers.js
import api from "./api";

// Get all layers for a workspace
export const getLayers = (workspaceId) =>
  api.get(`/items/layers?filter[workspace_id][_eq]=${workspaceId}&sort=order`);

// Get a single layer
export const getLayer = (id) => api.get(`/items/layers/${id}`);

// Create a layer
export const createLayer = (data) => api.post("/items/layers", data);

// Update a layer
export const updateLayer = (id, data) => api.patch(`/items/layers/${id}`, data);

// Delete a layer
export const deleteLayer = (id) => api.delete(`/items/layers/${id}`);
