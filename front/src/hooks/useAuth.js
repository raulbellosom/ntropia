import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/auth";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import { useEffect } from "react";

// Login - SIMPLIFICADO
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (res) => {
      const token = res.data.data.access_token;
      if (token) {
        localStorage.setItem("access_token", token);
        // Solo invalidar, NO refetch inmediato
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    },
    onError: (error) => {
      console.error("Error en login:", error);
    },
  });
}

// Register
export function useRegister() {
  return useMutation({
    mutationFn: authService.register,
    onError: (error) => {
      console.error("Error en registro:", error);
    },
  });
}

// Obtener usuario actual - SIMPLIFICADO
export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  const query = useQuery({
    queryKey: ["me"],
    queryFn: authService.getMe,
    select: (res) => res.data.data,
    retry: (failureCount, error) => {
      if (error.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
    enabled: !!localStorage.getItem("access_token"),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    // CAMBIO: Solo refetch si realmente es necesario
    refetchOnMount: true, // Cambiar de "always" a true
    refetchOnWindowFocus: false,
  });

  // Sincronizar con el store cuando cambien los datos
  useEffect(() => {
    if (query.data && !query.error) {
      setUser(query.data);
    } else if (query.error?.response?.status === 401) {
      clearUser();
      localStorage.removeItem("access_token");
    }
  }, [query.data, query.error, setUser, clearUser]);

  return query;
}

// Hook para logout mejorado
export function useLogout() {
  const queryClient = useQueryClient();
  const clearUser = useAuthStore((s) => s.clearUser);

  return () => {
    // Importar y desconectar socket
    import("./useSocketClient").then(({ useSocketClient }) => {
      const { disconnect } = useSocketClient();
      disconnect();
    });

    localStorage.removeItem("access_token");
    clearUser();
    queryClient.clear();
    window.location.href = "/login";
  };
}

// Hook para actualizar perfil
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (data) => {
      return api.patch("/users/me", data);
    },
    onSuccess: (response) => {
      const updatedUser = response.data.data;
      setUser(updatedUser);
      queryClient.setQueryData(["me"], response);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      console.error("Error actualizando perfil:", error);
    },
  });
}

// Hook para solicitar reset de contraseña (usuario autenticado)
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: authService.requestPasswordReset,
    onError: (error) => {
      console.error("Error requesting password reset:", error);
    },
  });
}

// Hook para solicitar reset de contraseña (usuario NO autenticado - desde login)
export function useRequestPasswordResetPublic() {
  return useMutation({
    mutationFn: authService.requestPasswordResetPublic,
    onError: (error) => {
      console.error("Error requesting password reset:", error);
    },
  });
}

// Hook para resetear contraseña con token
export function useResetPassword() {
  return useMutation({
    mutationFn: authService.resetPassword,
    onError: (error) => {
      console.error("Error resetting password:", error);
    },
  });
}

// Hook para cambiar contraseña (legacy)
export function useUpdatePassword() {
  return useMutation({
    mutationFn: authService.updatePassword,
    onError: (error) => {
      console.error("Error cambiando contraseña:", error);
    },
  });
}
