import React, { useRef, useEffect, useState } from "react";
import { Image, Rect, Transformer, Label, Tag, Text } from "react-konva";
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
  const shapes = useCanvasStore((state) => state.shapes); // Para leer props.title
  const marker = shapes.find((s) => s.id === id && s.type === "marker");
  const title = marker?.props?.title || "";

  const size = 32;
  const svgString = getMarkerSvg(color, size);
  const svgBase64 = "data:image/svg+xml;base64," + btoa(svgString);
  const [image] = useImage(svgBase64);
  const shapeRef = useRef();
  const trRef = useRef();
  const [showTooltip, setShowTooltip] = useState(false);

  // Transform sync
  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e) => {
    const node = e.target;
    const visualX = node.x();
    const visualY = node.y();
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
          setShowTooltip(true);
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = "default";
          setShowTooltip(false);
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} enabledAnchors={[]} rotateEnabled={true} />
      )}

      {/* Tooltip */}
      {showTooltip && title && (
        <Label
          x={x}
          y={y - size - 10}
          opacity={0.9}
          listening={false}
          scaleX={1 / zoom}
          scaleY={1 / zoom}
        >
          <Tag
            fill="black"
            pointerDirection="down"
            pointerWidth={10}
            pointerHeight={10}
            lineJoin="round"
            cornerRadius={4}
          />
          <Text
            text={title}
            fontFamily="Arial"
            fontSize={14}
            padding={6}
            fill="white"
          />
        </Label>
      )}
    </>
  );
}
