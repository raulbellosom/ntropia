// src/hooks/useShapeDrawing.js
import { useRef, useState } from "react";

/**
 * Encapsula la lógica para crear y editar figuras en el canvas.
 * Requiere que le pases props y callbacks para interactuar con tu store.
 *
 * Retorna:
 * - Handlers listos para usar: handleMouseDown, handleMouseMove, handleMouseUp
 * - Estados auxiliares: isDrawing, currentId
 */
export default function useShapeDrawing({
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
  useCanvasStoreRef, // opcional, para acceso a métodos de store fuera de React
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Función para crear figura según herramienta
  const handleMouseDown = (e) => {
    const layer = layers.find((l) => l.id === activeLayerId);
    if (layer && layer.locked) return;

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
            points: [pos.x, pos.y, pos.x, pos.y],
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
            fill: fillColor || "#eee",
            stroke: strokeColor || "#222",
          },
        };
        id = addShape(shapeData);
        setAutoEditTextId(id);
        setTimeout(() => setSelectedShape(id), 0);
        if (useCanvasStoreRef) {
          useCanvasStoreRef.getState().setTool("select");
        }
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
        // Si no es herramienta de dibujo, no hacer nada
        break;
    }
  };

  const handleMouseMove = (e, shapes) => {
    if (!isDrawing || !currentId) return;

    const pos = getCanvasPosition();
    // Si necesitas acceder a los shapes, pásalos como prop

    // Buscar el shape actual
    const shape = shapes?.find((s) => s.id === currentId);
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
          points: [points[0], points[1], pos.x, pos.y],
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
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentId(null);
      saveToHistory();
    }
  };

  return {
    isDrawing,
    currentId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
