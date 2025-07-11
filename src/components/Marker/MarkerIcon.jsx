import React from "react";
import { Group, Image } from "react-konva";
import { useCanvasStore } from "../../store/useCanvasStore";
import useImage from "use-image";

function getMarkerSvg(color = "red", size = 32) {
  // Puedes ajustar el width/height si quieres
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `;
}

export default function MarkerIcon({ id, x, y, color = "red", size = 32 }) {
  const updateShape = useCanvasStore((state) => state.updateShape);
  const zoom = useCanvasStore((state) => state.zoom);

  // Genera el SVG dinámicamente
  const svgString = getMarkerSvg(color, size);
  const svgBase64 = "data:image/svg+xml;base64," + btoa(svgString);
  const [image] = useImage(svgBase64);

  return (
    <Group
      id={id}
      x={x}
      y={y}
      scaleX={1 / zoom}
      scaleY={1 / zoom}
      draggable
      onClick={() => useCanvasStore.getState().setSelectedShape(id)}
      onDragEnd={(e) => {
        const { x: nx, y: ny } = e.target.position();
        updateShape(id, {
          props: {
            ...useCanvasStore.getState().shapes.find((s) => s.id === id).props,
            x: nx,
            y: ny,
          },
        });
      }}
    >
      {/* Centra la base del pin en el punto (x, y) */}
      <Image image={image} x={-size / 2} y={-size} width={size} height={size} />
    </Group>
  );
}
