// src/services/invitations.js
import api from "./api";

// Get all invitations for a workspace
export const getInvitations = (workspaceId) =>
  api.get(
    `/items/invitations?filter[workspace_id][_eq]=${workspaceId}&sort=-created_at`
  );

// Get a single invitation by its ID
export const getInvitation = (id) => api.get(`/items/invitations/${id}`);

// Get invitation by token via your extension endpoint
export const getInvitationByToken = (token) =>
  api.get(`/endpoint-invitations?token=${token}`);

// Create invitation
export const createInvitation = (data) => api.post("/items/invitations", data);

// Update invitation
export const updateInvitation = (id, data) =>
  api.patch(`/items/invitations/${id}`, data);

// Delete invitation
export const deleteInvitation = (id) => api.delete(`/items/invitations/${id}`);

// Accept invitation via extension endpoint
export const acceptInvitation = (token) =>
  api.post("/endpoint-invitations", { token });
