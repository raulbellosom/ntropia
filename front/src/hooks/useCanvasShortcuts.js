// src/hooks/useCanvasShortcuts.js
import { useEffect } from "react";
import { useCanvasStore } from "../store/useCanvasStore";

// Opcional: si quieres más legibilidad, puedes pasar los deps como argumento
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
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Si estamos en un input, contentEditable, o editando texto, ignorar atajos
      if (
        e.target.tagName === "INPUT" ||
        e.target.isContentEditable ||
        autoEditTextId !== null
      ) {
        return;
      }

      // Eliminar figuras seleccionadas
      if ((e.key === "Delete" || e.key === "Backspace") && tool === "select") {
        if (selectedShapeIds.length > 0) {
          removeSelectedShapes();
        }
        return;
      }

      // Atajos con Ctrl/Meta (Cmd en Mac)
      if (e.ctrlKey || e.metaKey) {
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

      // Toggle Layers Panel (Shift + L)
      if (e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLayersPanel();
        useCanvasStore.getState().setTool("select");
        return;
      }

      // Shortcuts de herramienta rápida (sin Ctrl)
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
        case "h":
          useCanvasStore.getState().setTool("hand");
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
  ]);
}
