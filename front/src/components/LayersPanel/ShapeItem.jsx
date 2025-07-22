// src/components/LayersPanel/ShapeItem.jsx
import React from "react";
import { Eye, EyeOff, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import classNames from "classnames";
import { Draggable } from "@hello-pangea/dnd";
import { useCanvasStore } from "../../store/useCanvasStore";

export default function ShapeItem({
  obj,
  idx,
  layerLocked,
  selectedShapeIds,
  setSelectedShape,
  toggleShapeVisibility,
  removeShape,
  editingId,
  setEditingId,
  editingValue,
  setEditingValue,
  handleRenameShape,
  objects,
  isEditMode,
  setActiveLayer,
}) {
  return (
    <Draggable
      draggableId={obj.id}
      isDragDisabled={!isEditMode || layerLocked}
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
                  onBlur={
                    isEditMode ? () => handleRenameShape(obj.id) : undefined
                  }
                  onKeyDown={
                    isEditMode
                      ? (e) => {
                          if (e.key === "Enter") handleRenameShape(obj.id);
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
          {/* Solo en modo edición los botones de reordenar y eliminar */}
          {isEditMode && !layerLocked && (
            <>
              <button
                className="ml-2 text-blue-300 hover:text-blue-500 p-1 rounded disabled:opacity-30"
                title="Subir"
                onClick={() =>
                  useCanvasStore.getState().bringShapeForward(obj.id)
                }
                disabled={idx === objects.length - 1}
              >
                <ChevronDown size={18} />
              </button>
              <button
                className="ml-1 text-blue-300 hover:text-blue-500 p-1 rounded disabled:opacity-30"
                title="Bajar"
                onClick={() =>
                  useCanvasStore.getState().sendShapeBackward(obj.id)
                }
                disabled={idx === 0}
              >
                <ChevronUp size={18} />
              </button>
              <button
                className="ml-2 text-red-400 hover:text-red-600"
                title="Eliminar elemento"
                onClick={() => removeShape(obj.id)}
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
