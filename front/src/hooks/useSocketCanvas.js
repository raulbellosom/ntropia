// front/src/hooks/useSocketCanvas.js
import { useEffect } from "react";
import { io } from "socket.io-client";
import { useCanvasStore } from "../store/useCanvasStore";

// URL de tu socket-server
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:4010";
const socket = io(SOCKET_URL, { autoConnect: false });

export default function useSocketCanvas(workspaceId, userEmail) {
  // Capas remotas
  const addRemoteLayer = useCanvasStore((s) => s.addRemoteLayer);
  const updateRemoteLayer = useCanvasStore((s) => s.updateRemoteLayer);
  const removeRemoteLayer = useCanvasStore((s) => s.removeRemoteLayer);

  // Shapes remotas
  const addRemoteShape = useCanvasStore((s) => s.addRemoteShape);
  const updateRemoteShape = useCanvasStore((s) => s.updateRemoteShape);
  const removeRemoteShape = useCanvasStore((s) => s.removeRemoteShape);

  // Workspace updates
  const setCanvasSize = useCanvasStore((s) => s.setCanvasSize);
  const setBackgroundColor = useCanvasStore((s) => s.setBackgroundColor);
  const setBackgroundImage = useCanvasStore((s) => s.setBackgroundImage);

  useEffect(() => {
    if (!workspaceId) return;

    // 1) Conectar socket
    if (!socket.connected) {
      console.log("🔌 Conectando socket...");
      socket.connect();
      if (userEmail) {
        socket.emit("join", userEmail);
      }
    }

    // 2) Entrar a la sala de este workspace
    console.log("🏠 Uniéndose a workspace:", workspaceId);
    socket.emit("join-workspace", workspaceId);

    // 3) Escuchar eventos de Layer con logs
    const handleLayerCreated = (layer) => {
      addRemoteLayer(layer);
    };

    const handleLayerUpdated = (layer) => {
      updateRemoteLayer(layer);
    };

    const handleLayerDeleted = (data) => {
      removeRemoteLayer(data.id);
    };

    socket.on("layer-created", handleLayerCreated);
    socket.on("layer-updated", handleLayerUpdated);
    socket.on("layer-deleted", handleLayerDeleted);

    // 4) Escuchar eventos de Shape
    socket.on("shape-created", addRemoteShape);
    socket.on("shape-updated", updateRemoteShape);
    socket.on("shape-deleted", ({ id }) => removeRemoteShape(id));

    // 5) Escuchar eventos de Workspace
    const handleWorkspaceUpdated = async (workspace) => {
      console.log("📝 Workspace updated received:", workspace);

      // Actualizar canvas size si cambió
      if (workspace.canvasWidth && workspace.canvasHeight) {
        setCanvasSize({
          width: workspace.canvasWidth,
          height: workspace.canvasHeight,
        });
      }

      // Actualizar background color si cambió
      if (workspace.backgroundColor) {
        setBackgroundColor(workspace.backgroundColor);
      }

      // Actualizar background image si cambió
      if (workspace.background) {
        try {
          // Importar api aquí para evitar problemas de dependencias circulares
          const { default: api } = await import("../services/api");
          const { API_URL } = await import("../config");

          const res = await api.get(`/assets/${workspace.background}`, {
            responseType: "blob",
          });
          const url = URL.createObjectURL(res.data);
          setBackgroundImage(url);
        } catch (error) {
          console.error("Error loading workspace background:", error);
          setBackgroundImage(null);
        }
      } else {
        setBackgroundImage(null);
      }
    };

    socket.on("workspace-updated", handleWorkspaceUpdated);

    // Cleanup al desmontar/ cambiar workspace
    return () => {
      socket.off("layer-created", handleLayerCreated);
      socket.off("layer-updated", handleLayerUpdated);
      socket.off("layer-deleted", handleLayerDeleted);

      socket.off("shape-created", addRemoteShape);
      socket.off("shape-updated", updateRemoteShape);
      socket.off("shape-deleted", ({ id }) => removeRemoteShape(id));

      socket.off("workspace-updated", handleWorkspaceUpdated);
    };
  }, [
    workspaceId,
    userEmail,
    addRemoteLayer,
    updateRemoteLayer,
    removeRemoteLayer,
    addRemoteShape,
    updateRemoteShape,
    removeRemoteShape,
    setCanvasSize,
    setBackgroundColor,
    setBackgroundImage,
  ]);
}
