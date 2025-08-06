// src/hooks/useSocketNotifications.js
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/useAuthStore";
import useNotificationStore from "../store/useNotificationStore";
import { useSocket } from "./useSocket";

export function useSocketNotifications() {
  const user = useAuthStore((s) => s.user);
  const socket = useSocket();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Funciones del store de notificaciones
  const {
    addNotification,
    updateNotification,
    removeNotification,
    removeNotificationByInvitationId,
    markAsViewed,
  } = useNotificationStore();

  useEffect(() => {
    if (!user?.email || !socket) return;

    // 1. Evento de nueva invitación (toast + store)
    const handleNewInvitation = (data) => {
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

      // Mostrar toast con hover handler
      toast.custom((t) => (
        <div
          className={`bg-white shadow-xl rounded-xl p-4 border-l-4 border-blue-500 max-w-sm ${
            t.visible ? "animate-enter" : "animate-leave"
          }`}
          onMouseEnter={() => {
            // Marcar como vista cuando se hace hover (actualiza local + backend)
            console.log(
              "🔵 Toast hover - Marcando invitación como vista:",
              data.invitationId
            );
            markAsViewed(`invitation-${data.invitationId}`);
          }}
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
    };

    // 2. Evento de invitación creada (para dropdown/modal de workspace)
    const handleInvitationCreated = (data) => {
      console.log("📩 useSocketNotifications - Invitación creada:", data);

      // Actualizar cache de invitaciones del workspace
      queryClient.setQueryData(
        ["workspaceInvitations", data.workspaceId],
        (old) => {
          if (!old) return [data.invitation];
          return [data.invitation, ...old];
        }
      );

      // Invalidar query para forzar re-render en cualquier modal abierto
      queryClient.invalidateQueries({
        queryKey: ["workspaceInvitations", data.workspaceId],
      });
    };

    // 3. Evento de invitación actualizada
    const handleInvitationUpdated = (data) => {
      console.log("🔄 Invitación actualizada:", data);

      // Actualizar store local si es para este usuario
      if (data.invitation?.email === user.email) {
        if (data.action === "accept" || data.action === "decline") {
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

          // Si la invitación fue aceptada o rechazada, removerla de la lista
          if (data.action === "accept" || data.action === "decline") {
            return old.filter((inv) => inv.id !== data.invitationId);
          }

          // Si fue solo actualizada, modificar en su lugar
          return old.map((inv) =>
            inv.id === data.invitationId ? { ...inv, ...data.invitation } : inv
          );
        }
      );

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["pendingInvitations"] });
      queryClient.invalidateQueries({
        queryKey: ["workspaceInvitations", data.workspaceId],
      });
    };

    // 4. Evento de invitación eliminada
    const handleInvitationDeleted = (data) => {
      console.log("🗑️ useSocketNotifications - Invitación eliminada:", data);

      // Remover del store local
      console.log(
        "📝 useSocketNotifications - Removiendo notificación con invitationId:",
        data.invitationId
      );
      removeNotificationByInvitationId(data.invitationId);

      // Actualizar cache de invitaciones del workspace
      queryClient.setQueryData(
        ["workspaceInvitations", data.workspaceId],
        (old) => {
          if (!old) return [];
          console.log(
            "📝 useSocketNotifications - Actualizando cache de workspaceInvitations, removiendo:",
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
    };

    // 5. Evento de miembro agregado al workspace
    const handleWorkspaceMemberAdded = (data) => {
      console.log("👥 Nuevo miembro agregado:", data);

      // Actualizar cache de miembros del workspace
      queryClient.setQueryData(
        ["workspaceMembers", data.workspaceId],
        (old) => {
          if (!old) return [data.member];
          return [data.member, ...old];
        }
      );

      // Invalidar invitaciones del workspace (por si había una pending que se convirtió en member)
      queryClient.invalidateQueries({
        queryKey: ["workspaceInvitations", data.workspaceId],
      });

      // Si es este usuario, actualizar lista de workspaces
      if (data.member?.email === user.email) {
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });

        toast.success(
          `Te uniste al workspace ${data.member.workspace_name || ""}`,
          {
            duration: 5000,
          }
        );
      } else {
        // Si es otro usuario uniéndose al workspace donde estoy
        toast.success(
          `${data.member.user_id?.first_name} ${data.member.user_id?.last_name} se unió al workspace`,
          {
            duration: 3000,
          }
        );
      }
    };

    // 6. Evento de miembro actualizado
    const handleWorkspaceMemberUpdated = (data) => {
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
    };

    // 7. Evento de miembro eliminado
    const handleWorkspaceMemberRemoved = (data) => {
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
    };

    // Suscribirse a eventos
    socket.on("new-invitation", handleNewInvitation);
    socket.on("invitation-created", handleInvitationCreated);
    socket.on("invitation-updated", handleInvitationUpdated);
    socket.on("invitation-deleted", handleInvitationDeleted);
    socket.on("workspace-member-added", handleWorkspaceMemberAdded);
    socket.on("workspace-member-updated", handleWorkspaceMemberUpdated);
    socket.on("workspace-member-removed", handleWorkspaceMemberRemoved);

    // Cleanup al desmontar
    return () => {
      socket.off("new-invitation", handleNewInvitation);
      socket.off("invitation-created", handleInvitationCreated);
      socket.off("invitation-updated", handleInvitationUpdated);
      socket.off("invitation-deleted", handleInvitationDeleted);
      socket.off("workspace-member-added", handleWorkspaceMemberAdded);
      socket.off("workspace-member-updated", handleWorkspaceMemberUpdated);
      socket.off("workspace-member-removed", handleWorkspaceMemberRemoved);
    };
  }, [
    user,
    socket,
    navigate,
    queryClient,
    addNotification,
    updateNotification,
    removeNotification,
    removeNotificationByInvitationId,
    markAsViewed,
  ]);

  return socket;
}
