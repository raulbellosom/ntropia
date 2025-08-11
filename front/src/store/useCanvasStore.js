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

// ----------------- Helpers de orden por capa -----------------
function getLayerShapes(shapes, layerId) {
  return shapes.filter((s) => s.layerId === layerId && !s._toDelete);
}

function normalizeLayerOrders(shapes, layerId) {
  // Reindexa 0..N-1 por order asc (back→front)
  const out = [...shapes];
  const layer = getLayerShapes(out, layerId)
    .slice()
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  layer.forEach((s, i) => {
    const idx = out.findIndex((x) => x.id === s.id);
    if (idx !== -1) {
      out[idx] = { ...out[idx], order: i };
    }
  });
  return out;
}

function ensureNumericOrder(shapes) {
  // Asegura Number(order) en todas las shapes
  return shapes.map((s) => ({
    ...s,
    order: typeof s.order === "number" ? s.order : Number(s.order) || 0,
  }));
}

export const useCanvasStore = create((set, get) => ({
  // ---- Estado base ----
  mode: "view", // "view" o "edit"
  tool: "select",
  selectedShapeId: null,
  selectedShapeIds: [], // Para selección múltiple
  zoom: 1,
  pan: { x: 0, y: 0 },
  gridEnabled: true,
  strokeColor: DEFAULT_STROKE_COLOR,
  fillColor: DEFAULT_FILL_COLOR,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  backgroundImage: null,

  // Referencia al Stage de Konva para exportación
  stageRef: null,

  layers: [
    {
      id: baseLayerId,
      name: "Capa 1",
      visible: true,
      locked: false,
      opacity: 1,
      order: 0,
      _isNew: false,
      _dirty: false,
      _toDelete: false,
    },
  ],
  activeLayerId: baseLayerId,
  shapes: [],

  clipboardShape: null, // shape copiado

  // ---- Historial ----
  history: [],
  future: [],

  // Tamaño del canvas
  canvasWidth: 1200,
  canvasHeight: 900,

  // ==== Persistencia / Sync ====
  setAllLayers: (layersFromBackend) =>
    set({
      layers: layersFromBackend
        .map((l, idx) => ({
          ...l,
          order: typeof l.order === "number" ? l.order : idx,
          _isNew: false,
          _dirty: false,
          _toDelete: false,
          name: l.name || `Capa ${idx + 1}`,
        }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }),

  setAllShapes: (shapesFromBackend) =>
    set(() => {
      // Mapear y asegurar order numérico
      let mapped = shapesFromBackend.map((s) => ({
        ...s,
        order: typeof s.order === "number" ? s.order : Number(s.order) || 0,
        // 🔄 backend 'data' -> frontend 'props'
        props: s.data || s.props || {},
        layerId: s.layer_id || s.layerId,
        _isNew: false,
        _dirty: false,
        _toDelete: false,
      }));

      // Normalizar por capa para evitar duplicados / undefined
      const byLayer = mapped.reduce((acc, s) => {
        (acc[s.layerId] ||= []).push(s);
        return acc;
      }, {});
      Object.keys(byLayer).forEach((lid) => {
        const layer = byLayer[lid]
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        layer.forEach((s, i) => {
          s.order = i; // 0..N-1
        });
      });

      return { shapes: mapped };
    }),

  markAsNew: (type, id) =>
    set((state) => ({
      [type]: state[type].map((item) =>
        item.id === id
          ? { ...item, _isNew: true, _dirty: false, _toDelete: false }
          : item
      ),
    })),

  markAsDirty: (type, id) =>
    set((state) => ({
      [type]: state[type].map((item) =>
        item.id === id && !item._isNew ? { ...item, _dirty: true } : item
      ),
    })),

  markAsToDelete: (type, id) =>
    set((state) => ({
      [type]: state[type].map((item) =>
        item.id === id ? { ...item, _toDelete: true } : item
      ),
    })),

  clearAllFlags: () =>
    set((state) => ({
      layers: state.layers.map((l) => ({
        ...l,
        _isNew: false,
        _dirty: false,
        _toDelete: false,
      })),
      shapes: state.shapes.map((s) => ({
        ...s,
        _isNew: false,
        _dirty: false,
        _toDelete: false,
      })),
    })),

  // ---- Historial ----
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

  // ---- Modo ----
  setMode: (mode) => {
    if (mode === "view") {
      set({
        mode,
        selectedShapeId: null,
        selectedShapeIds: [],
        tool: "select",
      });
    } else {
      set({ mode });
    }
  },

  toggleMode: () =>
    set((state) => {
      const newMode = state.mode === "edit" ? "view" : "edit";
      if (newMode === "view") {
        return {
          mode: newMode,
          selectedShapeId: null,
          selectedShapeIds: [],
          tool: "select",
        };
      }
      return { mode: newMode };
    }),

  // ---- Canvas ----
  setTool: (tool) => {
    if (tool === "hand") {
      set({ tool, selectedShapeId: null, selectedShapeIds: [] });
    } else {
      set({ tool });
    }
  },
  setSelectedShape: (id) => {
    if (get().selectedShapeId !== id)
      set({ selectedShapeId: id, selectedShapeIds: id ? [id] : [] });
  },

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

  setStageRef: (stageRef) => set({ stageRef }),
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
  setBackgroundImage: (img) => set({ backgroundImage: img }),
  clearBackgroundImage: () => set({ backgroundImage: null }),

  setCanvasSize: ({ width, height }) =>
    set({
      canvasWidth: width,
      canvasHeight: height,
    }),

  // ---- Capas ----
  addLayer: () => {
    get().saveToHistory();
    const id = generateId();
    const layers = get().layers || [];
    let maxNum = 0;
    const capaRegex = /^Capa (\d+)$/i;
    layers.forEach((l) => {
      const match = l.name && l.name.match(capaRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const name = `Capa ${maxNum + 1}`;
    set((state) => ({
      layers: [
        ...state.layers,
        {
          id,
          name,
          visible: true,
          locked: false,
          opacity: 1,
          order: state.layers.length,
          _isNew: true,
          _dirty: false,
          _toDelete: false,
        },
      ],
      activeLayerId: id,
    }));
    return id;
  },

  toggleLayerVisibility: (layerId) => {
    get().saveToHistory();
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId
          ? { ...l, visible: !l.visible, _dirty: !l._isNew ? true : l._dirty }
          : l
      ),
    }));
  },
  toggleLayerLock: (layerId) => {
    get().saveToHistory();
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId
          ? { ...l, locked: !l.locked, _dirty: !l._isNew ? true : l._dirty }
          : l
      ),
    }));
  },
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),
  removeLayer: (layerId) => {
    get().saveToHistory();
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, _toDelete: true } : l
      ),
      shapes: state.shapes.map((s) =>
        s.layerId === layerId ? { ...s, _toDelete: true } : s
      ),
      activeLayerId:
        state.activeLayerId === layerId
          ? state.layers[0]?.id || null
          : state.activeLayerId,
    }));
  },

  addRemoteLayer: (layer) =>
    set((state) => {
      if (!layer.id) {
        console.warn("🔥 Layer sin id recibido:", layer);
        return state;
      }
      if (state.layers.find((l) => l.id === layer.id)) {
        return state;
      }
      return {
        layers: [
          ...state.layers,
          { ...layer, _isNew: false, _dirty: false, _toDelete: false },
        ],
      };
    }),

  updateRemoteLayer: (layer) => {
    set((state) => {
      const layerIndex = state.layers.findIndex((l) => l.id === layer.id);
      if (layerIndex === -1) {
        console.warn("❌ Layer no encontrado:", layer.id);
        return state;
      }
      const updatedLayer = {
        ...layer,
        visible: Boolean(layer.visible),
        locked: Boolean(layer.locked),
        _isNew: false,
        _dirty: false,
        _toDelete: false,
      };
      const newLayers = [...state.layers];
      newLayers[layerIndex] = updatedLayer;
      newLayers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      return { ...state, layers: newLayers, _lastLayerUpdate: Date.now() };
    });
  },

  removeRemoteLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      activeLayerId:
        state.activeLayerId === id
          ? state.layers[0]?.id || null
          : state.activeLayerId,
    })),

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
      newLayers[idx - 1].order = idx - 1;
      newLayers[idx].order = idx;
      if (!newLayers[idx - 1]._isNew) newLayers[idx - 1]._dirty = true;
      if (!newLayers[idx]._isNew) newLayers[idx]._dirty = true;
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
      newLayers[idx].order = idx;
      newLayers[idx + 1].order = idx + 1;
      if (!newLayers[idx]._isNew) newLayers[idx]._dirty = true;
      if (!newLayers[idx + 1]._isNew) newLayers[idx + 1]._dirty = true;
      return { layers: newLayers };
    });
  },

  setLayerOpacity: (layerId, opacity) => {
    get().saveToHistory();
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId
          ? { ...l, opacity, _dirty: !l._isNew ? true : l._dirty }
          : l
      ),
    }));
  },

  renameLayer: (layerId, newName) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId
          ? { ...l, name: newName, _dirty: !l._isNew ? true : l._dirty }
          : l
      ),
    })),

  // ---- Shapes ----
  addShape: (shape) => {
    get().saveToHistory();
    const id = generateId();
    const state = get();

    const type = shape.type || "Shape";
    const shapesOfLayer = state.shapes.filter(
      (s) => s.layerId === shape.layerId && !s._toDelete
    );
    const maxOrder =
      shapesOfLayer.length > 0
        ? Math.max(
            ...shapesOfLayer.map((s) =>
              typeof s.order === "number" ? s.order : Number(s.order) || 0
            )
          )
        : -1;

    const order = typeof shape.order === "number" ? shape.order : maxOrder + 1; // 🔑 nuevas al frente

    const shapesOfType = state.shapes.filter((s) => s.type === type);
    const newName = `${capitalize(type)} ${shapesOfType.length + 1}`;

    set((state2) => ({
      shapes: [
        ...state2.shapes,
        {
          id,
          ...shape,
          order,
          name: shape.name || newName,
          _isNew: true,
          _dirty: false,
          _toDelete: false,
        },
      ],
    }));
    return id;
  },

  updateShape: (id, newProps) => {
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id
          ? {
              ...s,
              props: { ...s.props, ...newProps },
              _dirty: !s._isNew ? true : s._dirty,
            }
          : s
      ),
    }));
  },

  removeShape: (id) => {
    get().saveToHistory();
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? { ...s, _toDelete: true } : s
      ),
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
        shapes: state.shapes.map((s) =>
          selectedShapeIds.includes(s.id) ? { ...s, _toDelete: true } : s
        ),
        selectedShapeIds: [],
        selectedShapeId: null,
      }));
    }
  },

  addRemoteShape: (shape) =>
    set((state) => {
      if (!shape.id) {
        console.warn("🔥 Shape sin id recibido:", shape);
        return state;
      }
      const layerId = shape.layer_id || shape.layerId;
      const current = ensureNumericOrder(state.shapes);
      const layerShapes = getLayerShapes(current, layerId);
      const maxOrder =
        layerShapes.length > 0
          ? Math.max(...layerShapes.map((s) => Number(s.order) || 0))
          : -1;

      const incomingOrder =
        typeof shape.order === "number"
          ? shape.order
          : Number(shape.order) || maxOrder + 1;

      const next = [
        ...current,
        {
          ...shape,
          order: incomingOrder,
          props: shape.data || shape.props || {},
          layerId,
          _isNew: false,
          _dirty: false,
          _toDelete: false,
        },
      ];

      return {
        shapes: normalizeLayerOrders(next, layerId),
      };
    }),

  updateRemoteShape: (shape) =>
    set((state) => {
      const layerId = shape.layer_id || shape.layerId;
      const next = state.shapes.map((s) =>
        s.id === shape.id
          ? {
              ...shape,
              order:
                typeof shape.order === "number"
                  ? shape.order
                  : Number(shape.order) || 0,
              props: shape.data || shape.props || {},
              layerId,
              _isNew: false,
              _dirty: false,
              _toDelete: false,
            }
          : s
      );
      return { shapes: normalizeLayerOrders(next, layerId) };
    }),

  removeRemoteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedShapeIds: state.selectedShapeIds.filter((sid) => sid !== id),
      selectedShapeId:
        state.selectedShapeId === id ? null : state.selectedShapeId,
    })),

  // ---- Z-index por order ----
  bringShapeToFront: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = ensureNumericOrder([...state.shapes]);
      const s = shapes.find((x) => x.id === id);
      if (!s) return {};

      const layerId = s.layerId;
      const layerShapes = getLayerShapes(shapes, layerId);
      const maxOrder =
        layerShapes.length > 0
          ? Math.max(...layerShapes.map((x) => Number(x.order) || 0))
          : -1;

      s.order = maxOrder + 1; // poner arriba
      if (!s._isNew) s._dirty = true;

      const normalized = normalizeLayerOrders(shapes, layerId);
      return { shapes: normalized };
    });
  },

  sendShapeToBack: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = ensureNumericOrder([...state.shapes]);
      const s = shapes.find((x) => x.id === id);
      if (!s) return {};

      const layerId = s.layerId;
      // Ponerlo como el más bajo y luego normalizar
      s.order = -1;
      if (!s._isNew) s._dirty = true;

      const normalized = normalizeLayerOrders(shapes, layerId);
      return { shapes: normalized };
    });
  },

  bringShapeForward: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = ensureNumericOrder([...state.shapes]);
      const s = shapes.find((x) => x.id === id);
      if (!s) return {};

      const sameLayer = shapes
        .filter((x) => x.layerId === s.layerId && !x._toDelete)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // back→front

      const idx = sameLayer.findIndex((x) => x.id === id);
      if (idx === -1 || idx === sameLayer.length - 1) return {};

      const next = sameLayer[idx + 1]; // el de adelante
      const o1 = Number(s.order) || 0;
      const o2 = Number(next.order) || 0;
      s.order = o2;
      next.order = o1;

      if (!s._isNew) s._dirty = true;
      if (!next._isNew) next._dirty = true;

      const normalized = normalizeLayerOrders(shapes, s.layerId);
      return { shapes: normalized };
    });
  },

  sendShapeBackward: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = ensureNumericOrder([...state.shapes]);
      const s = shapes.find((x) => x.id === id);
      if (!s) return {};

      const sameLayer = shapes
        .filter((x) => x.layerId === s.layerId && !x._toDelete)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // back→front

      const idx = sameLayer.findIndex((x) => x.id === id);
      if (idx <= 0) return {};

      const prev = sameLayer[idx - 1];
      const o1 = Number(s.order) || 0;
      const o2 = Number(prev.order) || 0;
      s.order = o2;
      prev.order = o1;

      if (!s._isNew) s._dirty = true;
      if (!prev._isNew) prev._dirty = true;

      const normalized = normalizeLayerOrders(shapes, s.layerId);
      return { shapes: normalized };
    });
  },

  copyShape: (id) => {
    const shape = get().shapes.find((s) => s.id === id);
    if (shape) {
      set({
        clipboardShape: JSON.parse(JSON.stringify({ ...shape, id: undefined })),
      });
    }
  },

  pasteShape: () => {
    const shape = get().clipboardShape;
    if (shape) {
      let newProps = { ...shape.props };
      if (typeof newProps.x === "number") newProps.x += 30;
      if (typeof newProps.y === "number") newProps.y += 30;
      if (Array.isArray(newProps.points)) {
        for (let i = 0; i < newProps.points.length; i += 2) {
          newProps.points[i] += 30;
          newProps.points[i + 1] += 30;
        }
      }
      get().addShape({
        ...shape,
        props: newProps,
      });
    }
  },

  replaceShape: (id) => {
    const { clipboardShape, shapes, addShape, removeShape } = get();
    if (!clipboardShape) return;
    const target = shapes.find((s) => s.id === id);
    if (!target) return;

    let newProps = { ...clipboardShape.props };
    delete newProps.id;
    newProps.x = target.props.x;
    newProps.y = target.props.y;

    if ("width" in target.props) newProps.width = target.props.width;
    if ("height" in target.props) newProps.height = target.props.height;
    if ("radius" in target.props) newProps.radius = target.props.radius;
    if ("points" in target.props) newProps.points = [...target.props.points];
    if ("rotation" in target.props) newProps.rotation = target.props.rotation;
    if ("scaleX" in target.props) newProps.scaleX = target.props.scaleX;
    if ("scaleY" in target.props) newProps.scaleY = target.props.scaleY;

    const name = target.name || clipboardShape.name;
    if ("text" in target.props) newProps.text = target.props.text;

    removeShape(id);
    addShape({
      id: generateId(),
      ...clipboardShape,
      layerId: target.layerId,
      name,
      props: newProps,
    });
  },

  toggleShapeVisibility: (shapeId) => {
    get().saveToHistory();
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === shapeId
          ? { ...s, visible: !s.visible, _dirty: !s._isNew ? true : s._dirty }
          : s
      ),
    }));
  },

  renameShape: (shapeId, newName) =>
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === shapeId
          ? { ...s, name: newName, _dirty: !s._isNew ? true : s._dirty }
          : s
      ),
    })),

  // ---- Layers panel visibility ----
  layersPanelVisible: true,
  showLayersPanel: () => set({ layersPanelVisible: true }),
  hideLayersPanel: () => set({ layersPanelVisible: false }),
  toggleLayersPanel: () =>
    set((state) => ({ layersPanelVisible: !state.layersPanelVisible })),

  resetAll: () =>
    set({
      layers: [],
      shapes: [],
      selectedShapeId: null,
      selectedShapeIds: [],
      history: [],
      future: [],
      backgroundImage: null,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,
      canvasWidth: 1200,
      canvasHeight: 900,
      layersPanelVisible: true,
      mode: "view",
      tool: "select",
      pan: { x: 0, y: 0 },
      zoom: 1,
      // ...agrega aquí cualquier otro estado UI/global de tu canvas
    }),
}));
