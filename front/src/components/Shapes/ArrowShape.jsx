// src/components/Shapes/ArrowShape.jsx
import React, { useRef, useEffect } from "react";
import { Arrow, Transformer } from "react-konva";

export default function ArrowShape({
  id,
  points = [0, 0, 100, 100], // [x1, y1, x2, y2]
  x = 0,
  y = 0,
  stroke = "#222",
  fill = "#222",
  strokeWidth = 4,
  pointerLength = 20,
  pointerWidth = 20,
  tension = 0,
  draggable = true,
  rotation = 0,
  isSelected = false,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onDoubleClick,
  onContextMenu,
}) {
  const shapeRef = useRef();
  const trRef = useRef();

  // Mostrar transformer si está seleccionado
  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Arrow
        id={id}
        ref={shapeRef}
        x={x}
        y={y}
        points={points}
        stroke={stroke}
        fill={fill}
        strokeWidth={strokeWidth}
        pointerLength={pointerLength}
        pointerWidth={pointerWidth}
        tension={tension}
        draggable={draggable}
        rotation={rotation}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        onDblClick={onDoubleClick}
        onContextMenu={onContextMenu}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={["middle-left", "middle-right"]}
          boundBoxFunc={(oldBox, newBox) => newBox} // opcional, puedes limitar el resize aquí
        />
      )}
    </>
  );
}
