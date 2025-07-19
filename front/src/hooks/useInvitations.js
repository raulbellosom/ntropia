// src/hooks/useInvitations.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as invitations from "../services/invitations";

// Todas las invitaciones de un workspace
export function useInvitations(workspaceId) {
  return useQuery({
    queryKey: ["invitations", workspaceId],
    queryFn: () => invitations.getInvitations(workspaceId),
    select: (res) => res.data.data || [],
    enabled: !!workspaceId,
  });
}

// Una invitación
export function useInvitation(id) {
  return useQuery({
    queryKey: ["invitation", id],
    queryFn: () => invitations.getInvitation(id),
    enabled: !!id,
  });
}

// Crear invitación
export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invitations.createInvitation,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["invitations", vars.workspace_id],
      });
    },
  });
}

// Actualizar invitación
export function useUpdateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => invitations.updateInvitation(id, data),
    onSuccess: (_, { data }) => {
      if (data?.workspace_id)
        queryClient.invalidateQueries({
          queryKey: ["invitations", data.workspace_id],
        });
      else queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

// Eliminar invitación
export function useDeleteInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invitations.deleteInvitation,
    onSuccess: (_, id, context) => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}
