// front/src/services/files.js
import api from "./api";

// Get all files for a workspace
export const getFiles = (workspaceId) =>
  api.get(
    `/items/files?filter[workspace_id][_eq]=${workspaceId}&sort=-created_at`
  );

// Get a single file
export const getFile = (id) => api.get(`/items/files/${id}`);

// Upload a file (usa formData si subes archivos reales)
export const createFile = (data) => api.post("/items/files", data);

// Update file metadata
export const updateFile = (id, data) => api.patch(`/items/files/${id}`, data);

// Delete a file
export const deleteFile = (id) => api.delete(`/items/files/${id}`);
