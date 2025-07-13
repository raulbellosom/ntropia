import React, { useState } from "react";
import { useCanvasStore } from "../../store/useCanvasStore";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  PlusCircle,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronDown as ChevronDownSolid,
  X,
} from "lucide-react";
import classNames from "classnames";
import { useMediaQuery } from "react-responsive";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// -------------------- HOOK: Expansión de capas -------------------------
function useOpenLayers() {
  const [openLayers, setOpenLayers] = useState([]);
  const toggleLayerOpen = (layerId) => {
    setOpenLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId]
    );
  };
  const isLayerOpen = (layerId) => openLayers.includes(layerId);
  return { openLayers, toggleLayerOpen, isLayerOpen };
}

export default function LayersPanel() {
  const [editingId, setEditingId] = useState(null); // para figura/capa
  const [editingValue, setEditingValue] = useState("");

  // ---- HOOKS STORE ----
  const layers = useCanvasStore((state) => state.layers);
  const activeLayerId = useCanvasStore((state) => state.activeLayerId);
  const setActiveLayer = useCanvasStore((state) => state.setActiveLayer);
  const toggleLayerVisibility = useCanvasStore(
    (state) => state.toggleLayerVisibility
  );
  const toggleLayerLock = useCanvasStore((state) => state.toggleLayerLock);
  const addLayer = useCanvasStore((state) => state.addLayer);
  const removeLayer = useCanvasStore((state) => state.removeLayer);
  const moveLayerUp = useCanvasStore((state) => state.moveLayerUp);
  const moveLayerDown = useCanvasStore((state) => state.moveLayerDown);
  const setLayerOpacity = useCanvasStore((state) => state.setLayerOpacity);
  const removeShape = useCanvasStore((state) => state.removeShape);

  const shapes = useCanvasStore((state) => state.shapes);
  const selectedShapeIds = useCanvasStore((state) => state.selectedShapeIds);
  const setSelectedShape = useCanvasStore((state) => state.setSelectedShape);
  const toggleShapeVisibility = useCanvasStore(
    (state) => state.toggleShapeVisibility
  );

  const layersPanelVisible = useCanvasStore((s) => s.layersPanelVisible);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const { toggleLayerOpen, isLayerOpen } = useOpenLayers();

  // DnD Handlers ----
  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;

    // Drag de capas
    if (type === "layer") {
      if (source.index !== destination.index) {
        // Mover capa usando moveLayerUp/moveLayerDown varias veces
        // O mejor, implementa moveLayer({from, to}) en el store si quieres eficiencia
        // Por ahora, simula moviendo muchas veces
        let idx = source.index;
        while (idx > destination.index) {
          useCanvasStore.getState().moveLayerUp(layers[idx].id);
          idx--;
        }
        while (idx < destination.index) {
          useCanvasStore.getState().moveLayerDown(layers[idx].id);
          idx++;
        }
      }
      return;
    }

    // Drag de shapes
    if (type === "shape") {
      const sourceLayerId = source.droppableId;
      const destLayerId = destination.droppableId;
      const shapeId = draggableId;
      const sourceShapes = shapes.filter((s) => s.layerId === sourceLayerId);
      const destShapes = shapes.filter((s) => s.layerId === destLayerId);

      // Si cambia de capa: cambia layerId y lo reordena en destino
      // Si es en la misma capa, solo reordena
      useCanvasStore.setState((state) => {
        let newShapes = [...state.shapes];
        // Remueve de source
        const fromIdx = newShapes.findIndex(
          (s) => s.id === shapeId && s.layerId === sourceLayerId
        );
        if (fromIdx === -1) return {};
        const [moved] = newShapes.splice(fromIdx, 1);
        moved.layerId = destLayerId;
        // Inserta en destino en la posición correcta
        // Si es la misma capa, reinsertar en destino index; si cambia de capa, inserta
        const destIdx = newShapes.findIndex(
          (s, i) =>
            s.layerId === destLayerId &&
            destShapes[destination.index] &&
            s.id === destShapes[destination.index].id
        );
        if (destIdx === -1 || destShapes.length === 0) {
          // Añadir al final de capa destino
          // Buscar última posición de esa capa
          let lastIdx = -1;
          for (let i = newShapes.length - 1; i >= 0; i--) {
            if (newShapes[i].layerId === destLayerId) {
              lastIdx = i;
              break;
            }
          }
          newShapes.splice(lastIdx + 1, 0, moved);
        } else {
          newShapes.splice(destIdx, 0, moved);
        }
        return { shapes: newShapes };
      });
    }
  };

  const handleRenameLayer = (layerId) => {
    if (editingValue.trim()) {
      useCanvasStore.getState().renameLayer(layerId, editingValue.trim());
    }
    setEditingId(null);
    setEditingValue("");
  };

  const handleRenameShape = (shapeId) => {
    if (editingValue.trim()) {
      useCanvasStore.getState().renameShape(shapeId, editingValue.trim());
    }
    setEditingId(null);
    setEditingValue("");
  };

  // --- RENDER ---
  return (
    <div
      className={classNames("fixed z-50 transition-all duration-300", {
        "inset-x-0 mx-auto top-24": isMobile,
        "top-24 left-24 md:left-4": !isMobile,
        "pointer-events-none opacity-0 -translate-x-8": !layersPanelVisible,
        "pointer-events-auto opacity-100 translate-x-0": layersPanelVisible,
      })}
      style={{
        width: isMobile ? "95vw" : "23rem",
        minWidth: isMobile ? 160 : 300,
        maxWidth: isMobile ? 350 : 450,
        ...(isMobile ? { bottom: "auto", right: "auto" } : {}),
      }}
    >
      <aside className="w-full bg-slate-900/95 text-white shadow-2xl p-4 rounded-2xl border border-blue-900 backdrop-blur-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>
              <svg
                className="inline mr-1"
                width={22}
                height={22}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="6" width="16" height="13" rx="2" />
                <rect x="6" y="3" width="10" height="4" rx="2" />
              </svg>
            </span>
            Capas
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const name = prompt("Nombre de la nueva capa:");
                if (name && name.trim()) addLayer(name.trim());
              }}
              title="Agregar capa"
              className="text-green-400 hover:text-green-300"
            >
              <PlusCircle size={22} />
            </button>
            <button
              onClick={() => useCanvasStore.getState().hideLayersPanel()}
              title="Cerrar panel de capas"
              className="ml-2 text-slate-400 hover:text-red-500 p-1 rounded transition"
            >
              <X size={22} />
            </button>
          </div>
        </div>
        <div
          className="overflow-y-auto"
          style={{ maxHeight: isMobile ? "55vh" : "78dvh" }}
        >
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="LAYERS-DND" type="layer">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={classNames("space-y-4", { "space-y-2": isMobile })}
                >
                  {layers.map((layer, idx) => {
                    const isActive = layer.id === activeLayerId;
                    const objects = shapes.filter(
                      (s) => s.layerId === layer.id
                    );
                    const isOpen = isLayerOpen(layer.id);

                    return (
                      <Draggable
                        draggableId={layer.id}
                        index={idx}
                        key={layer.id}
                      >
                        {(dragLayerProvided) => (
                          <li
                            ref={dragLayerProvided.innerRef}
                            {...dragLayerProvided.draggableProps}
                            {...dragLayerProvided.dragHandleProps}
                            className={classNames(
                              "rounded-xl p-3 border shadow group transition-all duration-200 relative",
                              {
                                "bg-blue-950/70 border-blue-600 shadow-lg":
                                  isActive,
                                "bg-slate-800/60 border-slate-700 hover:bg-slate-800/80":
                                  !isActive,
                                "ring-2 ring-blue-500/70": isActive,
                              }
                            )}
                            tabIndex={0}
                            onClick={() => setActiveLayer(layer.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(layer.id);
                                  setEditingValue(layer.name);
                                }}
                              >
                                {editingId === layer.id ? (
                                  <input
                                    autoFocus
                                    value={editingValue}
                                    onChange={(e) =>
                                      setEditingValue(e.target.value)
                                    }
                                    onBlur={() => handleRenameLayer(layer.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleRenameLayer(layer.id);
                                      if (e.key === "Escape") {
                                        setEditingId(null);
                                        setEditingValue("");
                                      }
                                    }}
                                    className="px-2 py-1 bg-slate-800 rounded text-white w-32"
                                    style={{ minWidth: 80, maxWidth: 180 }}
                                  />
                                ) : (
                                  layer.name
                                )}
                              </span>

                              <div className="flex items-center gap-2 w-fit">
                                <button
                                  className="p-1 hover:bg-blue-800/40 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveLayerUp(layer.id);
                                  }}
                                  disabled={idx === 0}
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  className="p-1 hover:bg-blue-800/40 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveLayerDown(layer.id);
                                  }}
                                  disabled={idx === layers.length - 1}
                                >
                                  <ChevronDown size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2 flex-1">
                                <button
                                  className="hover:text-blue-300 transition"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLayerVisibility(layer.id);
                                  }}
                                >
                                  {layer.visible ? (
                                    <Eye size={17} />
                                  ) : (
                                    <EyeOff size={17} />
                                  )}
                                </button>
                                <button
                                  className="hover:text-blue-300 transition"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLayerLock(layer.id);
                                  }}
                                >
                                  {layer.locked ? (
                                    <Lock size={17} />
                                  ) : (
                                    <Unlock size={17} />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      window.confirm(
                                        "¿Eliminar capa y todos sus objetos?"
                                      )
                                    ) {
                                      removeLayer(layer.id);
                                    }
                                  }}
                                  title="Eliminar capa"
                                  className="ml-2 text-red-400 hover:text-red-600"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-col gap-2 text-xs opacity-80">
                              <div className="flex items-center justify-between flex-1">
                                <span>Opacidad</span>
                                <span>
                                  {layer.opacity
                                    ? Math.round(layer.opacity * 100)
                                    : 100}
                                  %
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min={10}
                                  max={100}
                                  step={1}
                                  value={
                                    layer.opacity ? layer.opacity * 100 : 100
                                  }
                                  onChange={(e) =>
                                    setLayerOpacity(
                                      layer.id,
                                      Number(e.target.value) / 100
                                    )
                                  }
                                  className="flex-1 accent-blue-500 bg-transparent"
                                  style={{ accentColor: "#3b82f6", width: 80 }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs opacity-80 mt-1">
                              <button
                                className="p-1 rounded hover:bg-slate-800 transition"
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
                              </button>
                              <span>{objects.length} objetos</span>
                            </div>
                            {isOpen && (
                              <Droppable droppableId={layer.id} type="shape">
                                {(dropProvided) => (
                                  <ul
                                    ref={dropProvided.innerRef}
                                    {...dropProvided.droppableProps}
                                    className="ml-7 mt-2 space-y-1"
                                  >
                                    {objects.map((obj, idx) => (
                                      <Draggable
                                        draggableId={obj.id}
                                        index={idx}
                                        key={obj.id}
                                      >
                                        {(objProvided) => (
                                          <li
                                            ref={objProvided.innerRef}
                                            {...objProvided.draggableProps}
                                            {...objProvided.dragHandleProps}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedShape(obj.id);
                                            }}
                                            className={classNames(
                                              "flex items-center group  rounded px-2 py-1 transition",
                                              {
                                                "bg-blue-600 text-white font-bold shadow":
                                                  selectedShapeIds.includes(
                                                    obj.id
                                                  ),
                                                "hover:bg-blue-800":
                                                  !selectedShapeIds.includes(
                                                    obj.id
                                                  ),
                                              }
                                            )}
                                          >
                                            <div className="flex-1 flex items-center gap-2 truncate">
                                              <button
                                                className="hover:text-blue-300 transition"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleShapeVisibility(obj.id);
                                                }}
                                              >
                                                {obj.visible !== false ? (
                                                  <Eye size={15} />
                                                ) : (
                                                  <EyeOff size={15} />
                                                )}
                                              </button>
                                              <span
                                                className="text-xs truncate"
                                                onDoubleClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingId(obj.id);
                                                  setEditingValue(
                                                    obj.name ||
                                                      obj.type ||
                                                      obj.id.slice(0, 8)
                                                  );
                                                }}
                                              >
                                                {editingId === obj.id ? (
                                                  <input
                                                    autoFocus
                                                    value={editingValue}
                                                    onChange={(e) =>
                                                      setEditingValue(
                                                        e.target.value
                                                      )
                                                    }
                                                    onBlur={() =>
                                                      handleRenameShape(obj.id)
                                                    }
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter")
                                                        handleRenameShape(
                                                          obj.id
                                                        );
                                                      if (e.key === "Escape") {
                                                        setEditingId(null);
                                                        setEditingValue("");
                                                      }
                                                    }}
                                                    className="px-2 py-1 text-xs bg-slate-800 rounded text-white w-24"
                                                    style={{
                                                      minWidth: 60,
                                                      maxWidth: 180,
                                                    }}
                                                  />
                                                ) : (
                                                  obj.name ||
                                                  obj.type ||
                                                  obj.id.slice(0, 8)
                                                )}
                                              </span>
                                            </div>
                                            <button
                                              className="ml-2 text-blue-300 hover:text-blue-500 p-1 rounded disabled:opacity-30"
                                              title="Subir"
                                              onClick={() =>
                                                useCanvasStore
                                                  .getState()
                                                  .bringShapeForward(obj.id)
                                              }
                                              disabled={
                                                idx === objects.length - 1
                                              }
                                            >
                                              <ChevronDown size={18} />
                                            </button>
                                            <button
                                              className="ml-1 text-blue-300 hover:text-blue-500 p-1 rounded disabled:opacity-30"
                                              title="Bajar"
                                              onClick={() =>
                                                useCanvasStore
                                                  .getState()
                                                  .sendShapeBackward(obj.id)
                                              }
                                              disabled={idx === 0}
                                            >
                                              <ChevronUp size={18} />
                                            </button>
                                            <button
                                              className="ml-2 text-red-400 hover:text-red-600"
                                              title="Eliminar elemento"
                                              onClick={() =>
                                                removeShape(obj.id)
                                              }
                                            >
                                              <Trash2 size={18} />
                                            </button>
                                          </li>
                                        )}
                                      </Draggable>
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
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </aside>
    </div>
  );
}
