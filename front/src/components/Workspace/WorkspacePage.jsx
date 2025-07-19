import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toolbar from "../Toolbar/Toolbar";
import LayersPanel from "../LayersPanel/LayersPanel";
import CanvasStage from "../Canvas/CanvasStage";
import ToolbarControls from "../Toolbar/ToolbarControls";
import WorkspaceControlsBar from "../Workspace/WorkspaceControlsBar";
import { useWorkspace, useUpdateWorkspace } from "../../hooks/useWorkspaces";
import {
  useLayers,
  useCreateLayer,
  useUpdateLayer,
  useDeleteLayer,
} from "../../hooks/useLayers";
import {
  useShapes,
  useCreateShape,
  useUpdateShape,
  useDeleteShape,
} from "../../hooks/useShapes";
import { useCreateFile } from "../../hooks/useFiles";
import { useCanvasStore } from "../../store/useCanvasStore";
import WorkspaceLoader from "../common/WorkspaceLoader";

export default function WorkspacePage() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();

  // Datos del backend
  const { data: workspace, isLoading: loadingWorkspace } =
    useWorkspace(workspaceId);
  const { data: backendLayers, isLoading: loadingLayers } =
    useLayers(workspaceId);
  const layerIds = backendLayers ? backendLayers.map((l) => l.id) : [];
  const { data: backendShapes, isLoading: loadingShapes } = useShapes(layerIds);

  // Zustand store setters
  const setAllLayers = useCanvasStore((s) => s.setAllLayers);
  const setAllShapes = useCanvasStore((s) => s.setAllShapes);
  const setBackgroundImage = useCanvasStore((s) => s.setBackgroundImage);
  const setBackgroundColor = useCanvasStore((s) => s.setBackgroundColor);
  const setCanvasSize = useCanvasStore((s) => s.setCanvasSize);

  // Estado de modo edición/visualización
  const mode = useCanvasStore((s) => s.mode);
  const toggleMode = useCanvasStore((s) => s.toggleMode);

  // Estado local del canvas (Zustand)
  const layers = useCanvasStore((s) => s.layers);
  const shapes = useCanvasStore((s) => s.shapes);
  const backgroundImage = useCanvasStore((s) => s.backgroundImage);
  const backgroundColor = useCanvasStore((s) => s.backgroundColor);
  const canvasWidth = useCanvasStore((s) => s.canvasWidth);
  const canvasHeight = useCanvasStore((s) => s.canvasHeight);
  const clearAllFlags = useCanvasStore((s) => s.clearAllFlags);
  const setAllLayersDefault = useCanvasStore((s) => s.setAllLayers);
  const setAllShapesDefault = useCanvasStore((s) => s.setAllShapes);
  const resetAll = useCanvasStore((s) => s.resetAll);

  // Mutations (CRUD)
  const createLayer = useCreateLayer();
  const updateLayer = useUpdateLayer();
  const deleteLayer = useDeleteLayer();
  const createShape = useCreateShape();
  const updateShape = useUpdateShape();
  const deleteShape = useDeleteShape();
  const createFile = useCreateFile();
  const updateWorkspace = useUpdateWorkspace();

  // 1. Resetea el estado global cada vez que cambias de workspace
  useEffect(() => {
    resetAll();
  }, [workspaceId, resetAll]);

  // 2. Cuando llegan los layers del backend, hidrata Zustand SOLO si hay datos nuevos
  useEffect(() => {
    if (backendLayers) setAllLayers(backendLayers);
  }, [backendLayers, setAllLayers]);

  // 3. Cuando llegan los shapes del backend, hidrata Zustand SOLO si hay datos nuevos
  useEffect(() => {
    if (backendShapes) setAllShapes(backendShapes);
  }, [backendShapes, setAllShapes]);

  // 4. Hidrata background/color/size cuando llegan los datos del workspace
  useEffect(() => {
    if (workspace) {
      if (workspace.background) setBackgroundImage(workspace.background);
      if (workspace.backgroundColor)
        setBackgroundColor(workspace.backgroundColor);
      if (workspace.canvasWidth && workspace.canvasHeight)
        setCanvasSize({
          width: workspace.canvasWidth,
          height: workspace.canvasHeight,
        });
    }
  }, [workspace, setBackgroundImage, setBackgroundColor, setCanvasSize]);

  // ----- GUARDAR TODO -----
  async function handleSaveAll() {
    try {
      let backgroundId = workspace.background;
      if (
        backgroundImage &&
        !/^https?:\/\//.test(backgroundImage) &&
        !/^\/assets\//.test(backgroundImage) &&
        backgroundImage.startsWith("data:")
      ) {
        const fileBlob = await fetch(backgroundImage).then((res) => res.blob());
        const formData = new FormData();
        formData.append("file", fileBlob, "background.png");
        const res = await createFile.mutateAsync(formData);
        backgroundId = res.data.id || res.data.data?.id;
      }

      // GUARDAR CAPAS
      for (const [i, l] of layers.entries()) {
        // Mapea los campos requeridos
        const layerPayload = {
          name: l.name,
          order: typeof l.order === "number" ? l.order : i, // Usa el orden real, o fallback al índice
          visible: typeof l.visible === "boolean" ? l.visible : true,
          locked: typeof l.locked === "boolean" ? l.locked : false,
          workspace_id: workspaceId,
        };

        // Añade id si es update
        if (l.id) layerPayload.id = l.id;

        if (l._toDelete && l.id) {
          await deleteLayer.mutateAsync(l.id);
        } else if (l._isNew) {
          await createLayer.mutateAsync(layerPayload);
        } else if (l._dirty && l.id) {
          await updateLayer.mutateAsync({ id: l.id, data: layerPayload });
        }
      }

      // GUARDAR FIGURAS (SHAPES)
      for (const [i, s] of shapes.entries()) {
        let finalShape = { ...s };
        if (
          s.type === "image" &&
          s.props?.src &&
          s.props.src.startsWith("data:")
        ) {
          const imgBlob = await fetch(s.props.src).then((res) => res.blob());
          const formData = new FormData();
          formData.append("file", imgBlob, "shape-image.png");
          const res = await createFile.mutateAsync(formData);
          finalShape.props = {
            ...finalShape.props,
            src: res.data.id || res.data.data?.id,
          };
        }

        // ------- MAPEO DE CAMPOS -------
        const shapePayload = {
          name: finalShape.name, // opcional, solo si tu modelo lo usa
          order: typeof finalShape.order === "number" ? finalShape.order : i, // orden dentro de la capa
          layer_id: finalShape.layerId, // camelCase -> snake_case
          data: finalShape.props, // props -> data
          type: finalShape.type,
        };
        // No incluyas props, layerId ni flags internos
        // No mandes id al crear
        if (s.id && !s._isNew) shapePayload.id = s.id;

        // --- CRUD ---
        if (s._toDelete && s.id) {
          await deleteShape.mutateAsync(s.id);
        } else if (s._isNew) {
          await createShape.mutateAsync(shapePayload);
        } else if (s._dirty && s.id) {
          await updateShape.mutateAsync({ id: s.id, data: shapePayload });
        }
      }

      // GUARDAR DATOS DEL WORKSPACE
      await updateWorkspace.mutateAsync({
        id: workspaceId,
        data: {
          background: backgroundId,
          backgroundColor,
          canvasWidth,
          canvasHeight,
        },
      });

      clearAllFlags();
      alert("¡Canvas guardado exitosamente!");
    } catch (err) {
      alert("Ocurrió un error al guardar. Intenta de nuevo.");
    }
  }

  // ----- DESCARTAR TODO -----
  function handleDiscardAll() {
    setAllLayersDefault(backendLayers || []);
    setAllShapesDefault(backendShapes || []);
    if (workspace) {
      if (workspace.background) setBackgroundImage(workspace.background);
      if (workspace.backgroundColor)
        setBackgroundColor(workspace.backgroundColor);
      if (workspace.canvasWidth && workspace.canvasHeight)
        setCanvasSize({
          width: workspace.canvasWidth,
          height: workspace.canvasHeight,
        });
    }
    clearAllFlags();
    alert("Cambios descartados.");
  }

  if (loadingWorkspace || loadingLayers || loadingShapes) {
    return <WorkspaceLoader text="Cargando tu Workspace..." />;
  }

  return (
    <div className="h-[100dvh] w-[100vw] flex flex-col relative bg-slate-900 overflow-hidden">
      {/* Barra superior de controles */}
      <WorkspaceControlsBar
        mode={mode}
        onToggleMode={toggleMode}
        onSave={handleSaveAll}
        onDiscard={handleDiscardAll}
        onExit={() => navigate("/")}
      />

      {/* Contenido principal del canvas */}
      <div className="flex flex-1 overflow-hidden relative">
        <CanvasStage />

        {/* Toolbar vertical de dibujo (siempre pegada a la derecha) */}
        {mode === "edit" && <Toolbar />}
        <ToolbarControls />
        <LayersPanel />
      </div>
    </div>
  );
}
