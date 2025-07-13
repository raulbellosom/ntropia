// src/store/useCanvasStore.js
import { create } from "zustand";
import { generateId } from "../utils/id";
import {
  DEFAULT_STROKE_COLOR,
  DEFAULT_FILL_COLOR,
  DEFAULT_BACKGROUND_COLOR,
} from "../utils/constants";

const baseLayerId = generateId();

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const useCanvasStore = create((set, get) => ({
  // ---- Estado base ----
  tool: "select",
  selectedShapeId: null,
  selectedShapeIds: [], // Para selección múltiple
  zoom: 1,
  pan: { x: 0, y: 0 },
  gridEnabled: true,
  strokeColor: DEFAULT_STROKE_COLOR,
  fillColor: DEFAULT_FILL_COLOR,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,

  layers: [
    { id: baseLayerId, name: "Base", visible: true, locked: false, opacity: 1 },
  ],
  activeLayerId: baseLayerId,
  shapes: [],

  clipboardShape: null, // shape copiado

  // ---- Historial ----
  history: [],
  future: [],

  saveToHistory: () => {
    const { shapes, layers, backgroundColor, history } = get();
    set({
      history: [
        ...history,
        {
          shapes: JSON.parse(JSON.stringify(shapes)),
          layers: JSON.parse(JSON.stringify(layers)),
          backgroundColor,
        },
      ],
      future: [],
    });
  },

  undo: () => {
    const { history, future, shapes, layers, backgroundColor } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      shapes: prev.shapes,
      layers: prev.layers,
      backgroundColor: prev.backgroundColor,
      history: history.slice(0, history.length - 1),
      future: [
        ...future,
        {
          shapes: JSON.parse(JSON.stringify(shapes)),
          layers: JSON.parse(JSON.stringify(layers)),
          backgroundColor,
        },
      ],
    });
  },

  redo: () => {
    const { history, future, shapes, layers, backgroundColor } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      shapes: next.shapes,
      layers: next.layers,
      backgroundColor: next.backgroundColor,
      history: [
        ...history,
        {
          shapes: JSON.parse(JSON.stringify(shapes)),
          layers: JSON.parse(JSON.stringify(layers)),
          backgroundColor,
        },
      ],
      future: future.slice(0, future.length - 1),
    });
  },

  // ---- Métodos canvas ----
  setTool: (tool) => set({ tool }),
  setSelectedShape: (id) => {
    if (get().selectedShapeId !== id)
      set({ selectedShapeId: id, selectedShapeIds: id ? [id] : [] });
  },

  // Métodos para selección múltiple
  addToSelection: (id) => {
    const current = get().selectedShapeIds;
    if (!current.includes(id)) {
      const newSelection = [...current, id];
      set({
        selectedShapeIds: newSelection,
        selectedShapeId: newSelection.length === 1 ? newSelection[0] : null,
      });
    }
  },

  removeFromSelection: (id) => {
    const current = get().selectedShapeIds;
    const newSelection = current.filter((shapeId) => shapeId !== id);
    set({
      selectedShapeIds: newSelection,
      selectedShapeId: newSelection.length === 1 ? newSelection[0] : null,
    });
  },

  toggleSelection: (id) => {
    const current = get().selectedShapeIds;
    if (current.includes(id)) {
      get().removeFromSelection(id);
    } else {
      get().addToSelection(id);
    }
  },

  clearSelection: () => {
    set({ selectedShapeId: null, selectedShapeIds: [] });
  },

  setMultipleSelection: (ids) => {
    set({
      selectedShapeIds: ids,
      selectedShapeId: ids.length === 1 ? ids[0] : null,
    });
  },

  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  zoomIn: () => set((state) => ({ zoom: state.zoom * 1.2 })),
  zoomOut: () => set((state) => ({ zoom: state.zoom / 1.2 })),
  resetView: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),

  toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),

  setBackgroundColor: (color) => {
    get().saveToHistory();
    set({ backgroundColor: color });
  },

  // ---- Capas ----
  addLayer: (name) => {
    get().saveToHistory();
    const id = generateId();
    set((state) => ({
      layers: [
        ...state.layers,
        { id, name, visible: true, locked: false, opacity: 1 },
      ],
      activeLayerId: state.activeLayerId || id,
    }));
  },
  toggleLayerVisibility: (layerId) => {
    get().saveToHistory();
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    }));
  },
  toggleLayerLock: (layerId) => {
    get().saveToHistory();
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, locked: !l.locked } : l
      ),
    }));
  },
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  removeLayer: (layerId) => {
    get().saveToHistory();
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== layerId),
      shapes: state.shapes.filter((s) => s.layerId !== layerId),
      activeLayerId:
        state.activeLayerId === layerId
          ? state.layers[0]?.id || null
          : state.activeLayerId,
    }));
  },
  moveLayerUp: (layerId) => {
    get().saveToHistory();
    set((state) => {
      const idx = state.layers.findIndex((l) => l.id === layerId);
      if (idx <= 0) return {};
      const newLayers = [...state.layers];
      [newLayers[idx - 1], newLayers[idx]] = [
        newLayers[idx],
        newLayers[idx - 1],
      ];
      return { layers: newLayers };
    });
  },
  moveLayerDown: (layerId) => {
    get().saveToHistory();
    set((state) => {
      const idx = state.layers.findIndex((l) => l.id === layerId);
      if (idx === -1 || idx === state.layers.length - 1) return {};
      const newLayers = [...state.layers];
      [newLayers[idx], newLayers[idx + 1]] = [
        newLayers[idx + 1],
        newLayers[idx],
      ];
      return { layers: newLayers };
    });
  },
  setLayerOpacity: (layerId, opacity) => {
    get().saveToHistory();
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, opacity } : l
      ),
    }));
  },
  renameLayer: (layerId, newName) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, name: newName } : l
      ),
    })),

  // ---- Shapes ----
  addShape: (shape) => {
    get().saveToHistory();
    const id = generateId();
    // Busca cuántos existen ya de ese tipo (y capa si quieres)
    const state = get();
    const type = shape.type || "Shape";
    const shapesOfType = state.shapes.filter((s) => s.type === type);
    const newName = `${capitalize(type)} ${shapesOfType.length + 1}`;
    set((state) => ({
      shapes: [...state.shapes, { id, ...shape, name: shape.name || newName }],
    }));
    return id;
  },

  updateShape: (id, newProps) => {
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? { ...s, props: { ...s.props, ...newProps } } : s
      ),
    }));
  },
  removeShape: (id) => {
    get().saveToHistory();
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedShapeIds: state.selectedShapeIds.filter(
        (shapeId) => shapeId !== id
      ),
      selectedShapeId:
        state.selectedShapeId === id ? null : state.selectedShapeId,
    }));
  },

  removeSelectedShapes: () => {
    const { selectedShapeIds } = get();
    if (selectedShapeIds.length > 0) {
      get().saveToHistory();
      set((state) => ({
        shapes: state.shapes.filter((s) => !selectedShapeIds.includes(s.id)),
        selectedShapeIds: [],
        selectedShapeId: null,
      }));
    }
  },

  bringShapeToFront: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = [...state.shapes];
      const idx = shapes.findIndex((s) => s.id === id);
      if (idx === -1) return {};
      const [shape] = shapes.splice(idx, 1);
      shapes.push(shape);
      return { shapes };
    });
  },
  sendShapeToBack: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = [...state.shapes];
      const idx = shapes.findIndex((s) => s.id === id);
      if (idx === -1) return {};
      const [shape] = shapes.splice(idx, 1);
      shapes.unshift(shape);
      return { shapes };
    });
  },
  bringShapeForward: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = [...state.shapes];
      const idx = shapes.findIndex((s) => s.id === id);
      if (idx < 0 || idx === shapes.length - 1) return {};
      [shapes[idx], shapes[idx + 1]] = [shapes[idx + 1], shapes[idx]];
      return { shapes };
    });
  },
  sendShapeBackward: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = [...state.shapes];
      const idx = shapes.findIndex((s) => s.id === id);
      if (idx <= 0) return {};
      [shapes[idx], shapes[idx - 1]] = [shapes[idx - 1], shapes[idx]];
      return { shapes };
    });
  },

  copyShape: (id) => {
    const shape = get().shapes.find((s) => s.id === id);
    if (shape) {
      // Guarda una copia profunda, sin el id
      set({
        clipboardShape: JSON.parse(JSON.stringify({ ...shape, id: undefined })),
      });
    }
  },

  pasteShape: () => {
    const shape = get().clipboardShape;
    if (shape) {
      // Opcional: mueve ligeramente la posición para no superponer
      let newProps = { ...shape.props };
      if (typeof newProps.x === "number") newProps.x += 30;
      if (typeof newProps.y === "number") newProps.y += 30;
      // Si es línea o free, mueve todos los puntos
      if (Array.isArray(newProps.points)) {
        for (let i = 0; i < newProps.points.length; i += 2) {
          newProps.points[i] += 30;
          newProps.points[i + 1] += 30;
        }
      }
      // Usa el método estándar para agregar shapes (esto también guarda en history)
      get().addShape({
        ...shape,
        props: newProps,
      });
    }
  },

  toggleShapeVisibility: (shapeId) => {
    get().saveToHistory();
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === shapeId ? { ...s, visible: !s.visible } : s
      ),
    }));
  },
  renameShape: (shapeId, newName) =>
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === shapeId ? { ...s, name: newName } : s
      ),
    })),

  // ---- Layers panel visibility ----
  layersPanelVisible: false,
  showLayersPanel: () => set({ layersPanelVisible: true }),
  hideLayersPanel: () => set({ layersPanelVisible: false }),
  toggleLayersPanel: () =>
    set((state) => ({ layersPanelVisible: !state.layersPanelVisible })),
}));
