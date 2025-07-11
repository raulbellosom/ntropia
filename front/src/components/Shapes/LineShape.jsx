// src/components/Shapes/LineShape.jsx
import React, { useRef, useEffect } from "react";
import { Line, Transformer } from "react-konva";

export default function LineShape({
  id,
  points,
  stroke = "#000",
  strokeWidth = 2,
  tension = 0,
  lineCap = "round",
  lineJoin = "round",
  isSelected,
  onSelect,
  onTransformEnd,
  onDoubleClick, // <--- Agregado
  onContextMenu, // <--- Agregado
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
      <Line
        id={id}
        ref={shapeRef}
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        tension={tension}
        lineCap={lineCap}
        lineJoin={lineJoin}
        draggable={isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick} // <--- Agregado
        onDblTap={onDoubleClick} // <--- Mobile
        onDragEnd={onTransformEnd}
        onContextMenu={onContextMenu}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const newPoints = node.points();
          onTransformEnd &&
            onTransformEnd({
              target: {
                id,
                points: () => newPoints,
              },
            });
          node.scaleX(1);
          node.scaleY(1);
        }}
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
          enabledAnchors={["middle-left", "middle-right"]}
          rotateEnabled={false}
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
