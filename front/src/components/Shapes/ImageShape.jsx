import React from "react";
import { Image, Rect, Transformer } from "react-konva";
import useImage from "use-image";

export default function ImageShape({
  id,
  src,
  x,
  y,
  width,
  height,
  isSelected,
  onSelect,
  onTransformEnd,
  onDoubleClick,
  onContextMenu, // <--- Agregado para el menú contextual
}) {
  const [image] = useImage(src);
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
        draggable={isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick} // <--- Agregado
        onDblTap={onDoubleClick} // <--- Mobile
        onDragEnd={onTransformEnd}
        onContextMenu={onContextMenu}
        onTransformEnd={onTransformEnd}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = "move"; // o 'pointer'
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          stage.container().style.cursor = "default";
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
