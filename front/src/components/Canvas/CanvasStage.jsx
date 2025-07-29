// src/components/Canvas/CanvasStage.jsx

import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Stage, Layer, Group, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

import { useCanvasStore } from "../../store/useCanvasStore";
import useZoomPan from "../../hooks/useZoomPan";
import useCanvasShortcuts from "../../hooks/useCanvasShortcuts";
import useShapeDrawing from "../../hooks/useShapeDrawing";
import useSelectionBox from "../../hooks/useSelectionBox";
import useContextMenu from "../../hooks/useContextMenu";
import useImageUpload from "../../hooks/useImageUpload";
import { getCanvasPosition as getCanvasPosUtil } from "../../utils/canvas";

import Grid from "./Grid";
import CanvasLayers from "./CanvasLayers";
import ContextMenu from "./ContextMenu";
import SelectBox from "./SelectBox";
import MultiTransformer from "./MultiTransformer";
import MarkerModal from "../Marker/MarkerModal";

import { GRID_CELL_SIZE } from "../../utils/constants";
import { useEditMode } from "../../hooks/useEditMode";
import useValidActiveLayer from "../../hooks/useValidActiveLayer";
import { toast } from "react-hot-toast";

// Mutations de Directus
import {
  useCreateShape,
  useUpdateShape,
  useDeleteShape,
} from "../../hooks/useShapes";

export default function CanvasStage() {
  const { id: workspaceId } = useParams();
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);
  const multiSelectRef = useRef(null);

  const { isEditMode } = useEditMode();
  const validActiveLayer = useValidActiveLayer();
  const hasActiveLayer = !!validActiveLayer;

  // Dimensiones viewport
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [autoEditTextId, setAutoEditTextId] = useState(null);
  const [markerModalShapeId, setMarkerModalShapeId] = useState(null);

  // Store local
  const {
    zoom,
    pan,
    setZoom,
    setPan,
    gridEnabled,
    strokeColor,
    fillColor,
    shapes,
    layers,
    activeLayerId,
    tool,
    backgroundColor,
    setBackgroundImage,
    backgroundImage,
    canvasWidth,
    canvasHeight,
    saveToHistory,
  } = useCanvasStore();

  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const selectedShapeIds = useCanvasStore((s) => s.selectedShapeIds);
  const setSelectedShape = useCanvasStore((s) => s.setSelectedShape);
  const toggleSelection = useCanvasStore((s) => s.toggleSelection);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const setMultipleSelection = useCanvasStore((s) => s.setMultipleSelection);
  const removeSelectedShapes = useCanvasStore((s) => s.removeSelectedShapes);
  const copyShape = useCanvasStore((s) => s.copyShape);
  const pasteShape = useCanvasStore((s) => s.pasteShape);
  const replaceShape = useCanvasStore((s) => s.replaceShape);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);

  // Mutations Directus
  const createShapeMut = useCreateShape();
  const updateShapeMut = useUpdateShape();
  const deleteShapeMut = useDeleteShape();

  // Context menu
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Offset centrar canvas
  const offset = {
    x: (dims.width - canvasWidth) / 2,
    y: (dims.height - canvasHeight) / 2,
  };
  const [bgImg] = useImage(backgroundImage || "");

  // Zoom & Pan
  useZoomPan(stageRef, { zoom, setZoom, pan, setPan, tool });

  // Imagen upload
  const { handleImageUpload, openImageInput } = useImageUpload({
    fileInputRef,
    CANVAS_WIDTH: canvasWidth,
    CANVAS_HEIGHT: canvasHeight,
    layers,
    activeLayerId,
    addShape: async (shape) => {
      // 🚀 SOLO servidor - Sin update local
      const result = await createShapeMut.mutateAsync({
        ...shape,
        layer_id: shape.layerId,
        workspace_id: workspaceId,
        data: shape.props,
      });
      return result?.data?.id; // Retornar el ID de la shape creada
    },
    setSelectedShape,
    setTool: useCanvasStore.getState().setTool,
    saveToHistory,
    getCanvasPosition: () => getCanvasPosUtil(stageRef, offset),
    useCanvasStoreRef: useCanvasStore,
  });

  // Atajos
  useCanvasShortcuts({
    autoEditTextId,
    setAutoEditTextId,
    selectedShapeId,
    selectedShapeIds,
    clearSelection,
    copyShape,
    pasteShape,
    toggleGrid: useCanvasStore.getState().toggleGrid,
    toggleLayersPanel: useCanvasStore.getState().toggleLayersPanel,
    removeSelectedShapes,
    tool,
  });

  // Drawing hook
  const {
    isDrawing,
    handleMouseDown: drawMouseDown,
    handleMouseMove: drawMouseMove,
    handleMouseUp: drawMouseUp,
  } = useShapeDrawing({
    tool,
    layers,
    activeLayerId,
    strokeColor,
    fillColor,
    addShape: (shape) => {
      // 🚀 SOLO servidor - Sin update local
      createShapeMut.mutate({
        ...shape,
        layer_id: shape.layerId,
        workspace_id: workspaceId,
        data: shape.props,
      });
    },
    updateShape: (id, props) => {
      // 🚀 SOLO servidor - Sin update local
      const shape = shapes.find((s) => s.id === id);
      if (!shape) return;

      updateShapeMut.mutate({
        id,
        data: {
          data: { ...shape.props, ...props }, // Merge con props existentes
        },
      });
    },
    setSelectedShape,
    saveToHistory,
    setAutoEditTextId,
    getCanvasPosition: () => getCanvasPosUtil(stageRef, offset),
    useCanvasStoreRef: useCanvasStore,
  });

  // Selection box
  const {
    selectBox,
    isSelecting,
    handleStart: selectStart,
    handleMove: selectMove,
    handleEnd: selectEnd,
  } = useSelectionBox({
    getCanvasPosition: () => getCanvasPosUtil(stageRef, offset),
    shapes,
    layers,
    setMultipleSelection,
  });

  // MultiTransformer
  useEffect(() => {
    if (!stageRef.current || !multiSelectRef.current) return;

    if (selectedShapeIds.length > 1) {
      const nodes = selectedShapeIds
        .map((id) => stageRef.current.findOne(`#${id}`))
        .filter(Boolean);
      multiSelectRef.current.nodes(nodes);
      multiSelectRef.current.getLayer().batchDraw();
    } else {
      multiSelectRef.current.nodes([]);
    }
  }, [selectedShapeIds]);

  // Resize
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      setDims({ width: w, height: h });
      setPan({ x: 0, y: 0 });
      setZoom(1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [setPan, setZoom]);

  // Prevent scroll touch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, []);

  // Open image input - solo una vez por selección de herramienta
  const prevTool = useRef(tool);
  useEffect(() => {
    if (tool === "image" && prevTool.current !== "image") {
      openImageInput();
    }
    prevTool.current = tool;
  }, [tool, openImageInput]);

  // Close marker modal if shape removed
  useEffect(() => {
    if (
      markerModalShapeId &&
      !shapes.find((s) => s.id === markerModalShapeId)
    ) {
      setMarkerModalShapeId(null);
    }
  }, [shapes, markerModalShapeId]);

  // Stage mouse handlers
  const handleStageMouseDown = (e) => {
    if (contextMenu) hideContextMenu();
    if (!isEditMode && tool !== "hand") return;
    const isShape =
      e.target.getClassName && e.target.getClassName() !== "Group";
    if (tool === "select" && isShape) return;
    const isBackground =
      e.target === e.target.getStage() || e.target.id() === "background-rect";
    if (tool === "select" && isBackground) {
      clearSelection();
      selectStart();
    } else if (tool !== "select" && isEditMode) {
      drawMouseDown(e);
    }
  };
  const handleStageMouseMove = (e) => {
    if (!isEditMode || tool === "hand") return;
    if (tool === "select") selectMove();
    else if (isDrawing) drawMouseMove(e, shapes);
  };
  const handleStageMouseUp = () => {
    if (!isEditMode || tool === "hand") return;
    if (tool === "select") selectEnd();
    if (isDrawing) drawMouseUp();
  };

  // Transform end
  const handleTransformEnd = (e) => {
    const id = e.target.id();
    const node = e.target;
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;
    const layer = layers.find((l) => l.id === shape.layerId);
    if (layer?.locked) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    const x = node.x();
    const y = node.y();
    let propsUpdate = {};

    switch (shape.type) {
      case "rect":
      case "image":
      case "marker":
        propsUpdate = {
          x,
          y,
          width: node.width() * scaleX,
          height: node.height() * scaleY,
          rotation,
        };
        break;
      case "circle":
        propsUpdate = {
          x,
          y,
          radius: shape.props.radius * scaleX,
          rotation,
        };
        break;
      case "line":
      case "freeDraw":
      case "arrow":
        propsUpdate = {
          x,
          y,
          points: shape.props.points.map((pt, idx) =>
            idx % 2 === 0 ? pt * scaleX : pt * scaleY
          ),
          rotation,
        };
        break;
      case "text":
        propsUpdate = {
          x,
          y,
          width: node.width() * scaleX,
          height: node.height() * scaleY,
          fontSize: (shape.props.fontSize || 16) * scaleX,
          rotation,
        };
        break;
      default:
        break;
    }

    node.scaleX(1);
    node.scaleY(1);
    node.rotation(0);

    // 🚀 SOLO servidor - Sin update local
    // Enviar los props dentro del campo 'data' de Directus
    saveToHistory();
    updateShapeMut.mutate({
      id,
      data: {
        data: { ...shape.props, ...propsUpdate }, // Merge con props existentes
      },
    });
  };

  // Drag end
  const handleShapeDragEnd = (e) => {
    const id = e.target.id();
    const x = e.target.x();
    const y = e.target.y();

    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    // 🚀 SOLO servidor - Sin update local
    // Enviar los props dentro del campo 'data' de Directus
    saveToHistory();
    updateShapeMut.mutate({
      id,
      data: {
        data: { ...shape.props, x, y }, // Merge con props existentes
      },
    });
  };

  // Shape double click
  const handleShapeDoubleClick = (id) => {
    setSelectedShape(id);
  };

  // Context menu actions
  const deleteViaMenu = (id) => {
    // 🚀 SOLO servidor - Sin update local
    deleteShapeMut.mutate(id);
  };

  const bringFront = (id) => useCanvasStore.getState().bringShapeToFront(id);
  const sendBack = (id) => useCanvasStore.getState().sendShapeToBack(id);
  const bringForward = (id) => useCanvasStore.getState().bringShapeForward(id);
  const sendBackward = (id) => useCanvasStore.getState().sendShapeBackward(id);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-900 relative overflow-hidden"
    >
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,application/pdf"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />

      <Stage
        ref={(r) => (stageRef.current = r)}
        width={dims.width}
        height={dims.height}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable={tool === "hand"}
        onDragEnd={(e) => {
          if (tool === "hand") setPan({ x: e.target.x(), y: e.target.y() });
        }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onDblClick={(e) => {
          const id = e.target.id();
          if (id) handleShapeDoubleClick(id);
        }}
        style={{ cursor: tool === "hand" ? "grab" : "crosshair" }}
      >
        <Layer>
          <Group x={offset.x} y={offset.y}>
            <Rect
              id="background-rect"
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill={backgroundColor}
              listening={false}
            />
            {backgroundImage && bgImg && (
              <KonvaImage
                image={bgImg}
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                listening={false}
              />
            )}
            {gridEnabled && (
              <Grid
                width={canvasWidth}
                height={canvasHeight}
                cellSize={GRID_CELL_SIZE}
              />
            )}
            <CanvasLayers
              layers={layers}
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              tool={tool}
              toggleSelection={toggleSelection}
              setSelectedShape={setSelectedShape}
              handleTransformEnd={handleTransformEnd}
              handleShapeDragEnd={handleShapeDragEnd}
              handleShapeDoubleClick={handleShapeDoubleClick}
              setContextMenu={showContextMenu}
              autoEditTextId={autoEditTextId}
              updateShape={(id, props) => {
                // 🚀 SOLO servidor - Sin update local
                const shape = shapes.find((s) => s.id === id);
                if (!shape) return;

                updateShapeMut.mutate({
                  id,
                  data: {
                    data: { ...shape.props, ...props }, // Merge con props existentes
                  },
                });
              }}
              setActiveLayer={setActiveLayer}
            />
            <SelectBox selectBox={selectBox} />
          </Group>
          <MultiTransformer
            transformerRef={multiSelectRef}
            enabled={isEditMode && selectedShapeIds.length > 1}
          />
        </Layer>
      </Stage>

      <ContextMenu
        contextMenu={contextMenu}
        onBringToFront={bringFront}
        onSendToBack={sendBack}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onCopy={copyShape}
        onPaste={pasteShape}
        onDelete={deleteViaMenu}
        onReplace={replaceShape}
        clipboardShape={useCanvasStore.getState().clipboardShape}
        onClose={hideContextMenu}
      />

      {markerModalShapeId && (
        <MarkerModal
          shapeId={markerModalShapeId}
          onClose={() => setMarkerModalShapeId(null)}
        />
      )}
    </div>
  );
}
