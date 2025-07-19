// src/hooks/useShapes.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as shapes from "../services/shapes";

// Todas las figuras de una capa
export function useShapes(layerIds) {
  return useQuery({
    queryKey: ["shapes", layerIds],
    queryFn: () => shapes.getShapes(layerIds),
    enabled: !!layerIds && layerIds.length > 0,
    select: (res) => res.data.data || [],
  });
}

// Una sola figura
export function useShape(id) {
  return useQuery({
    queryKey: ["shape", id],
    queryFn: () => shapes.getShape(id),
    enabled: !!id,
  });
}

// Crear figura
export function useCreateShape() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shapes.createShape,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["shapes", vars.layer_id] });
    },
  });
}

// Actualizar figura
export function useUpdateShape() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => shapes.updateShape(id, data),
    onSuccess: (_, { data }) => {
      if (data?.layer_id)
        queryClient.invalidateQueries({ queryKey: ["shapes", data.layer_id] });
      else queryClient.invalidateQueries({ queryKey: ["shapes"] });
    },
  });
}

// Eliminar figura
export function useDeleteShape() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shapes.deleteShape,
    onSuccess: (_, id, context) => {
      queryClient.invalidateQueries({ queryKey: ["shapes"] });
    },
  });
}
