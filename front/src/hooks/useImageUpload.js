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
  // Abre el selector de archivos
  const openImageInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // permite volver a seleccionar la misma imagen
      fileInputRef.current.click();
    }
  };

  // Handler para cuando el usuario selecciona una imagen
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
        // Centrar imagen en canvas visible
        const pos = {
          x: CANVAS_WIDTH / 2 - w / 2,
          y: CANVAS_HEIGHT / 2 - h / 2,
        };

        const layer = layers.find((l) => l.id === activeLayerId);
        if (layer && layer.locked) return;

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
        if (setTool) setTool("select");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    if (saveToHistory) saveToHistory();
  };

  return {
    handleImageUpload,
    openImageInput,
  };
}
