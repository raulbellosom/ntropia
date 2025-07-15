// src/hooks/useContextMenu.js

import { useState } from "react";

/**
 * Hook para manejar el menú contextual sobre shapes.
 *
 * Retorna:
 * - contextMenu: { x, y, shapeId } o null
 * - showContextMenu: fn para mostrarlo
 * - hideContextMenu: fn para ocultarlo
 */
export default function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);

  // Muestra el menú en la posición del mouse y con el shape correspondiente
  const showContextMenu = (e, shapeId) => {
    // e: evento Konva o React, shapeId: string
    // Puedes usar e.evt si el evento es de Konva (e.evt.clientX/Y)
    const x = e.evt ? e.evt.clientX : e.clientX;
    const y = e.evt ? e.evt.clientY : e.clientY;
    setContextMenu({ x, y, shapeId });
  };

  // Oculta el menú contextual
  const hideContextMenu = () => setContextMenu(null);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
}
