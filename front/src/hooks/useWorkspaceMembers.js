// src/hooks/useWorkspaceMembers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as members from "../services/workspace_members";

// Obtener todos los miembros de un workspace
export function useWorkspaceMembers(workspaceId) {
  return useQuery({
    queryKey: ["workspace_members", workspaceId],
    queryFn: () => members.getWorkspaceMembers(workspaceId),
    select: (res) => res.data.data || [],
    enabled: !!workspaceId,
  });
}

// Crear miembro
export function useCreateWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: members.createWorkspaceMember,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace_members", vars.workspace_id],
      });
    },
  });
}

// Actualizar miembro
export function useUpdateWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => members.updateWorkspaceMember(id, data),
    onSuccess: (_, { data }) => {
      if (data?.workspace_id)
        queryClient.invalidateQueries({
          queryKey: ["workspace_members", data.workspace_id],
        });
      else queryClient.invalidateQueries({ queryKey: ["workspace_members"] });
    },
  });
}

// Eliminar miembro
export function useDeleteWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: members.deleteWorkspaceMember,
    onSuccess: (_, id, context) => {
      // Puedes agregar más lógica si tienes workspaceId
      queryClient.invalidateQueries({ queryKey: ["workspace_members"] });
    },
  });
}
