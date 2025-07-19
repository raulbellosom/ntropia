// src/hooks/useLayers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as layers from "../services/layers";

// Todas las capas de un workspace
export function useLayers(workspaceId) {
  return useQuery({
    queryKey: ["layers", workspaceId],
    queryFn: () => layers.getLayers(workspaceId),
    select: (res) => res.data.data || [],
    enabled: !!workspaceId,
  });
}

// Una sola capa
export function useLayer(id) {
  return useQuery({
    queryKey: ["layer", id],
    queryFn: () => layers.getLayer(id),
    enabled: !!id,
  });
}

// Crear capa
export function useCreateLayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: layers.createLayer,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["layers", vars.workspace_id],
      });
    },
  });
}

// Actualizar capa
export function useUpdateLayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => layers.updateLayer(id, data),
    onSuccess: (_, { data }) => {
      if (data?.workspace_id)
        queryClient.invalidateQueries({
          queryKey: ["layers", data.workspace_id],
        });
      else queryClient.invalidateQueries({ queryKey: ["layers"] });
    },
  });
}

// Eliminar capa
export function useDeleteLayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: layers.deleteLayer,
    onSuccess: (_, id, context) => {
      queryClient.invalidateQueries({ queryKey: ["layers"] });
    },
  });
}
