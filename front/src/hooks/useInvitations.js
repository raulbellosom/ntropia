// src/hooks/useInvitations.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as invitationsService from "../services/invitations";

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
    // NO invalidamos invitationByToken
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
    },
  });
}

// Hook para crear una nueva invitación
export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      invitationsService.createInvitation({
        role: data.role ?? "viewer",
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
    },
  });
}
