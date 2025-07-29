// src/components/common/NotificationsDropdown.jsx
import { useState, useEffect } from "react";
import { Bell, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import api from "../../services/api";

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Hook para obtener invitaciones pendientes del usuario actual
  const {
    data: invitations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["pendingInvitations", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const response = await api.get(
        `/items/invitations?filter[email][_eq]=${user.email}&filter[status][_eq]=pending&fields=*,workspace_id.*,invited_by.*&sort=-date_created`
      );
      return response.data.data || [];
    },
    enabled: !!user?.email,
    refetchInterval: (data) => {
      // Solo hacer polling si el dropdown está abierto o hay invitaciones
      if (!isOpen && (!data || data.length === 0)) return false;
      // Si hay invitaciones pendientes, refrescar más frecuentemente (15s)
      // Si no hay invitaciones, refrescar menos frecuentemente (60s)
      return data && data.length > 0 ? 15000 : 60000;
    },
    staleTime: 10000, // Los datos se consideran frescos por 10 segundos
  });

  // Refrescar cuando se abre el dropdown
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const count = invitations.length;

  const handleViewInvitation = (invitation) => {
    // Usar el token existente de la invitación
    navigate(`/accept-invitation?token=${invitation.token}`);
    setIsOpen(false);
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
                ) : count === 0 ? (
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
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Invitación a workspace
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-semibold">
                                {invitation.invited_by?.first_name}{" "}
                                {invitation.invited_by?.last_name}
                              </span>{" "}
                              te invitó a{" "}
                              <span className="font-semibold">
                                {invitation.workspace_id?.name}
                              </span>
                            </p>
                            <button
                              onClick={() => handleViewInvitation(invitation)}
                              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
                            >
                              <Eye className="w-3 h-3" />
                              Ver solicitud
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {count > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500 text-center">
                    {count} invitación{count !== 1 ? "es" : ""} pendiente
                    {count !== 1 ? "s" : ""}
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
