// src/components/Canvas/CanvasLayers.jsx

import React from "react";
import { Layer, Group } from "react-konva";
import FreeDrawShape from "../Shapes/FreeDrawShape";
import RectShape from "../Shapes/RectShape";
import CircleShape from "../Shapes/CircleShape";
import LineShape from "../Shapes/LineShape";
import TextShape from "../Shapes/TextShape";
import ImageShape from "../Shapes/ImageShape";
import MarkerIcon from "../Marker/MarkerIcon";
import ArrowShape from "../Shapes/ArrowShape";

/**
 * Renderiza todas las capas y sus figuras.
 * Todos los handlers (onSelect, onTransformEnd, etc) y los IDs seleccionados vienen por props.
 */
export default function CanvasLayers({
  layers,
  shapes,
  selectedShapeIds,
  tool,
  toggleSelection,
  setSelectedShape,
  handleTransformEnd,
  handleShapeDragEnd,
  handleShapeDoubleClick,
  setContextMenu, // función para mostrar menú contextual
  autoEditTextId,
  updateShape, // para FreeDrawShape y LineShape
}) {
  let longPressTimer = null;

  const handleTouchStart = (e) => {
    // Solo activa si tool === "select", así no interfiere al dibujar
    if (tool !== "select" || isLocked) return;
    longPressTimer = setTimeout(() => {
      setContextMenu(e, s.id);
    }, 420); // 420ms para UX rápida pero no accidental
  };

  const clearLongPress = () => {
    clearTimeout(longPressTimer);
  };

  return (
    <>
      {layers.map((layer) => {
        if (!layer.visible) return null;
        const isLocked = layer.locked;
        const shapesDeCapa = shapes.filter(
          (s) => s.layerId === layer.id && s.visible !== false
        );
        if (shapesDeCapa.length === 0) return null;

        return (
          <Group
            key={layer.id}
            opacity={layer.opacity ?? 1}
            listening={!isLocked}
          >
            {shapesDeCapa.map((s) => {
              const isShapeLocked = isLocked; // Necesario para closures
              let longPressTimer = null;

              // Handler de long-press (tap sostenido)
              const handleTouchStart = (e) => {
                if (tool !== "select" || isShapeLocked) return;
                longPressTimer = setTimeout(() => {
                  setContextMenu(e, s.id);
                }, 420);
              };
              const clearLongPress = () => clearTimeout(longPressTimer);

              // Todos los props para el shape
              const props = {
                id: s.id,
                ...s.props,
                isSelected:
                  selectedShapeIds.includes(s.id) &&
                  selectedShapeIds.length === 1,
                isInMultiSelection:
                  selectedShapeIds.includes(s.id) &&
                  selectedShapeIds.length > 1,
                onSelect: (e) => {
                  if (tool === "select" && !isShapeLocked) {
                    if (e && (e.evt.ctrlKey || e.evt.metaKey)) {
                      toggleSelection(s.id);
                    } else {
                      setSelectedShape(s.id);
                    }
                  }
                },
                onTransformEnd: handleTransformEnd,
                onDragEnd: handleShapeDragEnd,
                onDoubleClick: () => handleShapeDoubleClick(s.id),
                draggable: !isShapeLocked && selectedShapeIds.includes(s.id),
                listening: !isShapeLocked,
                isLocked: isShapeLocked,
                onContextMenu: (e) => {
                  e.evt.preventDefault();
                  setContextMenu(e, s.id);
                },
                onTouchStart: handleTouchStart,
                onTouchEnd: clearLongPress,
                onTouchMove: clearLongPress,
              };

              switch (s.type) {
                case "free":
                  return (
                    <FreeDrawShape
                      key={s.id}
                      onUpdate={({ id, props }) => updateShape(id, props)}
                      {...props}
                    />
                  );
                case "line":
                  return (
                    <LineShape
                      key={s.id}
                      onUpdate={({ id, props }) => updateShape(id, props)}
                      {...props}
                    />
                  );
                case "arrow":
                  return <ArrowShape key={s.id} {...props} />;
                case "rect":
                  return <RectShape key={s.id} {...props} />;
                case "circle":
                  return <CircleShape key={s.id} {...props} />;
                case "text":
                  return (
                    <TextShape
                      key={s.id}
                      {...props}
                      autoEdit={s.id === autoEditTextId}
                      onChangeText={(id, newText) => {
                        updateShape(id, { text: newText });
                        // Si quieres cerrar edición automática:
                        // if (autoEditTextId === id) setAutoEditTextId(null);
                      }}
                    />
                  );
                case "image":
                  return <ImageShape key={s.id} {...props} />;
                case "marker":
                  return <MarkerIcon key={s.id} {...props} />;
                default:
                  return null;
              }
            })}
          </Group>
        );
      })}
    </>
  );
}
