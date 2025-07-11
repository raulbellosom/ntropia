// src/hooks/useZoomPan.js
import { useEffect } from "react";

/**
 * Hook para manejar zoom con rueda y pan con drag en el Stage de Konva.
 * @param {Object} stageRef - Ref al Stage de Konva
 * @param {Object} params
 * @param {number} params.zoom - Valor actual del zoom
 * @param {function} params.setZoom - Setter para actualizar zoom
 * @param {{x:number,y:number}} params.pan - Posición actual de pan
 * @param {function} params.setPan - Setter para actualizar pan
 * @param {string} params.tool - Herramienta activa ("select", "hand", etc.)
 */
export default function useZoomPan(
  stageRef,
  { zoom, setZoom, pan, setPan, tool }
) {
  // Zoom con la rueda en cualquier modo
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (e) => {
      e.evt.preventDefault();
      const scaleBy = 1.02;
      const oldScale = zoom;
      const pointer = stage.getPointerPosition();

      // Punto fijo bajo el cursor
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Cálculo de la nueva escala
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      setZoom(newScale);

      // Ajuste de pan para mantener el punto
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      setPan(newPos);
    };

    stage.on("wheel", handleWheel);
    return () => {
      stage.off("wheel", handleWheel);
    };
  }, [zoom, setZoom, setPan, stageRef]);

  // Paneo con drag **solo** en modo 'hand'
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Activar o desactivar draggable según la herramienta
    stage.draggable(tool === "hand");

    const handleDragEnd = () => {
      // Solo actualizar pan si realmente estamos paneando
      if (tool === "hand") {
        setPan({ x: stage.x(), y: stage.y() });
      }
    };

    stage.on("dragend", handleDragEnd);
    return () => {
      stage.off("dragend", handleDragEnd);
    };
  }, [tool, setPan, stageRef]);
}
