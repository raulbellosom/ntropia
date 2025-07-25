import React from "react";
import { Image, Rect, Transformer } from "react-konva";
import useImage from "use-image";
import { useDirectusImage } from "../../hooks/useDirectusImage";

export default function ImageShape({
  id,
  src,
  x,
  y,
  width,
  height,
  isSelected,
  isInMultiSelection,
  onSelect,
  onTransformEnd,
  onDragEnd,
  onDoubleClick,
  onContextMenu,
  listening = true,
  tool = "select",
}) {
  // Si src es id de Directus, genera la url:
  const imageUrl = useDirectusImage(src);
  const [image] = useImage(imageUrl);
  const shapeRef = React.useRef();
  const trRef = React.useRef();

  React.useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fillEnabled={false}
        strokeEnabled={false}
        listening={true}
        onClick={onSelect}
        onTap={onSelect}
      />
      <Image
        id={id}
        ref={shapeRef}
        image={image || undefined}
        x={x}
        y={y}
        width={width}
        height={height}
        draggable={isSelected || isInMultiSelection}
        opacity={isInMultiSelection ? 0.8 : 1}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick} // <--- Agregado
        onDblTap={onDoubleClick} // <--- Mobile
        onDragEnd={onDragEnd || onTransformEnd}
        onContextMenu={onContextMenu}
        onTransformEnd={onTransformEnd}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (listening) {
            stage.container().style.cursor = "move";
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          const currentTool = tool || "select"; // Obtener tool del contexto
          stage.container().style.cursor =
            currentTool === "hand"
              ? "grab"
              : currentTool === "select"
              ? "default"
              : "crosshair";
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
