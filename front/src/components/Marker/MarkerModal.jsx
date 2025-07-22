import React, { useState, useEffect, useRef } from "react";
import ModalWrapper from "../common/ModalWrapper";
import { useCanvasStore } from "../../store/useCanvasStore";
import { useDropzone } from "react-dropzone";
import IconColorPicker from "../common/IconColorPicker";
import { Droplet, X } from "lucide-react";
import { useEditMode } from "../../hooks/useEditMode";
import { API_URL } from "../../config";

export default function MarkerModal({
  shapeId,
  onClose,
  viewOnly: viewOnlyProp,
}) {
  const updateShape = useCanvasStore((state) => state.updateShape);
  const shapes = useCanvasStore((state) => state.shapes);
  const marker = shapes.find((s) => s.id === shapeId && s.type === "marker");
  const { isEditMode } = useEditMode();

  // Permitir override por prop, pero por defecto usa global
  const viewOnly =
    typeof viewOnlyProp === "boolean" ? viewOnlyProp : !isEditMode;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [markerColor, setMarkerColor] = useState("#FF4D4F");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // --- Para zoom ---
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  // Sincronizar estado local cuando cambia el marcador seleccionado
  useEffect(() => {
    if (marker) {
      setTitle(marker.props.title || "");
      setDescription(marker.props.description || "");
      setImages(marker.props.images || []);
      setMarkerColor(marker.props.color || "#FF4D4F");
    }
  }, [marker]);

  // Resetear zoom cuando abres otra imagen
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [lightboxIndex]);

  const onDrop = (acceptedFiles) => {
    if (viewOnly) return; // no hacer nada en solo visualización
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled: viewOnly,
  });

  const save = () => {
    updateShape(shapeId, {
      title,
      description,
      images,
      color: markerColor,
    });
    onClose();
  };

  if (!marker) return null;

  // Utilidad para mostrar imágenes: ID de backend o base64
  const getImageUrl = (src) => {
    if (!src) return "";
    if (/^data:/.test(src)) return src; // base64 local
    // Si es un ID del backend
    return `${API_URL}/assets/${src}`;
  };

  // --- Lightbox handlers ---
  const handleWheel = (e) => {
    let nextZoom = zoom + (e.deltaY < 0 ? 0.15 : -0.15);
    nextZoom = Math.max(1, Math.min(nextZoom, 4));
    setZoom(nextZoom);
  };

  const handleMouseDown = (e) => {
    if (zoom === 1) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    setOffset({
      x: offsetStart.current.x + (e.clientX - dragStart.current.x),
      y: offsetStart.current.y + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => {
    dragging.current = false;
  };

  const handleDoubleClick = () => {
    setZoom((z) => (z === 1 ? 2 : 1));
    setOffset({ x: 0, y: 0 });
  };

  // --- Touch handlers para drag en móvil ---
  const handleTouchStart = (e) => {
    if (e.touches.length === 1 && zoom > 1) {
      dragging.current = true;
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      offsetStart.current = { ...offset };
    }
  };

  const handleTouchMove = (e) => {
    if (dragging.current && e.touches.length === 1) {
      setOffset({
        x: offsetStart.current.x + (e.touches[0].clientX - dragStart.current.x),
        y: offsetStart.current.y + (e.touches[0].clientY - dragStart.current.y),
      });
    }
  };

  const handleTouchEnd = () => {
    dragging.current = false;
  };

  return (
    <>
      <ModalWrapper
        isOpen={Boolean(marker)}
        onClose={onClose}
        title={viewOnly ? "Detalle de Marcador" : "Editar Marcador"}
      >
        <div className="space-y-4">
          {/* Color */}
          <div>
            <label className="block text-sm font-medium">
              Color del marcador
            </label>
            {viewOnly ? (
              <div
                className="inline-flex items-center justify-center w-8 h-8 rounded-full"
                style={{
                  backgroundColor: markerColor,
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                }}
              >
                <Droplet color={"white"} />
              </div>
            ) : (
              <IconColorPicker
                icon={Droplet}
                color={markerColor}
                onChange={setMarkerColor}
                label="Color del marcador"
              />
            )}
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium">Título</label>
            {viewOnly ? (
              <div className="p-2 rounded bg-slate-50 border-b border-slate-200">
                {title || (
                  <span className="italic text-slate-400">Sin título</span>
                )}
              </div>
            ) : (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded p-2"
                disabled={viewOnly}
              />
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium">Descripción</label>
            {viewOnly ? (
              <div className="p-2 rounded bg-slate-50 border-b border-slate-200 min-h-[100px]">
                {description || (
                  <span className="italic text-slate-400">Sin descripción</span>
                )}
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded p-2"
                rows={3}
                disabled={viewOnly}
              />
            )}
          </div>

          {/* Imágenes */}
          <div>
            <label className="block text-sm font-medium">Imágenes</label>
            {!viewOnly && (
              <div
                {...getRootProps()}
                className="border-dashed border-2 border-gray-300 rounded p-4 text-center cursor-pointer"
              >
                <input {...getInputProps()} />
                <p>Arrastra o haz click para subir imágenes</p>
              </div>
            )}
            <div className="mt-2 grid grid-cols-4 gap-2">
              {images.length === 0 && viewOnly && (
                <div className="col-span-4 text-center text-slate-400 italic">
                  Sin imágenes
                </div>
              )}
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className="focus:outline-none"
                  tabIndex={viewOnly ? 0 : -1}
                  onClick={() => viewOnly && setLightboxIndex(i)}
                  style={{
                    cursor: viewOnly ? "zoom-in" : "default",
                    width: 64,
                    height: 64,
                    overflow: "hidden",
                    borderRadius: "0.5rem",
                    background: "#f8fafc",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={getImageUrl(src)}
                    alt={`preview-${i}`}
                    className="object-cover w-full h-full rounded"
                    style={{ width: 64, height: 64 }}
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Acciones */}
          {!viewOnly && (
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Guardar
              </button>
            </div>
          )}
        </div>
      </ModalWrapper>
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/90"
          style={{ cursor: zoom > 1 ? "grab" : "zoom-in" }}
          tabIndex={0}
          // Solo cierra si el usuario da click FUERA de la imagen, no durante el drag
          onClick={(e) => {
            // Solo cierra si el target es este div, no la imagen ni hijos
            if (e.target === e.currentTarget) setLightboxIndex(null);
          }}
        >
          {/* Botón cerrar */}
          <button
            className="absolute top-8 right-8 z-50 text-white bg-black/30 rounded-full p-2 hover:bg-black/50"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
          >
            <X size={28} />
          </button>
          {/* Contenedor de imagen para el zoom y drag */}
          <div
            className="relative"
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "visible",
              touchAction: "none",
            }}
            // Handlers de zoom y drag (idénticos a antes)
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={getImageUrl(images[lightboxIndex])}
              alt={`full-${lightboxIndex}`}
              className="select-none rounded-lg shadow-2xl"
              style={{
                width: "auto",
                height: "auto",
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: dragging.current ? "none" : "transform 0.15s",
                userSelect: "none",
                cursor: zoom > 1 ? "grab" : "zoom-in",
                margin: "auto",
                maxWidth: "90vw",
                maxHeight: "90vh",
                background: "#111",
              }}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        </div>
      )}
    </>
  );
}
