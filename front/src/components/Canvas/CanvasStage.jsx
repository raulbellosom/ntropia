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

export default function CanvasStage() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);
  const multiSelectRef = useRef(null);

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

  // Context menu hook
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Offset para centrar canvas
  const offset = {
    x: (dims.width - canvasWidth) / 2,
    y: (dims.height - canvasHeight) / 2,
  };
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
    currentId,
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

    const SHAPE_CLASSES = [
      "Rect",
      "Circle",
      "Line",
      "Text",
      "Image",
      "Path",
      "Star",
      "RegularPolygon",
      "Group",
    ];
    const clickedOnShape =
      e.target.getClassName &&
      (SHAPE_CLASSES.includes(e.target.getClassName()) ||
        e.target.getParent()?.getClassName() === "Group");

    if (clickedOnShape) return;

    // Click en fondo
    const isBackground =
      e.target === e.target.getStage() ||
      (e.target.id && e.target.id() === "background-rect");

    if (tool === "select" && isBackground) {
      if (!e.evt.ctrlKey && !e.evt.metaKey) {
        clearSelection();
        selectStart();
      }
    } else if (tool !== "select") {
      drawMouseDown(e);
    }
  };

  const handleStageMouseMove = (e) => {
    if (tool === "select") {
      selectMove();
    } else if (isDrawing) {
      drawMouseMove(e, shapes);
    }
  };

  const handleStageMouseUp = () => {
    if (tool === "select") {
      selectEnd();
    }
    if (isDrawing) {
      drawMouseUp();
    }
  };

  // Transform/drag/doubleclick delegados
  const handleTransformEnd = (e) => {
    // Copia tu lógica actual aquí (puedes seguir usando tu handler viejo si lo necesitas).
    // ...
    // (Puedes modularizarlo también luego en un hook si quieres)
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
              handleShapeDoubleClick={handleShapeDoubleClick}
              setContextMenu={showContextMenu}
              autoEditTextId={autoEditTextId}
              updateShape={updateShape}
            />

            {/* Rectángulo de selección */}
            <SelectBox selectBox={selectBox} />
          </Group>

          {/* Transformer múltiple */}
          <MultiTransformer
            transformerRef={multiSelectRef}
            enabled={selectedShapeIds.length > 1}
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
