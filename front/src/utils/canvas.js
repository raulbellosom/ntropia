// src/utils/canvas.js

/**
 * Obtiene la posición real del mouse o touch en el canvas,
 * ajustada por el offset y transformaciones.
 * @param {object} stageRef - Ref de Konva.Stage
 * @param {object} offset - { x, y }
 * @returns {object} { x, y }
 */
export function getCanvasPosition(stageRef, offset) {
  if (!stageRef.current) return { x: 0, y: 0 };
  const stage = stageRef.current;
  const pointerPosition = stage.getPointerPosition();
  if (!pointerPosition) return { x: 0, y: 0 };

  // Obtener la transformación inversa del stage
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();

  // Aplicar la transformación inversa
  const pos = transform.point(pointerPosition);

  return {
    x: pos.x - (offset?.x || 0),
    y: pos.y - (offset?.y || 0),
  };
}

/**
 * Devuelve un array de shapes que están dentro de un área rectangular.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {array} shapes
 * @param {array} layers
 * @returns {array} shapes seleccionadas
 */
export function getShapesInArea(x1, y1, x2, y2, shapes, layers) {
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);

  return shapes.filter((shape) => {
    const props = shape.props;
    let shapeLeft, shapeRight, shapeTop, shapeBottom;

    const layer = layers.find((l) => l.id === shape.layerId);
    if (layer && layer.locked) return false;

    switch (shape.type) {
      case "rect":
      case "image":
      case "text":
        shapeLeft = props.x;
        shapeRight = props.x + props.width;
        shapeTop = props.y;
        shapeBottom = props.y + props.height;
        break;
      case "marker":
        const markerSize = 32;
        shapeLeft = props.x - markerSize / 2;
        shapeRight = props.x + markerSize / 2;
        shapeTop = props.y - markerSize;
        shapeBottom = props.y;
        break;
      case "circle":
        shapeLeft = props.x - props.radius;
        shapeRight = props.x + props.radius;
        shapeTop = props.y - props.radius;
        shapeBottom = props.y + props.radius;
        break;
      case "line":
      case "free":
      case "arrow":
        if (props.points && props.points.length >= 2) {
          const xPoints = props.points.filter((_, i) => i % 2 === 0);
          const yPoints = props.points.filter((_, i) => i % 2 === 1);
          shapeLeft = Math.min(...xPoints);
          shapeRight = Math.max(...xPoints);
          shapeTop = Math.min(...yPoints);
          shapeBottom = Math.max(...yPoints);
        } else {
          return false;
        }
        break;
      default:
        return false;
    }

    return (
      shapeRight >= left &&
      shapeLeft <= right &&
      shapeBottom >= top &&
      shapeTop <= bottom
    );
  });
}
