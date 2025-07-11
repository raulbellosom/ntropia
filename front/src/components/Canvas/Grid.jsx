// src/components/Canvas/Grid.jsx
import React from "react";
import { Group, Line } from "react-konva";

/**
 * Grid de líneas para guiar en el canvas.
 * @param {number} width     Ancho total del canvas (px)
 * @param {number} height    Alto total del canvas (px)
 * @param {number} cellSize  Tamaño de cada celda (px)
 * @param {string} stroke    Color de línea
 * @param {number[]} dash    Patrón de guión para las líneas (dash)
 * @param {boolean} enabled  Mostrar u ocultar grid
 */
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
  // Líneas verticales
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
  // Líneas horizontales
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

  return <Group>{lines}</Group>;
}
