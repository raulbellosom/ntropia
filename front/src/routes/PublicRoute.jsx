import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { useCurrentUser } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function PublicRoute() {
  const user = useAuthStore((s) => s.user);
  const { isLoading, error, data } = useCurrentUser();
  const location = useLocation();
  const hasToken = !!localStorage.getItem("access_token");

  //   console.log("PublicRoute check:", {
  //     hasToken,
  //     hasUser: !!user,
  //     hasData: !!data,
  //     isLoading,
  //     hasError: !!error,
  //     errorStatus: error?.response?.status,
  //     path: location.pathname,
  //   });

  // Si hay error 401, permitir acceso a rutas públicas
  if (error?.response?.status === 401) {
    return <Outlet />;
  }

  // Si no hay token, permitir acceso directo
  if (!hasToken) {
    return <Outlet />;
  }

  // Si hay usuario autenticado, redirigir al dashboard
  if (user && data && user.id === data.id) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si está cargando con token, mostrar loading
  if (hasToken && (isLoading || !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#101726] via-[#232C47] to-[#1C2338]">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-6">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-white text-lg">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  // Fallback: permitir acceso a ruta pública
  return <Outlet />;
}
