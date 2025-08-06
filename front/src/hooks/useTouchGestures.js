// src/hooks/useTouchGestures.js
import { useEffect, useRef } from "react";

/**
 * Hook para manejar gestos táctiles (pinch para zoom) en dispositivos móviles
 * @param {Object} stageRef - Ref al Stage de Konva
 * @param {Object} params
 * @param {number} params.zoom - Valor actual del zoom
 * @param {function} params.setZoom - Setter para actualizar zoom
 * @param {{x:number,y:number}} params.pan - Posición actual de pan
 * @param {function} params.setPan - Setter para actualizar pan
 */
export default function useTouchGestures(
  stageRef,
  { zoom, setZoom, pan, setPan }
) {
  const lastCenterRef = useRef(null);
  const lastDistRef = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Prevenir scroll/zoom del navegador en el canvas
    const preventDefaultTouch = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Función para obtener la distancia entre dos puntos táctiles
    const getDistance = (p1, p2) => {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    // Función para obtener el centro entre dos puntos táctiles
    const getCenter = (p1, p2) => {
      return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };
    };

    const handleTouchMove = (e) => {
      e.evt.preventDefault();

      const touch1 = e.evt.touches[0];
      const touch2 = e.evt.touches[1];

      // Solo procesar si hay exactamente 2 toques (pinch gesture)
      if (e.evt.touches.length === 2 && touch1 && touch2) {
        const point1 = {
          x: touch1.clientX,
          y: touch1.clientY,
        };
        const point2 = {
          x: touch2.clientX,
          y: touch2.clientY,
        };

        const dist = getDistance(point1, point2);
        const center = getCenter(point1, point2);

        if (lastDistRef.current > 0) {
          // Calcular el factor de zoom basado en el cambio de distancia
          const deltaScale = dist / lastDistRef.current;

          // Limitar el factor de cambio para evitar zoom muy brusco
          const scaleBy = Math.max(0.95, Math.min(1.05, deltaScale));

          const oldScale = zoom;
          let newScale = oldScale * scaleBy;

          // Limitar el zoom entre valores razonables
          newScale = Math.max(0.1, Math.min(5, newScale));

          if (newScale !== oldScale) {
            // Obtener las coordenadas del canvas para el centro del pinch
            const canvasRect = stage.container().getBoundingClientRect();
            const centerPoint = {
              x: center.x - canvasRect.left,
              y: center.y - canvasRect.top,
            };

            // Punto fijo bajo el centro del pinch
            const mousePointTo = {
              x: (centerPoint.x - stage.x()) / oldScale,
              y: (centerPoint.y - stage.y()) / oldScale,
            };

            setZoom(newScale);

            // Ajuste de pan para mantener el punto central del pinch
            const newPos = {
              x: centerPoint.x - mousePointTo.x * newScale,
              y: centerPoint.y - mousePointTo.y * newScale,
            };
            setPan(newPos);
          }
        }

        lastDistRef.current = dist;
        lastCenterRef.current = center;
      }
    };

    const handleTouchEnd = (e) => {
      // Resetear las referencias cuando se termine el gesto
      if (e.evt.touches.length < 2) {
        lastDistRef.current = 0;
        lastCenterRef.current = null;
      }
    };

    const handleTouchStart = (e) => {
      // Resetear las referencias al comenzar un nuevo gesto
      if (e.evt.touches.length === 2) {
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        const point1 = {
          x: touch1.clientX,
          y: touch1.clientY,
        };
        const point2 = {
          x: touch2.clientX,
          y: touch2.clientY,
        };

        lastDistRef.current = getDistance(point1, point2);
        lastCenterRef.current = getCenter(point1, point2);
      }
    };

    // Agregar los event listeners específicos para gestos táctiles
    stage.on("touchmove", handleTouchMove);
    stage.on("touchend", handleTouchEnd);
    stage.on("touchstart", handleTouchStart);

    // Prevenir scroll nativo del navegador en el container del canvas
    const container = stage.container();
    container.addEventListener("touchstart", preventDefaultTouch, {
      passive: false,
    });
    container.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });

    return () => {
      stage.off("touchmove", handleTouchMove);
      stage.off("touchend", handleTouchEnd);
      stage.off("touchstart", handleTouchStart);

      container.removeEventListener("touchstart", preventDefaultTouch);
      container.removeEventListener("touchmove", preventDefaultTouch);
    };
  }, [zoom, setZoom, setPan, stageRef]);
}
