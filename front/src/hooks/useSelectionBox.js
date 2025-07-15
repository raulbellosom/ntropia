// src/hooks/useSelectionBox.js

import { useState } from "react";

/**
 * Hook para manejar el rectángulo de selección múltiple en el canvas.
 *
 * Retorna:
 * - selectBox: objeto {startX, startY, endX, endY} o null
 * - isSelecting: boolean
 * - handlers: handleStart, handleMove, handleEnd
 */
export default function useSelectionBox({
  getCanvasPosition, // función para obtener coordenadas reales en el canvas
  shapes, // array de shapes
  layers, // array de capas (para filtrar locked)
  setMultipleSelection, // callback para setear selección múltiple (ids)
}) {
  const [selectBox, setSelectBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Comienza selección de área
  const handleStart = () => {
    const pos = getCanvasPosition();
    setIsSelecting(true);
    setSelectBox({
      startX: pos.x,
      startY: pos.y,
      endX: pos.x,
      endY: pos.y,
    });
  };

  // Actualiza área de selección mientras arrastras
  const handleMove = () => {
    if (!isSelecting || !selectBox) return;
    const pos = getCanvasPosition();
    setSelectBox((prev) => ({
      ...prev,
      endX: pos.x,
      endY: pos.y,
    }));
  };

  // Termina selección y selecciona shapes dentro del área
  const handleEnd = () => {
    if (!isSelecting || !selectBox) return;

    const dragDistance =
      Math.abs(selectBox.endX - selectBox.startX) +
      Math.abs(selectBox.endY - selectBox.startY);

    if (dragDistance > 5) {
      const left = Math.min(selectBox.startX, selectBox.endX);
      const right = Math.max(selectBox.startX, selectBox.endX);
      const top = Math.min(selectBox.startY, selectBox.endY);
      const bottom = Math.max(selectBox.startY, selectBox.endY);

      // Filtra shapes dentro del área y en capas desbloqueadas
      const selectedShapes = shapes.filter((shape) => {
        const props = shape.props;
        let shapeLeft, shapeRight, shapeTop, shapeBottom;

        const layer = layers.find((l) => l.id === shape.layerId);
        if (layer && layer.locked) return false;

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

      if (selectedShapes.length > 0) {
        setMultipleSelection(selectedShapes.map((s) => s.id));
      }
    }
    setIsSelecting(false);
    setSelectBox(null);
  };

  return {
    selectBox,
    isSelecting,
    handleStart,
    handleMove,
    handleEnd,
  };
}
