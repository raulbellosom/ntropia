import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/auth";
import useAuthStore from "../store/useAuthStore";
import { useEffect } from "react";

// Login
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (res) => {
      localStorage.setItem("access_token", res.data.data.access_token);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// Register
export function useRegister() {
  return useMutation({ mutationFn: authService.register });
}

// Obtener usuario actual
export function useCurrentUser() {
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ["me"],
    queryFn: authService.getMe,
    select: (res) => res.data.data,
    retry: false,
    enabled: !!localStorage.getItem("access_token"), // Solo ejecutar si hay token
  });

  // Usar useEffect para guardar en el store cuando los datos cambien
  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}
