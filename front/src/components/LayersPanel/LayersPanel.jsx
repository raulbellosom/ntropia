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
} from "lucide-react";
import classNames from "classnames";
import { useMediaQuery } from "react-responsive";

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
  // TODOS LOS HOOKS ANTES DE CUALQUIER RETURN!
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
  const selectedShapeId = useCanvasStore((state) => state.selectedShapeId);
  const setSelectedShape = useCanvasStore((state) => state.setSelectedShape);
  const toggleShapeVisibility = useCanvasStore(
    (state) => state.toggleShapeVisibility
  );

  const layersPanelVisible = useCanvasStore((s) => s.layersPanelVisible);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const { toggleLayerOpen, isLayerOpen } = useOpenLayers();

  return (
    <div
      className={classNames(
        "fixed z-50 top-4 left-24 md:left-4 transition-all duration-300",
        {
          "pointer-events-none opacity-0 -translate-x-8": !layersPanelVisible,
          "pointer-events-auto opacity-100 translate-x-0": layersPanelVisible,
        }
      )}
      style={{
        width: isMobile ? "90vw" : "20rem",
        minWidth: isMobile ? 220 : 260,
        maxWidth: 400,
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
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "87dvh" }}>
          <ul className="space-y-4">
            {layers.map((layer, idx) => {
              const isActive = layer.id === activeLayerId;
              const objects = shapes.filter((s) => s.layerId === layer.id);
              const isOpen = isLayerOpen(layer.id);

              return (
                <li
                  key={layer.id}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium truncate">
                        {layer.name}
                      </span>
                      {isActive && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500 text-xs rounded-full font-bold text-white shadow-sm">
                          Activa
                        </span>
                      )}
                    </div>
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
                  {isOpen && objects.length > 0 && (
                    <ul className="ml-7 mt-2 space-y-1">
                      {objects.map((obj, idx) => (
                        <li
                          key={obj.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedShape(obj.id);
                          }}
                          className={classNames(
                            "flex items-center group hover:bg-slate-700/50 rounded px-2 py-1 transition",
                            {
                              "bg-blue-600 text-white font-bold shadow":
                                selectedShapeId === obj.id,
                              "hover:bg-slate-800": selectedShapeId !== obj.id,
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
                            <button
                              className={classNames(
                                "px-3 py-0.5 rounded text-xs truncate transition"
                              )}
                              title={obj.name || obj.type || obj.id}
                            >
                              {obj.name || obj.type || obj.id.slice(0, 8)}
                            </button>
                          </div>
                          {/* Subir */}
                          <button
                            className="ml-2 text-blue-300 hover:text-blue-500 p-1 rounded disabled:opacity-30"
                            title="Subir"
                            onClick={() =>
                              useCanvasStore
                                .getState()
                                .bringShapeForward(obj.id)
                            }
                            disabled={idx === objects.length - 1}
                          >
                            <ChevronDown size={18} />
                          </button>
                          {/* Bajar */}
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
                          {/* Traer al frente */}

                          {/* Eliminar */}
                          <button
                            className="ml-2 text-red-400 hover:text-red-600"
                            title="Eliminar elemento"
                            onClick={() => removeShape(obj.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
