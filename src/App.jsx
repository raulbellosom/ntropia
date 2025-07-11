// src/App.jsx
import React from "react";
import Toolbar from "./components/Toolbar/Toolbar";
import LayersPanel from "./components/LayersPanel/LayersPanel";
import CanvasStage from "./components/Canvas/CanvasStage";
import MarkerModal from "./components/Marker/MarkerModal";
import ToolbarControls from "./components/Toolbar/ToolbarControls";

export default function App() {
  return (
    <div className="h-screen flex flex-col relative">
      {/* Barra superior de herramientas */}
      <Toolbar />
      <ToolbarControls />

      <LayersPanel />
      {/* Contenedor principal: panel de capas y área de dibujo */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel lateral de capas */}

        {/* Canvas con zoom, pan y shapes */}
        <CanvasStage />
      </div>

      {/* Modal de marcador (se muestra cuando selectedShapeId es de tipo 'marker') */}
      <MarkerModal />
    </div>
  );
}
