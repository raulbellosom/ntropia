import React, { useRef, useEffect } from "react";
import { Line, Transformer } from "react-konva";

export default function LineShape({
  id,
  points = [0, 0, 100, 100],
  x = 0,
  y = 0,
  stroke = "#000",
  fill = "#000",
  strokeWidth = 2,
  tension = 0,
  draggable = true,
  rotation = 0,
  isSelected = false,
  isInMultiSelection = false,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onDoubleClick,
  onContextMenu,
  listening = true,
  lineCap = "round",
  lineJoin = "round",
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

  // Asegurar que points es un array plano
  const flatPoints = Array.isArray(points) ? points : [0, 0, 100, 100];

  return (
    <>
      <Line
        id={id}
        ref={shapeRef}
        x={x}
        y={y}
        points={flatPoints}
        stroke={stroke}
        fill={fill}
        strokeWidth={isInMultiSelection ? strokeWidth + 1 : strokeWidth}
        lineCap={lineCap}
        lineJoin={lineJoin}
        tension={tension}
        draggable={draggable && (isSelected || isInMultiSelection)}
        rotation={rotation}
        listening={listening}
        opacity={isInMultiSelection ? 0.8 : 1}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
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
          enabledAnchors={[
            "middle-left",
            "middle-right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "top-center",
            "bottom-center",
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            // Evitar dimensiones muy pequeñas
            if (Math.abs(newBox.width) < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
