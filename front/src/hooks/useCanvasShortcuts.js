// src/hooks/useCanvasShortcuts.js
import { useEffect } from "react";
import { useCanvasStore } from "../store/useCanvasStore";

export default function useCanvasShortcuts({
  autoEditTextId,
  setAutoEditTextId,
  selectedShapeId,
  selectedShapeIds,
  clearSelection,
  copyShape,
  pasteShape,
  toggleGrid,
  toggleLayersPanel,
  removeSelectedShapes,
  tool,
}) {
  const mode = useCanvasStore((s) => s.mode);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // --- IGNORA shortcuts si el foco está en input, textarea, select o contentEditable ---
      const tag = e.target.tagName?.toUpperCase();
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        e.target.isContentEditable ||
        autoEditTextId !== null
      ) {
        return;
      }

      // Eliminar figuras seleccionadas (solo en edit)
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        tool === "select" &&
        mode === "edit"
      ) {
        if (selectedShapeIds.length > 0) {
          removeSelectedShapes();
        }
        return;
      }

      // Atajos con Ctrl/Meta (Cmd en Mac) (solo en edit)
      if (mode === "edit" && (e.ctrlKey || e.metaKey)) {
        if (e.key.toLowerCase() === "c" && selectedShapeId) {
          e.preventDefault();
          copyShape(selectedShapeId);
          return;
        }
        if (e.key.toLowerCase() === "v") {
          e.preventDefault();
          pasteShape();
          return;
        }
        return;
      }

      // Toggle Layers Panel (Shift + L) (solo en edit)
      if (mode === "edit" && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLayersPanel();
        useCanvasStore.getState().setTool("select");
        return;
      }

      // Shortcuts de herramienta rápida (sin Ctrl)
      if (e.key === "h") {
        // Hand se permite SIEMPRE
        useCanvasStore.getState().setTool("hand");
        return;
      }

      // Otras herramientas SOLO en modo edit
      if (mode !== "edit") return;

      switch (e.key) {
        case "a":
          useCanvasStore.getState().setTool("arrow");
          break;
        case "v":
          useCanvasStore.getState().setTool("select");
          break;
        case "r":
          useCanvasStore.getState().setTool("rect");
          break;
        case "c":
          useCanvasStore.getState().setTool("circle");
          break;
        case "l":
          useCanvasStore.getState().setTool("line");
          break;
        case "f":
          useCanvasStore.getState().setTool("free");
          break;
        case "t":
          useCanvasStore.getState().setTool("text");
          break;
        case "i":
          useCanvasStore.getState().setTool("image");
          break;
        case "m":
          useCanvasStore.getState().setTool("marker");
          break;
        case "Escape":
          if (autoEditTextId) {
            setAutoEditTextId(null);
          } else if (selectedShapeIds.length > 0) {
            clearSelection();
          }
          break;
        case "g":
          toggleGrid();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    autoEditTextId,
    setAutoEditTextId,
    selectedShapeId,
    selectedShapeIds,
    clearSelection,
    copyShape,
    pasteShape,
    toggleGrid,
    toggleLayersPanel,
    removeSelectedShapes,
    tool,
    mode,
  ]);
}
