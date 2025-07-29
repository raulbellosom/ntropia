// src/components/LayersPanel/LayerItem.jsx
import React from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronDown as ChevronDownSolid,
} from "lucide-react";
import classNames from "classnames";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import ShapeItem from "./ShapeItem";
import { useCanvasStore } from "../../store/useCanvasStore";
import { useUpdateLayer } from "../../hooks/useLayers";

export default function LayerItem({
  layer,
  idx,
  isEditMode,
  isActive,
  isOpen,
  objects,
  layers,
  selectedShapeIds,
  setActiveLayer,
  setEditingId,
  editingId,
  editingValue,
  setEditingValue,
  handleRenameLayer,
  moveLayerUp,
  moveLayerDown,
  toggleLayerVisibility,
  toggleLayerLock,
  setLayerOpacity,
  toggleLayerOpen,
  setSelectedShape,
  toggleShapeVisibility,
  removeShape,
  handleRenameShape,
  onRequestDelete,
}) {
  const layerLocked = layer.locked;
  const updateLayer = useUpdateLayer();

  // 🚀 Handlers que SOLO envían al servidor - Sin updates locales
  const handleToggleVisibility = () => {
    // SOLO servidor - Sin update local
    updateLayer.mutate({
      id: layer.id,
      data: {
        name: layer.name,
        order: layer.order,
        visible: !layer.visible,
        locked: layer.locked,
        opacity: layer.opacity,
        workspace_id: layer.workspace_id,
      },
    });
  };

  const handleToggleLock = () => {
    // SOLO servidor - Sin update local
    updateLayer.mutate({
      id: layer.id,
      data: {
        name: layer.name,
        order: layer.order,
        visible: layer.visible,
        locked: !layer.locked,
        opacity: layer.opacity,
        workspace_id: layer.workspace_id,
      },
    });
  };

  const handleOpacityChange = (opacity) => {
    // SOLO servidor - Sin update local
    updateLayer.mutate({
      id: layer.id,
      data: {
        name: layer.name,
        order: layer.order,
        visible: layer.visible,
        locked: layer.locked,
        opacity,
        workspace_id: layer.workspace_id,
      },
    });
  };

  const onInputBlur = () => {
    handleRenameLayer(layer.id);
  };

  const onInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleRenameLayer(layer.id);
    }
    if (e.key === "Escape") {
      setEditingId(null);
      setEditingValue("");
    }
  };

  return (
    <Draggable
      draggableId={`layer-${layer.id}`} // 👈 Asegúrate que sea string y único
      isDragDisabled={!isEditMode || layerLocked}
      index={idx}
    >
      {(dragLayerProvided) => (
        <li
          ref={dragLayerProvided.innerRef}
          {...dragLayerProvided.draggableProps}
          {...dragLayerProvided.dragHandleProps}
          className={classNames(
            "rounded-xl p-3 border shadow group transition-all duration-200 relative",
            {
              "bg-blue-950/70 border-blue-600 shadow-lg": isActive,
              "bg-slate-800/60 border-slate-700 hover:bg-slate-800/80":
                !isActive,
              "ring-2 ring-blue-500/70": isActive,
            }
          )}
          tabIndex={0}
          onClick={() => setActiveLayer(layer.id)}
        >
          {/* Título y acciones de capa */}
          <div className="flex items-center justify-between">
            <span
              className="min-w-1/2"
              onDoubleClick={
                isEditMode
                  ? (e) => {
                      e.stopPropagation();
                      setEditingId(layer.id);
                      setEditingValue(layer.name);
                    }
                  : undefined
              }
              onTouchStart={
                isEditMode
                  ? (e) => {
                      let timeout = setTimeout(() => {
                        setEditingId(layer.id);
                        setEditingValue(layer.name);
                      }, 500);
                      e.target.ontouchend = () => clearTimeout(timeout);
                      e.target.ontouchmove = () => clearTimeout(timeout);
                    }
                  : undefined
              }
            >
              {editingId === layer.id ? (
                <input
                  autoFocus
                  value={editingValue}
                  onChange={
                    isEditMode
                      ? (e) => setEditingValue(e.target.value)
                      : undefined
                  }
                  onBlur={isEditMode ? onInputBlur : undefined}
                  onKeyDown={isEditMode ? onInputKeyDown : undefined}
                  className="px-2 py-1 bg-slate-800 rounded text-white w-32"
                  style={{ minWidth: 80, maxWidth: 180 }}
                />
              ) : (
                layer.name
              )}
            </span>
            <div className="flex items-center gap-2 w-fit">
              {isEditMode && !layer.locked && (
                <>
                  <button
                    className="p-1 hover:bg-blue-800/40 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      const handleMoveLayerUp = async () => {
                        // Obtener layers ANTES del update
                        const layers = useCanvasStore.getState().layers;
                        const currentIdx = layers.findIndex(
                          (l) => l.id === layer.id
                        );

                        if (currentIdx > 0) {
                          const currentLayer = layers[currentIdx];
                          const prevLayer = layers[currentIdx - 1];

                          // 🚀 SOLO servidor - Sin update local
                          try {
                            await updateLayer.mutateAsync({
                              id: currentLayer.id,
                              data: {
                                name: currentLayer.name,
                                order: currentIdx - 1,
                                visible: currentLayer.visible,
                                locked: currentLayer.locked,
                                opacity: currentLayer.opacity,
                              },
                            });
                            await updateLayer.mutateAsync({
                              id: prevLayer.id,
                              data: {
                                name: prevLayer.name,
                                order: currentIdx,
                                visible: prevLayer.visible,
                                locked: prevLayer.locked,
                                opacity: prevLayer.opacity,
                              },
                            });
                          } catch (error) {
                            console.error("Error moving layer up:", error);
                          }
                        }
                      };
                      handleMoveLayerUp();
                    }}
                    disabled={idx === 0}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    className="p-1 hover:bg-blue-800/40 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      const handleMoveLayerDown = async () => {
                        // Obtener layers ANTES del update
                        const layers = useCanvasStore.getState().layers;
                        const currentIdx = layers.findIndex(
                          (l) => l.id === layer.id
                        );

                        if (currentIdx < layers.length - 1) {
                          const currentLayer = layers[currentIdx];
                          const nextLayer = layers[currentIdx + 1];

                          // 🚀 SOLO servidor - Sin update local
                          try {
                            await updateLayer.mutateAsync({
                              id: currentLayer.id,
                              data: {
                                name: currentLayer.name,
                                order: currentIdx + 1,
                                visible: currentLayer.visible,
                                locked: currentLayer.locked,
                                opacity: currentLayer.opacity,
                              },
                            });
                            await updateLayer.mutateAsync({
                              id: nextLayer.id,
                              data: {
                                name: nextLayer.name,
                                order: currentIdx,
                                visible: nextLayer.visible,
                                locked: nextLayer.locked,
                                opacity: nextLayer.opacity,
                              },
                            });
                          } catch (error) {
                            console.error("Error moving layer down:", error);
                          }
                        }
                      };
                      handleMoveLayerDown();
                    }}
                    disabled={idx === layers.length - 1}
                  >
                    <ChevronDown size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Visibilidad, lock, eliminar */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 flex-1">
              <button
                className="hover:text-blue-300 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility();
                }}
              >
                {layer.visible ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
              {isEditMode && (
                <button
                  className="hover:text-blue-300 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLock();
                  }}
                >
                  {layer.locked ? <Lock size={17} /> : <Unlock size={17} />}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isEditMode && !layer.locked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDelete();
                  }}
                  title="Eliminar capa"
                  className="ml-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              )}
            </div>
          </div>
          {/* Opacidad */}
          <div className="mt-3 flex flex-col gap-2 text-xs opacity-80">
            <div className="flex items-center justify-between flex-1">
              <span>Opacidad</span>
              <span>{Math.round((layer.opacity ?? 1) * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={(layer.opacity ?? 1) * 100}
                onChange={(e) =>
                  handleOpacityChange(Number(e.target.value) / 100)
                }
                className="flex-1 accent-blue-500 bg-transparent"
                style={{ accentColor: "#3b82f6", width: 80 }}
              />
            </div>
          </div>
          {/* Expansión y lista de shapes */}
          <button
            className="p-1 px-2 flex items-center gap-2 text-xs mt-1 rounded hover:bg-blue-800 transition"
            onClick={(e) => {
              e.stopPropagation();
              toggleLayerOpen(layer.id);
            }}
          >
            {isOpen ? (
              <ChevronDownSolid size={17} />
            ) : (
              <ChevronRight size={17} />
            )}
            <span>{objects.length} objetos</span>
          </button>
          {isOpen && (
            <Droppable
              droppableId={layer.id}
              type="shape"
              isDropDisabled={!isEditMode}
            >
              {(dropProvided) => (
                <ul
                  ref={dropProvided.innerRef}
                  {...dropProvided.droppableProps}
                  className="ml-7 mt-2 space-y-1"
                >
                  {objects
                    .filter((obj) => obj.id) // 👈 Filtrar objetos sin id
                    .map((obj, idx) => (
                      <ShapeItem
                        key={`shape-${obj.id}`} // 👈 Clave más específica
                        obj={obj}
                        idx={idx}
                        layerLocked={layerLocked}
                        selectedShapeIds={selectedShapeIds}
                        setSelectedShape={setSelectedShape}
                        toggleShapeVisibility={toggleShapeVisibility}
                        removeShape={removeShape}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        editingValue={editingValue}
                        setEditingValue={setEditingValue}
                        handleRenameShape={handleRenameShape}
                        objects={objects}
                        isEditMode={isEditMode}
                        setActiveLayer={setActiveLayer}
                      />
                    ))}
                  {dropProvided.placeholder}
                </ul>
              )}
            </Droppable>
          )}
        </li>
      )}
    </Draggable>
  );
}
