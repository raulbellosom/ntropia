// src/components/LayersPanel/LayersPanel.jsx
import React, { useState, useCallback } from "react";
import { useCanvasStore } from "../../store/useCanvasStore";
import { Layers, PlusCircle, X } from "lucide-react";
import classNames from "classnames";
import { useMediaQuery } from "react-responsive";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import LayerItem from "./LayerItem";
import useOpenLayers from "../../hooks/useOpenLayers";
import { useEditMode } from "../../hooks/useEditMode";
import ModalWrapper from "../common/ModalWrapper";
import { toast } from "react-hot-toast";

export default function LayersPanel() {
  // Edición
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [confirmDeleteLayerId, setConfirmDeleteLayerId] = useState(null);

  // Store y hooks
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
  const { isEditMode } = useEditMode();

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const { toggleLayerOpen, isLayerOpen } = useOpenLayers();

  // Drag & Drop logic
  const onDragEnd = useCallback(
    (result) => {
      const { destination, source, draggableId, type } = result;
      if (!destination) return;

      // Capas
      if (type === "layer") {
        // Filtra solo capas visibles (igual que el .map que usas para renderizar)
        const visibleLayers = layers.filter((l) => !l._toDelete);

        // Obtén los ids antes y después
        const sourceId = visibleLayers[source.index]?.id;
        const destId = visibleLayers[destination.index]?.id;

        // Si el índice no cambió, no hacemos nada
        if (source.index === destination.index) return;

        // Saca el array visible, reordénalo según drag
        const reordered = [...visibleLayers];
        const [removed] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, removed);

        // Reasigna el order en el store solo para visibles
        useCanvasStore.setState((state) => {
          // Mantén el array completo pero actualiza los .order de las capas visibles
          const layersCopy = [...state.layers];
          reordered.forEach((layer, idx) => {
            const indexInAll = layersCopy.findIndex((l) => l.id === layer.id);
            if (indexInAll !== -1) {
              layersCopy[indexInAll] = {
                ...layersCopy[indexInAll],
                order: idx,
                _dirty: !layersCopy[indexInAll]._isNew
                  ? true
                  : layersCopy[indexInAll]._dirty,
              };
            }
          });
          // Opcional: reordena el array layers en el store según el nuevo orden global
          layersCopy.sort((a, b) => a.order - b.order);
          return { layers: layersCopy };
        });
      }
      // Shapes
      if (type === "shape") {
        const sourceLayerId = source.droppableId;
        const destLayerId = destination.droppableId;
        const shapeId = draggableId;
        const sourceShapes = shapes.filter((s) => s.layerId === sourceLayerId);
        const destShapes = shapes.filter((s) => s.layerId === destLayerId);

        useCanvasStore.setState((state) => {
          let newShapes = [...state.shapes];
          const fromIdx = newShapes.findIndex(
            (s) => s.id === shapeId && s.layerId === sourceLayerId
          );
          if (fromIdx === -1) return {};
          const [moved] = newShapes.splice(fromIdx, 1);
          moved.layerId = destLayerId;
          const destIdx = newShapes.findIndex(
            (s, i) =>
              s.layerId === destLayerId &&
              destShapes[destination.index] &&
              s.id === destShapes[destination.index].id
          );
          if (destIdx === -1 || destShapes.length === 0) {
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
    },
    [layers, shapes]
  );

  // Renombrar capa o shape
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

  // ... dentro del componente LayersPanel

  const handleSetActiveLayer = (layerId) => {
    if (!layerId) {
      toast("Selecciona una capa para continuar", {
        icon: "ℹ️",
        duration: 3000,
      });
      return;
    }
    setActiveLayer(layerId);
  };

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
      <aside className="w-full bg-slate-900/95 text-white shadow-2xl p-4 rounded-2xl border border-blue-900 backdrop-blur-lg text-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers size={20} />
            Capas
          </h2>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <button
                onClick={() => addLayer()}
                title="Agregar capa"
                className="text-green-400 hover:text-green-300"
              >
                <PlusCircle size={22} />
              </button>
            )}
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
          style={{ maxHeight: isMobile ? "70dvh" : "75dvh" }}
        >
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="LAYERS-DND" type="layer">
              {(provided) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={classNames("space-y-4", { "space-y-2": isMobile })}
                >
                  {layers
                    .filter((l) => !l._toDelete)
                    .map((layer, idx) => {
                      const isActive = layer.id === activeLayerId;
                      const objects = shapes.filter(
                        (s) => s.layerId === layer.id && !s._toDelete
                      );
                      const isOpen = isLayerOpen(layer.id);

                      return (
                        <LayerItem
                          key={layer.id}
                          layer={layer}
                          idx={idx}
                          isEditMode={isEditMode}
                          isActive={isActive}
                          isOpen={isOpen}
                          objects={objects}
                          layers={layers}
                          selectedShapeIds={selectedShapeIds}
                          setActiveLayer={handleSetActiveLayer}
                          setEditingId={setEditingId}
                          editingId={editingId}
                          editingValue={editingValue}
                          setEditingValue={setEditingValue}
                          handleRenameLayer={handleRenameLayer}
                          moveLayerUp={moveLayerUp}
                          moveLayerDown={moveLayerDown}
                          toggleLayerVisibility={toggleLayerVisibility}
                          toggleLayerLock={toggleLayerLock}
                          setLayerOpacity={setLayerOpacity}
                          toggleLayerOpen={toggleLayerOpen}
                          setSelectedShape={setSelectedShape}
                          toggleShapeVisibility={toggleShapeVisibility}
                          removeShape={removeShape}
                          handleRenameShape={handleRenameShape}
                          onRequestDelete={() =>
                            setConfirmDeleteLayerId(layer.id)
                          }
                        />
                      );
                    })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </aside>
      <ModalWrapper
        isOpen={!!confirmDeleteLayerId}
        onClose={() => setConfirmDeleteLayerId(null)}
        title="Eliminar capa"
      >
        <p className="mb-3">
          ¿Seguro que deseas eliminar esta capa y todos sus elementos?
        </p>
        <div className="flex gap-3 justify-end mt-6">
          <button
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setConfirmDeleteLayerId(null)}
          >
            Cancelar
          </button>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              removeLayer(confirmDeleteLayerId);
              setConfirmDeleteLayerId(null);
            }}
          >
            Eliminar
          </button>
        </div>
      </ModalWrapper>
    </div>
  );
}
