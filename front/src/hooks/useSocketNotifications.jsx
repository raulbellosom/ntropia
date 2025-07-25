// src/hooks/useSocketNotifications.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

export function useSocketNotifications() {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef(null);
  const navigate = useNavigate();

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

    socketRef.current.on("new-invitation", (data) => {
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
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  return socketRef;
}
