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

// Solicitar reset de contraseña por correo (usuario autenticado)
export const requestPasswordReset = () => {
  return api.post("/reset-password/request");
};

// Solicitar reset de contraseña por correo (usuario NO autenticado - desde login)
export const requestPasswordResetPublic = (email) => {
  return api.post("/reset-password/public-request", {
    email,
  });
};

// Cambiar contraseña usando token de reset
export const resetPassword = ({ token, password }) => {
  return api.post("/reset-password/change", {
    token,
    password,
  });
};

// Función legacy - mantener por compatibilidad
export const updatePassword = ({ current_password, new_password }) => {
  return api.post("/reset-password/change", {
    current_password,
    new_password,
  });
};

// Cerrar sesión (solo elimina token)
export const logout = () => {
  localStorage.removeItem("access_token");
  window.location.href = "/login";
};
