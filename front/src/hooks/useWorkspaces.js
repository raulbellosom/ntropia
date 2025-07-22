import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ws from "../services/workspaces";

// Todas las mesas
export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: ws.getWorkspaces,
    select: (res) => res.data.data || [],
  });
}

// Una mesa
export function useWorkspace(id) {
  return useQuery({
    queryKey: ["workspace", id],
    queryFn: () => ws.getWorkspace(id),
    enabled: !!id,
    select: (res) => res.data.data || null, // <-- ESTE SELECT desanida el objeto
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
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
