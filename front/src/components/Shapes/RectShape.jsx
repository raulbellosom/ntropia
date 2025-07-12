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
        draggable={isSelected || isInMultiSelection}
        rotation={rotation || 0}
        opacity={isInMultiSelection ? 0.8 : 1}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onDragEnd={onDragEnd || onTransformEnd}
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
