// src/components/LayersPanel/ShapeItem.jsx
import React, { useMemo } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Crosshair,
} from "lucide-react";
import classNames from "classnames";
import { Draggable } from "@hello-pangea/dnd";
import { useCanvasStore } from "../../store/useCanvasStore";
import { useDeleteShape, useUpdateShape } from "../../hooks/useShapes";

export default function ShapeItem({
  obj,
  idx, // index visual provisto por el contenedor (lo dejamos para Draggable)
  layerLocked,
  selectedShapeIds,
  setSelectedShape,
  toggleShapeVisibility,
  editingId,
  setEditingId,
  editingValue,
  setEditingValue,
  handleRenameShape: _, // override intencional
  objects, // viene desde el padre (no lo usamos para la lógica de order)
  isEditMode,
  setActiveLayer,
}) {
  const deleteShape = useDeleteShape();
  const updateShape = useUpdateShape();

  const removeLocalShape = useCanvasStore((s) => s.removeShape);
  const renameLocalShape = useCanvasStore((s) => s.renameShape);

  // Suscripción a las shapes para calcular estado (evita usar getState en render)
  const allShapes = useCanvasStore((s) => s.shapes);

  // Lista de la MISMA capa, ordenadas por 'order' real (asc: back→front)
  const sameLayerOrdered = useMemo(() => {
    return allShapes
      .filter((s) => s.layerId === obj.layerId && !s._toDelete)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [allShapes, obj.layerId]);

  // Posición del objeto actual dentro del orden real
  const realIndex = useMemo(
    () => sameLayerOrdered.findIndex((s) => s.id === obj.id),
    [sameLayerOrdered, obj.id]
  );

  // En este orden: el último elemento es el "más al frente"
  const isAtFront = realIndex === sameLayerOrdered.length - 1;
  const isAtBack = realIndex === 0;

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

  // Handle shape lock/unlock
  const onToggleLock = (e) => {
    e.stopPropagation();
    updateShape.mutate({
      id: obj.id,
      data: {
        name: obj.name,
        type: obj.type,
        order: obj.order,
        layer_id: obj.layerId,
        workspace_id: obj.workspace_id,
        data: obj.props,
        visible: obj.visible,
        locked: !obj.locked,
      },
    });
  };

  /**
   * Mueve la shape una posición arriba/abajo según su 'order' real.
   * - direction: 'up' (al frente) | 'down' (al fondo)
   * - Optimista local: usa bringShapeForward/sendShapeBackward del store
   * - Persistencia: 2 updates cruzados (swap de orders)
   */
  const handleMove = (direction /* 'up' | 'down' */) => {
    const store = useCanvasStore.getState();

    // Recalcular desde el estado actual por si hubo cambios justo antes
    const layerShapesOrdered = store.shapes
      .filter((s) => s.layerId === obj.layerId && !s._toDelete)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // back→front

    const i = layerShapesOrdered.findIndex((s) => s.id === obj.id);
    if (i === -1) return;

    const neighbor =
      direction === "up"
        ? layerShapesOrdered[i + 1]
        : layerShapesOrdered[i - 1];

    if (!neighbor) return;

    // Guardar orders actuales ANTES del swap optimista
    const currentOrder = obj.order ?? 0;
    const neighborOrder = neighbor.order ?? 0;

    // 1) Optimista local en Zustand (esto redibuja panel + canvas al instante)
    if (direction === "up") {
      store.bringShapeForward(obj.id);
    } else {
      store.sendShapeBackward(obj.id);
    }

    // 2) Persistir ambos con swap cruzado
    //    Nota: enviamos todos los campos que ya mandas normalmente
    updateShape.mutate({
      id: obj.id,
      data: {
        name: obj.name,
        type: obj.type,
        order: neighborOrder,
        layer_id: obj.layerId,
        workspace_id: obj.workspace_id,
        data: obj.props,
        visible: obj.visible,
      },
    });

    updateShape.mutate({
      id: neighbor.id,
      data: {
        name: neighbor.name,
        type: neighbor.type,
        order: currentOrder,
        layer_id: neighbor.layerId,
        workspace_id: neighbor.workspace_id,
        data: neighbor.props,
        visible: neighbor.visible,
      },
    });
  };

  // Handlers para los botones de reordenamiento (una unidad)
  const onBringForward = (e) => {
    e.stopPropagation();
    if (!isAtFront) handleMove("up");
  };
  const onSendBackward = (e) => {
    e.stopPropagation();
    if (!isAtBack) handleMove("down");
  };

  return (
    <Draggable
      draggableId={`shape-${obj.id}`} // debe ser string único
      isDragDisabled={!isEditMode || layerLocked || obj.locked}
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
          <div className="flex-1 flex items-center gap-1 truncate">
            <button
              className="hover:text-blue-900 p-1 hover:bg-white/30 rounded-md transition"
              onClick={(e) => {
                e.stopPropagation();
                toggleShapeVisibility(obj.id);
              }}
              title={obj.visible !== false ? "Ocultar" : "Mostrar"}
            >
              {obj.visible !== false ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>

            <button
              className="text-blue-300 hover:text-blue-900 p-1 hover:bg-white/30 rounded-md transition-colors"
              title="Ubicar shape"
              onClick={(e) => {
                e.stopPropagation();
                useCanvasStore
                  .getState()
                  .focusShape(obj.id, { animateMs: 240 });
              }}
            >
              <Crosshair size={15} />
            </button>

            {isEditMode && (
              <button
                className="hover:text-blue-900 p-1 hover:bg-white/30 rounded-md transition"
                onClick={onToggleLock}
                title={obj.locked ? "Desbloquear objeto" : "Bloquear objeto"}
              >
                {obj.locked ? <Lock size={15} /> : <Unlock size={15} />}
              </button>
            )}

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
                      // long-press para editar en móvil
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
                className={classNames(
                  "ml-2 text-blue-300 hover:text-blue-900 p-1 hover:bg-white/30 rounded-md disabled:opacity-30 transition-colors",
                  { "cursor-not-allowed": isAtFront }
                )}
                title={isAtFront ? "Ya está al frente" : "Subir (una posición)"}
                onClick={onBringForward}
                disabled={isAtFront}
              >
                <ChevronUp size={16} />
              </button>

              <button
                className={classNames(
                  "ml-1 text-blue-300 hover:text-blue-900 p-1 hover:bg-white/30 rounded-md disabled:opacity-30 transition-colors",
                  { "cursor-not-allowed": isAtBack }
                )}
                title={isAtBack ? "Ya está atrás" : "Bajar (una posición)"}
                onClick={onSendBackward}
                disabled={isAtBack}
              >
                <ChevronDown size={16} />
              </button>

              <button
                className="ml-2 text-red-400 hover:text-red-600 p-1 hover:bg-white/30 rounded-md"
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
