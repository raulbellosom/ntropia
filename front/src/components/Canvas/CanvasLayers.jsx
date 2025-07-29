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
import { useEditMode } from "../../hooks/useEditMode";

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
  setContextMenu,
  autoEditTextId,
  updateShape, // para FreeDrawShape y LineShape
  setActiveLayer,
}) {
  const { isEditMode } = useEditMode();
  return (
    <>
      {layers
        .filter((layer) => layer.visible)
        .sort((a, b) => (a.order || 0) - (b.order || 0)) // Ordenar layers por order también
        .map((layer) => {
          const isLocked = layer.locked;
          const shapesDeCapa = shapes
            .filter(
              (s) =>
                s.layerId === layer.id && s.visible !== false && !s._toDelete
            )
            .sort((a, b) => (a.order || 0) - (b.order || 0)); // Ordenar por campo order
          if (shapesDeCapa.length === 0) return null;

          return (
            <Group
              key={layer.id}
              opacity={layer.opacity ?? 1}
              listening={!isLocked}
            >
              {shapesDeCapa.map((s) => {
                const isShapeLocked = isLocked;
                let longPressTimer = null;

                // Handlers solo si es modo edición
                const handleTouchStart = (e) => {
                  if (tool !== "select" || isShapeLocked) return;
                  longPressTimer = setTimeout(() => {
                    setContextMenu(e, s.id);
                  }, 420);
                };
                const clearLongPress = () => clearTimeout(longPressTimer);

                // PROPS COMUNES (modificados por modo edición)
                const isMarker = s.type === "marker";
                const allowDblClick = isEditMode || isMarker;

                const propsShape = {
                  id: s.id,
                  ...s.props,
                  tool: tool,
                  isSelected:
                    isEditMode &&
                    selectedShapeIds.includes(s.id) &&
                    selectedShapeIds.length === 1,
                  isInMultiSelection:
                    isEditMode &&
                    selectedShapeIds.includes(s.id) &&
                    selectedShapeIds.length > 1,
                  draggable:
                    isEditMode &&
                    !isShapeLocked &&
                    selectedShapeIds.includes(s.id),
                  listening: isEditMode && tool === "select" && !isShapeLocked,
                  isLocked: isShapeLocked,
                  ...(isEditMode
                    ? {
                        onSelect: (e) => {
                          if (tool === "select" && !isShapeLocked) {
                            if (e && (e.evt.ctrlKey || e.evt.metaKey)) {
                              toggleSelection(s.id);
                            } else {
                              setSelectedShape(s.id);
                              setActiveLayer(s.layerId);
                            }
                          }
                        },
                        onTransformEnd: handleTransformEnd,
                        onDragEnd: handleShapeDragEnd,
                        onDoubleClick: () => handleShapeDoubleClick(s.id),
                        onContextMenu: (e) => {
                          if (tool === "select") {
                            e.evt.preventDefault();
                            setContextMenu(e, s.id);
                          }
                        },
                        onTouchStart: handleTouchStart,
                        onTouchEnd: clearLongPress,
                        onTouchMove: clearLongPress,
                      }
                    : isMarker
                    ? {
                        // SOLO para markers en modo view
                        onDoubleClick: () => handleShapeDoubleClick(s.id),
                      }
                    : {}),
                };

                switch (s.type) {
                  case "free":
                    return (
                      <FreeDrawShape
                        key={s.id}
                        onUpdate={({ id, props }) => updateShape(id, props)}
                        {...propsShape}
                      />
                    );
                  case "line":
                    return (
                      <LineShape
                        key={s.id}
                        {...propsShape}
                        onUpdate={({ id, props }) => updateShape(id, props)}
                      />
                    );
                  case "arrow":
                    return <ArrowShape key={s.id} {...propsShape} />;
                  case "rect":
                    return <RectShape key={s.id} {...propsShape} />;
                  case "circle":
                    return <CircleShape key={s.id} {...propsShape} />;
                  case "text":
                    return (
                      <TextShape
                        key={s.id}
                        {...propsShape}
                        autoEdit={s.id === autoEditTextId}
                        onChangeText={(id, newText) => {
                          updateShape(id, { text: newText });
                        }}
                      />
                    );
                  case "image":
                    return <ImageShape key={s.id} {...propsShape} />;
                  case "marker":
                    return <MarkerIcon key={s.id} {...propsShape} />;
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
