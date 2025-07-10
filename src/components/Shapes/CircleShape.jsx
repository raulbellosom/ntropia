import React, { useRef, useEffect } from "react";
import { Circle, Transformer } from "react-konva";

export default function CircleShape({
  id,
  x,
  y,
  radius,
  stroke = "#000",
  fill = "transparent",
  strokeWidth = 2,
  isSelected,
  onSelect,
  onTransformEnd,
  rotation,
  onDoubleClick, // <--- Agregado
  onContextMenu, // <--- Agregado para el menú contextual
}) {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Circle
        id={id}
        ref={shapeRef}
        x={x}
        y={y}
        radius={radius}
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
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          rotateEnabled={true}
          boundBoxFunc={(oldBox, newBox) => {
            // Evita círculos demasiado pequeños
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
