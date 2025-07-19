// src/components/Workspace/WorkspaceControlsBar.jsx
import { LogOut, Eye, Pencil, Save, Undo2, XCircle } from "lucide-react";
import classNames from "classnames";

export default function WorkspaceControlsBar({
  mode,
  onToggleMode,
  onSave,
  onDiscard,
  onExit,
}) {
  return (
    <div
      className={classNames(
        "fixed top-3 left-3  z-50 text-xs",
        "flex items-center justify-between gap-2 px-3 py-2",
        "bg-blue-900/50 backdrop-blur shadow-2xl rounded-2xl",
        "w-auto h-12",
        "transition-all duration-200"
      )}
    >
      {/* Botón salir */}
      <button
        onClick={onExit}
        className="flex items-center justify-center p-2 rounded-lg  text-white hover:bg-blue-800/80 transition"
        title="Salir"
        style={{ minWidth: 38, minHeight: 38 }}
      >
        <LogOut size={20} />
      </button>
      {/* Espaciador */}
      <div className="flex-1" />
      {/* Controles alineados a la derecha */}
      <div className="flex items-center gap-1">
        {/* Toggle modo */}
        <button
          onClick={onToggleMode}
          className={classNames(
            "flex items-center gap-1 px-3 py-2 rounded-lg text-white transition font-medium",
            "hover:bg-blue-700",
            mode === "edit" ? "bg-blue-500/90" : ""
          )}
          title={`Cambiar a modo ${
            mode === "edit" ? "visualización" : "edición"
          }`}
          style={{ minWidth: 38, minHeight: 38 }}
        >
          {mode === "edit" ? <Pencil size={18} /> : <Eye size={18} />}
          <span className="hidden md:inline">
            {mode === "edit" ? "Edición" : "Visualización"}
          </span>
        </button>
        {mode === "edit" && (
          <>
            {/* Guardar */}
            <button
              onClick={onSave}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-white transition font-medium  hover:bg-blue-700"
              title="Guardar cambios"
              style={{ minWidth: 38, minHeight: 38 }}
            >
              <Save size={18} />
              <span className="hidden md:inline">Guardar</span>
            </button>
            {/* Descartar */}
            <button
              onClick={onDiscard}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-white transition font-medium  hover:bg-blue-700"
              title="Descartar cambios"
              style={{ minWidth: 38, minHeight: 38 }}
            >
              <Undo2 size={18} />
              <span className="hidden md:inline">Descartar</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
