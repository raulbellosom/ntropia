// src/hooks/useOpenLayers.js
import { useState, useCallback } from "react";

export default function useOpenLayers() {
  const [openLayers, setOpenLayers] = useState([]);
  const toggleLayerOpen = useCallback((layerId) => {
    setOpenLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId]
    );
  }, []);
  const isLayerOpen = useCallback(
    (layerId) => openLayers.includes(layerId),
    [openLayers]
  );
  return { openLayers, toggleLayerOpen, isLayerOpen };
}
