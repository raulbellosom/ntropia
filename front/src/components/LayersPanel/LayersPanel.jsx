// src/components/LayersPanel/LayersPanel.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCanvasStore } from "../../store/useCanvasStore";
import {
  useCreateLayer,
  useUpdateLayer,
  useDeleteLayer,
} from "../../hooks/useLayers";
import { useUpdateShape } from "../../hooks/useShapes";
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
  const { id: workspaceId } = useParams();

  // Estado UI local para renombrar y confirmar borrado
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [confirmDeleteLayerId, setConfirmDeleteLayerId] = useState(null);

  // Store selectors y acciones
  const layers = useCanvasStore((s) => s.layers);
  const shapes = useCanvasStore((s) => s.shapes);
  const _lastLayerUpdate = useCanvasStore((s) => s._lastLayerUpdate);

  // Debug: Log cuando las layers cambian (usar useEffect para evitar logs en cada render)
  useEffect(() => {
    // También mostrar el orden después del filtro Y ordenamiento
    const processedLayers = layers
      .filter((l) => !l._toDelete && l.id)
      .sort((a, b) => a.order - b.order);
    processedLayers.forEach((l, idx) => {});
  }, [layers]);

  const activeLayerId = useCanvasStore((s) => s.activeLayerId);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const removeLayerLocal = useCanvasStore((s) => s.removeLayer);
  const moveLayerUp = useCanvasStore((s) => s.moveLayerUp);
  const moveLayerDown = useCanvasStore((s) => s.moveLayerDown);
  const toggleLayerVisibility = useCanvasStore((s) => s.toggleLayerVisibility);
  const toggleLayerLock = useCanvasStore((s) => s.toggleLayerLock);
  const setLayerOpacity = useCanvasStore((s) => s.setLayerOpacity);

  const removeShapeLocal = useCanvasStore((s) => s.removeShape);
  const selectedShapeIds = useCanvasStore((s) => s.selectedShapeIds);
  const setSelectedShape = useCanvasStore((s) => s.setSelectedShape);
  const toggleShapeVisibility = useCanvasStore((s) => s.toggleShapeVisibility);

  const layersPanelVisible = useCanvasStore((s) => s.layersPanelVisible);
  const hideLayersPanel = useCanvasStore((s) => s.hideLayersPanel);

  // Directus mutations
  const createLayer = useCreateLayer();
  const updateLayer = useUpdateLayer();
  const deleteLayer = useDeleteLayer();
  const updateShape = useUpdateShape();

  // Otros hooks y flags
  const { isEditMode } = useEditMode();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const { toggleLayerOpen, isLayerOpen } = useOpenLayers();

  // ─── Handlers ────────────────────────────────────────────

  const handleSetActiveLayer = (layerId) => {
    if (!layerId) {
      toast("Selecciona una capa primero", { icon: "ℹ️", duration: 2000 });
      return;
    }
    setActiveLayer(layerId);
  };

  const handleAddLayer = () => {
    const visibleCount = layers.filter((l) => !l._toDelete).length;
    createLayer.mutate(
      {
        name: `Capa ${visibleCount + 1}`,
        order: visibleCount,
        visible: true,
        locked: false,
        workspace_id: workspaceId,
      },
      {
        onError: () => toast.error("Error al crear capa"),
      }
    );
  };

  const handleRenameLayer = (layerId) => {
    const newName = editingValue.trim();
    if (newName) {
      // 🚀 SOLO servidor - Sin updates locales
      updateLayer.mutate(
        { id: layerId, data: { name: newName } },
        {
          onError: () => toast.error("Error renombrando capa"),
        }
      );
    }
    setEditingId(null);
    setEditingValue("");
  };

  const handleConfirmDelete = (layerId) => {
    removeLayerLocal(layerId);
    deleteLayer.mutate(layerId, {
      onError: () => toast.error("Error eliminando capa"),
    });
    setConfirmDeleteLayerId(null);
  };

  const handleRenameShape = (shapeId) => {
    const newName = editingValue.trim();
    if (newName) {
      // 🚀 SOLO servidor - Sin updates locales
      updateShape.mutate(
        { id: shapeId, data: { name: newName } },
        {
          onError: () => toast.error("Error renombrando shape"),
        }
      );
    }
    setEditingId(null);
    setEditingValue("");
  };

  const onDragEnd = useCallback(
    (result) => {
      const { destination, source, type, draggableId } = result;
      if (!destination) return;

      // ── Reordenar capas ─────────────────────────────────────────
      if (type === "layer") {
        const visible = layers.filter((l) => !l._toDelete);
        if (source.index === destination.index) return;

        const movedLayer = visible[source.index];
        const targetLayer = visible[destination.index];

        // 🚀 SOLO servidor - Sin updates locales
        const updateBothLayers = async () => {
          try {
            await updateLayer.mutateAsync({
              id: movedLayer.id,
              data: {
                name: movedLayer.name,
                order: destination.index,
                visible: movedLayer.visible,
                locked: movedLayer.locked,
                opacity: movedLayer.opacity,
                workspace_id: movedLayer.workspace_id,
              },
            });
            await updateLayer.mutateAsync({
              id: targetLayer.id,
              data: {
                name: targetLayer.name,
                order: source.index,
                visible: targetLayer.visible,
                locked: targetLayer.locked,
                opacity: targetLayer.opacity,
                workspace_id: targetLayer.workspace_id,
              },
            });
          } catch (error) {
            toast.error("Error reordenando capa");
            console.error("Error reordering layers:", error);
          }
        };
        updateBothLayers();
      }

      // ── Mover shapes entre capas ──────────────────────────────────
      if (type === "shape") {
        const sourceLayerId = source.droppableId;
        const destLayerId = destination.droppableId;
        const shapeId = draggableId.replace("shape-", ""); // 👈 Remover prefijo

        // 🚀 SOLO servidor - Sin updates locales
        const movedShape = useCanvasStore
          .getState()
          .shapes.find((s) => s.id === shapeId);
        if (movedShape) {
          updateShape.mutate(
            {
              id: shapeId,
              data: {
                name: movedShape.name,
                type: movedShape.type,
                order: destination.index,
                layer_id: destLayerId,
                workspace_id: movedShape.workspace_id,
                data: movedShape.props,
                visible: movedShape.visible,
              },
            },
            {
              onError: () => toast.error("Error moviendo shape entre capas"),
            }
          );
        }
      }
    },
    [layers, updateLayer, updateShape]
  );

  // ─── Render ────────────────────────────────────────────────
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers size={20} /> Capas
          </h2>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <button
                onClick={handleAddLayer}
                title="Agregar capa"
                className="text-green-400 hover:text-green-300"
              >
                <PlusCircle size={22} />
              </button>
            )}
            <button
              onClick={hideLayersPanel}
              title="Cerrar panel"
              className="ml-2 text-slate-400 hover:text-red-500 p-1 rounded transition"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Lista de capas */}
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
                    .filter((l) => !l._toDelete && l.id) // 👈 Filtrar primero
                    .sort((a, b) => a.order - b.order) // 👈 ORDENAR por field order
                    .map((layer, idx) => {
                      const objects = shapes.filter(
                        (s) => s.layerId === layer.id && !s._toDelete && s.id // 👈 También filtrar shapes sin id
                      );
                      return (
                        <LayerItem
                          key={`layer-${layer.id}-${layer.name}-${
                            layer.order
                          }-${_lastLayerUpdate || 0}`} // 👈 Clave única que incluye timestamp
                          layer={layer}
                          idx={idx}
                          isEditMode={isEditMode}
                          isActive={layer.id === activeLayerId}
                          isOpen={isLayerOpen(layer.id)}
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
                          removeShape={removeShapeLocal}
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

        {/* Modal confirmación de borrado */}
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
              onClick={() => handleConfirmDelete(confirmDeleteLayerId)}
            >
              Eliminar
            </button>
          </div>
        </ModalWrapper>
      </aside>
    </div>
  );
}
