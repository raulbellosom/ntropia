// src/services/invitations.js
import api from "./api";

// Get all invitations for a workspace using custom endpoint
export const getInvitations = (workspaceId) =>
  api.get(`/endpoint-invitations/workspace/${workspaceId}`);

// Get a single invitation by its ID
export const getInvitation = (id) => api.get(`/items/invitations/${id}`);

// Get invitation by token via your extension endpoint
export const getInvitationByToken = (token) =>
  api.get(`/endpoint-invitations?token=${token}`);

// Create invitation (usar el endpoint original para que se ejecute el hook)
export const createInvitation = (data) => api.post("/items/invitations", data);

// Update invitation
export const updateInvitation = (id, data) =>
  api.patch(`/items/invitations/${id}`, data);

// Delete invitation
export const deleteInvitation = (id) => api.delete(`/items/invitations/${id}`);

// Accept invitation via extension endpoint
export const acceptInvitation = (token) =>
  api.post("/endpoint-invitations", { token });

// Reject invitation via extension endpoint
export const rejectInvitation = (token) =>
  api.post("/endpoint-invitations", { token, action: "reject" });

// Validate invitation before sending
export const validateInvitation = (email, workspace_id) =>
  api.post("/endpoint-invitations/validate", { email, workspace_id });
