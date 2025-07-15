import React, { useRef, useEffect } from "react";
import { Image, Rect, Transformer } from "react-konva";
import useImage from "use-image";
import { useCanvasStore } from "../../store/useCanvasStore";

function getMarkerSvg(color = "red", size = 32) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `;
}

export default function MarkerIcon({
  id,
  x,
  y,
  color = "red",
  isSelected,
  isInMultiSelection,
  onSelect,
  onTransformEnd,
  onDragEnd,
  onDoubleClick,
  onContextMenu,
}) {
  const zoom = useCanvasStore((state) => state.zoom);
  const size = 32;
  const svgString = getMarkerSvg(color, size);
  const svgBase64 = "data:image/svg+xml;base64," + btoa(svgString);
  const [image] = useImage(svgBase64);
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // --- FIXED DRAG ---
  const handleDragEnd = (e) => {
    const node = e.target;
    // Recupera la posición visual donde soltaste el marker
    const visualX = node.x();
    const visualY = node.y();
    // Regresa a coordenadas de canvas (antes de escalar)
    const newX = (visualX + size / 2) * zoom;
    const newY = (visualY + size) * zoom;
    if (onDragEnd) {
      onDragEnd({
        ...e,
        target: {
          ...e.target,
          id: () => id,
          x: () => newX,
          y: () => newY,
        },
      });
    }
  };

  return (
    <>
      {/* Rect invisible para hit test y selección múltiple */}
      <Rect
        x={x - size / 2}
        y={y - size}
        width={size}
        height={size}
        fillEnabled={false}
        strokeEnabled={false}
        listening={true}
        onClick={onSelect}
        onTap={onSelect}
        onContextMenu={onContextMenu}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
      />
      <Image
        id={id}
        ref={shapeRef}
        image={image || undefined}
        x={x - size / 2}
        y={y - size}
        width={size}
        height={size}
        scaleX={1 / zoom}
        scaleY={1 / zoom}
        draggable={isSelected || isInMultiSelection}
        opacity={isInMultiSelection ? 0.8 : 1}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onDragEnd={handleDragEnd}
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
          enabledAnchors={[]} // Sin anchors: NO resize, solo rotación
          rotateEnabled={true}
        />
      )}
    </>
  );
}
