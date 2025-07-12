import React, { useRef, useState, useEffect } from "react";
import { Text, Rect, Transformer, Group } from "react-konva";
import { Html } from "react-konva-utils";

export default function TextShape({
  id,
  x,
  y,
  text,
  fontSize,
  fontFamily,
  fill, // fondo
  stroke, // color de letra
  isSelected,
  onSelect,
  onTransformEnd,
  onChangeText,
  rotation,
  autoEdit,
  onContextMenu,
}) {
  const groupRef = useRef();
  const textRef = useRef();
  const trRef = useRef();
  const [isEditing, setIsEditing] = useState(autoEdit || false);
  const [value, setValue] = useState(text);

  // Actualizar texto local cuando cambie la prop
  useEffect(() => setValue(text), [text]);
  useEffect(() => {
    if (autoEdit) setIsEditing(true);
  }, [autoEdit]);

  // Usar Transformer sobre el Group, no sobre el <Text> individual
  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current && !isEditing) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isEditing]);

  // Medir tamaño del texto para el rectángulo de fondo
  const [textSize, setTextSize] = useState({ width: 100, height: 40 });

  useEffect(() => {
    const stage = document.createElement("canvas");
    const context = stage.getContext("2d");
    context.font = `${fontSize || 16}px ${fontFamily || "Arial"}`;
    const lines = value.split("\n");
    const maxLineWidth = Math.max(
      ...lines.map((line) => context.measureText(line).width)
    );
    const width = Math.max(maxLineWidth + 16, 80);
    const height = Math.max(lines.length * (fontSize || 16) * 1.2 + 16, 28);
    setTextSize({ width, height });
  }, [value, fontSize, fontFamily]);

  // Cuando termina resize/rotate
  const handleTransformEnd = (e) => {
    const node = groupRef.current;
    const textNode = textRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newFontSize = Math.max(8, (fontSize || 16) * scaleY); // Escalado vertical para fontSize
    const newWidth = Math.max(50, textSize.width * scaleX);
    const newHeight = Math.max(20, textSize.height * scaleY);

    onTransformEnd &&
      onTransformEnd({
        target: {
          id: () => id,
          x: () => node.x(),
          y: () => node.y(),
          width: () => newWidth,
          height: () => newHeight,
          rotation: () => node.rotation(),
          scaleX: () => 1,
          scaleY: () => 1,
          fontSize: () => newFontSize,
        },
      });

    // Resetear transformaciones visuales para que la actualización sea visualmente correcta
    node.scaleX(1);
    node.scaleY(1);
    node.rotation(0);
  };

  const handleEditEnd = () => {
    setIsEditing(false);
    if (onChangeText && value !== text) onChangeText(id, value);
  };

  return (
    <>
      {!isEditing ? (
        <>
          <Group
            ref={groupRef}
            x={x}
            y={y}
            rotation={rotation || 0}
            draggable={isSelected}
            onClick={onSelect}
            onTap={onSelect}
            onDblClick={() => setIsEditing(true)}
            onDblTap={() => setIsEditing(true)}
            onDragEnd={(e) => {
              const node = e.target;
              onTransformEnd &&
                onTransformEnd({
                  target: {
                    id: () => id,
                    x: () => node.x(),
                    y: () => node.y(),
                    width: () => textSize.width,
                    height: () => textSize.height,
                    rotation: () => node.rotation(),
                    scaleX: () => 1,
                    scaleY: () => 1,
                    fontSize: () => fontSize,
                  },
                });
            }}
            onContextMenu={onContextMenu}
          >
            {/* Rectángulo invisible para que Transformer pueda hacer resize */}
            <Rect
              width={textSize.width}
              height={textSize.height}
              fillEnabled={false}
              strokeEnabled={false}
              listening={true}
              name="resize-box"
            />
            {/* Fondo visual */}
            <Rect
              width={textSize.width}
              height={textSize.height}
              fill={fill}
              cornerRadius={6}
              listening={false}
            />
            <Text
              name="INPUT"
              ref={textRef}
              text={value}
              fontSize={fontSize}
              fontFamily={fontFamily}
              fill={stroke}
              width={textSize.width}
              height={textSize.height}
              align="left"
              verticalAlign="middle"
              onTransformEnd={handleTransformEnd}
            />
          </Group>

          {/* Transformer */}
          {isSelected && !isEditing && (
            <Transformer
              ref={trRef}
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
            name="INPUT"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              // Autoresize
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
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
              color: stroke,
              background: fill,
              border: "1px solid #aaa",
              padding: 4,
              borderRadius: 4,
              resize: "none",
              minWidth: 80,
              minHeight: 28,
              maxHeight: 300,
              overflow: "auto",
              zIndex: 20,
              outline: "none",
              lineHeight: 1.2,
            }}
            rows={3}
            spellCheck={false}
          />
        </Html>
      )}
    </>
  );
}
