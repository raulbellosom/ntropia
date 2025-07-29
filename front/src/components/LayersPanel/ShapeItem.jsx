// src/components/LayersPanel/ShapeItem.jsx
import React from "react";
import { Eye, EyeOff, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import classNames from "classnames";
import { Draggable } from "@hello-pangea/dnd";
import { useCanvasStore } from "../../store/useCanvasStore";
import { useDeleteShape, useUpdateShape } from "../../hooks/useShapes";

export default function ShapeItem({
  obj,
  idx,
  layerLocked,
  selectedShapeIds,
  setSelectedShape,
  toggleShapeVisibility,
  editingId,
  setEditingId,
  editingValue,
  setEditingValue,
  handleRenameShape: _, // we'll override
  objects,
  isEditMode,
  setActiveLayer,
}) {
  const deleteShape = useDeleteShape();
  const updateShape = useUpdateShape();

  const removeLocalShape = useCanvasStore((s) => s.removeShape);
  const renameLocalShape = useCanvasStore((s) => s.renameShape);

  // Handle delete (optimistic + server)
  const onDelete = (e) => {
    e.stopPropagation();
    removeLocalShape(obj.id);
    deleteShape.mutate(obj.id);
  };

  // Handle rename
  const onRename = () => {
    if (editingValue.trim()) {
      renameLocalShape(obj.id, editingValue.trim());
      updateShape.mutate({
        id: obj.id,
        data: { name: editingValue.trim() },
      });
    }
    setEditingId(null);
    setEditingValue("");
  };

  // Handle reorder forward/back
  const onBringForward = () => {
    // Obtener shapes ANTES del update optimista
    const shapes = useCanvasStore.getState().shapes;
    const layerShapes = shapes.filter(
      (s) => s.layerId === obj.layerId && !s._toDelete
    );
    const currentIndex = layerShapes.findIndex((s) => s.id === obj.id);

    if (currentIndex < layerShapes.length - 1) {
      const currentShape = layerShapes[currentIndex];
      const nextShape = layerShapes[currentIndex + 1];

      // Optimistic update
      useCanvasStore.getState().bringShapeForward(obj.id);

      // Persistir ambas shapes con toda la información
      updateShape.mutate({
        id: currentShape.id,
        data: {
          name: currentShape.name,
          type: currentShape.type,
          order: currentIndex + 1,
          layer_id: currentShape.layerId,
          workspace_id: currentShape.workspace_id,
          data: currentShape.props,
          visible: currentShape.visible,
        },
      });

      updateShape.mutate({
        id: nextShape.id,
        data: {
          name: nextShape.name,
          type: nextShape.type,
          order: currentIndex,
          layer_id: nextShape.layerId,
          workspace_id: nextShape.workspace_id,
          data: nextShape.props,
          visible: nextShape.visible,
        },
      });
    }
  };

  const onSendBackward = () => {
    // Obtener shapes ANTES del update optimista
    const shapes = useCanvasStore.getState().shapes;
    const layerShapes = shapes.filter(
      (s) => s.layerId === obj.layerId && !s._toDelete
    );
    const currentIndex = layerShapes.findIndex((s) => s.id === obj.id);

    if (currentIndex > 0) {
      const currentShape = layerShapes[currentIndex];
      const prevShape = layerShapes[currentIndex - 1];

      // Optimistic update
      useCanvasStore.getState().sendShapeBackward(obj.id);

      // Persistir ambas shapes con toda la información
      updateShape.mutate({
        id: currentShape.id,
        data: {
          name: currentShape.name,
          type: currentShape.type,
          order: currentIndex - 1,
          layer_id: currentShape.layerId,
          workspace_id: currentShape.workspace_id,
          data: currentShape.props,
          visible: currentShape.visible,
        },
      });

      updateShape.mutate({
        id: prevShape.id,
        data: {
          name: prevShape.name,
          type: prevShape.type,
          order: currentIndex,
          layer_id: prevShape.layerId,
          workspace_id: prevShape.workspace_id,
          data: prevShape.props,
          visible: prevShape.visible,
        },
      });
    }
  };

  return (
    <Draggable
      draggableId={`shape-${obj.id}`} // 👈 Asegúrate que sea string y único
      isDragDisabled={!isEditMode || layerLocked}
      index={idx}
    >
      {(objProvided) => (
        <li
          ref={objProvided.innerRef}
          {...objProvided.draggableProps}
          {...objProvided.dragHandleProps}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedShape(obj.id);
            setActiveLayer(obj.layerId);
          }}
          className={classNames(
            "flex items-center group rounded px-2 py-1 transition",
            {
              "bg-blue-600 text-white font-bold shadow":
                selectedShapeIds.includes(obj.id),
              "hover:bg-blue-800": !selectedShapeIds.includes(obj.id),
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
              {obj.visible !== false ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <span
              className="text-xs truncate"
              onDoubleClick={
                isEditMode
                  ? (e) => {
                      e.stopPropagation();
                      setEditingId(obj.id);
                      setEditingValue(
                        obj.name || obj.type || obj.id.slice(0, 8)
                      );
                    }
                  : undefined
              }
              onTouchStart={
                isEditMode
                  ? (e) => {
                      let timeout = setTimeout(() => {
                        setEditingId(obj.id);
                        setEditingValue(
                          obj.name || obj.type || obj.id.slice(0, 8)
                        );
                      }, 500);
                      e.target.ontouchend = () => clearTimeout(timeout);
                      e.target.ontouchmove = () => clearTimeout(timeout);
                    }
                  : undefined
              }
            >
              {editingId === obj.id ? (
                <input
                  autoFocus
                  value={editingValue}
                  onChange={
                    isEditMode
                      ? (e) => setEditingValue(e.target.value)
                      : undefined
                  }
                  onBlur={isEditMode ? onRename : undefined}
                  onKeyDown={
                    isEditMode
                      ? (e) => {
                          if (e.key === "Enter") onRename();
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditingValue("");
                          }
                        }
                      : undefined
                  }
                  className="px-2 py-1 text-xs bg-slate-800 rounded text-white w-24"
                  style={{ minWidth: 60, maxWidth: 180 }}
                />
              ) : (
                obj.name || obj.type || obj.id.slice(0, 8)
              )}
            </span>
          </div>

          {isEditMode && !layerLocked && (
            <>
              <button
                className="ml-2 text-blue-300 hover:text-blue-500 p-1 rounded disabled:opacity-30"
                title="Subir"
                onClick={onBringForward}
                disabled={idx === objects.length - 1}
              >
                <ChevronDown size={18} />
              </button>
              <button
                className="ml-1 text-blue-300 hover:text-blue-500 p-1 rounded disabled:opacity-30"
                title="Bajar"
                onClick={onSendBackward}
                disabled={idx === 0}
              >
                <ChevronUp size={18} />
              </button>
              <button
                className="ml-2 text-red-400 hover:text-red-600"
                title="Eliminar elemento"
                onClick={onDelete}
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </li>
      )}
    </Draggable>
  );
}
