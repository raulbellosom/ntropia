// src/components/LayersPanel/LayerItem.jsx
import React, { useState, useRef, useCallback } from "react";
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

  // Estado para controlar el debounce del opacity
  const [localOpacity, setLocalOpacity] = useState(layer.opacity ?? 1);
  const [isChangingOpacity, setIsChangingOpacity] = useState(false);
  const opacityTimeoutRef = useRef(null);
  const lastRequestTime = useRef(0);
  const REQUEST_DELAY = 500; // 500ms entre requests

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

  const handleOpacityChange = useCallback(
    (opacity) => {
      const now = Date.now();

      // Actualizar estado local inmediatamente para UI responsiva
      setLocalOpacity(opacity);
      setIsChangingOpacity(true);

      // Limpiar timeout anterior
      if (opacityTimeoutRef.current) {
        clearTimeout(opacityTimeoutRef.current);
      }

      // Configurar nuevo timeout con debounce
      opacityTimeoutRef.current = setTimeout(() => {
        const timeSinceLastRequest = now - lastRequestTime.current;

        // Solo enviar si ha pasado suficiente tiempo desde la última request
        if (timeSinceLastRequest >= REQUEST_DELAY) {
          lastRequestTime.current = Date.now();

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
        }

        setIsChangingOpacity(false);
      }, 300); // 300ms debounce
    },
    [layer, updateLayer]
  );

  const handleOpacityMouseUp = () => {
    // Cuando el usuario suelta el slider, enviar inmediatamente
    if (opacityTimeoutRef.current) {
      clearTimeout(opacityTimeoutRef.current);
    }

    const now = Date.now();
    lastRequestTime.current = now;

    updateLayer.mutate({
      id: layer.id,
      data: {
        name: layer.name,
        order: layer.order,
        visible: layer.visible,
        locked: layer.locked,
        opacity: localOpacity,
        workspace_id: layer.workspace_id,
      },
    });

    setIsChangingOpacity(false);
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
            "rounded-lg p-3 border shadow-sm group transition-all duration-200 relative cursor-pointer",
            {
              "bg-blue-950/80 border-blue-500 shadow-md ring-1 ring-blue-500/50":
                isActive,
              "bg-slate-800/50 border-slate-600 hover:bg-slate-800/70 hover:border-slate-500":
                !isActive,
            }
          )}
          tabIndex={0}
          onClick={() => setActiveLayer(layer.id)}
        >
          {/* Título y acciones principales */}
          <div className="flex items-center justify-between">
            <span
              className="flex-1 font-medium text-sm truncate"
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
                  className="px-2 py-1 bg-slate-700 border border-slate-500 rounded text-white text-sm w-full"
                />
              ) : (
                layer.name
              )}
            </span>

            {/* Controles principales */}
            <div className="flex items-center gap-1 ml-2">
              <button
                className="p-1.5 hover:bg-blue-700/40 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility();
                }}
                title={layer.visible ? "Ocultar capa" : "Mostrar capa"}
              >
                {layer.visible ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>

              {isEditMode && (
                <button
                  className="p-1.5 hover:bg-blue-700/40 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLock();
                  }}
                  title={layer.locked ? "Desbloquear capa" : "Bloquear capa"}
                >
                  {layer.locked ? <Lock size={15} /> : <Unlock size={15} />}
                </button>
              )}

              {isEditMode && !layer.locked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDelete();
                  }}
                  title="Eliminar capa"
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Fila inferior: orden y opacidad */}
          {isEditMode && !layer.locked && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-600/50">
              {/* Controles de orden */}
              <div className="flex items-center gap-1 w-1/3">
                <button
                  className={classNames(
                    "p-1 rounded transition-colors text-xs",
                    {
                      "opacity-30 cursor-not-allowed": idx === 0,
                      "hover:bg-blue-700/40 text-slate-300": idx !== 0,
                    }
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    const handleMoveLayerUp = async () => {
                      // Obtener layers ordenados como en la UI (mayor order primero)
                      const allLayers = useCanvasStore.getState().layers;
                      const sortedLayers = allLayers
                        .filter((l) => !l._toDelete && l.id)
                        .sort((a, b) => b.order - a.order);

                      const currentUIIndex = sortedLayers.findIndex(
                        (l) => l.id === layer.id
                      );

                      if (currentUIIndex > 0) {
                        const currentLayer = sortedLayers[currentUIIndex];
                        const targetLayer = sortedLayers[currentUIIndex - 1];

                        // Intercambiar orders - el que está arriba en UI debe tener mayor order
                        try {
                          await updateLayer.mutateAsync({
                            id: currentLayer.id,
                            data: {
                              name: currentLayer.name,
                              order: targetLayer.order,
                              visible: currentLayer.visible,
                              locked: currentLayer.locked,
                              opacity: currentLayer.opacity,
                              workspace_id: currentLayer.workspace_id,
                            },
                          });
                          await updateLayer.mutateAsync({
                            id: targetLayer.id,
                            data: {
                              name: targetLayer.name,
                              order: currentLayer.order,
                              visible: targetLayer.visible,
                              locked: targetLayer.locked,
                              opacity: targetLayer.opacity,
                              workspace_id: targetLayer.workspace_id,
                            },
                          });
                        } catch (error) {
                          console.error("Error moving layer up:", error);
                        }
                      }
                    };
                    if (idx !== 0) handleMoveLayerUp();
                  }}
                  disabled={idx === 0}
                  title={idx === 0 ? "Ya está al frente" : "Traer al frente"}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  className={classNames(
                    "p-1 rounded transition-colors text-xs",
                    {
                      "opacity-30 cursor-not-allowed":
                        idx === layers.filter((l) => !l._toDelete).length - 1,
                      "hover:bg-blue-700/40 text-slate-300":
                        idx !== layers.filter((l) => !l._toDelete).length - 1,
                    }
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    const handleMoveLayerDown = async () => {
                      // Obtener layers ordenados como en la UI (mayor order primero)
                      const allLayers = useCanvasStore.getState().layers;
                      const sortedLayers = allLayers
                        .filter((l) => !l._toDelete && l.id)
                        .sort((a, b) => b.order - a.order);

                      const currentUIIndex = sortedLayers.findIndex(
                        (l) => l.id === layer.id
                      );

                      if (currentUIIndex < sortedLayers.length - 1) {
                        const currentLayer = sortedLayers[currentUIIndex];
                        const targetLayer = sortedLayers[currentUIIndex + 1];

                        // Intercambiar orders - el que está abajo en UI debe tener menor order
                        try {
                          await updateLayer.mutateAsync({
                            id: currentLayer.id,
                            data: {
                              name: currentLayer.name,
                              order: targetLayer.order,
                              visible: currentLayer.visible,
                              locked: currentLayer.locked,
                              opacity: currentLayer.opacity,
                              workspace_id: currentLayer.workspace_id,
                            },
                          });
                          await updateLayer.mutateAsync({
                            id: targetLayer.id,
                            data: {
                              name: targetLayer.name,
                              order: currentLayer.order,
                              visible: targetLayer.visible,
                              locked: targetLayer.locked,
                              opacity: targetLayer.opacity,
                              workspace_id: targetLayer.workspace_id,
                            },
                          });
                        } catch (error) {
                          console.error("Error moving layer down:", error);
                        }
                      }
                    };
                    if (idx !== layers.filter((l) => !l._toDelete).length - 1)
                      handleMoveLayerDown();
                  }}
                  disabled={
                    idx === layers.filter((l) => !l._toDelete).length - 1
                  }
                  title={
                    idx === layers.filter((l) => !l._toDelete).length - 1
                      ? "Ya está atrás"
                      : "Enviar atrás"
                  }
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={(localOpacity ?? 1) * 100}
                  onChange={(e) =>
                    handleOpacityChange(Number(e.target.value) / 100)
                  }
                  onMouseUp={handleOpacityMouseUp}
                  onTouchEnd={handleOpacityMouseUp}
                  className={classNames(
                    "flex-1 bg-transparent transition-all h-1",
                    {
                      "accent-blue-500": !isChangingOpacity,
                      "accent-blue-400": isChangingOpacity,
                    }
                  )}
                  style={{
                    accentColor: isChangingOpacity ? "#60a5fa" : "#3b82f6",
                  }}
                />
                <span
                  className={classNames(
                    "text-xs font-mono transition-colors min-w-[32px]",
                    {
                      "text-blue-400": isChangingOpacity,
                      "text-slate-400": !isChangingOpacity,
                    }
                  )}
                >
                  {Math.round((localOpacity ?? 1) * 100)}%
                </span>
              </div>
            </div>
          )}
          {/* Expansión y lista de shapes */}
          <div className="mt-2 pt-2 border-t border-slate-600/30">
            <button
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700/30 rounded p-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerOpen(layer.id);
              }}
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDownSolid size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                <span>
                  {objects.length} objeto{objects.length !== 1 ? "s" : ""}
                </span>
              </div>
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
                    className="mt-2 space-y-1 max-h-32 overflow-y-auto"
                  >
                    {objects
                      .filter((obj) => obj.id) // 👈 Filtrar objetos sin id
                      .sort((a, b) => {
                        // Manejar casos donde order puede ser undefined/null
                        const orderA = a.order ?? 0;
                        const orderB = b.order ?? 0;
                        return orderB - orderA; // 👈 ORDEN CORRECTO: Mayor order arriba (al frente), menor order abajo (al fondo)
                      })
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
                          objects={objects
                            .filter((obj) => obj.id)
                            .sort((a, b) => {
                              // Manejar casos donde order puede ser undefined/null
                              const orderA = a.order ?? 0;
                              const orderB = b.order ?? 0;
                              return orderB - orderA; // 👈 ORDEN CORRECTO: Mayor order arriba (al frente), menor order abajo (al fondo)
                            })} // 👈 Pasar objetos ordenados
                          isEditMode={isEditMode}
                          setActiveLayer={setActiveLayer}
                        />
                      ))}
                    {dropProvided.placeholder}
                  </ul>
                )}
              </Droppable>
            )}
          </div>
        </li>
      )}
    </Draggable>
  );
}
