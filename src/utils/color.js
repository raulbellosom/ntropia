// utils/color.js
export function getShapeColorForPicker(color, fallback = "#000000") {
  // Si no es HEX válido, regresa fallback
  if (!color) return fallback;
  // Si es 'transparent' o 'black', regresa fallback
  if (color === "transparent") return fallback;
  if (color === "black") return "#000000"; // SketchPicker espera HEX, no 'black'
  // Si ya es HEX, ok
  return color;
}
