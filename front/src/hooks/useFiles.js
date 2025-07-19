// src/hooks/useFiles.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as files from "../services/files";

// Todos los archivos de un workspace
export function useFiles(workspaceId) {
  return useQuery({
    queryKey: ["files", workspaceId],
    queryFn: () => files.getFiles(workspaceId),
    select: (res) => res.data.data || [],
    enabled: !!workspaceId,
  });
}

// Un archivo
export function useFile(id) {
  return useQuery({
    queryKey: ["file", id],
    queryFn: () => files.getFile(id),
    enabled: !!id,
  });
}

// Crear archivo
export function useCreateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: files.createFile,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["files", vars.workspace_id] });
    },
  });
}

// Actualizar archivo
export function useUpdateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => files.updateFile(id, data),
    onSuccess: (_, { data }) => {
      if (data?.workspace_id)
        queryClient.invalidateQueries({
          queryKey: ["files", data.workspace_id],
        });
      else queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

// Eliminar archivo
export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: files.deleteFile,
    onSuccess: (_, id, context) => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
