import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ws from "../services/workspaces";
import useAuthStore from "../store/useAuthStore";

// Todas las mesas
export function useWorkspaces() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["workspaces"],
    queryFn: ws.getAllUserWorkspaces,
    enabled: !!user?.id,
    select: (res) => {
      const all = res.data.data || [];
      const own = all.filter((w) => w.owner === user.id);
      const invited = all.filter((w) => w.owner !== user.id);
      return { own, invited };
    },
  });
}

// Una mesa
export function useWorkspace(id) {
  return useQuery({
    queryKey: ["workspace", id],
    queryFn: () => ws.getWorkspaceByAccess(id),
    enabled: !!id,
    select: (res) => res.data.data || null,
  });
}

// Crear
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ws.createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

// Actualizar
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => ws.updateWorkspace(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", id] });
    },
  });
}

// Eliminar
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ws.deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}
