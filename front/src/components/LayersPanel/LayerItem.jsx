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

  return (
    <Draggable
      draggableId={layer.id}
      isDragDisabled={!isEditMode || layerLocked}
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
                  onBlur={
                    isEditMode ? () => handleRenameLayer(layer.id) : undefined
                  }
                  onKeyDown={
                    isEditMode
                      ? (e) => {
                          if (e.key === "Enter") handleRenameLayer(layer.id);
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditingValue("");
                          }
                        }
                      : undefined
                  }
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
                  toggleLayerVisibility(layer.id);
                }}
              >
                {layer.visible ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
              {isEditMode && (
                <button
                  className="hover:text-blue-300 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerLock(layer.id);
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
          {/* Opacidad SIEMPRE DISPONIBLE */}
          <div className="mt-3 flex flex-col gap-2 text-xs opacity-80">
            <div className="flex items-center justify-between flex-1">
              <span>Opacidad</span>
              <span>
                {layer.opacity ? Math.round(layer.opacity * 100) : 100}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={layer.opacity ? layer.opacity * 100 : 100}
                onChange={(e) =>
                  setLayerOpacity(layer.id, Number(e.target.value) / 100)
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
                  {objects.map((obj, idx) => (
                    <ShapeItem
                      key={obj.id}
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
