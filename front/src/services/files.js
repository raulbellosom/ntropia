import api from "./api";

/** Listar archivos (puedes agregar filtros, búsqueda, etc) */
export const getFiles = (params = {}) => {
  // params: { limit, offset, sort, filter, search, fields, meta }
  return api.get("/files", { params });
};

/** Obtener un archivo por id */
export const getFile = (id, params = {}) => {
  return api.get(`/files/${id}`, { params });
};

/** Subir un archivo (usa FormData, NO JSON) */
export const uploadFile = (file, fileName = "image.png") => {
  const formData = new FormData();
  formData.append("file", file, fileName);
  return api.post("/files", formData); // Axios maneja Content-Type solo
};

/** Importar un archivo desde una URL externa */
export const importFile = (url, otherData = {}) => {
  // otherData: puede incluir los mismos campos que upload
  return api.post("/files/import", { url, ...otherData });
};

/** Actualizar metadata (título, tags, etc) de un archivo */
export const updateFile = (id, data) => {
  return api.patch(`/files/${id}`, data);
};

/** Eliminar un archivo por id */
export const deleteFile = (id) => {
  return api.delete(`/files/${id}`);
};

/** Eliminar varios archivos por array de ids */
export const deleteFiles = (ids = []) => {
  return api.delete(`/files`, { data: ids }); // Directus acepta DELETE con body (array de ids)
};
