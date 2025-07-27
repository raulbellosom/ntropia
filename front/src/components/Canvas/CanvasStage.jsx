// src/components/Canvas/CanvasStage.jsx

import React, { useRef, useState, useEffect } from "react";
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
import { toast } from "react-hot-toast";
import useValidActiveLayer from "../../hooks/useValidActiveLayer";

export default function CanvasStage() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);
  const multiSelectRef = useRef(null);
  const { isEditMode } = useEditMode();

  // Estado general
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [autoEditTextId, setAutoEditTextId] = useState(null);
  const [markerModalShapeId, setMarkerModalShapeId] = useState(null);

  // Store
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
    setSelectedShape,
    addShape,
    updateShape,
    toggleGrid,
    toggleLayersPanel,
    saveToHistory,
    backgroundImage,
    canvasWidth,
    canvasHeight,
  } = useCanvasStore();

  const validActiveLayer = useValidActiveLayer();
  const hasActiveLayer = !!validActiveLayer;

  // Selections & multi
  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const selectedShapeIds = useCanvasStore((s) => s.selectedShapeIds);
  const toggleSelection = useCanvasStore((s) => s.toggleSelection);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const setMultipleSelection = useCanvasStore((s) => s.setMultipleSelection);
  const removeSelectedShapes = useCanvasStore((s) => s.removeSelectedShapes);
  const copyShape = useCanvasStore((s) => s.copyShape);
  const pasteShape = useCanvasStore((s) => s.pasteShape);
  const removeShape = useCanvasStore((s) => s.removeShape);
  const clipboardShape = useCanvasStore((s) => s.clipboardShape);
  const replaceShape = useCanvasStore((s) => s.replaceShape);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);

  // Context menu hook
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Offset para centrar canvas
  const offset = {
    x: (dims.width - canvasWidth) / 2,
    y: (dims.height - canvasHeight) / 2,
  };
  window.__konvaOffset = offset;
  const [bgImg] = useImage(backgroundImage || "");

  // Función utilitaria para obtener posición real del canvas
  const getCanvasPosition = () => getCanvasPosUtil(stageRef, offset);

  // Zoom & Pan con hook dedicado
  useZoomPan(stageRef, { zoom, setZoom, pan, setPan, tool });

  // Imagen upload hook
  const { handleImageUpload, openImageInput } = useImageUpload({
    fileInputRef,
    CANVAS_WIDTH: canvasWidth,
    CANVAS_HEIGHT: canvasHeight,
    layers,
    activeLayerId,
    addShape,
    setSelectedShape,
    setTool: useCanvasStore.getState().setTool,
    saveToHistory,
  });

  // Atajos teclado hook
  useCanvasShortcuts({
    autoEditTextId,
    setAutoEditTextId,
    selectedShapeId,
    selectedShapeIds,
    clearSelection,
    copyShape,
    pasteShape,
    toggleGrid,
    toggleLayersPanel,
    removeSelectedShapes,
    tool,
  });

  // Drawing hook (dibujo de figuras)
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
    addShape,
    updateShape,
    setSelectedShape,
    saveToHistory,
    setAutoEditTextId,
    getCanvasPosition,
    useCanvasStoreRef: useCanvasStore,
  });

  // Selección por área
  const {
    selectBox,
    isSelecting,
    handleStart: selectStart,
    handleMove: selectMove,
    handleEnd: selectEnd,
  } = useSelectionBox({
    getCanvasPosition,
    shapes,
    layers,
    setMultipleSelection,
  });

  // MultiTransformer efecto (actualiza nodos seleccionados)
  useEffect(() => {
    if (!stageRef.current || !multiSelectRef.current) return;

    if (selectedShapeIds.length > 1) {
      const nodes = selectedShapeIds
        .map((id) => stageRef.current.findOne(`#${id}`))
        .filter(Boolean);

      if (nodes.length > 1) {
        multiSelectRef.current.nodes(nodes);
        multiSelectRef.current.getLayer().batchDraw();
      }
    } else {
      multiSelectRef.current.nodes([]);
    }
  }, [selectedShapeIds]);

  // Centrar y resize inicial
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

  // Prevenir scroll touch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, []);

  // Abrir file input cuando tool == image
  useEffect(() => {
    if (tool === "image") openImageInput();
  }, [tool, openImageInput]);

  // Ocultar MarkerModal si shape se borra
  useEffect(() => {
    if (
      markerModalShapeId &&
      !shapes.find((s) => s.id === markerModalShapeId)
    ) {
      setMarkerModalShapeId(null);
    }
  }, [shapes, markerModalShapeId]);

  // Handlers combinados para el Stage (unifican select/draw)
  const handleStageMouseDown = (e) => {
    // Ocultar menú contextual
    if (contextMenu) hideContextMenu();

    if (tool === "hand") return;

    const SHAPE_CLASSES = [
      "Arrow",
      "Rect",
      "Circle",
      "Line",
      "Text",
      "Image",
      "FreeDraw",
      "Marker",
      "Group",
    ];
    const clickedOnShape =
      e.target.getClassName &&
      (SHAPE_CLASSES.includes(e.target.getClassName()) ||
        e.target.getParent()?.getClassName() === "Group");

    // En modo visualización, solo permitir interacción con markers
    if (!isEditMode) {
      const isMarker =
        e.target.getParent()?.getClassName() === "Group" &&
        e.target.getParent()?.name() === "marker";
      if (!isMarker) return;
    }

    // Solo retornar temprano si es herramienta select Y se hizo clic en una figura
    if (tool === "select" && clickedOnShape) {
      return;
    }

    // Click en fondo
    const isBackground =
      e.target === e.target.getStage() ||
      (e.target.id && e.target.id() === "background-rect");

    // Evita dibujo si no hay capa activa válida o no está en modo edición
    if (
      (!hasActiveLayer || !isEditMode) &&
      tool !== "select" &&
      tool !== "hand"
    ) {
      if (!isEditMode) return; // En modo visualización no hacer nada

      toast("Selecciona una capa antes de continuar", {
        icon: "⚠️",
        duration: 3500,
      });
      return;
    }

    if (tool === "select" && isBackground && isEditMode) {
      if (!e.evt.ctrlKey && !e.evt.metaKey) {
        clearSelection();
        selectStart();
      }
    } else if (tool !== "select" && isEditMode) {
      // Permitir dibujo solo en modo edición
      drawMouseDown(e);
    }
  };

  const handleStageMouseMove = (e) => {
    if (!isEditMode) return; // No permitir interacciones en modo visualización
    if (tool === "hand") return;
    if (tool === "select") {
      selectMove();
    } else if (isDrawing) {
      drawMouseMove(e, shapes);
    }
  };

  const handleStageMouseUp = () => {
    if (!isEditMode) return; // No permitir interacciones en modo visualización
    if (tool === "hand") return;
    if (tool === "select") {
      selectEnd();
    }
    if (isDrawing) {
      drawMouseUp();
    }
  };

  const handleTransformEnd = (e) => {
    // Selección múltiple (MultiTransformer)
    if (selectedShapeIds.length > 1) {
      selectedShapeIds.forEach((id) => {
        const node = stageRef.current.findOne(`#${id}`);
        if (!node) return;
        const shape = shapes.find((s) => s.id === id);
        if (!shape) return;

        // Busca si la capa está bloqueada (isLocked)
        const layer = layers.find((l) => l.id === shape.layerId);
        const isLocked = layer && layer.locked;
        if (isLocked) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rotation = node.rotation();
        const x = node.x();
        const y = node.y();

        switch (shape.type) {
          case "arrow":
            updateShape(id, {
              x: x,
              y: y,
              points: shape.props.points.map((point, idx) =>
                idx % 2 === 0 ? point * scaleX : point * scaleY
              ),
              rotation: rotation,
            });
            break;
          case "line":
            updateShape(id, {
              x: x,
              y: y,
              points: shape.props.points.map((point, idx) =>
                idx % 2 === 0 ? point * scaleX : point * scaleY
              ),
              rotation: rotation,
            });
            break;
          case "freeDraw":
            updateShape(id, {
              x: x,
              y: y,
              points: shape.props.points.map((point, idx) =>
                idx % 2 === 0 ? point * scaleX : point * scaleY
              ),
              rotation: rotation,
            });
            break;
          case "rect":
          case "image":
          case "marker":
            updateShape(id, {
              x: x,
              y: y,
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
              rotation: rotation,
            });
            break;
          case "text":
            updateShape(id, {
              x: x,
              y: y,
              width: Math.max(50, node.width() * scaleX),
              height: Math.max(20, node.height() * scaleY),
              fontSize: Math.max(8, (shape.props.fontSize || 16) * scaleX),
              rotation: rotation,
            });
            break;
          case "circle":
            updateShape(id, {
              x: x,
              y: y,
              radius: Math.max(5, shape.props.radius * scaleX),
              rotation: rotation,
            });
            break;
          default:
            break;
        }

        // Reset transform para cada nodo
        node.scaleX(1);
        node.scaleY(1);
        node.rotation(0);
      });
      // Guarda historial SOLO UNA VEZ después de todos los updates
      saveToHistory();
      return;
    }

    // Lógica original para transformación de una sola shape
    const node = e.target;
    if (!node || typeof node.id !== "function") return;
    const id = node.id();
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    const layer = layers.find((l) => l.id === shape.layerId);
    const isLocked = layer && layer.locked;
    if (isLocked) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    const x = node.x();
    const y = node.y();

    switch (shape.type) {
      case "arrow":
        updateShape(id, {
          x: x,
          y: y,
          points: shape.props.points.map((point, idx) =>
            idx % 2 === 0 ? point * scaleX : point * scaleY
          ),
          rotation: rotation,
        });
        break;
      case "line":
        updateShape(id, {
          x: x,
          y: y,
          points: shape.props.points.map((point, idx) =>
            idx % 2 === 0 ? point * scaleX : point * scaleY
          ),
          rotation: rotation,
        });
        break;
      case "freeDraw":
        updateShape(id, {
          x: x,
          y: y,
          points: shape.props.points.map((point, idx) =>
            idx % 2 === 0 ? point * scaleX : point * scaleY
          ),
          rotation: rotation,
        });
        break;
      case "rect":
      case "image":
      case "marker":
        updateShape(id, {
          x: x,
          y: y,
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: rotation,
        });
        break;
      case "text":
        updateShape(id, {
          x: x,
          y: y,
          width: Math.max(50, node.width() * scaleX),
          height: Math.max(20, node.height() * scaleY),
          fontSize: Math.max(8, (shape.props.fontSize || 16) * scaleX),
          rotation: rotation,
        });
        break;
      case "circle":
        updateShape(id, {
          x: x,
          y: y,
          radius: Math.max(5, shape.props.radius * scaleX),
          rotation: rotation,
        });
        break;
      default:
        break;
    }

    node.scaleX(1);
    node.scaleY(1);
    node.rotation(0);

    saveToHistory();
  };

  const handleShapeDragEnd = (e) => {
    const node = e.target;
    const id = node.id();
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;
    const newX = node.x();
    const newY = node.y();
    updateShape(id, { x: newX, y: newY });
    saveToHistory();
  };

  const handleShapeDoubleClick = (id) => {
    const shape = shapes.find((s) => s.id === id);
    if (shape?.type === "marker") {
      setMarkerModalShapeId(id);
    } else {
      setSelectedShape(id);
    }
  };

  const handleStageDoubleClick = (e) => {
    // Solo en modo edición permitir cambio de herramienta
    if (tool === "hand") return;
    if (!isEditMode) return;

    // Solo cambiar a select si no se hizo doble clic en una figura
    const SHAPE_CLASSES = [
      "Arrow",
      "Rect",
      "Circle",
      "Line",
      "Text",
      "Image",
      "FreeDraw",
      "Marker",
      "Group",
    ];
    const clickedOnShape =
      e.target.getClassName &&
      (SHAPE_CLASSES.includes(e.target.getClassName()) ||
        e.target.getParent()?.getClassName() === "Group");

    if (!clickedOnShape) {
      const { setTool } = useCanvasStore.getState();
      setTool("select");
    }
  };

  // Acciones del menú contextual
  const bringShapeToFront = (id) =>
    useCanvasStore.getState().bringShapeToFront(id);
  const sendShapeToBack = (id) => useCanvasStore.getState().sendShapeToBack(id);
  const bringShapeForward = (id) =>
    useCanvasStore.getState().bringShapeForward(id);
  const sendShapeBackward = (id) =>
    useCanvasStore.getState().sendShapeBackward(id);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-900 overflow-hidden p-0 m-0"
    >
      {/* Input file para cargar imágenes */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none", position: "absolute", left: "-9999px" }}
        onChange={handleImageUpload}
      />

      <Stage
        ref={(ref) => {
          stageRef.current = ref;
          window.__konvaStageRef = ref;
        }}
        width={dims.width}
        height={dims.height}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable={tool === "hand"}
        onDragEnd={
          tool === "hand"
            ? (e) => setPan({ x: e.target.x(), y: e.target.y() })
            : undefined
        }
        style={{
          cursor:
            tool === "hand"
              ? "grab"
              : tool === "select"
              ? isSelecting
                ? "crosshair"
                : "default"
              : "crosshair",
        }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onDblClick={handleStageDoubleClick}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleStageMouseMove}
        onTouchEnd={handleStageMouseUp}
      >
        <Layer>
          <Group x={offset.x} y={offset.y}>
            {/* Fondo */}
            <Rect
              id="background-rect"
              x={0}
              y={0}
              fill={backgroundColor}
              width={canvasWidth}
              height={canvasHeight}
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

            {/* Grid */}
            {gridEnabled && (
              <Grid
                width={canvasWidth}
                height={canvasHeight}
                cellSize={GRID_CELL_SIZE}
              />
            )}

            {/* Capas y shapes */}
            <CanvasLayers
              layers={layers}
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              tool={tool}
              toggleSelection={toggleSelection}
              setSelectedShape={setSelectedShape}
              handleTransformEnd={handleTransformEnd}
              handleShapeDragEnd={handleShapeDragEnd}
              handleShapeDoubleClick={() =>
                tool === "select" ? handleShapeDoubleClick : undefined
              }
              setContextMenu={showContextMenu}
              autoEditTextId={autoEditTextId}
              updateShape={updateShape}
              setActiveLayer={setActiveLayer}
            />

            {/* Rectángulo de selección */}
            <SelectBox selectBox={selectBox} />
          </Group>

          {/* Transformer múltiple */}
          <MultiTransformer
            transformerRef={multiSelectRef}
            enabled={
              isEditMode && selectedShapeIds.length > 1 && tool !== "hand"
            }
          />
        </Layer>
      </Stage>

      {/* Menú contextual */}
      <ContextMenu
        contextMenu={contextMenu}
        onBringToFront={bringShapeToFront}
        onSendToBack={sendShapeToBack}
        onBringForward={bringShapeForward}
        onSendBackward={sendShapeBackward}
        onClose={hideContextMenu}
        onCopy={copyShape}
        onPaste={pasteShape}
        onDelete={removeShape}
        clipboardShape={clipboardShape}
        onReplace={replaceShape}
      />

      {/* Modal de Marker */}
      {markerModalShapeId && (
        <MarkerModal
          shapeId={markerModalShapeId}
          onClose={() => setMarkerModalShapeId(null)}
        />
      )}
    </div>
  );
}
