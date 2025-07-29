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

  layers: [
    {
      id: baseLayerId,
      name: "Capa 1",
      visible: true,
      locked: false,
      opacity: 1,
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
  canvasWidth: 1200, // o el valor que quieras por defecto
  canvasHeight: 900, // o el valor que quieras por defecto

  // ==== Métodos de persistencia y sincronización ====

  /** Sobrescribe todas las capas con las que trae el backend (flags en false) */
  setAllLayers: (layersFromBackend) =>
    set({
      layers: layersFromBackend.map((l, idx) => ({
        ...l,
        _isNew: false,
        _dirty: false,
        _toDelete: false,
        name: l.name || `Capa ${idx + 1}`,
      })),
    }),

  /** Sobrescribe todas las figuras con las del backend (flags en false) */
  setAllShapes: (shapesFromBackend) =>
    set({
      shapes: shapesFromBackend.map((s) => ({
        ...s,
        // 🔄 Mapear 'data' del backend a 'props' del frontend
        props: s.data || s.props || {},
        layerId: s.layer_id || s.layerId,
        _isNew: false,
        _dirty: false,
        _toDelete: false,
      })),
    }),

  /** Marca un layer o shape como nuevo */
  markAsNew: (type, id) =>
    set((state) => ({
      [type]: state[type].map((item) =>
        item.id === id
          ? { ...item, _isNew: true, _dirty: false, _toDelete: false }
          : item
      ),
    })),

  /** Marca un layer o shape como editado */
  markAsDirty: (type, id) =>
    set((state) => ({
      [type]: state[type].map((item) =>
        item.id === id && !item._isNew ? { ...item, _dirty: true } : item
      ),
    })),

  /** Marca un layer o shape como eliminado (luego de guardar lo borras del store) */
  markAsToDelete: (type, id) =>
    set((state) => ({
      [type]: state[type].map((item) =>
        item.id === id ? { ...item, _toDelete: true } : item
      ),
    })),

  /** Limpia los flags después de sincronizar con backend */
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

  // ---- Modo de edición ----
  setMode: (mode) => {
    // Si cambiamos a modo view, limpiar selecciones
    if (mode === "view") {
      set({
        mode,
        selectedShapeId: null,
        selectedShapeIds: [],
        tool: "select", // resetear herramienta también
      });
    } else {
      set({ mode });
    }
  },

  toggleMode: () =>
    set((state) => {
      const newMode = state.mode === "edit" ? "view" : "edit";
      // Si cambiamos a modo view, limpiar selecciones
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
    // Buscar el mayor número usado en capas tipo "Capa X"
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
          order: state.layers.length, // 👈 agrega el campo order aquí
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
  /** Añade una capa que viene del servidor */
  addRemoteLayer: (layer) =>
    set((state) => {
      // Validación: asegurar que tenga id
      if (!layer.id) {
        console.warn("🔥 Layer sin id recibido:", layer);
        return state; // 👈 Devolver estado actual sin cambios
      }
      // si ya existe, no hagas nada
      if (state.layers.find((l) => l.id === layer.id)) {
        return state; // 👈 Devolver estado actual sin cambios
      }
      return {
        layers: [
          ...state.layers,
          {
            ...layer,
            _isNew: false,
            _dirty: false,
            _toDelete: false,
          },
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

      const currentLayer = state.layers[layerIndex];

      // Crear layer actualizado
      const updatedLayer = {
        ...layer,
        visible: Boolean(layer.visible),
        locked: Boolean(layer.locked),
        _isNew: false,
        _dirty: false,
        _toDelete: false,
      };

      // Crear nuevo array con el layer actualizado
      const newLayers = [...state.layers];
      newLayers[layerIndex] = updatedLayer;

      // Ordenar por order
      newLayers.sort((a, b) => a.order - b.order);

      const newState = {
        ...state,
        layers: newLayers,
        // Timestamp para forzar re-render
        _lastLayerUpdate: Date.now(),
      };

      return newState;
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

      // Intercambiar posiciones
      [newLayers[idx - 1], newLayers[idx]] = [
        newLayers[idx],
        newLayers[idx - 1],
      ];

      // Solo actualizar el order de los dos layers intercambiados
      newLayers[idx - 1].order = idx - 1;
      newLayers[idx].order = idx;

      // Marcar como dirty solo los intercambiados
      if (!newLayers[idx - 1]._isNew) newLayers[idx - 1]._dirty = true;
      if (!newLayers[idx]._isNew) newLayers[idx]._dirty = true;

      return {
        layers: newLayers,
      };
    });
  },
  moveLayerDown: (layerId) => {
    get().saveToHistory();
    set((state) => {
      const idx = state.layers.findIndex((l) => l.id === layerId);
      if (idx === -1 || idx === state.layers.length - 1) return {};
      const newLayers = [...state.layers];

      // Intercambiar posiciones
      [newLayers[idx], newLayers[idx + 1]] = [
        newLayers[idx + 1],
        newLayers[idx],
      ];

      // Solo actualizar el order de los dos layers intercambiados
      newLayers[idx].order = idx;
      newLayers[idx + 1].order = idx + 1;

      // Marcar como dirty solo los intercambiados
      if (!newLayers[idx]._isNew) newLayers[idx]._dirty = true;
      if (!newLayers[idx + 1]._isNew) newLayers[idx + 1]._dirty = true;

      return {
        layers: newLayers,
      };
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
      (s) => s.layerId === shape.layerId
    );
    const order =
      typeof shape.order === "number" ? shape.order : shapesOfLayer.length;
    const shapesOfType = state.shapes.filter((s) => s.type === type);
    const newName = `${capitalize(type)} ${shapesOfType.length + 1}`;
    set((state) => ({
      shapes: [
        ...state.shapes,
        {
          id,
          ...shape,
          order, // asegúrate que siempre tiene order
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
      // Validación: asegurar que tenga id
      if (!shape.id) {
        console.warn("🔥 Shape sin id recibido:", shape);
        return state; // 👈 Devolver estado actual sin cambios
      }
      return {
        shapes: [
          ...state.shapes,
          {
            ...shape,
            // 🔄 Mapear 'data' del backend a 'props' del frontend
            props: shape.data || shape.props || {},
            layerId: shape.layer_id || shape.layerId,
            _isNew: false,
            _dirty: false,
            _toDelete: false,
          },
        ],
      };
    }),

  /** Reemplaza la shape completa, ideal para eventos de update desde el servidor */
  updateRemoteShape: (shape) =>
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === shape.id
          ? {
              ...shape,
              // 🔄 Mapear 'data' del backend a 'props' del frontend
              props: shape.data || shape.props || {},
              layerId: shape.layer_id || shape.layerId,
              _isNew: false,
              _dirty: false,
              _toDelete: false,
            }
          : s
      ),
    })),

  /** Elimina del array la shape con id dado, para eventos de delete en tiempo real */
  removeRemoteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      // además limpiamos selección si estaba activa
      selectedShapeIds: state.selectedShapeIds.filter((sid) => sid !== id),
      selectedShapeId:
        state.selectedShapeId === id ? null : state.selectedShapeId,
    })),

  bringShapeToFront: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = [...state.shapes];
      const idx = shapes.findIndex((s) => s.id === id);
      if (idx === -1) return {};
      const [shape] = shapes.splice(idx, 1);
      shapes.push(shape);
      return {
        shapes: shapes.map((s) => ({
          ...s,
          _dirty: !s._isNew ? true : s._dirty,
        })),
      };
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
      return {
        shapes: shapes.map((s) => ({
          ...s,
          _dirty: !s._isNew ? true : s._dirty,
        })),
      };
    });
  },
  bringShapeForward: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = [...state.shapes];
      const shape = shapes.find((s) => s.id === id);
      if (!shape) return {};

      // Filtrar shapes de la misma capa
      const layerShapes = shapes.filter(
        (s) => s.layerId === shape.layerId && !s._toDelete
      );
      const currentIndex = layerShapes.findIndex((s) => s.id === id);

      if (currentIndex === -1 || currentIndex === layerShapes.length - 1)
        return {};

      // Intercambiar con la shape siguiente
      const nextShape = layerShapes[currentIndex + 1];
      const shapeIdx = shapes.findIndex((s) => s.id === id);
      const nextShapeIdx = shapes.findIndex((s) => s.id === nextShape.id);

      [shapes[shapeIdx], shapes[nextShapeIdx]] = [
        shapes[nextShapeIdx],
        shapes[shapeIdx],
      ];

      // Actualizar order fields y marcar como dirty solo las intercambiadas
      shapes[shapeIdx].order = currentIndex + 1;
      shapes[nextShapeIdx].order = currentIndex;
      if (!shapes[shapeIdx]._isNew) shapes[shapeIdx]._dirty = true;
      if (!shapes[nextShapeIdx]._isNew) shapes[nextShapeIdx]._dirty = true;

      return {
        shapes,
      };
    });
  },
  sendShapeBackward: (id) => {
    get().saveToHistory();
    set((state) => {
      const shapes = [...state.shapes];
      const shape = shapes.find((s) => s.id === id);
      if (!shape) return {};

      // Filtrar shapes de la misma capa
      const layerShapes = shapes.filter(
        (s) => s.layerId === shape.layerId && !s._toDelete
      );
      const currentIndex = layerShapes.findIndex((s) => s.id === id);

      if (currentIndex <= 0) return {};

      // Intercambiar con la shape anterior
      const prevShape = layerShapes[currentIndex - 1];
      const shapeIdx = shapes.findIndex((s) => s.id === id);
      const prevShapeIdx = shapes.findIndex((s) => s.id === prevShape.id);

      [shapes[shapeIdx], shapes[prevShapeIdx]] = [
        shapes[prevShapeIdx],
        shapes[shapeIdx],
      ];

      // Actualizar order fields y marcar como dirty solo las intercambiadas
      shapes[shapeIdx].order = currentIndex - 1;
      shapes[prevShapeIdx].order = currentIndex;
      if (!shapes[shapeIdx]._isNew) shapes[shapeIdx]._dirty = true;
      if (!shapes[prevShapeIdx]._isNew) shapes[prevShapeIdx]._dirty = true;

      return {
        shapes,
      };
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

  replaceShape: (id) => {
    const { clipboardShape, shapes, addShape, removeShape } = get();
    if (!clipboardShape) return;
    const target = shapes.find((s) => s.id === id);
    if (!target) return;

    // Nueva figura con props del clipboard, pero...
    let newProps = { ...clipboardShape.props };
    // drop id from clipboardShape
    delete newProps.id;
    // -- Mantén posición y medidas originales
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

    // Texto y nombre si aplica
    const name = target.name || clipboardShape.name;
    if ("text" in target.props) newProps.text = target.props.text;

    // Elimina el shape original y agrega el nuevo (nuevo id, misma capa)
    removeShape(id);
    addShape({
      id: generateId(), // nuevo id
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
  layersPanelVisible: false,
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
      layersPanelVisible: false, // 👈 oculta el panel de capas
      mode: "view", // o como quieras el estado inicial
      tool: "select",
      pan: { x: 0, y: 0 },
      zoom: 1,
      // ...agrega aquí cualquier otro estado UI/global de tu canvas
    }),
}));
