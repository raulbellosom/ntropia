// src/components/Shapes/RectShape.jsx
import React, { useRef, useEffect } from "react";
import { Rect, Transformer } from "react-konva";

export default function RectShape({
  id,
  x,
  y,
  width,
  height,
  stroke = "#000",
  fill = "transparent",
  strokeWidth = 2,
  isSelected,
  isInMultiSelection,
  onSelect,
  onTransformEnd,
  onDragEnd,
  rotation,
  onDoubleClick,
  onContextMenu,
  listening = true,
  tool = "select",
  locked = false,
}) {
  const shapeRef = useRef();
  const trRef = useRef();

  // Mostrar Transformer sólo si está seleccionado
  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
        id={id}
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={stroke}
        fill={fill}
        strokeWidth={isInMultiSelection ? strokeWidth + 1 : strokeWidth}
        draggable={(isSelected || isInMultiSelection) && !locked}
        rotation={rotation || 0}
        opacity={locked ? 0.5 : isInMultiSelection ? 0.8 : 1}
        onClick={locked ? undefined : onSelect}
        onTap={locked ? undefined : onSelect}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onDragEnd={onDragEnd || onTransformEnd}
        onTransformEnd={onTransformEnd}
        onContextMenu={onContextMenu}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (listening) {
            stage.container().style.cursor = "move";
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          const currentTool = tool || "select"; // Obtener tool del contexto
          stage.container().style.cursor =
            currentTool === "hand"
              ? "grab"
              : currentTool === "select"
              ? "default"
              : "crosshair";
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
