// src/components/Toolbar/Toolbar.jsx
import React from "react";
import {
  MousePointerClick as SelectIcon,
  Hand as HandIcon,
  Slash as LineIcon,
  Square as RectIcon,
  Circle as CircleIcon,
  PenTool as FreeIcon,
  Type as TextIcon,
  Image as ImageIcon,
  MapPin as MarkerIcon,
  Droplet,
  Layout as BgIcon,
  Layers,
  Copy,
  Clipboard,
  PaintBucket,
  ArrowRight,
} from "lucide-react";
import { useCanvasStore } from "../../store/useCanvasStore";
import IconColorPicker from "../common/IconColorPicker";
import classNames from "classnames";
import { useMediaQuery } from "react-responsive";

const tools = [
  { name: "select", icon: SelectIcon, title: "Seleccionar (V)" },
  { name: "hand", icon: HandIcon, title: "Mano (Pan)" },
  { name: "free", icon: FreeIcon, title: "Dibujo libre" },
  { name: "line", icon: LineIcon, title: "Línea (L)" },
  { name: "arrow", icon: ArrowRight, title: "Flecha (A)" },
  { name: "rect", icon: RectIcon, title: "Rectángulo (R)" },
  { name: "circle", icon: CircleIcon, title: "Círculo (C)" },
  { name: "text", icon: TextIcon, title: "Texto (T)" },
  { name: "image", icon: ImageIcon, title: "Imagen (I)" },
  { name: "marker", icon: MarkerIcon, title: "Marcador (M)" },
];

export default function Toolbar() {
  const {
    strokeColor,
    fillColor,
    backgroundColor,
    setBackgroundColor,
    tool,
    setTool,
    clipboardShape,
  } = useCanvasStore();

  const toggleLayersPanel = useCanvasStore((s) => s.toggleLayersPanel);
  const layersPanelVisible = useCanvasStore((s) => s.layersPanelVisible);
  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const copyShape = useCanvasStore((s) => s.copyShape);
  const pasteShape = useCanvasStore((s) => s.pasteShape);

  const shapes = useCanvasStore((s) => s.shapes);
  const updateShape = useCanvasStore((s) => s.updateShape);
  const setStrokeColor = useCanvasStore((s) => s.setStrokeColor);
  const setFillColor = useCanvasStore((s) => s.setFillColor);

  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  const currentStrokeColor = selectedShape?.props?.stroke ?? strokeColor; // shape o global
  const currentFillColor = selectedShape?.props?.fill ?? fillColor; // shape o global

  const handleStrokeColorChange = (color) => {
    if (selectedShape) {
      updateShape(selectedShape.id, { stroke: color });
    } else {
      setStrokeColor(color); // Para futuros shapes
    }
  };

  const handleFillColorChange = (color) => {
    if (selectedShape) {
      updateShape(selectedShape.id, { fill: color });
    } else {
      setFillColor(color); // Para futuros shapes
    }
  };

  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <div
      className={classNames(
        "fixed z-50 top-4 left-1/2 -translate-x-1/2 transition-all duration-200",
        { "w-[95vw]": isMobile, "w-auto": !isMobile }
      )}
      style={{
        maxWidth: isMobile ? "100vw" : "100%",
      }}
    >
      <nav
        className={classNames(
          "flex items-center gap-2 overflow-x-auto p-2 bg-blue-900/60 backdrop-blur-lg rounded-xl border border-slate-500/50 shadow-2xl",
          { "w-full": isMobile, "w-auto": !isMobile }
        )}
        style={{
          maxWidth: isMobile ? "100vw" : "unset",
          minWidth: isMobile ? 220 : 0,
        }}
      >
        {/* Botón de capas */}
        <button
          onClick={() => {
            toggleLayersPanel();
            setTool("select"); // <-- Esto pone la herramienta en "select" cada vez
          }}
          title={
            layersPanelVisible
              ? "Ocultar capas (Shift+L)"
              : "Mostrar capas (Shift+L)"
          }
          className={classNames(
            "flex-shrink-0 text-white rounded p-2 shadow-lg transition",
            {
              "bg-blue-600": layersPanelVisible,
              "bg-slate-800": !layersPanelVisible,
            }
          )}
        >
          <Layers size={20} />
        </button>
        <div className="border-r border-slate-500/50 h-8" />

        {/* Herramientas principales */}
        <div className="flex flex-nowrap items-center space-x-2">
          {tools.map(({ name, icon: Icon, title }) => (
            <button
              key={name}
              title={title}
              onClick={() => setTool(name)}
              className={classNames(
                "p-2 rounded transition-colors duration-150 flex-shrink-0",
                {
                  "bg-blue-100 text-black": tool === name,
                  "text-white hover:bg-slate-500/90": tool !== name,
                }
              )}
            >
              <Icon size={20} />
            </button>
          ))}

          {/* borde izquierdo */}
          <div className="border-l border-slate-500/50 h-8" />

          <div className="flex items-center gap-2">
            <button
              className={classNames(
                "p-2 rounded transition-colors duration-150 flex-shrink-0",
                {
                  // si no hay shape seleccionado, el botón es azul claro
                  "bg-blue-100 text-black": selectedShapeId,
                  // si hay shape seleccionado, el botón es blanco con hover gris
                  "text-white hover:bg-slate-500/90": !selectedShapeId,
                }
              )}
              title="Copiar elemento (Ctrl+C)"
              onClick={() => copyShape(selectedShapeId)}
              disabled={!selectedShapeId}
            >
              <Copy size={20} />
            </button>
            <button
              className={classNames(
                "p-2 rounded transition-colors duration-150 flex-shrink-0",
                {
                  "bg-blue-100 text-black": clipboardShape,
                  "text-white hover:bg-slate-500/90": !clipboardShape,
                }
              )}
              title="Pegar elemento (Ctrl+V)"
              onClick={pasteShape}
              disabled={!clipboardShape}
            >
              <Clipboard size={20} />
            </button>
          </div>

          {/* borde derecho */}
          <div className="border-r border-slate-500/50 h-8" />

          {/* Paletas de color */}
          <div className="flex items-center gap-3">
            <IconColorPicker
              icon={Droplet}
              color={currentStrokeColor}
              onChange={handleStrokeColorChange}
              label="Color del trazo"
            />
            <IconColorPicker
              icon={PaintBucket}
              color={currentFillColor}
              onChange={handleFillColorChange}
              label="Color de relleno"
            />
            <IconColorPicker
              icon={BgIcon}
              color={backgroundColor}
              onChange={setBackgroundColor}
              label="Color de fondo"
            />
          </div>
        </div>
      </nav>
    </div>
  );
}
