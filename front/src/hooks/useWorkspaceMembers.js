// src/hooks/useWorkspaceMembers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as members from "../services/workspace_members";

// Obtener todos los miembros de un workspace
export function useWorkspaceMembers(workspaceId) {
  return useQuery({
    queryKey: ["workspaceMembers", workspaceId],
    queryFn: () => members.getWorkspaceMembers(workspaceId),
    select: (res) =>
      (res.data.data || []).map((m) => ({
        ...m,
        user: m.user_id, // reetiquetamos user_id ➞ user
      })),
    enabled: !!workspaceId,
  });
}

// Obtener el rol del usuario actual en un workspace
export function useCurrentUserRole(workspace, userId) {
  if (!workspace || !userId) return null;

  // Si es el propietario
  if (workspace.owner === userId || workspace.isOwner) {
    return "owner";
  }

  // Si tiene rol específico desde el endpoint
  if (workspace.userRole) {
    return workspace.userRole;
  }

  // Buscar en la lista de miembros
  const member = workspace.members?.find((m) => m.user_id === userId);
  return member?.role || "viewer";
}

// Crear miembro
export function useCreateWorkspaceMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: members.createWorkspaceMember,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["workspaceMembers", vars.workspace_id],
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
          queryKey: ["workspaceMembers", data.workspace_id],
        });
      else queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
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
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
    },
  });
}
