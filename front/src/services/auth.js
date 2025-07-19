// front/src/services/auth.js
import api from "./api";

// Login Directus
export const login = ({ email, password }) =>
  api.post("/auth/login", { email, password });

// Register Directus
export const register = ({ email, password, first_name, last_name }) =>
  api.post("/users/register", { email, password, first_name, last_name });

// Obtener usuario actual (Directus)
// Llama solo los campos que te interesan
export const getMe = () =>
  api.get("/users/me?fields=id,first_name,last_name,email,avatar");

// Cerrar sesión (solo elimina token)
export const logout = () => {
  localStorage.removeItem("access_token");
  window.location.href = "/login";
};
