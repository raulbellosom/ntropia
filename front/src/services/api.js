// src/services/api.js
import axios from "axios";
import { API_URL } from "../config";

// Instancia principal de Axios
const api = axios.create({
  baseURL: API_URL,
  // Puedes agregar otras configs por defecto aquí si quieres (timeout, etc.)
});

// Interceptor para agregar automáticamente el token a cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo global de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token expira o la sesión es inválida
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("access_token");
      // Opcional: redirige a login si estás en el browser
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    // Puedes manejar otros códigos de error aquí (403, 500, etc.)
    return Promise.reject(error);
  }
);

export default api;
