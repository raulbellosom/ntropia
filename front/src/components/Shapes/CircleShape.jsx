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
  isInMultiSelection,
  onSelect,
  onTransformEnd,
  onDragEnd,
  rotation,
  onDoubleClick,
  onContextMenu,
  listening = true,
  tool = "select",
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
