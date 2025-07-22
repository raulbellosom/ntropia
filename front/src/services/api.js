// src/services/api.js
import axios from "axios";
import { API_URL } from "../config";

// Instancia principal de Axios
const api = axios.create({
  baseURL: API_URL,
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
    // Si el token expiró o es inválido
    if (error.response?.status === 401) {
      console.warn("Token expirado o inválido, redirigiendo al login...");
      localStorage.removeItem("access_token");

      // Evitar bucle infinito si ya estamos en login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
