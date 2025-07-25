// src/components/Toolbar/ToolbarControls.jsx
import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Grid as GridIcon,
  LocateFixed,
  Undo,
  Redo,
  Layers,
  Hand as HandIcon,
} from "lucide-react";
import { useCanvasStore } from "../../store/useCanvasStore";
import classNames from "classnames";
import { useMediaQuery } from "react-responsive";

export default function ToolbarControls() {
  const {
    zoom,
    zoomIn,
    zoomOut,
    resetView,
    gridEnabled,
    toggleGrid,
    setTool,
    tool,
  } = useCanvasStore();

  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const toggleLayersPanel = useCanvasStore((s) => s.toggleLayersPanel);
  const layersPanelVisible = useCanvasStore((s) => s.layersPanelVisible);

  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <div
      className={classNames(
        "fixed z-50 right-3 bottom-3 transition-all duration-200",
        { "right-1 left-1 flex justify-center": isMobile }
      )}
    >
      <nav
        className={classNames(
          "flex items-center gap-2 overflow-x-auto p-2 bg-blue-900/50 backdrop-blur-lg rounded-xl shadow-2xl",
          { "w-auto": !isMobile }
        )}
        style={{
          maxWidth: isMobile ? "95vw" : "unset",
        }}
      >
        {/* Botón de capas */}
        <button
          onClick={() => {
            toggleLayersPanel();
            setTool("select");
          }}
          title={
            layersPanelVisible
              ? "Ocultar capas (Shift+L)"
              : "Mostrar capas (Shift+L)"
          }
          className={classNames(
            "flex-shrink-0 text-white rounded p-2  transition-colors duration-200",
            {
              "bg-blue-600": layersPanelVisible,
              " hover:bg-blue-500/90": !layersPanelVisible,
            }
          )}
        >
          <Layers size={20} />
        </button>
        <button
          onClick={() => setTool("hand")}
          title="Mover lienzo (H)"
          className={classNames(
            "p-2 rounded transition-colors duration-200 flex-shrink-0",
            {
              "bg-blue-600 text-white": tool === "hand",
              "text-white hover:bg-blue-500/90": tool !== "hand",
            }
          )}
        >
          <HandIcon size={20} />
        </button>
        <button
          onClick={undo}
          title="Deshacer (Ctrl+Z)"
          className="p-2 rounded transition-colors text-white hover:bg-blue-500/90 duration-150"
        >
          <Undo size={20} />
        </button>
        <button
          onClick={redo}
          title="Rehacer (Ctrl+Shift+Z)"
          className="p-2 rounded transition-colors text-white hover:bg-blue-500/90 duration-150"
        >
          <Redo size={20} />
        </button>
        <button
          onClick={zoomOut}
          title="Alejar"
          className="p-2 rounded transition-colors text-white hover:bg-blue-500/90 duration-150"
        >
          <ZoomOut size={20} />
        </button>
        <span className="whitespace-nowrap text-white w-12 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={zoomIn}
          title="Acercar"
          className="p-2 rounded text-white hover:bg-blue-500/90 transition-colors duration-150"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={resetView}
          title="Centrar vista"
          className="p-2 rounded text-white hover:bg-blue-500/90 transition-colors duration-150"
        >
          <LocateFixed size={20} />
        </button>
        <button
          onClick={toggleGrid}
          title="Mostrar/Ocultar cuadrícula"
          className={classNames("p-2 rounded transition-colors duration-150", {
            "bg-blue-100 text-black": gridEnabled,
            "text-white hover:bg-blue-500/90": !gridEnabled,
          })}
        >
          <GridIcon size={20} />
        </button>
      </nav>
    </div>
  );
}
