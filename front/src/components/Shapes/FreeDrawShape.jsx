// src/components/Shapes/FreeDrawShape.jsx
import React, { useRef } from "react";
import { Line } from "react-konva";
import { useCanvasStore } from "../../store/useCanvasStore";

export default function FreeDrawShape({
  id,
  points,
  stroke,
  strokeWidth,
  tension,
  lineCap,
  lineJoin,
  onContextMenu, // <--- Agregado para el menú contextual
}) {
  const shapeRef = useRef();
  const tool = useCanvasStore((s) => s.tool);
  const setSelected = useCanvasStore((s) => s.setSelectedShape);
  const updateShape = useCanvasStore((s) => s.updateShape);

  const isSelectMode = tool === "select";

  return (
    <Line
      id={id}
      ref={shapeRef}
      points={points}
      stroke={stroke}
      strokeWidth={strokeWidth}
      tension={tension}
      lineCap={lineCap}
      lineJoin={lineJoin}
      draggable={isSelectMode}
      onContextMenu={onContextMenu}
      onClick={isSelectMode ? () => setSelected(id) : undefined}
      onDragEnd={
        isSelectMode
          ? (e) => updateShape(id, { x: e.target.x(), y: e.target.y() })
          : undefined
      }
      onTransformEnd={
        isSelectMode
          ? (e) => {
              const node = shapeRef.current;
              const newPoints = node.points();
              updateShape(id, { points: newPoints });
              node.scaleX(1);
              node.scaleY(1);
            }
          : undefined
      }
    />
  );
}
