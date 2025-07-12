import React, { useRef, useEffect } from "react";
import { Line, Transformer } from "react-konva";

export default function LineShape({
  id,
  points,
  stroke = "#000",
  strokeWidth = 2,
  tension = 0,
  lineCap = "round",
  lineJoin = "round",
  isSelected,
  isInMultiSelection,
  onSelect,
  onUpdate, // A new prop to update the shape in the store
  onDragEnd,
  onDoubleClick,
  onContextMenu,
  draggable = true,
  listening = true,
}) {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = (e) => {
    const node = shapeRef.current;
    if (!node) return;

    // Obtenemos la matriz de transformación completa del nodo
    const transform = node.getTransform();

    const newPoints = [];
    const originalPoints = node.points(); // Usamos los puntos del nodo de Konva

    // Iteramos sobre los puntos originales en pares (x, y)
    for (let i = 0; i < originalPoints.length; i += 2) {
      const point = {
        x: originalPoints[i],
        y: originalPoints[i + 1],
      };
      // Aplicamos la transformación para obtener la nueva posición absoluta
      const { x, y } = transform.point(point);
      newPoints.push(x, y);
    }

    // Reseteamos todas las transformaciones del nodo, ya que ahora están "cocinadas" en los puntos.
    node.position({ x: 0, y: 0 });
    node.rotation(0);
    node.scaleX(1);
    node.scaleY(1);

    // Actualizamos el estado global con los puntos en su posición y forma final.
    // El 'x' y 'y' del shape ahora serán 0, porque la posición ya está en los puntos.
    onUpdate({
      id,
      props: {
        points: newPoints,
        x: 0,
        y: 0,
        rotation: 0,
      },
    });
  };

  return (
    <>
      <Line
        id={id}
        ref={shapeRef}
        points={points}
        stroke={stroke}
        strokeWidth={isInMultiSelection ? strokeWidth + 1 : strokeWidth}
        tension={tension}
        lineCap={lineCap}
        lineJoin={lineJoin}
        draggable={draggable && (isSelected || isInMultiSelection)}
        listening={listening}
        opacity={isInMultiSelection ? 0.8 : 1}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onContextMenu={onContextMenu}
        onDragEnd={onDragEnd}
        onTransformEnd={handleTransformEnd}
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
          rotateEnabled={true}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
