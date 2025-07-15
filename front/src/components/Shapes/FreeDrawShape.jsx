import React, { useRef, useEffect } from "react";
import { Line, Transformer } from "react-konva";

export default function FreeDrawShape({
  id,
  points,
  stroke,
  strokeWidth,
  tension = 0.5,
  lineCap = "round",
  lineJoin = "round",
  isSelected,
  isInMultiSelection,
  onSelect,
  onUpdate, // A new prop to update the shape in the store
  onDragEnd,
  onContextMenu,
  draggable = true,
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

  const handleTransformEnd = (e) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    if (scaleX === 0 || scaleY === 0) return;

    const newPoints = node.points().map((point, i) => {
      return i % 2 === 0 ? point * scaleX : point * scaleY;
    });

    node.scaleX(1);
    node.scaleY(1);

    onUpdate({
      id,
      props: {
        points: newPoints,
        x: node.x(),
        y: node.y(),
        rotation,
      },
    });
  };

  return (
    <>
      <Line
        id={id}
        ref={shapeRef}
        points={points}
        stroke={stroke}
        strokeWidth={isInMultiSelection ? strokeWidth + 1 : strokeWidth}
        tension={tension}
        lineCap={lineCap}
        lineJoin={lineJoin}
        draggable={draggable && (isSelected || isInMultiSelection)}
        listening={listening}
        opacity={isInMultiSelection ? 0.8 : 1}
        onClick={onSelect}
        onTap={onSelect}
        onContextMenu={onContextMenu}
        onDragEnd={onDragEnd}
        onTransformEnd={handleTransformEnd}
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
