// src/components/common/NotificationsDropdown.jsx
import { useState, useEffect, useRef } from "react";
import { Bell, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import useNotificationStore from "../../store/useNotificationStore";
import api from "../../services/api";

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const lastInvitationsRef = useRef(null);

  // Estado de notificaciones desde Zustand store
  const {
    notifications,
    unreadCount,
    syncWithInvitations,
    markAsRead,
    updateNotification,
  } = useNotificationStore();

  // Hook para obtener invitaciones pendientes del usuario actual (solo para inicialización)
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["pendingInvitations", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const response = await api.get(
        `/items/invitations?filter[email][_eq]=${user.email}&filter[status][_eq]=pending&fields=*,workspace_id.*,invited_by.*&sort=-date_created`
      );
      return response.data.data || [];
    },
    enabled: !!user?.email,
    refetchOnWindowFocus: false, // Desactivar refetch automático
    refetchOnReconnect: false, // Desactivar refetch al reconectar
    refetchInterval: false, // Desactivar polling - solo tiempo real
    staleTime: Infinity, // Los datos nunca se consideran obsoletos - solo tiempo real
  });

  // Sincronizar invitaciones con el store cuando cambien
  useEffect(() => {
    if (!invitations || !Array.isArray(invitations)) return;

    // Comparar por contenido para evitar actualizaciones innecesarias
    const invitationIds = invitations
      .map((inv) => inv.id)
      .sort()
      .join(",");

    if (lastInvitationsRef.current !== invitationIds) {
      lastInvitationsRef.current = invitationIds;
      syncWithInvitations(invitations);
    }
  }, [invitations, syncWithInvitations]);

  // Contar notificaciones no vistas Y pendientes (para el badge rojo)
  const count = notifications.filter(
    (n) => n.type === "invitation" && n.status === "pending" && !n.viewed
  ).length;

  // Contar todas las pendientes (para el footer del dropdown)
  const totalPending = notifications.filter(
    (n) => n.type === "invitation" && n.status === "pending"
  ).length;

  const handleViewInvitation = async (notification) => {
    // Marcar como vista localmente
    markAsRead(notification.id);

    // Marcar como vista en el servidor si tiene invitationId
    if (notification.invitationId) {
      try {
        await api.patch(`/items/invitations/${notification.invitationId}`, {
          viewed: true,
        });
      } catch (error) {
        console.error("Error marcando invitación como vista:", error);
      }
    }

    // Navegar a la invitación
    navigate(`/accept-invitation?token=${notification.token}`);
    setIsOpen(false);
  };

  const handleNotificationHover = async (notification) => {
    if (!notification.viewed && notification.invitationId) {
      // Marcar como vista localmente
      updateNotification(notification.id, { viewed: true });

      // Marcar como vista en el servidor
      try {
        await api.patch(`/items/invitations/${notification.invitationId}`, {
          viewed: true,
        });
      } catch (error) {
        console.error("Error marcando invitación como vista:", error);
      }
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        className="relative p-2 rounded-lg hover:bg-white/10 transition"
        title="Notificaciones"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-6 h-6 text-[#2563eb]" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Notificaciones</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Cargando notificaciones...
                  </div>
                ) : totalPending === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">
                      Sin notificaciones
                    </p>
                    <p className="text-gray-400 text-sm">
                      Te notificaremos cuando tengas nuevas invitaciones
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications
                      .filter(
                        (n) => n.type === "invitation" && n.status === "pending"
                      ) // Solo invitaciones pendientes (viewed true o false)
                      .map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                            !notification.viewed ? "bg-blue-50" : ""
                          }`}
                          onMouseEnter={() =>
                            handleNotificationHover(notification)
                          }
                          onClick={() => handleViewInvitation(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                !notification.viewed
                                  ? "bg-blue-500 text-white"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                                <Eye className="w-3 h-3" />
                                Ver solicitud
                              </div>
                            </div>
                            {!notification.viewed && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {totalPending > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500 text-center">
                    {totalPending} invitación{totalPending !== 1 ? "es" : ""}{" "}
                    pendiente
                    {totalPending !== 1 ? "s" : ""}
                    {count > 0 && (
                      <span className="text-blue-600 font-medium">
                        {" "}
                        • {count} sin leer
                      </span>
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
