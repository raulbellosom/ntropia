// src/components/Canvas/Grid.jsx
import React from "react";
import { Group, Line } from "react-konva";

export default function Grid({
  width = 1080,
  height = 720,
  cellSize = 20,
  stroke = "#ddd",
  dash = [2, 2],
  enabled = true,
}) {
  if (!enabled) return null;

  const lines = [];
  for (let x = 0; x <= width; x += cellSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={stroke}
        dash={dash}
        listening={false}
      />
    );
  }
  for (let y = 0; y <= height; y += cellSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={stroke}
        dash={dash}
        listening={false}
      />
    );
  }

  return <Group listening={false}>{lines}</Group>;
}
