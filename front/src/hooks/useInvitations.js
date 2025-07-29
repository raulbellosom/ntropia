// src/hooks/useInvitations.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as invitationsService from "../services/invitations";

// Hook para obtener invitaciones de un workspace específico
export function useWorkspaceInvitations(workspaceId) {
  return useQuery({
    queryKey: ["workspaceInvitations", workspaceId],
    queryFn: () =>
      invitationsService
        .getInvitations(workspaceId)
        .then((res) => res.data.data),
    enabled: Boolean(workspaceId),
  });
}

// Hook para cargar invitación por token
export function useInvitationByToken(token) {
  return useQuery({
    queryKey: ["invitationByToken", token],
    queryFn: () =>
      invitationsService
        .getInvitationByToken(token)
        .then((res) => res.data.data),
    enabled: Boolean(token),
    retry: false,
  });
}

// Hook para aceptar invitación (usa tu extension endpoint)
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token }) => invitationsService.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
    },
  });
}

// Hook para rechazar invitación
export function useRejectInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token }) => invitationsService.rejectInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
    },
  });
}

// Hook para crear una nueva invitación
export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      invitationsService.createInvitation({
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
    },
  });
}

// Hook para validar invitación antes de enviar
export function useValidateInvitation() {
  return useMutation({
    mutationFn: ({ email, workspace_id }) =>
      invitationsService.validateInvitation(email, workspace_id),
  });
}

// Hook para eliminar/cancelar invitación
export function useDeleteInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId) =>
      invitationsService.deleteInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
    },
  });
}
