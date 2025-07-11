// src/components/Marker/MarkerModal.jsx
import React, { useState, useEffect } from "react";
import ModalWrapper from "../common/ModalWrapper";
import { useCanvasStore } from "../../store/useCanvasStore";
import { useDropzone } from "react-dropzone";
import IconColorPicker from "../common/IconColorPicker";
import { Droplet } from "lucide-react";

export default function MarkerModal() {
  const selectedId = useCanvasStore((state) => state.selectedShapeId);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const deselectShape = useCanvasStore((state) => state.setSelectedShape);
  const shapes = useCanvasStore((state) => state.shapes);
  const marker = shapes.find((s) => s.id === selectedId && s.type === "marker");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [markerColor, setMarkerColor] = useState("#FF4D4F");

  // Sincronizar estado local cuando cambia el marcador seleccionado
  useEffect(() => {
    if (marker) {
      setTitle(marker.props.title || "");
      setDescription(marker.props.description || "");
      setImages(marker.props.images || []);
      setMarkerColor(marker.props.color || "#FF4D4F");
    }
  }, [marker]);

  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const save = () => {
    updateShape(selectedId, {
      props: {
        ...marker.props,
        title,
        description,
        images,
        color: markerColor,
      },
    });
    deselectShape(null);
  };

  if (!marker) return null;

  return (
    <ModalWrapper
      isOpen={Boolean(marker)}
      onClose={() => deselectShape(null)}
      title="Editar Marcador"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Color del marcador
          </label>
          <IconColorPicker
            icon={Droplet}
            color={markerColor}
            onChange={setMarkerColor}
            label="Color del marcador"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Imágenes</label>
          <div
            {...getRootProps()}
            className="border-dashed border-2 border-gray-300 rounded p-4 text-center cursor-pointer"
          >
            <input {...getInputProps()} />
            <p>Arrastra o haz click para subir imágenes</p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`preview-${i}`}
                className="w-full h-24 object-cover rounded"
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={() => deselectShape(null)}
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
      </div>
    </ModalWrapper>
  );
}
