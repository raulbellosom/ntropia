// front/src/services/workspaces.js
import api from "./api";

// Get all workspaces
export const getWorkspaces = () =>
  api.get("/items/workspaces?sort=-date_created");

export const getAllUserWorkspaces = () => api.get("/endpoint-workspaces");

// Get a single workspace
export const getWorkspace = (id) => api.get(`/items/workspaces/${id}`);

// Get a workspace by access Custom Endpoint
export const getWorkspaceByAccess = (id) =>
  api.get(`/endpoint-workspaces/${id}`);

// Create a workspace
export const createWorkspace = (data) => api.post("/items/workspaces", data);

// Update a workspace
export const updateWorkspace = (id, data) =>
  api.patch(`/items/workspaces/${id}`, data);

// Delete a workspace
export const deleteWorkspace = (id) => api.delete(`/items/workspaces/${id}`);
