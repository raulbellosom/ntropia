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
import { useUploadFile } from "../../hooks/useFiles";
import { useCanvasStore } from "../../store/useCanvasStore";
import WorkspaceLoader from "../common/WorkspaceLoader";
import { toast } from "react-hot-toast";
import { generateId } from "../../utils/id";
import { API_URL } from "../../config";

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
  const uploadFile = useUploadFile();
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
    if (backendShapes) {
      // Mapear backend → frontend
      const shapesFrontend = backendShapes.map((s) => ({
        ...s,
        id: String(s.id), // <- convierte id a string
        props: s.data,
        layerId: String(s.layer_id), // <- convierte layerId a string
      }));
      setAllShapes(shapesFrontend);
    }
  }, [backendShapes, setAllShapes]);

  // 4. Hidrata background/color/size cuando llegan los datos del workspace
  useEffect(() => {
    if (workspace) {
      setBackgroundImage(
        workspace.background
          ? `${API_URL}/assets/${workspace.background}`
          : null
      );

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
      // 1. SUBIR imagen de fondo si es base64/dataURL
      let backgroundId = workspace.background;
      if (
        backgroundImage &&
        !/^https?:\/\//.test(backgroundImage) &&
        !/^\/assets\//.test(backgroundImage) &&
        backgroundImage.startsWith("data:")
      ) {
        const fileBlob = await fetch(backgroundImage).then((res) => res.blob());
        const uuid = generateId();
        const ext = fileBlob.type.split("/")[1];

        // SUBE la imagen y obtén el ID
        const uploadRes = await uploadFile.mutateAsync({
          file: fileBlob,
          fileName: `${uuid}.${ext}`,
        });
        backgroundId = uploadRes.data.id || uploadRes.data.data?.id;
      }

      // 2. GUARDAR capas (layers) y shapes igual que antes...
      const tempIdToRealId = {};
      let layersToSave = layers.filter((l) => !(l._isNew && l._toDelete));
      for (const [i, l] of layersToSave.entries()) {
        const layerPayload = {
          name: l.name,
          order: typeof l.order === "number" ? l.order : i,
          visible: typeof l.visible === "boolean" ? l.visible : true,
          locked: typeof l.locked === "boolean" ? l.locked : false,
          workspace_id: workspaceId,
        };
        if (l.id) layerPayload.id = l.id;

        if (l._toDelete && l.id && !l._isNew) {
          await deleteLayer.mutateAsync(l.id);
        } else if (l._isNew && !l._toDelete) {
          const res = await createLayer.mutateAsync(layerPayload);
          const realId = res.data.id || res.data.data?.id;
          tempIdToRealId[l.id] = realId;
        } else if (l._dirty && l.id && !l._isNew && !l._toDelete) {
          await updateLayer.mutateAsync({ id: l.id, data: layerPayload });
        }
      }

      // 3. GUARDAR SHAPES igual que antes (incluyendo images)
      const validLayerIds = [
        ...layersToSave
          .filter((l) => !l._toDelete && !l._isNew)
          .map((l) => l.id),
        ...Object.values(tempIdToRealId),
      ];
      let shapesToSave = shapes.filter(
        (s) =>
          !(s._isNew && s._toDelete) &&
          validLayerIds.includes(tempIdToRealId[s.layerId] || s.layerId)
      );
      for (const [i, s] of shapesToSave.entries()) {
        let finalShape = { ...s };

        // Si es imagen, súbela si es base64/dataURL
        if (s.type === "image" && s.props?.src) {
          if (s.props.src.startsWith("data:")) {
            const imgBlob = await fetch(s.props.src).then((res) => res.blob());
            const uuid = generateId();
            const ext = imgBlob.type.split("/")[1];
            const uploadRes = await uploadFile.mutateAsync({
              file: imgBlob,
              fileName: `${uuid}.${ext}`,
            });
            const fileId = uploadRes.data?.id || uploadRes.data?.data?.id;
            finalShape.props = {
              ...finalShape.props,
              src: fileId,
            };
          }
        }

        // Si es un marker con imágenes en base64
        if (s.type === "marker" && Array.isArray(s.props?.images)) {
          // Nuevo: Recorrer y subir las imágenes base64
          const uploadedImages = [];
          for (const imgSrc of s.props.images) {
            if (imgSrc.startsWith("data:")) {
              const imgBlob = await fetch(imgSrc).then((res) => res.blob());
              const uuid = generateId();
              const ext = imgBlob.type.split("/")[1];
              const uploadRes = await uploadFile.mutateAsync({
                file: imgBlob,
                fileName: `${uuid}.${ext}`,
              });
              const fileId = uploadRes.data?.id || uploadRes.data?.data?.id;
              uploadedImages.push(fileId);
            } else {
              // Si ya es un ID, conservarlo
              uploadedImages.push(imgSrc);
            }
          }
          finalShape.props = {
            ...finalShape.props,
            images: uploadedImages,
          };
        }
        const layerIdReal =
          tempIdToRealId[finalShape.layerId] || finalShape.layerId;
        const shapePayload = {
          name: finalShape.name,
          order: typeof finalShape.order === "number" ? finalShape.order : i,
          layer_id: layerIdReal,
          workspace_id: workspaceId,
          data: finalShape.props,
          type: finalShape.type,
        };
        if (s.id && !s._isNew) shapePayload.id = s.id;

        if (s._toDelete && s.id && !s._isNew) {
          await deleteShape.mutateAsync(s.id);
        } else if (s._isNew && !s._toDelete) {
          await createShape.mutateAsync(shapePayload);
        } else if (s._dirty && s.id && !s._isNew && !s._toDelete) {
          await updateShape.mutateAsync({ id: s.id, data: shapePayload });
        }
      }

      // 4. GUARDAR el workspace, incluyendo el nuevo fondo y el tamaño actual
      // (si backgroundId es null, puedes guardar null o dejarlo como estaba)
      await updateWorkspace.mutateAsync({
        id: workspaceId,
        data: {
          background: backgroundId || null,
          backgroundColor,
          canvasWidth,
          canvasHeight,
        },
      });

      clearAllFlags();
      toast.success("¡Canvas guardado exitosamente!");
      console.log(
        "[Guardar todo] OK: background",
        backgroundId,
        "color",
        backgroundColor,
        "size",
        canvasWidth,
        canvasHeight
      );
    } catch (err) {
      toast.error("Ocurrió un error al guardar. Intenta de nuevo.");
      console.error("Error al guardar todo:", err);
    }
  }

  // ----- DESCARTAR TODO -----
  function handleDiscardAll() {
    // Capas
    if (backendLayers) {
      setAllLayersDefault(backendLayers);
    }

    // Shapes
    if (backendShapes) {
      // Mapea a formato frontend
      const shapesFrontend = backendShapes.map((s) => ({
        ...s,
        id: String(s.id),
        props: s.data,
        layerId: String(s.layer_id),
      }));
      setAllShapesDefault(shapesFrontend);
    }

    // Otros estados
    if (workspace) {
      setBackgroundImage(
        workspace.background
          ? `${API_URL}/assets/${workspace.background}`
          : null
      );

      if (workspace.backgroundColor)
        setBackgroundColor(workspace.backgroundColor);
      if (workspace.canvasWidth && workspace.canvasHeight)
        setCanvasSize({
          width: workspace.canvasWidth,
          height: workspace.canvasHeight,
        });
    }

    clearAllFlags();
    toast("Cambios descartados.", { icon: "ℹ️" });
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
