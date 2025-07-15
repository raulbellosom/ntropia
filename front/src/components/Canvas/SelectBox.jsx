// src/components/Canvas/SelectBox.jsx

import React from "react";
import { Rect } from "react-konva";

/**
 * Componente visual para el rectángulo de selección múltiple.
 * Recibe por props el objeto selectBox: { startX, startY, endX, endY }
 */
export default function SelectBox({ selectBox }) {
  if (!selectBox) return null;

  const x = Math.min(selectBox.startX, selectBox.endX);
  const y = Math.min(selectBox.startY, selectBox.endY);
  const width = Math.abs(selectBox.endX - selectBox.startX);
  const height = Math.abs(selectBox.endY - selectBox.startY);

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(173, 216, 230, 0.2)"
      stroke="rgba(70, 130, 180, 0.8)"
      strokeWidth={1}
      dash={[2, 2]}
      listening={false}
    />
  );
}
