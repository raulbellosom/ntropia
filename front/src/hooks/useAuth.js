import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/auth";
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
    localStorage.removeItem("access_token");
    clearUser();
    queryClient.clear();
    window.location.href = "/login";
  };
}
