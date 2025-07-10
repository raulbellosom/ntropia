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
  onSelect,
  onTransformEnd,
  rotation,
  onDoubleClick,
  onContextMenu,
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
        strokeWidth={strokeWidth}
        draggable={isSelected}
        rotation={rotation || 0}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick} // <--- Agregado
        onDblTap={onDoubleClick} // <--- Mobile
        onDragEnd={onTransformEnd}
        onTransformEnd={onTransformEnd}
        onContextMenu={onContextMenu}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = "move";
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = "default";
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
