// src/components/Canvas/CanvasStage.jsx
import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect, Group, Transformer } from "react-konva";
import { useCanvasStore } from "../../store/useCanvasStore";
import useZoomPan from "../../hooks/useZoomPan";
import Grid from "./Grid";
import FreeDrawShape from "../Shapes/FreeDrawShape";
import RectShape from "../Shapes/RectShape";
import CircleShape from "../Shapes/CircleShape";
import LineShape from "../Shapes/LineShape";
import TextShape from "../Shapes/TextShape";
import ImageShape from "../Shapes/ImageShape";
import MarkerIcon from "../Marker/MarkerIcon";
import ArrowShape from "../Shapes/ArrowShape";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_CELL_SIZE,
} from "../../utils/constants";
import MarkerModal from "../Marker/MarkerModal";

export default function CanvasStage() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const shapesLayerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [autoEditTextId, setAutoEditTextId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [markerModalShapeId, setMarkerModalShapeId] = useState(null);

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
    setSelectedShape,
    addShape,
    updateShape,
    backgroundColor,
    toggleGrid,
  } = useCanvasStore();

  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const selectedShapeIds = useCanvasStore((s) => s.selectedShapeIds);
  const addToSelection = useCanvasStore((s) => s.addToSelection);
  const removeFromSelection = useCanvasStore((s) => s.removeFromSelection);
  const toggleSelection = useCanvasStore((s) => s.toggleSelection);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const setMultipleSelection = useCanvasStore((s) => s.setMultipleSelection);
  const removeSelectedShapes = useCanvasStore((s) => s.removeSelectedShapes);
  const saveToHistory = useCanvasStore((s) => s.saveToHistory);
  const removeShape = useCanvasStore((s) => s.removeShape);
  const copyShape = useCanvasStore((s) => s.copyShape);
  const pasteShape = useCanvasStore((s) => s.pasteShape);
  const toggleLayersPanel = useCanvasStore((s) => s.toggleLayersPanel);
  const [selectBox, setSelectBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const multiSelectRef = useRef(null);
  useZoomPan(stageRef, { zoom, setZoom, pan, setPan, tool });

  const offset = {
    x: (dims.width - CANVAS_WIDTH) / 2,
    y: (dims.height - CANVAS_HEIGHT) / 2,
  };

  // Inicializa tamaño y centra
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prevent = (e) => {
      e.preventDefault();
    };

    el.addEventListener("touchmove", prevent, { passive: false });

    return () => {
      el.removeEventListener("touchmove", prevent);
    };
  }, []);

  // Zoom con wheel + pan con drag (solo si tool='hand')

  // Manejar transformer para selección múltiple
  useEffect(() => {
    if (!stageRef.current || !multiSelectRef.current) return;

    if (selectedShapeIds.length > 1) {
      // Obtener todos los nodos seleccionados
      const nodes = selectedShapeIds
        .map((id) => {
          return stageRef.current.findOne(`#${id}`);
        })
        .filter((node) => node); // Filtrar nodos null/undefined

      if (nodes.length > 1) {
        multiSelectRef.current.nodes(nodes);
        multiSelectRef.current.getLayer().batchDraw();
      }
    } else {
      multiSelectRef.current.nodes([]);
    }
  }, [selectedShapeIds]);

  // Al cambiar a tool='image', abrimos selector
  useEffect(() => {
    if (tool === "image") {
      fileInputRef.current?.click();
    }
  }, [tool]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Verificar si estamos editando texto
      if (
        e.target.tagName === "INPUT" ||
        e.target.isContentEditable ||
        autoEditTextId !== null // Agregar esta condición
      ) {
        return; // No procesar atajos de teclado si estamos editando texto
      }

      if ((e.key === "Delete" || e.key === "Backspace") && tool === "select") {
        if (selectedShapeIds.length > 0) {
          removeSelectedShapes();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeIds, removeSelectedShapes, tool, autoEditTextId]);

  useEffect(() => {
    if (
      markerModalShapeId &&
      !shapes.find((s) => s.id === markerModalShapeId)
    ) {
      setMarkerModalShapeId(null);
    }
  }, [shapes, markerModalShapeId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.isContentEditable ||
        autoEditTextId // <-- flag de edición de texto, asegúrate de que es true/false o id
      ) {
        return;
      }

      // Atajos con Ctrl/Meta (Cmd en Mac)
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "c" && selectedShapeId) {
          e.preventDefault();
          copyShape(selectedShapeId);
          return;
        }
        if (e.key.toLowerCase() === "v") {
          e.preventDefault();
          pasteShape();
          return;
        }

        return;
      }

      if (e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLayersPanel();
        useCanvasStore.getState().setTool("select");
        return;
      }

      // Atajos de cambio de herramienta (sin Ctrl)
      switch (e.key) {
        case "a": // Arrow
          useCanvasStore.getState().setTool("arrow");
          break;
        case "v": // Select
          useCanvasStore.getState().setTool("select");
          break;
        case "r": // Rect
          useCanvasStore.getState().setTool("rect");
          break;
        case "c": // Circle
          useCanvasStore.getState().setTool("circle");
          break;
        case "l": // Line
          useCanvasStore.getState().setTool("line");
          break;
        case "f": // Free draw
          useCanvasStore.getState().setTool("free");
          break;
        case "t": // Text
          useCanvasStore.getState().setTool("text");
          break;
        case "i": // Image
          useCanvasStore.getState().setTool("image");
          break;
        case "m": // Marker
          useCanvasStore.getState().setTool("marker");
          break;
        case "h": // Hand
          useCanvasStore.getState().setTool("hand");
          break;
        case "Escape": // Escape para salir de edición de texto o limpiar selección
          if (autoEditTextId) {
            setAutoEditTextId(null);
          } else if (selectedShapeIds.length > 0) {
            clearSelection();
          }
          break;
        case "g": // Toggle grid
          toggleGrid();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedShapeId,
    copyShape,
    pasteShape,
    autoEditTextId,
    selectedShapeIds,
    clearSelection,
    toggleGrid,
    toggleLayersPanel,
  ]);

  // Carga de imagen con escalado automático
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      const img = new window.Image();
      img.onload = () => {
        const maxW = CANVAS_WIDTH;
        const maxH = CANVAS_HEIGHT;
        let w = img.width;
        let h = img.height;
        let scale = 1;
        if (w > maxW || h > maxH) {
          scale = Math.min(maxW / w, maxH / h);
          w = w * scale;
          h = h * scale;
        }
        // Coloca la imagen en el centro del canvas visible
        const pos = {
          x: CANVAS_WIDTH / 2 - w / 2,
          y: CANVAS_HEIGHT / 2 - h / 2,
        };

        const id = addShape({
          layerId: activeLayerId,
          type: "image",
          props: {
            x: pos.x,
            y: pos.y,
            src,
            width: w,
            height: h,
          },
        });
        setTimeout(() => setSelectedShape(id), 0);
        useCanvasStore.getState().setTool("select");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    saveToHistory();
  };

  // Función auxiliar para obtener coordenadas del mouse en el canvas
  const getCanvasPosition = () => {
    if (!stageRef.current) return { x: 0, y: 0 };

    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();

    if (!pointerPosition) return { x: 0, y: 0 };

    // Obtener la transformación inversa del stage
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();

    // Aplicar la transformación inversa
    const pos = transform.point(pointerPosition);

    // Ajustar por el offset del group
    return {
      x: pos.x - offset.x,
      y: pos.y - offset.y,
    };
  };

  // Función para detectar shapes en un área rectangular
  const getShapesInArea = (x1, y1, x2, y2) => {
    const left = Math.min(x1, x2);
    const right = Math.max(x1, x2);
    const top = Math.min(y1, y2);
    const bottom = Math.max(y1, y2);

    return shapes.filter((shape) => {
      const props = shape.props;
      let shapeLeft, shapeRight, shapeTop, shapeBottom;

      switch (shape.type) {
        case "rect":
        case "image":
        case "text":
        case "marker":
          shapeLeft = props.x;
          shapeRight = props.x + props.width;
          shapeTop = props.y;
          shapeBottom = props.y + props.height;
          break;
        case "circle":
          shapeLeft = props.x - props.radius;
          shapeRight = props.x + props.radius;
          shapeTop = props.y - props.radius;
          shapeBottom = props.y + props.radius;
          break;
        case "line":
        case "free":
        case "arrow":
          if (props.points && props.points.length >= 2) {
            const xPoints = props.points.filter((_, i) => i % 2 === 0);
            const yPoints = props.points.filter((_, i) => i % 2 === 1);
            shapeLeft = Math.min(...xPoints);
            shapeRight = Math.max(...xPoints);
            shapeTop = Math.min(...yPoints);
            shapeBottom = Math.max(...yPoints);
          } else {
            return false;
          }
          break;
        default:
          return false;
      }

      return (
        shapeRight >= left &&
        shapeLeft <= right &&
        shapeBottom >= top &&
        shapeTop <= bottom
      );
    });
  };

  // Deseleccionar al hacer click en el fondo (stage o rect de fondo)
  const handleStageMouseDown = (e) => {
    // Ocultar menú contextual si está visible
    if (contextMenu) {
      setContextMenu(null);
    }

    // Clases de shapes "interactivos"
    const SHAPE_CLASSES = [
      "Rect",
      "Circle",
      "Line",
      "Text",
      "Image",
      "Path",
      "Star",
      "RegularPolygon",
      "Group", // Agregar Group para TextShape y MarkerIcon
    ];

    // Verificar si se hizo click en un shape
    const clickedOnShape =
      e.target.getClassName &&
      (SHAPE_CLASSES.includes(e.target.getClassName()) ||
        e.target.getParent()?.getClassName() === "Group"); // También verificar si el parent es un Group

    if (clickedOnShape) {
      return;
    }

    // Verificar si se hizo click en el fondo
    const isBackground =
      e.target === e.target.getStage() ||
      (e.target.id && e.target.id() === "background-rect");

    if (tool === "select") {
      if (isBackground) {
        // Click izquierdo en el fondo para empezar selección de área o limpiar selección
        if (!e.evt.ctrlKey && !e.evt.metaKey) {
          // Solo limpiar selección si no hay Ctrl presionado
          clearSelection();

          // Iniciar selección de área con click izquierdo + drag
          setIsSelecting(true);
          const pos = getCanvasPosition();
          setSelectBox({
            startX: pos.x,
            startY: pos.y,
            endX: pos.x,
            endY: pos.y,
          });
        }
      }
      // NO llamar handleMouseDown en select
    } else {
      handleMouseDown(e);
    }
  };

  // Crear shapes en modos de dibujo
  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const pos = getCanvasPosition();

    let shapeData = {};
    let id = null;

    switch (tool) {
      case "line":
        shapeData = {
          layerId: activeLayerId,
          type: "line",
          props: {
            points: [pos.x, pos.y, pos.x, pos.y],
            stroke: strokeColor || "black",
            strokeWidth: 2,
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;
      case "arrow":
        shapeData = {
          layerId: activeLayerId,
          type: "arrow",
          props: {
            points: [pos.x, pos.y, pos.x, pos.y], // inicia como línea
            stroke: strokeColor || "black",
            fill: strokeColor || "black",
            strokeWidth: 4,
            pointerLength: 20,
            pointerWidth: 20,
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;
      case "rect":
        shapeData = {
          layerId: activeLayerId,
          type: "rect",
          props: {
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            fill: fillColor || "transparent",
            stroke: strokeColor || "black",
            strokeWidth: 2,
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;

      case "circle":
        shapeData = {
          layerId: activeLayerId,
          type: "circle",
          props: {
            x: pos.x,
            y: pos.y,
            radius: 0,
            fill: fillColor || "transparent",
            stroke: strokeColor || "black",
            strokeWidth: 2,
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;

      case "free":
        shapeData = {
          layerId: activeLayerId,
          type: "free",
          props: {
            points: [pos.x, pos.y],
            stroke: strokeColor || "black",
            strokeWidth: 2,
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;
      case "text":
        shapeData = {
          layerId: activeLayerId,
          type: "text",
          props: {
            x: pos.x,
            y: pos.y,
            text: "Ingrese texto",
            fontSize: 16,
            fontFamily: "Arial",
            fill: fillColor || "#eee", // color fondo/caja
            stroke: strokeColor || "#222", // color de letra
          },
        };
        id = addShape(shapeData);
        setAutoEditTextId(id);
        setTimeout(() => setSelectedShape(id), 0);
        useCanvasStore.getState().setTool("select");
        break;
      case "marker":
        shapeData = {
          layerId: activeLayerId,
          type: "marker",
          props: {
            x: pos.x,
            y: pos.y,
            color: "red",
            title: "",
            description: "",
            images: [],
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;

      default:
        return;
    }
  };

  const handleMouseMove = (e) => {
    const pos = getCanvasPosition();

    // Manejo del rectángulo de selección
    if (isSelecting && selectBox) {
      setSelectBox((prev) => ({
        ...prev,
        endX: pos.x,
        endY: pos.y,
      }));
      return;
    }

    // Manejo del dibujo normal
    if (!isDrawing || !currentId) return;

    const shape = shapes.find((s) => s.id === currentId);
    if (!shape) return;
    const { x, y, points } = shape.props;

    switch (shape.type) {
      case "free":
        updateShape(currentId, { points: [...points, pos.x, pos.y] });
        break;
      case "line":
        updateShape(currentId, {
          points: [points[0], points[1], pos.x, pos.y],
        });
        break;
      case "arrow":
        updateShape(currentId, {
          points: [points[0], points[1], pos.x, pos.y], // solo mueve el final
        });
        break;
      case "rect":
        updateShape(currentId, { width: pos.x - x, height: pos.y - y });
        break;
      case "circle":
        const radius = Math.hypot(pos.x - x, pos.y - y);
        updateShape(currentId, { radius });
        break;
      default:
        break;
    }
  };

  const handleMouseUp = () => {
    // Finalizar selección por área
    if (isSelecting && selectBox) {
      // Solo seleccionar si hubo un arrastre real (más de 5 píxeles)
      const dragDistance =
        Math.abs(selectBox.endX - selectBox.startX) +
        Math.abs(selectBox.endY - selectBox.startY);

      if (dragDistance > 5) {
        const selectedShapes = getShapesInArea(
          selectBox.startX,
          selectBox.startY,
          selectBox.endX,
          selectBox.endY
        );

        if (selectedShapes.length > 0) {
          setMultipleSelection(selectedShapes.map((s) => s.id));
        }
      }
      // Si no hubo arrastre significativo, la selección ya se limpió en mouseDown

      setIsSelecting(false);
      setSelectBox(null);
      return;
    }

    // Finalizar dibujo normal
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentId(null);
      saveToHistory();
    }
  };

  const handleDragEnd = (e) => {
    setPan({ x: e.target.x(), y: e.target.y() });
  };

  // Función simplificada para manejar transformaciones
  const handleTransformEnd = (e) => {
    const node = e.target;

    if (!node || typeof node.id !== "function") {
      return;
    }

    const id = node.id();
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    const x = node.x();
    const y = node.y();

    switch (shape.type) {
      case "line":
      case "free":
        // Para líneas y free draw, transformar usando el rectángulo como guía
        const oldBounds = {
          x: shape.props.points.filter((_, i) => i % 2 === 0),
          y: shape.props.points.filter((_, i) => i % 2 === 1),
        };

        const oldMinX = Math.min(...oldBounds.x);
        const oldMaxX = Math.max(...oldBounds.x);
        const oldMinY = Math.min(...oldBounds.y);
        const oldMaxY = Math.max(...oldBounds.y);

        const oldWidth = oldMaxX - oldMinX;
        const oldHeight = oldMaxY - oldMinY;

        const newWidth = node.width() * scaleX;
        const newHeight = node.height() * scaleY;

        const newPoints = [];
        for (let i = 0; i < shape.props.points.length; i += 2) {
          const px = shape.props.points[i];
          const py = shape.props.points[i + 1];

          // Normalizar a 0-1
          const normalizedX = oldWidth > 0 ? (px - oldMinX) / oldWidth : 0;
          const normalizedY = oldHeight > 0 ? (py - oldMinY) / oldHeight : 0;

          // Escalar y posicionar
          const newX = x + normalizedX * newWidth;
          const newY = y + normalizedY * newHeight;

          newPoints.push(newX, newY);
        }

        updateShape(id, { points: newPoints });

        // Reset del rectángulo
        node.scaleX(1);
        node.scaleY(1);
        node.rotation(0);
        node.x(0);
        node.y(0);
        break;

      case "rect":
      case "image":
      case "marker":
        const newAttrs = {
          x: x,
          y: y,
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: rotation,
        };

        updateShape(id, newAttrs);
        node.scaleX(1);
        node.scaleY(1);
        node.rotation(0);
        break;

      case "text":
        const textAttrs = {
          x: x,
          y: y,
          width: Math.max(50, node.width() * scaleX),
          height: Math.max(20, node.height() * scaleY),
          fontSize: Math.max(8, (shape.props.fontSize || 16) * scaleX),
          rotation: rotation,
        };

        updateShape(id, textAttrs);
        node.scaleX(1);
        node.scaleY(1);
        node.rotation(0);
        break;

      case "circle":
        updateShape(id, {
          x: x,
          y: y,
          radius: Math.max(5, shape.props.radius * scaleX),
          rotation: rotation,
        });
        node.scaleX(1);
        node.scaleY(1);
        node.rotation(0);
        break;

      default:
        break;
    }

    saveToHistory();
  };

  const handleShapeDragEnd = (e) => {
    const node = e.target;
    const id = node.id();
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    const newX = node.x();
    const newY = node.y();

    // Actualiza solo la posición de la figura arrastrada
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

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-900 overflow-hidden p-0 m-0"
    >
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none", position: "absolute", left: "-9999px" }}
        onChange={handleImageUpload}
      />

      <Stage
        ref={stageRef}
        width={dims.width}
        height={dims.height}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable={tool === "hand"}
        onDragEnd={tool === "hand" ? handleDragEnd : undefined}
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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          <Group x={offset.x} y={offset.y}>
            {/* Fondo */}
            <Rect
              id="background-rect"
              x={0}
              y={0}
              fill={backgroundColor}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              listening={false}
            />

            {/* Grid */}
            {gridEnabled && (
              <Grid
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                cellSize={GRID_CELL_SIZE}
              />
            )}

            {/* Capas */}
            {layers.map((layer) => {
              if (!layer.visible) return null;
              const isLocked = layer.locked;
              const shapesDeCapa = shapes.filter(
                (s) => s.layerId === layer.id && s.visible !== false
              );

              if (shapesDeCapa.length === 0) return null;

              return (
                <Group
                  key={layer.id}
                  opacity={layer.opacity ?? 1}
                  listening={!isLocked}
                >
                  {shapesDeCapa.map((s) => {
                    const props = {
                      id: s.id,
                      ...s.props,
                      isSelected:
                        selectedShapeIds.includes(s.id) &&
                        selectedShapeIds.length === 1,
                      isInMultiSelection:
                        selectedShapeIds.includes(s.id) &&
                        selectedShapeIds.length > 1,
                      onSelect: (e) => {
                        if (tool === "select" && !isLocked) {
                          if (e && (e.evt.ctrlKey || e.evt.metaKey)) {
                            toggleSelection(s.id);
                          } else {
                            setSelectedShape(s.id);
                          }
                        }
                      },
                      onTransformEnd: handleTransformEnd,
                      onDragEnd: handleShapeDragEnd,
                      onDoubleClick: () => handleShapeDoubleClick(s.id),
                      draggable: !isLocked && selectedShapeIds.includes(s.id),
                      listening: !isLocked,
                      isLocked,
                      onContextMenu: (e) => {
                        e.evt.preventDefault();
                        setContextMenu({
                          x: e.evt.clientX,
                          y: e.evt.clientY,
                          shapeId: s.id,
                        });
                      },
                    };

                    switch (s.type) {
                      case "free":
                        return (
                          <FreeDrawShape
                            key={s.id}
                            onUpdate={({ id, props }) => updateShape(id, props)}
                            {...props}
                          />
                        );
                      case "line":
                        return (
                          <LineShape
                            key={s.id}
                            onUpdate={({ id, props }) => updateShape(id, props)}
                            {...props}
                          />
                        );
                      case "arrow":
                        return <ArrowShape key={s.id} {...props} />;
                      case "rect":
                        return <RectShape key={s.id} {...props} />;
                      case "circle":
                        return <CircleShape key={s.id} {...props} />;
                      case "text":
                        return (
                          <TextShape
                            key={s.id}
                            {...props}
                            autoEdit={s.id === autoEditTextId}
                            onChangeText={(id, newText) => {
                              updateShape(id, { text: newText });
                              if (autoEditTextId === id)
                                setAutoEditTextId(null);
                            }}
                          />
                        );
                      case "image":
                        return <ImageShape key={s.id} {...props} />;
                      case "marker":
                        return <MarkerIcon key={s.id} {...props} />;
                      default:
                        return null;
                    }
                  })}
                </Group>
              );
            })}

            {/* Rectángulo de selección */}
            {selectBox && (
              <Rect
                x={Math.min(selectBox.startX, selectBox.endX)}
                y={Math.min(selectBox.startY, selectBox.endY)}
                width={Math.abs(selectBox.endX - selectBox.startX)}
                height={Math.abs(selectBox.endY - selectBox.startY)}
                fill="rgba(173, 216, 230, 0.2)"
                stroke="rgba(70, 130, 180, 0.8)"
                strokeWidth={1}
                dash={[2, 2]}
                listening={false}
              />
            )}
          </Group>

          {/* Transformer para selección múltiple */}
          {selectedShapeIds.length > 1 && (
            <Transformer
              ref={multiSelectRef}
              rotateEnabled={false} // Deshabilitar rotación para selección múltiple
              enabledAnchors={[
                "top-left",
                "top-center",
                "top-right",
                "middle-right",
                "bottom-right",
                "bottom-center",
                "bottom-left",
                "middle-left",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (
                  Math.abs(newBox.width) < 10 ||
                  Math.abs(newBox.height) < 10
                ) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded shadow border"
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 140 }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="w-full text-left p-2 hover:bg-slate-100"
            onClick={() => {
              useCanvasStore.getState().bringShapeToFront(contextMenu.shapeId);
              setContextMenu(null);
            }}
          >
            Traer al frente
          </button>
          <button
            className="w-full text-left p-2 hover:bg-slate-100"
            onClick={() => {
              useCanvasStore.getState().sendShapeToBack(contextMenu.shapeId);
              setContextMenu(null);
            }}
          >
            Enviar al fondo
          </button>
          <button
            className="w-full text-left p-2 hover:bg-slate-100"
            onClick={() => {
              useCanvasStore.getState().bringShapeForward(contextMenu.shapeId);
              setContextMenu(null);
            }}
          >
            Subir
          </button>
          <button
            className="w-full text-left p-2 hover:bg-slate-100"
            onClick={() => {
              useCanvasStore.getState().sendShapeBackward(contextMenu.shapeId);
              setContextMenu(null);
            }}
          >
            Bajar
          </button>
        </div>
      )}
      {markerModalShapeId && (
        <MarkerModal
          shapeId={markerModalShapeId}
          onClose={() => setMarkerModalShapeId(null)}
        />
      )}
    </div>
  );
}
