// front/src/services/invitations.js
import api from "./api";

// Get all invitations for a workspace
export const getInvitations = (workspaceId) =>
  api.get(
    `/items/invitations?filter[workspace_id][_eq]=${workspaceId}&sort=-created_at`
  );

// Get a single invitation
export const getInvitation = (id) => api.get(`/items/invitations/${id}`);

// Create invitation
export const createInvitation = (data) => api.post("/items/invitations", data);

// Update invitation
export const updateInvitation = (id, data) =>
  api.patch(`/items/invitations/${id}`, data);

// Delete invitation
export const deleteInvitation = (id) => api.delete(`/items/invitations/${id}`);
