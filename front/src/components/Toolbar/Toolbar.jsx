// src/components/Toolbar/Toolbar.jsx
import React, { useState } from "react";
import {
  MousePointerClick as SelectIcon,
  Slash as LineIcon,
  Square as RectIcon,
  Circle as CircleIcon,
  PenTool as FreeIcon,
  Type as TextIcon,
  Image as ImageIcon,
  MapPin as MarkerIcon,
  Droplet,
  Copy,
  Clipboard,
  PaintBucket,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCanvasStore } from "../../store/useCanvasStore";
import IconColorPicker from "../common/IconColorPicker";
import classNames from "classnames";
import { useMediaQuery } from "react-responsive";
import { motion, AnimatePresence } from "framer-motion";
import useValidActiveLayer from "../../hooks/useValidActiveLayer";
import { toast } from "react-hot-toast";

const tools = [
  { name: "select", icon: SelectIcon, title: "Seleccionar (V)" },
  { name: "free", icon: FreeIcon, title: "Dibujo libre" },
  { name: "line", icon: LineIcon, title: "Línea (L)" },
  { name: "arrow", icon: ArrowRight, title: "Flecha (A)" },
  { name: "rect", icon: RectIcon, title: "Rectángulo (R)" },
  { name: "circle", icon: CircleIcon, title: "Círculo (C)" },
  { name: "text", icon: TextIcon, title: "Texto (T)" },
  { name: "image", icon: ImageIcon, title: "Imagen (I)" },
  { name: "marker", icon: MarkerIcon, title: "Marcador (M)" },
];

// Variantes de animación para el contenedor principal
const containerVariants = {
  collapsed: {
    height: 56,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      when: "afterChildren",
    },
  },
  expanded: {
    height: "auto",
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      when: "beforeChildren",
    },
  },
};

// Variantes para el contenido de la toolbar
const contentVariants = {
  collapsed: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: "easeIn",
      staggerChildren: 0.01,
      staggerDirection: -1,
    },
  },
  expanded: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
};

// Variantes para elementos individuales
const itemVariants = {
  collapsed: {
    opacity: 0,
    scale: 0.9,
    y: -5,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
  expanded: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

// Variantes para el botón de toggle
const toggleButtonVariants = {
  collapsed: {
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  expanded: {
    rotate: 180,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export default function Toolbar() {
  const { strokeColor, fillColor, tool, clipboardShape } = useCanvasStore();

  const [collapsed, setCollapsed] = useState(false);
  const saveToHistory = useCanvasStore((s) => s.saveToHistory);

  const validActiveLayer = useValidActiveLayer();
  const hasActiveLayer = !!validActiveLayer;

  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const copyShape = useCanvasStore((s) => s.copyShape);
  const pasteShape = useCanvasStore((s) => s.pasteShape);

  const shapes = useCanvasStore((s) => s.shapes);
  const updateShape = useCanvasStore((s) => s.updateShape);
  const setStrokeColor = useCanvasStore((s) => s.setStrokeColor);
  const setFillColor = useCanvasStore((s) => s.setFillColor);

  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  const currentStrokeColor = selectedShape?.props?.stroke ?? strokeColor;
  const currentFillColor = selectedShape?.props?.fill ?? fillColor;

  const setTool = useCanvasStore((s) => s.setTool);

  const handleStrokeColorChange = (color) => {
    if (selectedShape) {
      updateShape(selectedShape.id, { stroke: color });
      saveToHistory();
    } else {
      setStrokeColor(color);
    }
  };

  const handleFillColorChange = (color) => {
    if (selectedShape) {
      updateShape(selectedShape.id, { fill: color });
      saveToHistory();
    } else {
      setFillColor(color);
    }
  };

  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <>
      <motion.div
        variants={containerVariants}
        animate={collapsed ? "collapsed" : "expanded"}
        className={classNames(
          "fixed z-40 flex flex-col items-center",
          "backdrop-blur-lg shadow-2xl bg-blue-900/50 rounded-2xl",
          "top-3 right-3"
        )}
        style={{
          width: 64,
          height: "auto",
          minHeight: 56,
          maxHeight: "calc(100dvh - 112px)",
          overflow: "hidden",
        }}
      >
        {/* Botón de toggle siempre visible */}
        <motion.button
          variants={toggleButtonVariants}
          animate={collapsed ? "collapsed" : "expanded"}
          className={classNames(
            "p-2 transition-colors duration-200 flex-shrink-0 bg-slate-800 text-white flex items-center justify-center",
            "rounded-t-2xl w-full"
          )}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Mostrar herramientas" : "Colapsar herramientas"}
        >
          {isMobile ? (
            collapsed ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )
          ) : collapsed ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronUp size={20} />
          )}
        </motion.button>

        {/* Contenido de la toolbar */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              key="toolbar-content"
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className={classNames(
                "flex items-center gap-2 p-2",
                "w-full flex-1 flex-col overflow-y-auto"
              )}
              style={{
                maxHeight: "calc(100dvh - 200px)", // Ajustado para evitar overflow
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Herramientas principales */}
              <motion.div
                variants={itemVariants}
                className={classNames("flex gap-2", "flex-col")}
              >
                {tools.map(({ name, icon: Icon, title }, index) => (
                  <motion.button
                    key={name}
                    variants={itemVariants}
                    custom={index}
                    title={title}
                    onClick={() => {
                      if (
                        name !== "select" &&
                        name !== "hand" &&
                        !hasActiveLayer
                      ) {
                        toast("Selecciona una capa antes de continuar", {
                          icon: "⚠️",
                          duration: 3000,
                        });
                        return;
                      }
                      setTool(name);
                    }}
                    className={classNames(
                      "p-2 rounded transition-colors duration-200 flex-shrink-0",
                      {
                        "bg-blue-500/90 text-white": tool === name,
                        "text-white hover:text-white hover:bg-blue-500/90":
                          tool !== name,
                      }
                    )}
                  >
                    <Icon size={20} />
                  </motion.button>
                ))}
              </motion.div>

              {/* Separador */}
              <motion.div
                variants={itemVariants}
                className={classNames(
                  "border-slate-500/50",
                  "border-t w-8 my-2"
                )}
              />

              {/* Paletas de color */}
              <motion.div
                variants={itemVariants}
                className={classNames("flex gap-3 items-center", "flex-col")}
              >
                <motion.div variants={itemVariants}>
                  <IconColorPicker
                    icon={Droplet}
                    color={currentStrokeColor}
                    onChange={handleStrokeColorChange}
                    label="Color del trazo"
                    vertical={!isMobile}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <IconColorPicker
                    icon={PaintBucket}
                    color={currentFillColor}
                    onChange={handleFillColorChange}
                    label="Color de relleno"
                    vertical={!isMobile}
                  />
                </motion.div>
              </motion.div>

              {/* Separador */}
              <motion.div
                variants={itemVariants}
                className={classNames(
                  "border-slate-500/50",
                  "border-t w-8 my-2"
                )}
              />

              {/* Acciones rápidas */}
              <motion.div
                variants={itemVariants}
                className={classNames("flex gap-2", "flex-col")}
              >
                <motion.button
                  variants={itemVariants}
                  className={classNames(
                    "p-2 rounded transition-colors duration-200 flex-shrink-0",
                    {
                      "bg-blue-500/90 text-white": selectedShapeId,
                      "text-white hover:text-white hover:bg-blue-500/90":
                        !selectedShapeId,
                    }
                  )}
                  title="Copiar elemento (Ctrl+C)"
                  onClick={() => copyShape(selectedShapeId)}
                  disabled={!selectedShapeId}
                >
                  <Copy size={20} />
                </motion.button>
                <motion.button
                  variants={itemVariants}
                  className={classNames(
                    "p-2 rounded transition-colors duration-200 flex-shrink-0",
                    {
                      "bg-blue-500/90 text-white": clipboardShape,
                      "text-white hover:text-white hover:bg-blue-500/90":
                        !clipboardShape,
                    }
                  )}
                  title="Pegar elemento (Ctrl+V)"
                  onClick={pasteShape}
                  disabled={!clipboardShape}
                >
                  <Clipboard size={20} />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
