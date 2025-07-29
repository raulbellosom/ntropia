import React, { useRef, useState, useEffect } from "react";
import { Text, Rect, Transformer, Group } from "react-konva";
import { Html } from "react-konva-utils";
import { useEditMode } from "../../hooks/useEditMode";
import { useCanvasStore } from "../../store/useCanvasStore";

export default function TextShape({
  id,
  x,
  y,
  width,
  height,
  text,
  fontSize,
  fontFamily,
  fill, // fondo
  stroke, // color de letra
  fontStyle, // bold, italic, normal
  align, // left, center, right
  isSelected,
  onSelect,
  onTransformEnd,
  onChangeText,
  rotation,
  autoEdit,
  onContextMenu,
  // Props estándar que vienen de CanvasLayers
  draggable,
  listening,
  onDragEnd,
  onDoubleClick,
  onTap,
  isInMultiSelection,
}) {
  const groupRef = useRef(); // Mantenemos por si lo necesitamos después
  const textRef = useRef();
  const trRef = useRef();
  const [isEditing, setIsEditing] = useState(autoEdit || false);
  const [value, setValue] = useState(text);
  const { isEditMode } = useEditMode();
  const { tool } = useCanvasStore();
  // Actualizar texto local cuando cambie la prop
  useEffect(() => setValue(text), [text]);
  useEffect(() => {
    if (autoEdit) setIsEditing(true);
  }, [autoEdit]);

  // Usar Transformer sobre el Text directamente
  useEffect(() => {
    if (isSelected && trRef.current && textRef.current && !isEditing) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isEditing]);

  // Medir tamaño del texto para el rectángulo de fondo
  const textAreaWidth = width || 200;
  const textAreaHeight = height || 100;

  // Calcular propiedades del texto basadas en fontStyle
  const getKonvaFontStyle = () => {
    // En Konva, fontStyle combina peso y estilo
    const weight =
      fontStyle === "bold" || fontStyle?.includes("bold") ? "bold" : "normal";
    const style =
      fontStyle === "italic" || fontStyle?.includes("italic")
        ? "italic"
        : "normal";

    if (weight === "bold" && style === "italic") return "bold italic";
    if (weight === "bold") return "bold";
    if (style === "italic") return "italic";
    return "normal";
  };

  const getFontWeight = () => {
    if (fontStyle === "bold" || fontStyle?.includes("bold")) return "bold";
    return "normal";
  };

  const getFontStyleCSS = () => {
    if (fontStyle === "italic" || fontStyle?.includes("italic"))
      return "italic";
    return "normal";
  };

  const getTextAlign = () => {
    return align || "left";
  };

  // Cuando termina resize/rotate
  const handleTransformEnd = (e) => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Para texto, solo cambiamos el área, NO el fontSize
    const newWidth = Math.max(50, textAreaWidth * scaleX);
    const newHeight = Math.max(20, textAreaHeight * scaleY);

    // Resetear transformaciones ANTES de notificar cambios
    node.scaleX(1);
    node.scaleY(1);

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
          fontSize: () => fontSize || 16, // SIEMPRE mantener fontSize original
        },
      });
  };

  const handleEditEnd = () => {
    setIsEditing(false);
    if (onChangeText && value !== text) onChangeText(id, value);
  };

  return (
    <>
      {!isEditing ? (
        <>
          {/* Fondo del texto - separado y detrás */}
          <Rect
            x={x}
            y={y}
            width={textAreaWidth}
            height={textAreaHeight}
            fill={fill}
            cornerRadius={6}
            rotation={rotation || 0}
            listening={false}
          />

          {/* Texto principal - maneja todos los eventos */}
          <Text
            id={id}
            ref={textRef}
            x={x}
            y={y}
            width={textAreaWidth}
            height={textAreaHeight}
            text={value}
            fontSize={fontSize || 16}
            fontFamily={fontFamily || "Arial"}
            fontStyle={getKonvaFontStyle()}
            fill={stroke || "#000"}
            align={getTextAlign()}
            verticalAlign="top"
            padding={8}
            rotation={rotation || 0}
            draggable={draggable} // Usar prop de CanvasLayers
            listening={listening} // Usar prop de CanvasLayers
            onClick={onSelect} // Usar prop de CanvasLayers
            onTap={onTap || onSelect} // Usar prop de CanvasLayers
            onDblClick={(e) => {
              // Primero ejecutar el handler de CanvasLayers si existe
              if (onDoubleClick) {
                onDoubleClick(e);
              }
              // Luego activar modo edición para TextShape
              if (isEditMode && tool === "select") {
                setIsEditing(true);
              }
            }}
            onDblTap={(e) => {
              // Primero ejecutar el handler de CanvasLayers si existe
              if (onDoubleClick) {
                onDoubleClick(e);
              }
              // Luego activar modo edición para TextShape
              if (isEditMode && tool === "select") {
                setIsEditing(true);
              }
            }}
            onDragEnd={onDragEnd} // Usar prop de CanvasLayers
            onTransformEnd={handleTransformEnd}
            onContextMenu={onContextMenu}
            opacity={isInMultiSelection ? 0.8 : 1} // Para multi-selección
            strokeWidth={isInMultiSelection ? 1 : 0} // Borde en multi-selección
            stroke={isInMultiSelection ? "#4A90E2" : "transparent"}
          />

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
              fontSize: fontSize || 16,
              fontFamily: fontFamily || "Arial",
              fontWeight: getFontWeight(),
              fontStyle: getFontStyleCSS(),
              textAlign: getTextAlign(),
              color: stroke || "#000",
              background: fill || "transparent",
              border: "1px solid #aaa",
              padding: 8,
              borderRadius: 4,
              resize: "none",
              width: textAreaWidth,
              height: textAreaHeight,
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
