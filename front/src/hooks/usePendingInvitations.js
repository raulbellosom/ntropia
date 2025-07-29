// src/hooks/usePendingInvitations.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";

// Hook para obtener invitaciones pendientes del usuario actual
export function usePendingInvitations() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["pendingInvitations", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const response = await api.get(
        `/items/invitations?filter[email][_eq]=${user.email}&filter[status][_eq]=pending&fields=*,workspace_id.*,invited_by.*&sort=-date_created`
      );
      return response.data.data || [];
    },
    enabled: !!user?.email,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}

// Hook para aceptar invitación
export function useAcceptPendingInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId) => {
      // Usar el endpoint personalizado que maneja la lógica completa
      const response = await api.post("/endpoint-invitations/accept", {
        invitationId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

// Hook para rechazar invitación
export function useRejectPendingInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId) => {
      const response = await api.post("/endpoint-invitations/reject", {
        invitationId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
    },
  });
}
