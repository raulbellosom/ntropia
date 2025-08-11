// src/components/Canvas/SelectBox.jsx
import React from "react";
import { Rect } from "react-konva";

export default function SelectBox({ selectBox }) {
  if (!selectBox) return null;

  let x, y, width, height;

  // Manejo de ambos formatos: {x,y,width,height} y {startX,startY,endX,endY}
  if ("width" in selectBox && "height" in selectBox) {
    x = Number.isFinite(selectBox.x) ? selectBox.x : 0;
    y = Number.isFinite(selectBox.y) ? selectBox.y : 0;
    width = Number.isFinite(selectBox.width) ? selectBox.width : 0;
    height = Number.isFinite(selectBox.height) ? selectBox.height : 0;
  } else {
    x = Math.min(selectBox.startX, selectBox.endX);
    y = Math.min(selectBox.startY, selectBox.endY);
    width = Math.abs(selectBox.endX - selectBox.startX);
    height = Math.abs(selectBox.endY - selectBox.startY);
  }

  if (width === 0 && height === 0) return null;

  return (
    <Rect
      listening={false}
      x={x}
      y={y}
      width={width}
      height={height}
      stroke="#3B82F6"
      dash={[4, 4]}
      strokeWidth={1}
      fill="rgba(59, 130, 246, 0.3)"
      opacity={0.9}
    />
  );
}
