// Hook para exponer la conexión socket compartida
import { useRef } from "react";
import { io } from "socket.io-client";
import useAuthStore from "../store/useAuthStore";

let globalSocket = null;

export function useSocket() {
  const user = useAuthStore((s) => s.user);

  // Crear socket solo una vez de manera global
  if (!globalSocket && user?.email) {
    globalSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
    });

    globalSocket.on("connect", () => {
      globalSocket.emit("join", user.email);
      console.log("✅ Socket global conectado:", globalSocket.id);
    });
  }

  return globalSocket;
}

export function closeGlobalSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}
