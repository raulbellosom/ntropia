import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { useCurrentUser } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const { isLoading, error, data } = useCurrentUser();
  const location = useLocation();
  const hasToken = !!localStorage.getItem("access_token");

  // console.log("ProtectedRoute check:", {
  //   hasToken,
  //   hasUser: !!user,
  //   hasData: !!data,
  //   isLoading,
  //   hasError: !!error,
  //   errorStatus: error?.response?.status,
  //   path: location.pathname,
  //   // Nuevo: verificar si está sincronizado
  //   isUserDataSynced: !!data && !!user && data.id === user.id,
  // });

  // Si no hay token, redirigir inmediatamente
  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay error 401, redirigir al login
  if (error?.response?.status === 401) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Solo permitir acceso si el usuario está completamente establecido
  if (user && data && user.id === data.id) {
    return <Outlet />;
  }

  // Si tiene token pero aún no está completamente cargado, mostrar loading
  if (hasToken && (isLoading || !user)) {
    // El AuthProvider manejará el loading
    return <Outlet />;
  }

  // Fallback: redirigir al login
  return <Navigate to="/login" state={{ from: location }} replace />;
}
