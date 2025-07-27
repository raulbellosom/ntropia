// src/components/Workspace/WorkspaceControlsBar.jsx
import {
  LogOut,
  Eye,
  Pencil,
  Save,
  Undo2,
  XCircle,
  Lock,
  Undo,
  Redo,
  Settings,
} from "lucide-react";
import classNames from "classnames";
import { useCanvasStore } from "../../store/useCanvasStore";
import SettingsMenuModal from "../Canvas/SettingsMenuModal";
import { useState } from "react";

export default function WorkspaceControlsBar({
  mode,
  onToggleMode,
  onSave,
  onDiscard,
  onExit,
  userRole, // Nuevo prop para el rol del usuario
  isOwner = false, // Nuevo prop para indicar si es el propietario del workspace
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Función para verificar si el usuario puede editar
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  const canEdit = () => {
    const editableRoles = ["admin", "editor", "owner"];
    return editableRoles.includes(userRole?.toLowerCase()) || isOwner;
  };

  // Función para verificar si puede cambiar entre modos
  const canToggleToEdit = () => {
    // Permite cambiar a edición solo si tiene permisos, pero siempre permite salir de edición
    return (canEdit() && mode !== "edit") || mode === "edit";
  };
  // Mensaje de tooltip según los permisos
  const getToggleTooltip = () => {
    if (!canEdit()) {
      return "No tienes permisos de edición";
    }
    return `Cambiar a modo ${mode === "edit" ? "visualización" : "edición"}`;
  };

  return (
    <>
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

        {/* Indicador de rol (opcional) */}
        {userRole && (
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-blue-700/50 text-white text-xs">
            <span className="capitalize">{userRole}</span>
            {!canEdit() && <Lock size={12} />}
          </div>
        )}

        {/* Espaciador */}
        <div className="flex-1" />

        {/* Controles alineados a la derecha */}
        <div className="flex items-center gap-1">
          {/* Toggle modo */}
          <button
            onClick={canToggleToEdit() ? onToggleMode : undefined}
            disabled={!canEdit() && mode === "view"}
            className={classNames(
              "flex items-center gap-1 px-3 py-2 rounded-lg text-white transition font-medium",
              canEdit() ? "hover:bg-blue-700" : "opacity-50 cursor-not-allowed",
              mode === "edit" ? "bg-blue-500/90" : "",
              !canEdit() && mode === "view" ? "bg-red-500/30" : ""
            )}
            title={getToggleTooltip()}
            style={{ minWidth: 38, minHeight: 38 }}
          >
            {!canEdit() && mode === "view" ? (
              <Lock size={18} />
            ) : mode === "edit" ? (
              <Pencil size={18} />
            ) : (
              <Eye size={18} />
            )}
            <span className="hidden md:inline">
              {!canEdit() && mode === "view"
                ? "Solo lectura"
                : mode === "edit"
                ? "Edición"
                : "Visualización"}
            </span>
          </button>

          {mode === "edit" && canEdit() && (
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
            </>
          )}
          <button
            className="p-2 rounded text-white hover:bg-blue-500/90 transition-colors duration-200"
            title="Configuración del lienzo"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
      <SettingsMenuModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
