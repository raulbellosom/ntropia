// src/hooks/useValidActiveLayer.js

import { useCanvasStore } from "../store/useCanvasStore";

/**
 * Devuelve la capa activa SÓLO si realmente existe y está visible.
 * Si no, retorna null.
 */
export default function useValidActiveLayer() {
  const activeLayerId = useCanvasStore((s) => s.activeLayerId);
  const layers = useCanvasStore((s) => s.layers);
  // Busca si existe y está visible
  return layers.find((l) => l.id === activeLayerId) || null;
}
