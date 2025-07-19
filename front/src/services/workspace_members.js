// front/src/services/workspace_members.js
import api from "./api";

// Get all workspace members
export const getWorkspaceMembers = (workspaceId) =>
  api.get(`/items/workspace_members?filter[workspace_id][_eq]=${workspaceId}`);

// Get a single workspace member
export const getWorkspaceMember = (id) =>
  api.get(`/items/workspace_members/${id}`);

// Add member to workspace
export const createWorkspaceMember = (data) =>
  api.post("/items/workspace_members", data);

// Update workspace member
export const updateWorkspaceMember = (id, data) =>
  api.patch(`/items/workspace_members/${id}`, data);

// Remove workspace member
export const deleteWorkspaceMember = (id) =>
  api.delete(`/items/workspace_members/${id}`);
