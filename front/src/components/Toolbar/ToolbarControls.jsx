// src/components/Toolbar/ToolbarControls.jsx
import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Grid as GridIcon,
  LocateFixed,
  Undo,
  Redo,
} from "lucide-react";
import { useCanvasStore } from "../../store/useCanvasStore";
import classNames from "classnames";
import { useMediaQuery } from "react-responsive";

export default function ToolbarControls() {
  const { zoom, zoomIn, zoomOut, resetView, gridEnabled, toggleGrid } =
    useCanvasStore();

  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <div
      className={classNames(
        "fixed z-50 right-4 bottom-4 transition-all duration-200",
        { "right-1 left-1 flex justify-center": isMobile }
      )}
    >
      <nav
        className={classNames(
          "flex items-center gap-2 p-2 bg-blue-900/70 backdrop-blur-lg rounded-xl border border-slate-500/50 shadow-2xl",
          { "w-auto": !isMobile }
        )}
        style={{
          maxWidth: isMobile ? "95vw" : "unset",
        }}
      >
        <button
          onClick={undo}
          title="Deshacer"
          className="p-2 rounded transition-colors text-white hover:bg-slate-500/90"
        >
          <Undo size={20} />
        </button>
        <button
          onClick={redo}
          title="Rehacer"
          className="p-2 rounded transition-colors text-white hover:bg-slate-500/90"
        >
          <Redo size={20} />
        </button>
        <button
          onClick={zoomOut}
          title="Alejar"
          className="p-2 rounded text-white hover:bg-slate-500/90 transition-colors duration-150"
        >
          <ZoomOut size={20} />
        </button>
        <span className="whitespace-nowrap text-white w-12 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={zoomIn}
          title="Acercar"
          className="p-2 rounded text-white hover:bg-slate-500/90 transition-colors duration-150"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={resetView}
          title="Centrar vista"
          className="p-2 rounded text-white hover:bg-slate-500/90 transition-colors duration-150"
        >
          <LocateFixed size={20} />
        </button>
        <button
          onClick={toggleGrid}
          title="Mostrar/Ocultar cuadrícula"
          className={classNames("p-2 rounded transition-colors duration-150", {
            "bg-blue-100 text-black": gridEnabled,
            "text-white hover:bg-slate-500/90": !gridEnabled,
          })}
        >
          <GridIcon size={20} />
        </button>
      </nav>
    </div>
  );
}
