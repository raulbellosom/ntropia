// front/src/components/Workspace/WorkspacePage.jsx

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Real-time socket hook
import useSocketCanvas from "../../hooks/useSocketCanvas";

import Toolbar from "../Toolbar/Toolbar";
import LayersPanel from "../LayersPanel/LayersPanel";
import CanvasStage from "../Canvas/CanvasStage";
import ToolbarControls from "../Toolbar/ToolbarControls";
import WorkspaceControlsBar from "../Workspace/WorkspaceControlsBar";

import { useWorkspace } from "../../hooks/useWorkspaces";
import { useLayers } from "../../hooks/useLayers";
import { useShapes } from "../../hooks/useShapes";

import useAuthStore from "../../store/useAuthStore";
import { useCanvasStore } from "../../store/useCanvasStore";

import WorkspaceLoader from "../common/WorkspaceLoader";
import { API_URL } from "../../config";
import api from "../../services/api";

export default function WorkspacePage() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // ───── Real-time ──────────────────────────────────────────────────────────
  useSocketCanvas(workspaceId, user?.email);

  // Ref para liberar URL de fondo anterior
  const bgUrlRef = useRef(null);

  // Queries backend
  const { data: workspace, isLoading: loadingWorkspace } =
    useWorkspace(workspaceId);
  const { data: backendLayers, isLoading: loadingLayers } =
    useLayers(workspaceId);
  const layerIds = backendLayers?.map((l) => l.id) ?? [];
  const { data: backendShapes, isLoading: loadingShapes } = useShapes(layerIds);

  // Store setters / estado
  const resetAll = useCanvasStore((s) => s.resetAll);
  const setAllLayers = useCanvasStore((s) => s.setAllLayers);
  const setAllShapes = useCanvasStore((s) => s.setAllShapes);
  const setBackgroundImage = useCanvasStore((s) => s.setBackgroundImage);
  const setBackgroundColor = useCanvasStore((s) => s.setBackgroundColor);
  const setCanvasSize = useCanvasStore((s) => s.setCanvasSize);

  const mode = useCanvasStore((s) => s.mode);
  const toggleMode = useCanvasStore((s) => s.toggleMode);

  // ───── Hidratación controlada ──────────────────────────────────────────────
  const [layersHydrated, setLayersHydrated] = useState(false);
  const [shapesHydrated, setShapesHydrated] = useState(false);

  // Al cambiar de workspace, resetea y desmarca hidrataciones
  useEffect(() => {
    resetAll();
    setLayersHydrated(false);
    setShapesHydrated(false);
  }, [workspaceId, resetAll]);

  // 1) Hidratamos layers SOLO la primera vez que llegan
  useEffect(() => {
    if (!layersHydrated && backendLayers) {
      const sortedLayers = [...backendLayers].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
      setAllLayers(sortedLayers);
      setLayersHydrated(true);
    }
  }, [backendLayers, layersHydrated, setAllLayers]);

  // 2) Hidratamos shapes SOLO la primera vez que llegan (y solo si ya hydrate layers)
  useEffect(() => {
    if (!shapesHydrated && layersHydrated && backendShapes) {
      const shapesFrontend = backendShapes
        .map((s) => ({
          ...s,
          id: String(s.id),
          props: s.data,
          layerId: String(s.layer_id),
          order: s.order || 0, // Asegurar que tiene order
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0)); // Ordenar por order
      setAllShapes(shapesFrontend);
      setShapesHydrated(true);
    }
  }, [backendShapes, layersHydrated, shapesHydrated, setAllShapes]);

  // 3) Carga background/color/size del workspace
  useEffect(() => {
    async function loadBackground() {
      if (!workspace) return;

      if (workspace.backgroundColor) {
        setBackgroundColor(workspace.backgroundColor);
      }
      if (workspace.canvasWidth && workspace.canvasHeight) {
        setCanvasSize({
          width: workspace.canvasWidth,
          height: workspace.canvasHeight,
        });
      }

      if (workspace.background) {
        try {
          const res = await api.get(`/assets/${workspace.background}`, {
            responseType: "blob",
          });
          if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current);
          const url = URL.createObjectURL(res.data);
          bgUrlRef.current = url;
          setBackgroundImage(url);
        } catch {
          setBackgroundImage(null);
        }
      } else {
        if (bgUrlRef.current) {
          URL.revokeObjectURL(bgUrlRef.current);
          bgUrlRef.current = null;
        }
        setBackgroundImage(null);
      }
    }
    loadBackground();
  }, [workspace, setBackgroundColor, setCanvasSize, setBackgroundImage]);

  if (loadingWorkspace || loadingLayers || (loadingShapes && !shapesHydrated)) {
    return <WorkspaceLoader text="Cargando tu Workspace..." />;
  }

  return (
    <div className="h-[100dvh] w-[100vw] flex flex-col relative bg-slate-900 overflow-hidden">
      <WorkspaceControlsBar
        mode={mode}
        onToggleMode={toggleMode}
        onExit={() => navigate("/")}
        userRole={workspace?.userRole}
        isOwner={workspace?.isOwner || workspace?.owner === user?.id}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <CanvasStage />
        {mode === "edit" && <Toolbar />}
        <ToolbarControls />
        <LayersPanel />
      </div>
    </div>
  );
}
