// src/components/Canvas/CanvasStage.jsx
import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect, Group } from "react-konva";
import { useCanvasStore } from "../../store/useCanvasStore";
import useZoomPan from "../../hooks/useZoomPan";
import Grid from "./Grid";
import FreeDrawShape from "../Shapes/FreeDrawShape";
import RectShape from "../Shapes/RectShape";
import CircleShape from "../Shapes/CircleShape";
import LineShape from "../Shapes/LineShape";
import TextShape from "../Shapes/TextShape";
import ImageShape from "../Shapes/ImageShape";
import MarkerIcon from "../Marker/MarkerIcon";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_CELL_SIZE,
} from "../../utils/constants";

export default function CanvasStage() {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const shapesLayerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [autoEditTextId, setAutoEditTextId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const {
    zoom,
    pan,
    setZoom,
    setPan,
    gridEnabled,
    strokeColor,
    fillColor,
    shapes,
    layers,
    activeLayerId,
    tool,
    setSelectedShape,
    addShape,
    updateShape,
    backgroundColor,
    toggleGrid,
  } = useCanvasStore();

  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const saveToHistory = useCanvasStore((s) => s.saveToHistory);
  const removeShape = useCanvasStore((s) => s.removeShape);
  const copyShape = useCanvasStore((s) => s.copyShape);
  const pasteShape = useCanvasStore((s) => s.pasteShape);
  const toggleLayersPanel = useCanvasStore((s) => s.toggleLayersPanel);

  const offset = {
    x: (dims.width - CANVAS_WIDTH) / 2,
    y: (dims.height - CANVAS_HEIGHT) / 2,
  };

  // Inicializa tamaño y centra
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      setDims({ width: w, height: h });
      setPan({ x: 0, y: 0 });
      setZoom(1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [setPan, setZoom]);

  // Zoom con wheel + pan con drag (solo si tool='hand')
  useZoomPan(stageRef, { zoom, setZoom, pan, setPan, tool });

  // Al cambiar a tool='image', abrimos selector
  useEffect(() => {
    if (tool === "image") {
      fileInputRef.current.click();
    }
  }, [tool]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedShapeId) {
        removeShape(selectedShapeId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeId, removeShape]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

      // Atajos con Ctrl/Meta (Cmd en Mac)
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "c" && selectedShapeId) {
          e.preventDefault();
          copyShape(selectedShapeId);
          return;
        }
        if (e.key.toLowerCase() === "v") {
          e.preventDefault();
          pasteShape();
          return;
        }

        return;
      }

      if (e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLayersPanel();
        setTool("select"); // Opcional: forzar herramienta en select como con el botón
        return;
      }

      // Atajos de cambio de herramienta (sin Ctrl)
      switch (e.key) {
        case "v": // Select
          useCanvasStore.getState().setTool("select");
          break;
        case "r": // Rect
          useCanvasStore.getState().setTool("rect");
          break;
        case "c": // Circle
          useCanvasStore.getState().setTool("circle");
          break;
        case "l": // Line
          useCanvasStore.getState().setTool("line");
          break;
        case "f": // Free draw
          useCanvasStore.getState().setTool("free");
          break;
        case "t": // Text
          useCanvasStore.getState().setTool("text");
          break;
        case "i": // Image
          useCanvasStore.getState().setTool("image");
          break;
        case "m": // Marker
          useCanvasStore.getState().setTool("marker");
          break;
        case "h": // Hand
          useCanvasStore.getState().setTool("hand");
          break;
        case "Escape": // Escape para salir de edición de texto
          if (autoEditTextId) {
            useCanvasStore.getState().setAutoEditTextId(null);
          }
          break;
        case "Delete": // Delete para eliminar shape seleccionado
          if (selectedShapeId) {
            useCanvasStore.getState().removeShape(selectedShapeId);
          }
          break;
        // quitar cuadriculado o grid
        case "g": // Toggle grid
          toggleGrid();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeId, copyShape, pasteShape]);

  // Carga de imagen con escalado automático
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      const img = new window.Image();
      img.onload = () => {
        const maxW = CANVAS_WIDTH;
        const maxH = CANVAS_HEIGHT;
        let w = img.width;
        let h = img.height;
        let scale = 1;
        if (w > maxW || h > maxH) {
          scale = Math.min(maxW / w, maxH / h);
          w = w * scale;
          h = h * scale;
        }
        // Usa el offset para colocar la imagen en la mesa de trabajo centrada
        const pos = lastPointerPos || {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
        };
        const id = addShape({
          layerId: activeLayerId,
          type: "image",
          props: {
            x: pos.x,
            y: pos.y,
            src,
            width: w,
            height: h,
          },
        });
        setTimeout(() => setSelectedShape(id), 0);
        useCanvasStore.getState().setTool("select");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    saveToHistory();
  };

  // Deseleccionar al hacer click en el fondo (stage o rect de fondo)
  const handleStageMouseDown = (e) => {
    // Clases de shapes "interactivos"
    const SHAPE_CLASSES = [
      "Rect",
      "Circle",
      "Line",
      "Text",
      "Image",
      "Path",
      "Star",
      "RegularPolygon",
      "marker",
    ];

    if (
      e.target.getClassName &&
      SHAPE_CLASSES.includes(e.target.getClassName())
    ) {
      return;
    }

    const isBackground =
      e.target === e.target.getStage() ||
      (e.target.id && e.target.id() === "background-rect");

    if (tool === "select") {
      if (isBackground) {
        setSelectedShape(null);
      }
      // NO llamar handleMouseDown en select
    } else {
      handleMouseDown(e);
    }
  };

  // Crear shapes en modos de dibujo
  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const posStage = stageRef.current.getPointerPosition();
    const pos = {
      x: (posStage.x - offset.x) / zoom,
      y: (posStage.y - offset.y) / zoom,
    };

    setLastPointerPos(pos); // Para imágenes

    let shapeData = {};
    let id = null;

    switch (tool) {
      case "line":
        shapeData = {
          layerId: activeLayerId,
          type: "line",
          props: {
            points: [pos.x, pos.y, pos.x, pos.y],
            stroke: strokeColor || "black",
            strokeWidth: 2,
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;

      case "rect":
        shapeData = {
          layerId: activeLayerId,
          type: "rect",
          props: {
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            fill: fillColor || "transparent",
            stroke: strokeColor || "black",
            strokeWidth: 2,
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;

      case "circle":
        shapeData = {
          layerId: activeLayerId,
          type: "circle",
          props: {
            x: pos.x,
            y: pos.y,
            radius: 0,
            fill: fillColor || "transparent",
            stroke: strokeColor || "black",
            strokeWidth: 2,
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;

      case "free":
        shapeData = {
          layerId: activeLayerId,
          type: "free",
          props: {
            points: [pos.x, pos.y],
            stroke: strokeColor || "black",
            strokeWidth: 2,
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;
      case "text":
        shapeData = {
          layerId: activeLayerId,
          type: "text",
          props: {
            x: pos.x,
            y: pos.y,
            text: "Ingrese texto",
            fontSize: 16,
            fontFamily: "Arial",
            fill: fillColor || "#eee", // color fondo/caja
            stroke: strokeColor || "#222", // color de letra
          },
        };
        id = addShape(shapeData);
        setAutoEditTextId(id);
        setTimeout(() => setSelectedShape(id), 0);
        useCanvasStore.getState().setTool("select");
        break;
      case "marker":
        shapeData = {
          layerId: activeLayerId,
          type: "marker",
          props: {
            x: pos.x,
            y: pos.y,
            color: "red", // o el color que prefieras
            title: "",
            description: "",
            images: [],
          },
        };
        id = addShape(shapeData);
        setCurrentId(id);
        break;

      default:
        return;
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentId) return;
    const posStage = stageRef.current.getPointerPosition();
    const pos = {
      x: (posStage.x - offset.x) / zoom,
      y: (posStage.y - offset.y) / zoom,
    };

    const shape = shapes.find((s) => s.id === currentId);
    if (!shape) return;
    const { x, y, points } = shape.props;

    switch (shape.type) {
      case "free":
        updateShape(currentId, { points: [...points, pos.x, pos.y] });
        break;
      case "line":
        updateShape(currentId, {
          points: [points[0], points[1], pos.x, pos.y],
        });
        break;
      case "rect":
        updateShape(currentId, { width: pos.x - x, height: pos.y - y });
        break;
      case "circle":
        const radius = Math.hypot(pos.x - x, pos.y - y);
        updateShape(currentId, { radius });
        break;
      default:
        break;
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setCurrentId(null);
    saveToHistory();
  };

  const handleDragEnd = (e) => {
    setPan({ x: e.target.x(), y: e.target.y() });
  };

  // Al transformar/mover, actualizar el shape en el store
  const handleTransformEnd = (e) => {
    const node = e.target;
    const id = node.id();
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    // Estos métodos existen seguro
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    switch (shape.type) {
      case "rect":
      case "image":
      case "text":
        updateShape(id, {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        });
        break;
      case "circle":
        updateShape(id, {
          x: node.x(),
          y: node.y(),
          radius: Math.max(5, shape.props.radius * scaleX),
        });
        break;
      default:
        break;
    }

    node.scaleX(1);
    node.scaleY(1);

    saveToHistory();
  };

  const handleShapeDoubleClick = (id) => {
    useCanvasStore.getState().setTool("select");
    setSelectedShape(id);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-900 overflow-hidden p-0 m-0"
    >
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />

      <Stage
        ref={stageRef}
        width={dims.width}
        height={dims.height}
        scaleX={zoom}
        scaleY={zoom}
        x={0}
        y={0}
        draggable={tool === "hand"}
        onDragEnd={tool === "hand" ? handleDragEnd : undefined}
        style={{
          cursor:
            tool === "hand"
              ? "grab"
              : tool === "select"
              ? selectedShapeId
                ? "default"
                : "pointer"
              : "crosshair",
        }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          <Group x={offset.x} y={offset.y}>
            {/* Fondo */}
            <Rect
              id="background-rect"
              x={0}
              y={0}
              fill={backgroundColor}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              listening={false}
            />

            {/* Grid */}
            {gridEnabled && (
              <Grid
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                cellSize={GRID_CELL_SIZE}
              />
            )}

            {/* Capas */}
            {layers.map((layer) => {
              if (!layer.visible) return null;
              const isLocked = layer.locked;
              const shapesDeCapa = shapes.filter(
                (s) => s.layerId === layer.id && s.visible !== false
              );

              if (shapesDeCapa.length === 0) return null;

              return (
                <Group
                  key={layer.id}
                  opacity={layer.opacity ?? 1}
                  listening={!isLocked}
                >
                  {shapesDeCapa.map((s) => {
                    const props = {
                      id: s.id,
                      ...s.props,
                      isSelected: s.id === selectedShapeId,
                      onSelect: () => {
                        if (
                          tool === "select" &&
                          s.id !== selectedShapeId &&
                          !isLocked
                        ) {
                          setSelectedShape(s.id);
                        }
                      },
                      onTransformEnd: handleTransformEnd,
                      onDoubleClick: () => handleShapeDoubleClick(s.id),
                      draggable: !isLocked,
                      listening: !isLocked,
                      isLocked,
                      contextMenu,
                      onContextMenu: (e) => {
                        e.evt.preventDefault();
                        setContextMenu({
                          x: e.evt.clientX,
                          y: e.evt.clientY,
                          shapeId: s.id,
                        });
                      },
                    };

                    switch (s.type) {
                      case "free":
                        return <FreeDrawShape key={s.id} {...props} />;
                      case "line":
                        return <LineShape key={s.id} {...props} />;
                      case "rect":
                        return <RectShape key={s.id} {...props} />;
                      case "circle":
                        return <CircleShape key={s.id} {...props} />;
                      case "text":
                        return (
                          <TextShape
                            key={s.id}
                            {...props}
                            autoEdit={s.id === autoEditTextId}
                            onChangeText={(id, newText) => {
                              updateShape(id, { text: newText });
                              if (autoEditTextId === id)
                                setAutoEditTextId(null);
                            }}
                          />
                        );
                      case "image":
                        return <ImageShape key={s.id} {...props} />;
                      case "marker":
                        return <MarkerIcon key={s.id} {...props} />;
                      default:
                        return null;
                    }
                  })}
                </Group>
              );
            })}
          </Group>
        </Layer>
      </Stage>
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded shadow border"
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 140 }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="w-full text-left p-2 hover:bg-slate-100"
            onClick={() => {
              useCanvasStore.getState().bringShapeToFront(contextMenu.shapeId);
              setContextMenu(null);
            }}
          >
            Traer al frente
          </button>
          <button
            className="w-full text-left p-2 hover:bg-slate-100"
            onClick={() => {
              useCanvasStore.getState().sendShapeToBack(contextMenu.shapeId);
              setContextMenu(null);
            }}
          >
            Enviar al fondo
          </button>
          <button
            className="w-full text-left p-2 hover:bg-slate-100"
            onClick={() => {
              useCanvasStore.getState().bringShapeForward(contextMenu.shapeId);
              setContextMenu(null);
            }}
          >
            Subir
          </button>
          <button
            className="w-full text-left p-2 hover:bg-slate-100"
            onClick={() => {
              useCanvasStore.getState().sendShapeBackward(contextMenu.shapeId);
              setContextMenu(null);
            }}
          >
            Bajar
          </button>
          {/* ... más acciones */}
        </div>
      )}
    </div>
  );
}
