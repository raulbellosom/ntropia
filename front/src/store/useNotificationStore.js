// src/store/useNotificationStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

const useNotificationStore = create(
  persist(
    (set, get) => ({
      // Estado de notificaciones
      notifications: [],
      unreadCount: 0,

      // Agregar nueva notificación
      addNotification: (notification) =>
        set((state) => {
          const exists = state.notifications.some(
            (n) => n.id === notification.id
          );
          if (exists) return state;

          const newNotifications = [notification, ...state.notifications];
          const unreadCount = newNotifications.filter((n) =>
            n.type === "invitation"
              ? n.status === "pending" && !n.viewed
              : !n.viewed
          ).length;

          return {
            notifications: newNotifications,
            unreadCount,
          };
        }),

      // Actualizar notificación existente (solo local)
      updateNotification: (id, updates) =>
        set((state) => {
          const newNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          );
          const unreadCount = newNotifications.filter((n) =>
            n.type === "invitation"
              ? n.status === "pending" && !n.viewed
              : !n.viewed
          ).length;

          return {
            notifications: newNotifications,
            unreadCount,
          };
        }),

      // Marcar como vista (actualiza local + backend)
      markAsViewed: async (id) => {
        const notification = get().notifications.find((n) => n.id === id);
        if (!notification || notification.viewed) return;

        // Actualizar estado local inmediatamente
        set((state) => {
          const newNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, viewed: true } : n
          );
          const unreadCount = newNotifications.filter((n) =>
            n.type === "invitation"
              ? n.status === "pending" && !n.viewed
              : !n.viewed
          ).length;

          return {
            notifications: newNotifications,
            unreadCount,
          };
        });

        // Actualizar en el backend si es una invitación
        if (notification.type === "invitation" && notification.invitationId) {
          try {
            console.log(
              "🔵 Actualizando 'viewed' en backend para:",
              notification.invitationId
            );
            await api.patch(`/items/invitations/${notification.invitationId}`, {
              viewed: true,
            });
          } catch (error) {
            console.error("Error actualizando 'viewed' en backend:", error);
          }
        }
      },

      // Eliminar notificación
      removeNotification: (id) =>
        set((state) => {
          const newNotifications = state.notifications.filter(
            (n) => n.id !== id
          );
          const unreadCount = newNotifications.filter((n) =>
            n.type === "invitation"
              ? n.status === "pending" && !n.viewed
              : !n.viewed
          ).length;

          return {
            notifications: newNotifications,
            unreadCount,
          };
        }),

      // Eliminar notificación por invitation ID
      removeNotificationByInvitationId: (invitationId) =>
        set((state) => {
          console.log(
            "🗑️ [Store] Eliminando notificación con invitationId:",
            invitationId
          );
          console.log(
            "🗑️ [Store] Notificaciones antes:",
            state.notifications.length
          );

          const newNotifications = state.notifications.filter(
            (n) => n.invitationId !== invitationId
          );

          console.log(
            "🗑️ [Store] Notificaciones después:",
            newNotifications.length
          );

          const unreadCount = newNotifications.filter((n) =>
            n.type === "invitation"
              ? n.status === "pending" && !n.viewed
              : !n.viewed
          ).length;

          return {
            notifications: newNotifications,
            unreadCount,
          };
        }),

      // Marcar como leída
      markAsRead: (id) =>
        set((state) => {
          const newNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, viewed: true } : n
          );
          const unreadCount = newNotifications.filter((n) =>
            n.type === "invitation"
              ? n.status === "pending" && !n.viewed
              : !n.viewed
          ).length;

          return {
            notifications: newNotifications,
            unreadCount,
          };
        }),

      // Marcar todas como leídas
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            viewed: true,
          })),
          unreadCount: 0,
        })),

      // Limpiar todas las notificaciones
      clearAll: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),

      // Actualizar contador
      updateUnreadCount: () =>
        set((state) => ({
          unreadCount: state.notifications.filter((n) =>
            n.type === "invitation"
              ? n.status === "pending" && !n.viewed
              : !n.viewed
          ).length,
        })),

      // Sincronizar con invitaciones pendientes del servidor
      syncWithInvitations: (invitations) =>
        set((state) => {
          // Evitar re-renderizados innecesarios comparando el contenido
          const currentInvitationIds = state.notifications
            .filter((n) => n.type === "invitation")
            .map((n) => n.invitationId)
            .sort();

          const newInvitationIds = invitations.map((inv) => inv.id).sort();

          // Si no hay cambios en los IDs, no actualizar
          if (
            JSON.stringify(currentInvitationIds) ===
            JSON.stringify(newInvitationIds)
          ) {
            return state;
          }

          // Crear notificaciones a partir de invitaciones pendientes (solo status: pending)
          const notificationsFromInvitations = invitations
            .filter((inv) => inv.status === "pending") // Solo invitaciones pendientes
            .map((inv) => ({
              id: `invitation-${inv.id}`,
              invitationId: inv.id,
              type: "invitation",
              title: "Invitación a workspace",
              message: `${inv.invited_by?.first_name} ${inv.invited_by?.last_name} te invitó a ${inv.workspace_id?.name}`,
              workspaceName: inv.workspace_id?.name,
              inviterName: `${inv.invited_by?.first_name} ${inv.invited_by?.last_name}`,
              token: inv.token,
              workspaceId: inv.workspace_id?.id,
              viewed: inv.viewed || false,
              status: inv.status,
              date_created: inv.date_created,
            }));

          // Mantener notificaciones no relacionadas con invitaciones
          const otherNotifications = state.notifications.filter(
            (n) => n.type !== "invitation"
          );

          const allNotifications = [
            ...otherNotifications,
            ...notificationsFromInvitations,
          ];
          // Solo contar notificaciones pending como no leídas
          const unreadCount = allNotifications.filter((n) =>
            n.type === "invitation"
              ? n.status === "pending" && !n.viewed
              : !n.viewed
          ).length;

          return {
            notifications: allNotifications,
            unreadCount,
          };
        }),
    }),
    {
      name: "notification-store",
      // Solo persistir las notificaciones que no han sido vistas
      partialize: (state) => ({
        notifications: state.notifications.filter((n) => !n.viewed),
        unreadCount: state.unreadCount,
      }),
    }
  )
);

export default useNotificationStore;
