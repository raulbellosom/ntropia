// src/components/Canvas/MultiTransformer.jsx

import React from "react";
import { Transformer } from "react-konva";

/**
 * Componente visual para el Transformer de selección múltiple.
 * Recibe la ref, nodos, y cualquier prop personalizado.
 */
export default function MultiTransformer({
  transformerRef,
  enabled = true,
  ...rest
}) {
  if (!enabled) return null;

  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled={false}
      enabledAnchors={[
        "top-left",
        "top-center",
        "top-right",
        "middle-right",
        "bottom-right",
        "bottom-center",
        "bottom-left",
        "middle-left",
      ]}
      boundBoxFunc={(oldBox, newBox) => {
        if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
          return oldBox;
        }
        return newBox;
      }}
      {...rest}
    />
  );
}
