import React, { useRef, useState, useEffect } from "react";
import { Text, Rect, Transformer } from "react-konva";
import { Html } from "react-konva-utils";

export default function TextShape({
  id,
  x,
  y,
  text,
  fontSize,
  fontFamily,
  fill, // <--- Este será el fondo/caja
  stroke, // <--- Este será el color de la letra
  isSelected,
  onSelect,
  onTransformEnd,
  onChangeText,
  rotation,
  autoEdit,
  onContextMenu, // <--- Agregado para el menú contextual
}) {
  const shapeRef = useRef();
  const trRef = useRef();
  const [isEditing, setIsEditing] = useState(autoEdit || false);
  const [value, setValue] = useState(text);
  const [textSize, setTextSize] = useState({ width: 100, height: 40 });

  // Actualizar el texto local
  useEffect(() => setValue(text), [text]);
  useEffect(() => {
    if (autoEdit) setIsEditing(true);
  }, [autoEdit]);

  // Medir tamaño del texto para ajustar el fondo
  useEffect(() => {
    // Usar Konva para medir el texto
    const stage = document.createElement("canvas");
    const context = stage.getContext("2d");
    context.font = `${fontSize || 16}px ${fontFamily || "Arial"}`;
    const metrics = context.measureText(value);
    const width = Math.max(metrics.width + 16, 80); // padding horizontal
    const height = Math.max((fontSize || 16) + 16, 28); // padding vertical
    setTextSize({ width, height });
  }, [value, fontSize, fontFamily]);

  useEffect(() => {
    if (isSelected && shapeRef.current && trRef.current && !isEditing) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isEditing]);

  const handleEditEnd = () => {
    setIsEditing(false);
    if (onChangeText && value !== text) onChangeText(id, value);
  };

  return (
    <>
      {!isEditing ? (
        <>
          {/* Rectángulo de fondo */}
          <Rect
            x={x}
            y={y}
            width={textSize.width}
            height={textSize.height}
            fill={fill} // color de fondo
            cornerRadius={6}
            listening={false}
          />
          {/* Texto */}
          <Text
            id={id}
            ref={shapeRef}
            x={x + 8}
            y={y + 8}
            text={value}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fill={stroke} // color de letra
            draggable={isSelected}
            rotation={rotation || 0}
            onClick={onSelect}
            onTap={onSelect}
            onDblClick={() => setIsEditing(true)}
            onDblTap={() => setIsEditing(true)}
            onDragEnd={onTransformEnd}
            onTransformEnd={onTransformEnd}
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
          {/* Transformer */}
          {isSelected && (
            <Transformer
              ref={trRef}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
              rotateEnabled={true}
              boundBoxFunc={(oldBox, newBox) => {
                if (
                  Math.abs(newBox.width) < 20 ||
                  Math.abs(newBox.height) < 20
                ) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </>
      ) : (
        <Html>
          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleEditEnd}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleEditEnd();
              if (e.key === "Escape") setIsEditing(false);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translate(${x}px, ${y}px)`,
              fontSize,
              fontFamily,
              color: stroke, // color letra
              background: fill, // color fondo
              border: "1px solid #aaa",
              padding: 4,
              borderRadius: 4,
              resize: "none",
              minWidth: 80,
              minHeight: 28,
              zIndex: 20,
              outline: "none",
              lineHeight: 1.2,
            }}
            rows={2}
            spellCheck={false}
          />
        </Html>
      )}
    </>
  );
}
