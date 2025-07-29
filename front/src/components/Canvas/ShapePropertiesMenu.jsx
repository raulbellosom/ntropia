// src/components/Canvas/ShapePropertiesMenu.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  PaintBucket,
  Minus,
  Square,
  Circle,
  ArrowRight,
  Move,
} from "lucide-react";
import IconColorPicker from "../common/IconColorPicker";
import { useCanvasStore } from "../../store/useCanvasStore";

// Variable global para mantener la posición del menú entre cambios de shape
let persistentMenuPosition = null;

const FONT_SIZES = [
  8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72,
];
const STROKE_WIDTHS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20];

export default function ShapePropertiesMenu({
  shapes,
  selectedShapeIds,
  onUpdate,
  onClose,
  position,
}) {
  // Early return BEFORE any hooks
  const shape = shapes.find((s) => selectedShapeIds.includes(s.id));
  if (!shape) return null;

  // Get the first selected shape for property editing
  const [localProps, setLocalProps] = useState(shape?.props || {});
  const [menuPosition, setMenuPosition] = useState(() => {
    // Usar posición persistente si existe, sino usar la posición inicial
    return persistentMenuPosition || position || { x: 100, y: 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasBeenMoved, setHasBeenMoved] = useState(!!persistentMenuPosition);
  const menuRef = useRef();

  useEffect(() => {
    setLocalProps(shape?.props || {});
  }, [shape?.props]);

  useEffect(() => {
    // Solo calcular posición inteligente si el menú NO ha sido movido manualmente
    if (!hasBeenMoved && position && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 768;

      let x = position.x;
      let y = position.y;

      // En móvil, posicionar más hacia arriba por defecto
      if (isMobile) {
        // Centrar horizontalmente y posicionar en el tercio superior
        x = Math.max(20, (viewportWidth - 340) / 2); // Centrar considerando el ancho máximo
        y = Math.min(position.y, viewportHeight * 0.2); // Máximo en el 20% superior
      }

      // Ajustar horizontalmente
      if (x + menuRect.width > viewportWidth - 20) {
        x = viewportWidth - menuRect.width - 20;
      }
      if (x < 20) {
        x = 20;
      }

      // Ajustar verticalmente
      if (y + menuRect.height > viewportHeight - 20) {
        y = viewportHeight - menuRect.height - 20;
      }
      if (y < 20) {
        y = 20;
      }

      const newPosition = { x, y };
      setMenuPosition(newPosition);
      persistentMenuPosition = newPosition;
    }
  }, [position, hasBeenMoved]);

  const updateProp = (key, value) => {
    const newProps = { ...localProps, [key]: value };
    setLocalProps(newProps);
    onUpdate(shape.id, { [key]: value }); // Actualización en tiempo real
  };

  // Manejadores para arrastrar el menú
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (menuPosition?.x || 0),
      y: e.clientY - (menuPosition?.y || 0),
    });
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - (menuPosition?.x || 0),
        y: e.touches[0].clientY - (menuPosition?.y || 0),
      });
    }
  };

  // Agregar listeners globales para el arrastre
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Mantener dentro de los límites de la pantalla
      const menuRect = menuRef.current?.getBoundingClientRect();
      if (menuRect) {
        const maxX = window.innerWidth - menuRect.width - 20;
        const maxY = window.innerHeight - menuRect.height - 20;

        const newPosition = {
          x: Math.max(20, Math.min(newX, maxX)),
          y: Math.max(20, Math.min(newY, maxY)),
        };

        setMenuPosition(newPosition);
        // Guardar la posición para futuros cambios de shape
        persistentMenuPosition = newPosition;
        setHasBeenMoved(true);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        const newX = e.touches[0].clientX - dragStart.x;
        const newY = e.touches[0].clientY - dragStart.y;

        // Mantener dentro de los límites de la pantalla
        const menuRect = menuRef.current?.getBoundingClientRect();
        if (menuRect) {
          const maxX = window.innerWidth - menuRect.width - 20;
          const maxY = window.innerHeight - menuRect.height - 20;

          const newPosition = {
            x: Math.max(20, Math.min(newX, maxX)),
            y: Math.max(20, Math.min(newY, maxY)),
          };

          setMenuPosition(newPosition);
          // Guardar la posición para futuros cambios de shape
          persistentMenuPosition = newPosition;
          setHasBeenMoved(true);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    // Event listeners para mouse y touch
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragStart.x, dragStart.y]);

  const renderTextControls = () => (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-slate-600">
        Text Properties
      </div>

      {/* Tamaño de fuente */}
      <div className="flex items-center gap-3">
        <Type size={18} className="text-gray-600 dark:text-gray-400" />
        <select
          value={localProps.fontSize || 16}
          onChange={(e) => updateProp("fontSize", parseInt(e.target.value))}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white touch-manipulation"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </div>

      {/* Color de texto */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px]">
          Color:
        </span>
        <IconColorPicker
          icon={Type}
          color={localProps.stroke || "#000"}
          onChange={(color) => updateProp("stroke", color)}
          size={32}
          className="touch-manipulation"
        />
      </div>

      {/* Color de fondo */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px]">
          Fondo:
        </span>
        <IconColorPicker
          icon={PaintBucket}
          color={localProps.fill || "transparent"}
          onChange={(color) => updateProp("fill", color)}
          size={32}
          className="touch-manipulation"
        />
      </div>

      {/* Estilos */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Style:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() =>
              updateProp(
                "fontStyle",
                localProps.fontStyle === "bold" ? "normal" : "bold"
              )
            }
            className={`
              flex-1 p-3 rounded-lg border touch-manipulation transition-colors
              ${
                localProps.fontStyle === "bold"
                  ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              }
            `}
          >
            <Bold size={16} className="mx-auto" />
          </button>
          <button
            onClick={() =>
              updateProp(
                "fontStyle",
                localProps.fontStyle === "italic" ? "normal" : "italic"
              )
            }
            className={`
              flex-1 p-3 rounded-lg border touch-manipulation transition-colors
              ${
                localProps.fontStyle === "italic"
                  ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              }
            `}
          >
            <Italic size={16} className="mx-auto" />
          </button>
        </div>
      </div>

      {/* Alineación */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Alignment:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => updateProp("align", "left")}
            className={`
              flex-1 p-3 rounded-lg border touch-manipulation transition-colors
              ${
                localProps.align === "left"
                  ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              }
            `}
          >
            <AlignLeft size={16} className="mx-auto" />
          </button>
          <button
            onClick={() => updateProp("align", "center")}
            className={`
              flex-1 p-3 rounded-lg border touch-manipulation transition-colors
              ${
                localProps.align === "center"
                  ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              }
            `}
          >
            <AlignCenter size={16} className="mx-auto" />
          </button>
          <button
            onClick={() => updateProp("align", "right")}
            className={`
              flex-1 p-3 rounded-lg border touch-manipulation transition-colors
              ${
                localProps.align === "right"
                  ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              }
            `}
          >
            <AlignRight size={16} className="mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderShapeControls = () => (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-slate-600">
        Shape Properties
      </div>

      {/* Grosor de línea */}
      <div className="flex items-center gap-3">
        <Minus size={18} className="text-gray-600 dark:text-gray-400" />
        <select
          value={localProps.strokeWidth || 2}
          onChange={(e) => updateProp("strokeWidth", parseInt(e.target.value))}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white touch-manipulation"
        >
          {STROKE_WIDTHS.map((width) => (
            <option key={width} value={width}>
              {width}px
            </option>
          ))}
        </select>
      </div>

      {/* Color de línea */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px]">
          Stroke:
        </span>
        <IconColorPicker
          icon={Palette}
          color={localProps.stroke || "#000"}
          onChange={(color) => updateProp("stroke", color)}
          size={32}
          className="touch-manipulation"
        />
      </div>

      {/* Color de relleno */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px]">
          Fill:
        </span>
        <IconColorPicker
          icon={PaintBucket}
          color={localProps.fill || "transparent"}
          onChange={(color) => updateProp("fill", color)}
          size={32}
          className="touch-manipulation"
        />
      </div>
    </div>
  );

  const renderMarkerControls = () => (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-slate-600">
        Marker Properties
      </div>

      {/* Color del marcador */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px]">
          Color:
        </span>
        <IconColorPicker
          icon={Circle}
          color={localProps.color || "#FF4D4F"}
          onChange={(color) => updateProp("color", color)}
          size={32}
          className="touch-manipulation"
        />
      </div>
    </div>
  );

  const getShapeIcon = () => {
    switch (shape.type) {
      case "text":
        return Type;
      case "rect":
        return Square;
      case "circle":
        return Circle;
      case "arrow":
        return ArrowRight;
      case "marker":
        return Circle;
      default:
        return Palette;
    }
  };

  const ShapeIcon = getShapeIcon();

  // Calculate responsive position
  const getResponsiveStyle = () => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // En móvil, usar posición calculada (draggable) pero con tamaños responsivos
      return {
        position: "fixed",
        top: menuPosition?.y || 100,
        left: menuPosition?.x || 20,
        transform: "none",
        width: "calc(100vw - 40px)", // Ancho casi completo en móvil
        maxWidth: "340px", // Pero con un máximo
        maxHeight: "70vh",
        overflowY: "auto",
        zIndex: 9998,
        cursor: isDragging ? "grabbing" : "auto",
      };
    } else {
      // En desktop, comportamiento original
      return {
        position: "fixed",
        top: menuPosition?.y || 100,
        left: menuPosition?.x || 100,
        transform: "none",
        zIndex: 9998,
        cursor: isDragging ? "grabbing" : "auto",
      };
    }
  };

  return (
    <>
      <div
        ref={menuRef}
        className={`
          fixed z-[9998] 
          bg-white/95 dark:bg-slate-900/95
          border border-gray-200 dark:border-slate-700
          rounded-xl shadow-xl 
          backdrop-blur-md
          transition-all duration-200
          md:p-4 p-5
          md:min-w-64 md:max-w-72
          select-none
        `}
        style={getResponsiveStyle()}
      >
        {/* Header with drag handle */}
        <div
          className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-slate-700"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none", // Prevenir scroll mientras arrastramos
          }}
        >
          <Move
            size={16}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          />
          <ShapeIcon size={18} className="text-blue-600 dark:text-blue-400" />
          <span className="text-base font-semibold capitalize text-gray-900 dark:text-white flex-1">
            {shape.type} Properties
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ×
          </button>
        </div>

        {/* Controles según tipo */}
        <div className="space-y-4">
          {shape.type === "text" && renderTextControls()}
          {(shape.type === "rect" ||
            shape.type === "circle" ||
            shape.type === "line" ||
            shape.type === "arrow" ||
            shape.type === "free") &&
            renderShapeControls()}
          {shape.type === "marker" && renderMarkerControls()}
        </div>
      </div>
    </>
  );
}
