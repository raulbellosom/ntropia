// src/hooks/useSocketNotifications.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/useAuthStore";
import useNotificationStore from "../store/useNotificationStore";

export function useSocketNotifications() {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Funciones del store de notificaciones
  const {
    addNotification,
    updateNotification,
    removeNotification,
    removeNotificationByInvitationId,
  } = useNotificationStore();

  useEffect(() => {
    if (!user?.email) return;

    // Conectarse al servidor socket
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join", user.email); // Unirse a sala privada
      console.log("✅ Socket conectado:", socketRef.current.id);
    });

    // 1. Evento de nueva invitación (toast + store)
    socketRef.current.on("new-invitation", (data) => {
      console.log("📨 Nueva invitación recibida:", data);

      // Agregar al store
      addNotification({
        id: `invitation-${data.invitationId}`,
        invitationId: data.invitationId,
        type: "invitation",
        title: "Invitación a workspace",
        message: `${data.inviterName} te invitó a ${data.workspaceName}`,
        workspaceName: data.workspaceName,
        inviterName: data.inviterName,
        token: data.token,
        workspaceId: data.workspaceId,
        viewed: false,
        status: "pending", // Nuevas invitaciones siempre son pending
        date_created: new Date().toISOString(),
      });

      // Mostrar toast
      toast.custom((t) => (
        <div
          className={`bg-white shadow-xl rounded-xl p-4 border-l-4 border-blue-500 max-w-sm ${
            t.visible ? "animate-enter" : "animate-leave"
          }`}
        >
          <p className="font-bold text-blue-700">
            Invitación de {data.inviterName}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Te invitó a colaborar en <b>{data.workspaceName}</b>
          </p>
          <button
            className="mt-3 text-blue-600 text-sm hover:underline"
            onClick={() => {
              toast.dismiss(t.id);
              navigate(`/accept-invitation?token=${data.token}`);
            }}
          >
            Ver invitación →
          </button>
        </div>
      ));

      // Invalidar queries de invitaciones
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
    });

    // 2. Evento de invitación creada (para dropdown/modal de workspace)
    socketRef.current.on("invitation-created", (data) => {
      console.log("📩 Invitación creada en workspace:", data);

      // Actualizar cache de invitaciones del workspace
      queryClient.setQueryData(
        ["workspaceInvitations", data.workspaceId],
        (old) => {
          if (!old) return [data.invitation];
          return [data.invitation, ...old];
        }
      );
    });

    // 3. Evento de invitación actualizada
    socketRef.current.on("invitation-updated", (data) => {
      console.log("🔄 Invitación actualizada:", data);

      // Actualizar store local si es para este usuario
      if (data.invitation?.email === user.email) {
        if (data.action === "accepted" || data.action === "rejected") {
          removeNotificationByInvitationId(data.invitationId);
        } else {
          updateNotification(`invitation-${data.invitationId}`, {
            viewed: data.invitation.viewed,
          });
        }
      }

      // Actualizar cache de invitaciones del workspace
      queryClient.setQueryData(
        ["workspaceInvitations", data.workspaceId],
        (old) => {
          if (!old) return [];
          return old.map((inv) =>
            inv.id === data.invitationId ? { ...inv, ...data.invitation } : inv
          );
        }
      );

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
    });

    // 4. Evento de invitación eliminada
    socketRef.current.on("invitation-deleted", (data) => {
      console.log("🗑️ Invitación eliminada:", data);

      // Remover del store local
      console.log(
        "📝 Removiendo notificación con invitationId:",
        data.invitationId
      );
      removeNotificationByInvitationId(data.invitationId);

      // Actualizar cache de invitaciones del workspace
      queryClient.setQueryData(
        ["workspaceInvitations", data.workspaceId],
        (old) => {
          if (!old) return [];
          console.log(
            "📝 Actualizando cache de workspaceInvitations, removiendo:",
            data.invitationId
          );
          return old.filter((inv) => inv.id !== data.invitationId);
        }
      );

      // Invalidar queries para asegurar actualización
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
      queryClient.invalidateQueries({
        queryKey: ["workspaceInvitations", data.workspaceId],
      });
    }); // 5. Evento de miembro agregado al workspace
    socketRef.current.on("workspace-member-added", (data) => {
      console.log("👥 Nuevo miembro agregado:", data);

      // Actualizar cache de miembros del workspace
      queryClient.setQueryData(
        ["workspaceMembers", data.workspaceId],
        (old) => {
          if (!old) return [data.member];
          return [data.member, ...old];
        }
      );

      // Si es este usuario, actualizar lista de workspaces
      if (data.member?.email === user.email) {
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });

        toast.success(
          `Te uniste al workspace ${data.member.workspace_name || ""}`,
          {
            duration: 5000,
          }
        );
      }
    });

    // 6. Evento de miembro actualizado
    socketRef.current.on("workspace-member-updated", (data) => {
      console.log("🔄 Miembro actualizado:", data);

      // Actualizar cache de miembros del workspace
      queryClient.setQueryData(
        ["workspaceMembers", data.workspaceId],
        (old) => {
          if (!old) return [];
          return old.map((member) =>
            member.id === data.member.id
              ? { ...member, ...data.member }
              : member
          );
        }
      );
    });

    // 7. Evento de miembro eliminado
    socketRef.current.on("workspace-member-removed", (data) => {
      console.log("❌ Miembro eliminado:", data);

      // Actualizar cache de miembros del workspace
      queryClient.setQueryData(
        ["workspaceMembers", data.workspaceId],
        (old) => {
          if (!old) return [];
          return old.filter((member) => member.id !== data.memberId);
        }
      );

      // Si es este usuario, actualizar lista de workspaces
      if (data.memberEmail === user.email) {
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });

        toast.error(
          `Fuiste removido del workspace ${data.workspaceName || ""}`,
          {
            duration: 5000,
          }
        );
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [
    user,
    navigate,
    queryClient,
    addNotification,
    updateNotification,
    removeNotification,
    removeNotificationByInvitationId,
  ]);

  return socketRef;
}
