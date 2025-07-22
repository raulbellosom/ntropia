import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as files from "../services/files";

/** Listar archivos con soporte a params de Directus (limit, filter, search, etc) */
export function useFiles(params) {
  return useQuery({
    queryKey: ["files", params],
    queryFn: () => files.getFiles(params),
    select: (res) => res.data.data || [],
  });
}

/** Obtener un archivo individual */
export function useFile(id, params) {
  return useQuery({
    queryKey: ["file", id, params],
    queryFn: () => files.getFile(id, params),
    enabled: !!id,
    select: (res) => res.data.data,
  });
}

/** Subir archivo (blob o File) */
export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, fileName }) => files.uploadFile(file, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

/** Importar archivo desde URL */
export function useImportFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ url, ...otherData }) => files.importFile(url, otherData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

/** Actualizar metadata */
export function useUpdateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => files.updateFile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

/** Eliminar archivo individual */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => files.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

/** Eliminar varios archivos */
export function useDeleteFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => files.deleteFiles(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
