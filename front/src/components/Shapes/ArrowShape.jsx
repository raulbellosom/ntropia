import React, { useRef, useEffect } from "react";
import { Arrow, Transformer } from "react-konva";

export default function ArrowShape({
  id,
  points = [0, 0, 100, 100],
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
  isInMultiSelection = false, // <- solo declara aquí
  onSelect,
  onDragEnd,
  onTransformEnd,
  onDoubleClick,
  onContextMenu,
  listening = true,
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
      <Arrow
        id={id}
        ref={shapeRef}
        x={x}
        y={y}
        points={points}
        stroke={stroke}
        fill={fill}
        strokeWidth={isInMultiSelection ? strokeWidth + 1 : strokeWidth}
        pointerLength={pointerLength}
        pointerWidth={pointerWidth}
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
          enabledAnchors={["middle-left", "middle-right"]}
          boundBoxFunc={(oldBox, newBox) => newBox}
        />
      )}
    </>
  );
}
