// src/components/Canvas/CanvasStage.jsx

import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Stage, Layer, Group, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

import { useCanvasStore } from "../../store/useCanvasStore";
import useZoomPan from "../../hooks/useZoomPan";
import useTouchGestures from "../../hooks/useTouchGestures";
import useCanvasShortcuts from "../../hooks/useCanvasShortcuts";
import useShapeDrawing from "../../hooks/useShapeDrawing";
import useSelectionBox from "../../hooks/useSelectionBox";
import useContextMenu from "../../hooks/useContextMenu";
import useImageUpload from "../../hooks/useImageUpload";
import { getCanvasPosition as getCanvasPosUtil } from "../../utils/canvas";

import Grid from "./Grid";
import CanvasLayers from "./CanvasLayers";
import ContextMenu from "./ContextMenu";
import SelectBox from "./SelectBox";
import MultiTransformer from "./MultiTransformer";
import MarkerModal from "../Marker/MarkerModal";
import ShapePropertiesMenu from "./ShapePropertiesMenu";

import { GRID_CELL_SIZE } from "../../utils/constants";
import { useEditMode } from "../../hooks/useEditMode";
import useValidActiveLayer from "../../hooks/useValidActiveLayer";
import { toast } from "react-hot-toast";

// Mutations de Directus
import {
  useCreateShape,
  useUpdateShape,
  useDeleteShape,
} from "../../hooks/useShapes";

export default function CanvasStage() {
  const { id: workspaceId } = useParams();
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);
  const multiSelectRef = useRef(null);

  const { isEditMode } = useEditMode();
  const validActiveLayer = useValidActiveLayer();
  const hasActiveLayer = !!validActiveLayer;

  // Dimensiones viewport
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [autoEditTextId, setAutoEditTextId] = useState(null);
  const [markerModalShapeId, setMarkerModalShapeId] = useState(null);
  const [propertiesMenuOpen, setPropertiesMenuOpen] = useState(false);
  const [propertiesPosition, setPropertiesPosition] = useState({ x: 0, y: 0 });

  // Store local
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
    backgroundColor,
    setBackgroundImage,
    backgroundImage,
    canvasWidth,
    canvasHeight,
    saveToHistory,
  } = useCanvasStore();

  const selectedShapeId = useCanvasStore((s) => s.selectedShapeId);
  const selectedShapeIds = useCanvasStore((s) => s.selectedShapeIds);
  const setSelectedShape = useCanvasStore((s) => s.setSelectedShape);
  const toggleSelection = useCanvasStore((s) => s.toggleSelection);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const setMultipleSelection = useCanvasStore((s) => s.setMultipleSelection);
  const removeSelectedShapes = useCanvasStore((s) => s.removeSelectedShapes);
  const copyShape = useCanvasStore((s) => s.copyShape);
  const pasteShape = useCanvasStore((s) => s.pasteShape);
  const replaceShape = useCanvasStore((s) => s.replaceShape);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const setStageRef = useCanvasStore((s) => s.setStageRef);

  // Mutations Directus
  const createShapeMut = useCreateShape();
  const updateShapeMut = useUpdateShape();
  const deleteShapeMut = useDeleteShape();

  // Delete selected shapes (for keyboard shortcut) - Definir antes de usar
  const deleteSelectedShapes = () => {
    const { selectedShapeIds } = useCanvasStore.getState();
    if (selectedShapeIds.length > 0) {
      // 🚀 Eliminar del servidor cada shape seleccionada
      selectedShapeIds.forEach((id) => {
        deleteShapeMut.mutate(id);
      });
      // Limpiar selección local
      clearSelection();
    }
  };

  // Paste shape action - Definir antes de usar en shortcuts
  const pasteShapeAction = () => {
    const { clipboardShape } = useCanvasStore.getState();
    if (!clipboardShape) return;

    // Crear las props modificadas (sin ID para que se genere uno nuevo)
    let newProps = { ...clipboardShape.props };

    // Mover ligeramente para no superponer
    newProps.x = (newProps.x || 0) + 30;
    newProps.y = (newProps.y || 0) + 30;

    // Si es línea o free, mover todos los puntos
    if (Array.isArray(newProps.points)) {
      newProps.points = newProps.points.map((point, index) =>
        index % 2 === 0 ? point + 30 : point + 30
      );
    }

    // 🚀 SOLO servidor - Sin update local
    // Estructura correcta para createShapeMut
    createShapeMut.mutate({
      type: clipboardShape.type,
      layer_id: clipboardShape.layerId,
      workspace_id: workspaceId,
      data: newProps, // Las props van directamente en data
    });
  };

  // Replace shape action - Definir antes de usar
  const replaceShapeAction = (id) => {
    const { clipboardShape } = useCanvasStore.getState();
    if (!clipboardShape) return;

    const target = shapes.find((s) => s.id === id);
    if (!target) return;

    // Nueva figura con props del clipboard, pero manteniendo posición y medidas originales
    let newProps = { ...clipboardShape.props };

    // Mantener posición y medidas originales
    newProps.x = target.props.x;
    newProps.y = target.props.y;

    // Tamaño
    if ("width" in target.props) newProps.width = target.props.width;
    if ("height" in target.props) newProps.height = target.props.height;
    if ("radius" in target.props) newProps.radius = target.props.radius;
    if ("points" in target.props) newProps.points = [...target.props.points];
    if ("rotation" in target.props) newProps.rotation = target.props.rotation;
    if ("scaleX" in target.props) newProps.scaleX = target.props.scaleX;
    if ("scaleY" in target.props) newProps.scaleY = target.props.scaleY;

    // Texto si aplica
    if ("text" in target.props) newProps.text = target.props.text;

    // Primero eliminar la shape original
    deleteShapeMut.mutate(id);

    // Luego crear la nueva shape con estructura correcta
    setTimeout(() => {
      createShapeMut.mutate({
        type: clipboardShape.type,
        layer_id: target.layerId,
        workspace_id: workspaceId,
        data: newProps, // Las props van directamente en data
      });
    }, 100); // Pequeño delay para asegurar que la eliminación se procese primero
  };

  // Context menu
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Offset centrar canvas
  const offset = {
    x: (dims.width - canvasWidth) / 2,
    y: (dims.height - canvasHeight) / 2,
  };
  const [bgImg] = useImage(backgroundImage || "");

  // Zoom & Pan
  useZoomPan(stageRef, { zoom, setZoom, pan, setPan, tool });

  // Gestos táctiles para dispositivos móviles (pinch zoom)
  useTouchGestures(stageRef, { zoom, setZoom, pan, setPan });

  // Imagen upload
  const { handleImageUpload, openImageInput } = useImageUpload({
    fileInputRef,
    CANVAS_WIDTH: canvasWidth,
    CANVAS_HEIGHT: canvasHeight,
    layers,
    activeLayerId,
    addShape: async (shape) => {
      // 🚀 SOLO servidor - Sin update local
      const result = await createShapeMut.mutateAsync({
        ...shape,
        layer_id: shape.layerId,
        workspace_id: workspaceId,
        data: shape.props,
      });
      return result?.data?.id; // Retornar el ID de la shape creada
    },
    setSelectedShape,
    setTool: useCanvasStore.getState().setTool,
    saveToHistory,
    getCanvasPosition: () => getCanvasPosUtil(stageRef, offset),
    useCanvasStoreRef: useCanvasStore,
  });

  // Atajos
  useCanvasShortcuts({
    autoEditTextId,
    setAutoEditTextId,
    selectedShapeId,
    selectedShapeIds,
    clearSelection,
    copyShape,
    pasteShape: pasteShapeAction,
    toggleGrid: useCanvasStore.getState().toggleGrid,
    toggleLayersPanel: useCanvasStore.getState().toggleLayersPanel,
    removeSelectedShapes: deleteSelectedShapes, // 👈 Usar la nueva función
    tool,
  });

  // Drawing hook
  const {
    isDrawing,
    handleMouseDown: drawMouseDown,
    handleMouseMove: drawMouseMove,
    handleMouseUp: drawMouseUp,
  } = useShapeDrawing({
    tool,
    layers,
    activeLayerId,
    strokeColor,
    fillColor,
    addShape: (shape) => {
      // 🚀 SOLO servidor - Sin update local
      createShapeMut.mutate({
        ...shape,
        layer_id: shape.layerId,
        workspace_id: workspaceId,
        data: shape.props,
      });
    },
    updateShape: (id, props) => {
      // 🚀 SOLO servidor - Sin update local
      const shape = shapes.find((s) => s.id === id);
      if (!shape) return;

      updateShapeMut.mutate({
        id,
        data: {
          data: { ...shape.props, ...props }, // Merge con props existentes
        },
      });
    },
    setSelectedShape,
    saveToHistory,
    setAutoEditTextId,
    getCanvasPosition: () => getCanvasPosUtil(stageRef, offset),
    useCanvasStoreRef: useCanvasStore,
  });

  // Selection box
  const {
    selectBox,
    isSelecting,
    handleStart: selectStart,
    handleMove: selectMove,
    handleEnd: selectEnd,
  } = useSelectionBox({
    getCanvasPosition: () => getCanvasPosUtil(stageRef, offset),
    shapes,
    layers,
    setMultipleSelection,
  });

  // MultiTransformer
  useEffect(() => {
    if (!stageRef.current || !multiSelectRef.current) return;

    if (selectedShapeIds.length > 1) {
      const nodes = selectedShapeIds
        .map((id) => stageRef.current.findOne(`#${id}`))
        .filter(Boolean);
      multiSelectRef.current.nodes(nodes);
      multiSelectRef.current.getLayer().batchDraw();
    } else {
      multiSelectRef.current.nodes([]);
    }
  }, [selectedShapeIds]);

  // Resize
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

  // Establecer referencia global del Stage para exportación
  useEffect(() => {
    if (stageRef.current) {
      window.__konvaStageRef = stageRef.current;
      setStageRef(stageRef.current); // También establecer en el store
    }
    return () => {
      if (window.__konvaStageRef) {
        delete window.__konvaStageRef;
      }
      setStageRef(null);
    };
  }, [stageRef.current, setStageRef]);

  // Prevent scroll touch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, []);

  // Open image input - solo una vez por selección de herramienta
  const prevTool = useRef(tool);
  useEffect(() => {
    if (tool === "image" && prevTool.current !== "image") {
      openImageInput();
    }
    prevTool.current = tool;
  }, [tool, openImageInput]);

  // Close marker modal if shape removed
  useEffect(() => {
    if (
      markerModalShapeId &&
      !shapes.find((s) => s.id === markerModalShapeId)
    ) {
      setMarkerModalShapeId(null);
    }
  }, [shapes, markerModalShapeId]);

  // Stage mouse handlers
  const handleStageMouseDown = (e) => {
    if (contextMenu) hideContextMenu();
    if (!isEditMode && tool !== "hand") return;

    const isShape =
      e.target.getClassName && e.target.getClassName() !== "Group";
    const isBackground =
      e.target === e.target.getStage() || e.target.id() === "background-rect";

    // Si es herramienta select y hacemos clic en fondo, limpiar selección
    if (tool === "select" && isBackground) {
      clearSelection();
      selectStart();
      return;
    }

    // Si es herramienta select y hacemos clic en shape, no hacer nada (lo maneja el shape)
    if (tool === "select" && isShape) {
      // Verificar si la shape está bloqueada
      const shapeId = e.target.parent?.id() || e.target.id();
      const shape = shapes.find((s) => s.id === shapeId);

      if (shape?.locked) {
        // Si la shape está bloqueada, tratarla como si fuera parte del fondo
        clearSelection();
        selectStart();
      }
      return;
    }

    // Si no es herramienta select y estamos en modo edición, empezar a dibujar
    if (tool !== "select" && isEditMode) {
      drawMouseDown(e);
    }
  };
  const handleStageMouseMove = (e) => {
    if (!isEditMode || tool === "hand") return;
    if (tool === "select") selectMove();
    else if (isDrawing) drawMouseMove(e, shapes);
  };
  const handleStageMouseUp = () => {
    if (!isEditMode || tool === "hand") return;
    if (tool === "select") selectEnd();
    if (isDrawing) drawMouseUp();
  };

  // Transform end

  // Manejadores específicos para eventos táctiles
  const handleStageTouchStart = (e) => {
    // Si hay más de un toque, es un gesto de pinch - no procesar como toque simple
    if (e.evt.touches.length > 1) {
      return;
    }
    // Para toques simples, usar el mismo handler que mouse
    handleStageMouseDown(e);
  };

  const handleStageTouchMove = (e) => {
    // Si hay más de un toque, es un gesto de pinch - no procesar como movimiento simple
    if (e.evt.touches.length > 1) {
      return;
    }
    // Para toques simples, usar el mismo handler que mouse
    handleStageMouseMove(e);
  };

  const handleStageTouchEnd = (e) => {
    // Si aún hay toques activos, no procesar como fin de toque simple
    if (e.evt.touches.length > 0) {
      return;
    }
    // Para toques simples, usar el mismo handler que mouse
    handleStageMouseUp(e);
  };
  const handleTransformEnd = (e) => {
    const id = e.target.id();
    const node = e.target;
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;
    const layer = layers.find((l) => l.id === shape.layerId);
    if (layer?.locked) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    const x = node.x();
    const y = node.y();
    let propsUpdate = {};

    switch (shape.type) {
      case "rect":
      case "image":
      case "marker":
        propsUpdate = {
          x,
          y,
          width: node.width() * scaleX,
          height: node.height() * scaleY,
          rotation,
        };
        break;
      case "circle":
        propsUpdate = {
          x,
          y,
          radius: shape.props.radius * scaleX,
          rotation,
        };
        break;
      case "line":
      case "freeDraw":
      case "arrow":
        propsUpdate = {
          x,
          y,
          points: shape.props.points.map((pt, idx) =>
            idx % 2 === 0 ? pt * scaleX : pt * scaleY
          ),
          rotation,
        };
        break;
      case "text":
        propsUpdate = {
          x,
          y,
          width: node.width() * scaleX,
          height: node.height() * scaleY,
          fontSize: (shape.props.fontSize || 16) * scaleX,
          rotation,
        };
        break;
      default:
        break;
    }

    node.scaleX(1);
    node.scaleY(1);
    node.rotation(0);

    // 🚀 SOLO servidor - Sin update local
    // Enviar los props dentro del campo 'data' de Directus
    saveToHistory();
    updateShapeMut.mutate({
      id,
      data: {
        data: { ...shape.props, ...propsUpdate }, // Merge con props existentes
      },
    });
  };

  // Drag end
  const handleShapeDragEnd = (e) => {
    const id = e.target.id();
    const x = e.target.x();
    const y = e.target.y();

    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;

    // 🚀 SOLO servidor - Sin update local
    // Enviar los props dentro del campo 'data' de Directus
    saveToHistory();
    updateShapeMut.mutate({
      id,
      data: {
        data: { ...shape.props, x, y }, // Merge con props existentes
      },
    });
  };

  // Shape double click
  const handleShapeDoubleClick = (id) => {
    const shape = shapes.find((s) => s.id === id);
    if (shape?.type === "marker") {
      // Para markers, abrir el modal
      setMarkerModalShapeId(id);
    } else {
      // Para otras shapes, solo seleccionar
      setSelectedShape(id);
    }
  };

  // Open properties menu
  const openPropertiesMenu = (event) => {
    const selectedShapes =
      selectedShapeIds.length > 0
        ? selectedShapeIds
        : selectedShapeId
        ? [selectedShapeId]
        : [];

    if (selectedShapes.length === 0) return;

    // Get position from touch event or mouse event
    let clientX, clientY;
    if (event.touches && event.touches[0]) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Calcular posición inteligente para desktop
    let x = clientX;
    let y = clientY;

    if (window.innerWidth >= 768) {
      // Estimación del tamaño del menú (será ajustado después)
      const menuWidth = 280;
      const menuHeight = 400;

      // Ajustar para que no se salga de pantalla
      if (x + menuWidth > window.innerWidth - 20) {
        x = window.innerWidth - menuWidth - 20;
      }
      if (x < 20) {
        x = 20;
      }

      if (y + menuHeight > window.innerHeight - 20) {
        y = window.innerHeight - menuHeight - 20;
      }
      if (y < 20) {
        y = 20;
      }
    }

    setPropertiesPosition({ x, y });
    setPropertiesMenuOpen(true);
    hideContextMenu(); // Close context menu if open
  };

  // Close properties menu
  const closePropertiesMenu = () => {
    setPropertiesMenuOpen(false);
  };

  // Handle long press for mobile context menu
  useEffect(() => {
    let touchTimer = null;

    const handleTouchStart = (e) => {
      // Solo activar long press si estamos en modo select
      if (!isEditMode || tool !== "select") return;

      // Clear any existing timer
      if (touchTimer) {
        clearTimeout(touchTimer);
      }

      // Solo activar si tocamos una shape existente
      const touch = e.touches[0];
      const stage = stageRef.current;
      if (!stage) return;

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      const target = stage.getIntersection(pointerPosition);

      // Solo iniciar timer si tocamos una shape (no el fondo)
      if (
        target &&
        target.getClassName &&
        target.getClassName() !== "Group" &&
        target.id()
      ) {
        // Start long press timer (500ms)
        touchTimer = setTimeout(() => {
          const fakeEvent = {
            evt: {
              button: 2, // Right click
              clientX: touch.clientX,
              clientY: touch.clientY,
              preventDefault: () => {},
            },
          };

          showContextMenu(fakeEvent);
          // Haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, 500);
      }
    };

    const handleTouchEnd = () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    };

    const handleTouchMove = () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    };

    const stage = stageRef.current;
    if (stage) {
      const container = stage.container();
      // Solo agregar listeners si estamos en modo select
      if (isEditMode && tool === "select") {
        container.addEventListener("touchstart", handleTouchStart, {
          passive: false,
        });
        container.addEventListener("touchend", handleTouchEnd);
        container.addEventListener("touchmove", handleTouchMove);

        return () => {
          container.removeEventListener("touchstart", handleTouchStart);
          container.removeEventListener("touchend", handleTouchEnd);
          container.removeEventListener("touchmove", handleTouchMove);
        };
      }
    }
  }, [isEditMode, tool, showContextMenu]); // Agregar tool como dependencia

  // Context menu actions
  const deleteViaMenu = (id) => {
    // 🚀 SOLO servidor - Sin update local
    deleteShapeMut.mutate(id);
  };

  const bringFront = (id) => useCanvasStore.getState().bringShapeToFront(id);
  const sendBack = (id) => useCanvasStore.getState().sendShapeToBack(id);
  const bringForward = (id) => useCanvasStore.getState().bringShapeForward(id);
  const sendBackward = (id) => useCanvasStore.getState().sendShapeBackward(id);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-900 relative overflow-hidden"
    >
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,application/pdf"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />

      <Stage
        ref={(r) => (stageRef.current = r)}
        width={dims.width}
        height={dims.height}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable={tool === "hand"}
        onDragEnd={(e) => {
          if (tool === "hand") setPan({ x: e.target.x(), y: e.target.y() });
        }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageTouchStart} // Touch con detección de pinch
        onTouchMove={handleStageTouchMove} // Touch con detección de pinch
        onTouchEnd={handleStageTouchEnd} // Touch con detección de pinch
        onDblClick={(e) => {
          const id = e.target.id();
          if (id) handleShapeDoubleClick(id);
        }}
        onDblTap={(e) => {
          // Touch equivalente a double click
          const id = e.target.id();
          if (id) handleShapeDoubleClick(id);
        }}
        style={{ cursor: tool === "hand" ? "grab" : "crosshair" }}
      >
        <Layer>
          <Group x={offset.x} y={offset.y}>
            <Rect
              id="background-rect"
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill={backgroundColor}
              listening={false}
            />
            {backgroundImage && bgImg && (
              <KonvaImage
                image={bgImg}
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                listening={false}
              />
            )}
            {gridEnabled && (
              <Grid
                width={canvasWidth}
                height={canvasHeight}
                cellSize={GRID_CELL_SIZE}
              />
            )}
            <CanvasLayers
              layers={layers}
              shapes={shapes}
              selectedShapeIds={selectedShapeIds}
              tool={tool}
              toggleSelection={toggleSelection}
              setSelectedShape={setSelectedShape}
              handleTransformEnd={handleTransformEnd}
              handleShapeDragEnd={handleShapeDragEnd}
              handleShapeDoubleClick={handleShapeDoubleClick}
              setContextMenu={showContextMenu}
              autoEditTextId={autoEditTextId}
              updateShape={(id, props) => {
                // 🚀 SOLO servidor - Sin update local
                const shape = shapes.find((s) => s.id === id);
                if (!shape) return;

                updateShapeMut.mutate({
                  id,
                  data: {
                    data: { ...shape.props, ...props }, // Merge con props existentes
                  },
                });
              }}
              setActiveLayer={setActiveLayer}
            />
            <SelectBox selectBox={selectBox} />
          </Group>
          <MultiTransformer
            transformerRef={multiSelectRef}
            enabled={isEditMode && selectedShapeIds.length > 1}
          />
        </Layer>
      </Stage>

      <ContextMenu
        contextMenu={contextMenu}
        onBringToFront={bringFront}
        onSendToBack={sendBack}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onCopy={copyShape}
        onPaste={pasteShapeAction}
        onDelete={deleteViaMenu}
        onReplace={replaceShapeAction}
        onOpenProperties={openPropertiesMenu}
        clipboardShape={useCanvasStore.getState().clipboardShape}
        onClose={hideContextMenu}
        shapes={shapes}
        onToggleLock={(shapeId) => {
          const shape = shapes.find((s) => s.id === shapeId);
          if (shape) {
            updateShapeMut.mutate({
              id: shapeId,
              data: {
                name: shape.name,
                type: shape.type,
                order: shape.order,
                layer_id: shape.layerId,
                workspace_id: shape.workspace_id,
                data: shape.props,
                visible: shape.visible,
                locked: !shape.locked,
              },
            });
          }
          hideContextMenu();
        }}
      />

      {markerModalShapeId && (
        <MarkerModal
          shapeId={markerModalShapeId}
          onClose={() => setMarkerModalShapeId(null)}
        />
      )}

      {propertiesMenuOpen && (
        <ShapePropertiesMenu
          shapes={shapes}
          selectedShapeIds={
            selectedShapeIds.length > 0
              ? selectedShapeIds
              : selectedShapeId
              ? [selectedShapeId]
              : []
          }
          position={propertiesPosition}
          onClose={closePropertiesMenu}
          onUpdate={(shapeId, properties) => {
            const shape = shapes.find((s) => s.id === shapeId);
            if (!shape) return;

            updateShapeMut.mutate({
              id: shapeId,
              data: {
                data: { ...shape.props, ...properties },
              },
            });
          }}
        />
      )}
    </div>
  );
}
