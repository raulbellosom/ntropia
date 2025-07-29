// src/hooks/useImageUpload.js

/**
 * Hook para manejar la carga de imágenes y crear shapes de imagen en el canvas.
 *
 * Retorna:
 * - handleImageUpload: handler para el input file
 * - openImageInput: función para abrir el file input programáticamente
 *
 * Props requeridos:
 * - fileInputRef: ref al input file
 * - CANVAS_WIDTH, CANVAS_HEIGHT: dimensiones del canvas
 * - layers, activeLayerId: info de capas
 * - addShape: callback para crear shape
 * - setSelectedShape: callback para seleccionar shape creado
 * - setTool: callback para cambiar de herramienta (opcional)
 * - saveToHistory: callback para guardar historial (opcional)
 */

import { useUploadFile } from "./useFiles";
import { pdfToImageAndUpload } from "../utils/pdfToImage";
import { useCallback } from "react";

export default function useImageUpload({
  fileInputRef,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  layers,
  activeLayerId,
  addShape,
  setSelectedShape,
  setTool, // opcional
  saveToHistory, // opcional
}) {
  const uploadFile = useUploadFile();

  // Abre el selector de archivos - MEMOIZADO
  const openImageInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // permite volver a seleccionar la misma imagen
      fileInputRef.current.click();
    }
  }, [fileInputRef]);

  // Handler para cuando el usuario selecciona una imagen - MEMOIZADO
  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        let fileId, originalWidth, originalHeight;

        // Manejar PDFs de forma diferente
        if (file.type === "application/pdf") {
          const result = await pdfToImageAndUpload(file);
          fileId = result.fileId;
          originalWidth = result.width;
          originalHeight = result.height;
        } else {
          // Manejar imágenes normales
          const uploadResult = await uploadFile.mutateAsync({
            file,
            fileName: file.name,
          });
          fileId = uploadResult.data.data.id;

          // Obtener dimensiones de la imagen
          const reader = new FileReader();
          const dimensions = await new Promise((resolve) => {
            reader.onload = () => {
              const img = new window.Image();
              img.onload = () =>
                resolve({ width: img.width, height: img.height });
              img.src = reader.result;
            };
            reader.readAsDataURL(file);
          });
          originalWidth = dimensions.width;
          originalHeight = dimensions.height;
        }

        // Calcular dimensiones ajustadas
        const maxW = CANVAS_WIDTH;
        const maxH = CANVAS_HEIGHT;
        let w = originalWidth;
        let h = originalHeight;
        let scale = 1;

        if (w > maxW || h > maxH) {
          scale = Math.min(maxW / w, maxH / h);
          w = w * scale;
          h = h * scale;
        }

        // Centrar imagen en canvas visible
        const pos = {
          x: CANVAS_WIDTH / 2 - w / 2,
          y: CANVAS_HEIGHT / 2 - h / 2,
        };

        const layer = layers.find((l) => l.id === activeLayerId);
        if (layer && layer.locked) return;

        // Crear shape con el ID de Directus, NO con base64
        const id = await addShape({
          layerId: activeLayerId,
          type: "image",
          props: {
            x: pos.x,
            y: pos.y,
            src: fileId, // ✅ Solo guardamos el ID
            width: w,
            height: h,
          },
        });

        // Seleccionar la shape después de que se cree en el servidor
        if (id) {
          setTimeout(() => setSelectedShape(id), 100);
        }
        if (setTool) setTool("select");
        if (saveToHistory) saveToHistory();
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error al subir la imagen. Inténtalo de nuevo.");
      }
    },
    [
      uploadFile,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      layers,
      activeLayerId,
      addShape,
      setSelectedShape,
      setTool,
      saveToHistory,
    ]
  );

  return {
    handleImageUpload,
    openImageInput,
  };
}
