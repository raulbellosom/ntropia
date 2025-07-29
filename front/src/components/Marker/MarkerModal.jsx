import React, { useState, useEffect, useRef } from "react";
import ModalWrapper from "../common/ModalWrapper";
import { useCanvasStore } from "../../store/useCanvasStore";
import { useDropzone } from "react-dropzone";
import IconColorPicker from "../common/IconColorPicker";
import {
  ChevronLeftCircle,
  ChevronRightCircle,
  Droplet,
  X,
  XCircle,
} from "lucide-react";
import { useEditMode } from "../../hooks/useEditMode";
import ImageWithDirectusUrl from "../common/ImageWithDirectusUrl";
import { useUploadFile } from "../../hooks/useFiles";
import { useUpdateShape } from "../../hooks/useShapes";

export default function MarkerModal({
  shapeId,
  onClose,
  viewOnly: viewOnlyProp,
}) {
  const lightboxContentRef = useRef(null);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const shapes = useCanvasStore((state) => state.shapes);
  const marker = shapes.find((s) => s.id === shapeId && s.type === "marker");
  const { isEditMode } = useEditMode();
  const uploadFile = useUploadFile();
  const updateShapeMutation = useUpdateShape(); // Hook para persistir en tiempo real

  // Permitir override por prop, pero por defecto usa global
  const viewOnly =
    typeof viewOnlyProp === "boolean" ? viewOnlyProp : !isEditMode;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [markerColor, setMarkerColor] = useState("#FF4D4F");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Auto-save cuando cambien los datos (opcional, para UX mejorada)
  useEffect(() => {
    if (marker && !viewOnly) {
      const timeoutId = setTimeout(() => {
        // Solo auto-guardar si hay cambios
        const hasChanges =
          title !== (marker.props.title || "") ||
          description !== (marker.props.description || "") ||
          JSON.stringify(images) !==
            JSON.stringify(marker.props.images || []) ||
          markerColor !== (marker.props.color || "#FF4D4F");

        if (hasChanges) {
          // Actualizar store local
          updateShape(shapeId, {
            title,
            description,
            images,
            color: markerColor,
          });

          // Sincronizar con servidor
          updateShapeMutation.mutate({
            id: shapeId,
            data: {
              data: {
                ...marker.props,
                title,
                description,
                images,
                color: markerColor,
              },
            },
          });
        }
      }, 2000); // Auto-save después de 2 segundos de inactividad

      return () => clearTimeout(timeoutId);
    }
  }, [
    title,
    description,
    images,
    markerColor,
    marker,
    viewOnly,
    shapeId,
    updateShape,
    updateShapeMutation,
  ]);

  // Resetear zoom cuando abres otra imagen
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [lightboxIndex]);

  const onDrop = async (acceptedFiles) => {
    if (viewOnly) return; // no hacer nada en solo visualización

    setIsUploading(true);
    try {
      const newImageIds = [];
      for (const file of acceptedFiles) {
        const uploadResult = await uploadFile.mutateAsync({
          file,
          fileName: file.name,
        });
        const fileId = uploadResult.data.data.id;
        newImageIds.push(fileId);
      }

      // Actualizar el estado local inmediatamente
      const updatedImages = [...images, ...newImageIds];
      setImages(updatedImages);

      // Sincronizar inmediatamente con la store y servidor
      updateShape(shapeId, {
        title,
        description,
        images: updatedImages, // ✅ Incluir las nuevas imágenes
        color: markerColor,
      });

      // Persistir en servidor
      updateShapeMutation.mutate({
        id: shapeId,
        data: {
          data: {
            ...marker.props,
            title,
            description,
            images: updatedImages, // ✅ Los IDs se guardan inmediatamente
            color: markerColor,
          },
        },
      });
    } catch (error) {
      console.error("Error uploading marker images:", error);
      alert("Error al subir las imágenes. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled: viewOnly || isUploading,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
  });

  if (!marker) return null;

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
        disableOutsideClick={lightboxIndex !== null}
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
                className={`border-dashed border-2 border-gray-300 rounded-lg p-3 text-center cursor-pointer transition-colors hover:border-gray-400 hover:bg-gray-50 ${
                  isUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-sm">
                    {isUploading
                      ? "Subiendo imágenes..."
                      : "Arrastra imágenes o haz clic"}
                  </span>
                </div>
              </div>
            )}
            <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
              <div className="grid grid-cols-4 gap-2">
                {images.length === 0 && viewOnly && (
                  <div className="col-span-4 text-center text-slate-400 italic py-6 text-sm">
                    Sin imágenes
                  </div>
                )}
                {images.map((src, i) => (
                  <div key={i} className="relative group">
                    <button
                      type="button"
                      className="focus:outline-none w-full relative overflow-hidden rounded-md bg-slate-100 hover:bg-slate-200 transition-colors block"
                      tabIndex={viewOnly ? 0 : -1}
                      onClick={() =>
                        viewOnly
                          ? setLightboxIndex(i)
                          : !viewOnly && setLightboxIndex(i)
                      }
                      style={{
                        cursor: "zoom-in",
                        aspectRatio: "1",
                        minHeight: "80px",
                      }}
                    >
                      <ImageWithDirectusUrl
                        src={src}
                        alt={`preview-${i}`}
                        className="object-cover w-full h-full rounded-md"
                        draggable={false}
                        onError={(e) => {
                          console.log("Error loading image:", src);
                          e.target.style.backgroundColor = "#f1f5f9";
                        }}
                        onLoad={(e) => {
                          e.target.style.backgroundColor = "transparent";
                        }}
                      />
                      <div className="absolute inset-0 bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full p-1.5">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                        </div>
                      </div>
                    </button>
                    {!viewOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedImages = images.filter(
                            (_, idx) => idx !== i
                          );
                          setImages(updatedImages);

                          // Sincronizar inmediatamente
                          updateShape(shapeId, {
                            title,
                            description,
                            images: updatedImages,
                            color: markerColor,
                          });

                          updateShapeMutation.mutate({
                            id: shapeId,
                            data: {
                              data: {
                                ...marker.props,
                                title,
                                description,
                                images: updatedImages,
                                color: markerColor,
                              },
                            },
                          });
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        title="Eliminar imagen"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ModalWrapper>
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/90"
          style={{ cursor: zoom > 1 ? "grab" : "zoom-in" }}
          tabIndex={0}
          onClick={(e) => {
            if (
              lightboxContentRef.current &&
              !lightboxContentRef.current.contains(e.target)
            ) {
              setLightboxIndex(null);
            }
          }}
        >
          {/* Botón cerrar */}
          <button
            className="absolute cursor-pointer top-8 right-8 z-50 text-white bg-black/30 rounded-full p-2 hover:bg-black/50"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
          >
            <XCircle size={28} />
          </button>

          {/* Botón anterior */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev > 0 ? prev - 1 : images.length - 1
                );
              }}
              className="absolute cursor-pointer left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
            >
              <ChevronLeftCircle size={28} />
            </button>
          )}

          {/* Botón siguiente */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev < images.length - 1 ? prev + 1 : 0
                );
              }}
              className="absolute cursor-pointer right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
            >
              <ChevronRightCircle size={28} />
            </button>
          )}

          {/* Contenedor de imagen */}
          <div
            ref={lightboxContentRef}
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
            <ImageWithDirectusUrl
              src={images[lightboxIndex]}
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
