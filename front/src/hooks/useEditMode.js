// front/src/hooks/useEditMode.js
import { useCanvasStore } from "../store/useCanvasStore";

export function useEditMode() {
  const mode = useCanvasStore((s) => s.mode);

  return {
    isEditMode: mode === "edit",
    isViewMode: mode === "view",
    mode,
  };
}
