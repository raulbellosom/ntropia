import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import ModalWrapper from "../common/ModalWrapper";
import { useCanvasStore } from "../../store/useCanvasStore";
import { useUpdateWorkspace } from "../../hooks/useWorkspaces";
import { useUploadFile } from "../../hooks/useFiles";
import { generateId } from "../../utils/id";
import {
  Image as ImageIcon,
  Download,
  Settings,
  Info,
  PaintBucket,
  RefreshCw,
  Droplet,
  FileImage,
  FileText,
  X,
  Facebook,
  Instagram,
  Twitter,
  Coffee,
  Banknote,
} from "lucide-react";
import classNames from "classnames";
import IconColorPicker from "../common/IconColorPicker";
import { pdfToImage } from "../../utils/pdfToImage";
import { useEditMode } from "../../hooks/useEditMode";

export default function SettingsMenuModal({ isOpen, onClose }) {
  const { id: workspaceId } = useParams();
  const { isEditMode } = useEditMode();

  // Mutations para tiempo real
  const updateWorkspace = useUpdateWorkspace();
  const uploadFile = useUploadFile();

  // Crear TABS dinámicamente basado en el modo
  const TABS = [
    // Solo incluir tab Canvas si está en modo edición
    ...(isEditMode
      ? [{ key: "canvas", label: "Canvas", icon: <ImageIcon size={18} /> }]
      : []),
    { key: "export", label: "Exportar", icon: <Download size={18} /> },
    { key: "about", label: "About", icon: <Info size={18} /> },
  ];

  // Inicializar tab basado en el modo
  const [tab, setTab] = useState(() => {
    return isEditMode ? "canvas" : "export";
  });

  // Actualizar tab cuando cambie el modo de edición
  useEffect(() => {
    // Si está en modo visualización y el tab actual es canvas, cambiar a export
    if (!isEditMode && tab === "canvas") {
      setTab("export");
    }
    // Si está en modo edición y el modal se abre, usar canvas como default
    if (isEditMode && isOpen && !["canvas", "export", "about"].includes(tab)) {
      setTab("canvas");
    }
  }, [isEditMode, tab, isOpen]);

  // Store hooks
  const {
    canvasWidth,
    canvasHeight,
    setCanvasSize,
    backgroundColor,
    setBackgroundColor,
    resetView,
    setBackgroundImage,
    clearBackgroundImage,
    backgroundImage,
  } = useCanvasStore();

  // 🚀 Funciones de actualización en tiempo real
  const handleCanvasSizeChange = async (width, height) => {
    if (!isEditMode) return;

    const newWidth = Math.max(100, parseInt(width));
    const newHeight = Math.max(100, parseInt(height));

    // Actualizar localmente de inmediato
    setCanvasSize({ width: newWidth, height: newHeight });

    // Enviar al servidor
    try {
      await updateWorkspace.mutateAsync({
        id: workspaceId,
        data: {
          canvasWidth: newWidth,
          canvasHeight: newHeight,
        },
      });
    } catch (error) {
      console.error("Error updating canvas size:", error);
    }
  };

  const handleBackgroundColorChange = async (color) => {
    if (!isEditMode) return;

    // Actualizar localmente de inmediato
    setBackgroundColor(color);

    // Enviar al servidor
    try {
      await updateWorkspace.mutateAsync({
        id: workspaceId,
        data: { backgroundColor: color },
      });
    } catch (error) {
      console.error("Error updating background color:", error);
    }
  };

  const handleBackgroundImageChange = async (imageFile) => {
    if (!isEditMode) return;

    try {
      // Validar que sea una imagen
      if (!imageFile.type.startsWith("image/")) {
        toast.error("Por favor selecciona un archivo de imagen válido");
        return;
      }

      // Obtener dimensiones de la imagen
      const imageDimensions = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = URL.createObjectURL(imageFile);
      });

      // Subir archivo al servidor
      const uuid = generateId();
      const ext = imageFile.type.split("/")[1];
      const uploadResult = await uploadFile.mutateAsync({
        file: imageFile,
        fileName: `${uuid}.${ext}`,
      });

      const fileId = uploadResult.data.id || uploadResult.data.data?.id;

      // Actualizar workspace con nueva imagen Y dimensiones
      await updateWorkspace.mutateAsync({
        id: workspaceId,
        data: {
          background: fileId,
          canvasWidth: imageDimensions.width,
          canvasHeight: imageDimensions.height,
        },
      });

      // Actualizar canvas size localmente también
      setCanvasSize({
        width: imageDimensions.width,
        height: imageDimensions.height,
      });

      toast.success("Imagen de fondo actualizada");
      // La imagen se cargará automáticamente por el sistema de hidratación
    } catch (error) {
      console.error("Error uploading background image:", error);
      toast.error("Error al subir la imagen de fondo");
    }
  };

  const handleClearBackgroundImage = async () => {
    if (!isEditMode) return;

    // Actualizar localmente de inmediato
    clearBackgroundImage();

    // Enviar al servidor
    try {
      await updateWorkspace.mutateAsync({
        id: workspaceId,
        data: { background: null },
      });
      toast.success("Imagen de fondo eliminada");
    } catch (error) {
      console.error("Error clearing background image:", error);
      toast.error("Error al eliminar la imagen de fondo");
    }
  };

  // Export settings
  const stageRef = window.__konvaStageRef;

  const handleExport = (type) => {
    if (!stageRef) return;

    // Guarda zoom/pan actuales
    const stage = stageRef;
    const origScale = { x: stage.scaleX(), y: stage.scaleY() };
    const origPos = { x: stage.x(), y: stage.y() };

    // Offset del Group (mesa de trabajo)
    const offset = window.__konvaOffset || { x: 0, y: 0 };
    const width = canvasWidth;
    const height = canvasHeight;

    // Forzar Stage a escala 1 y sin pan
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();

    // Opcional: forzar fondo blanco para JPG
    const backgroundRect = stage.findOne("#background-rect");
    const prevFill = backgroundRect ? backgroundRect.fill() : null;
    if (type === "jpg" && backgroundRect) backgroundRect.fill("#fff");

    // Exporta solo el área lógica
    const uri = stage.toDataURL({
      x: offset.x,
      y: offset.y,
      width,
      height,
      pixelRatio: 3,
      mimeType: type === "jpg" ? "image/jpeg" : "image/png",
      quality: type === "jpg" ? 1 : undefined,
    });

    // Restaura todo a como estaba
    stage.scale(origScale);
    stage.position(origPos);
    stage.batchDraw();
    if (type === "jpg" && backgroundRect && prevFill)
      backgroundRect.fill(prevFill);

    // Descarga
    const link = document.createElement("a");
    link.download = `canvas.${type}`;
    link.href = uri;
    link.click();
  };

  // 🚀 Handler para cambio de imagen en tiempo real
  function handleBackgroundImageInput(e) {
    if (!isEditMode) return;

    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido");
      return;
    }

    handleBackgroundImageChange(file);

    // Limpiar el input para permitir seleccionar el mismo archivo otra vez
    e.target.value = "";
  }

  // 🚀 Handler para cambio de PDF en tiempo real
  async function handleBackgroundPdfInput(e) {
    if (!isEditMode) return;

    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea un PDF
    if (file.type !== "application/pdf") {
      toast.error("Por favor selecciona un archivo PDF válido");
      return;
    }

    try {
      toast.loading("Procesando PDF...", { id: "pdf-processing" });

      const { dataUrl, width, height } = await pdfToImage(file, 2);

      // Actualizar tamaño del canvas
      await handleCanvasSizeChange(Math.round(width), Math.round(height));

      // Convertir dataURL a blob y subir
      const blob = await fetch(dataUrl).then((r) => r.blob());
      await handleBackgroundImageChange(blob);

      toast.success("PDF convertido y aplicado como fondo", {
        id: "pdf-processing",
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error(`Error al procesar PDF: ${error.message}`, {
        id: "pdf-processing",
      });
    }

    // Limpiar el input para permitir seleccionar el mismo archivo otra vez
    e.target.value = "";
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex gap-2 items-center">
          <Settings size={20} />
          Menu{" "}
          {!isEditMode && (
            <span className="text-sm font-normal text-gray-500">
              (Modo Visualización)
            </span>
          )}
        </span>
      }
    >
      <div className="flex flex-col md:flex-row w-full max-w-[90vw] md:max-w-2xl min-h-[650px] md:min-h-[500px]">
        {/* Sidebar / Tabs */}
        <aside className="flex md:flex-col gap-1 md:pr-2 mb-2 md:mb-0 border-b md:border-b-0 md:border-r border-slate-200 md:min-w-[110px]">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              className={classNames(
                "flex items-center gap-2 px-3 py-2 rounded transition-colors font-medium w-full md:w-auto",
                tab === tabItem.key
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-slate-100 text-slate-700"
              )}
              onClick={() => setTab(tabItem.key)}
            >
              {tabItem.icon} {tabItem.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <section className="flex-1 pl-0 md:pl-6 overflow-y-auto relative">
          {/* Tab Canvas - Solo en modo edición */}
          {tab === "canvas" && isEditMode && (
            <div className="flex flex-col gap-y-8 md:gap-y-6 h-full">
              {/* Canvas Size */}
              <div>
                <h3 className="font-bold md:text-lg mb-2 flex items-center gap-2">
                  <ImageIcon size={18} /> Canvas Size
                </h3>
                <div className="flex sm:flex-row gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1 w-full sm:w-32">
                    <span className="text-xs font-semibold">Width</span>
                    <input
                      type="number"
                      min={100}
                      max={100000}
                      step={1}
                      pattern="\d*"
                      value={canvasWidth}
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        // Evita punto, coma y letras
                        if (e.key === "." || e.key === "," || e.key === "e")
                          e.preventDefault();
                      }}
                      onChange={(e) => {
                        // Solo actualizar el estado local sin validar aquí
                        const val = e.target.value.replace(/[^\d]/g, "");
                        setCanvasSize({
                          width: val === "" ? 0 : parseInt(val),
                          height: canvasHeight,
                        });
                      }}
                      onBlur={(e) => {
                        // Validar y corregir en onBlur
                        const val = e.target.value.replace(/[^\d]/g, "");
                        const numVal = val === "" ? 100 : parseInt(val);
                        const finalWidth = Math.max(
                          100,
                          Math.min(100000, numVal)
                        );

                        if (numVal < 100) {
                          toast.error("El ancho mínimo es 100px");
                        } else if (numVal > 100000) {
                          toast.error("El ancho máximo es 100,000px");
                        }

                        handleCanvasSizeChange(finalWidth, canvasHeight);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base text-center font-medium shadow-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-full sm:w-32">
                    <span className="text-xs font-semibold">Height</span>
                    <input
                      type="number"
                      min={100}
                      max={100000}
                      step={1}
                      pattern="\d*"
                      value={canvasHeight}
                      inputMode="numeric"
                      onChange={(e) => {
                        // Solo actualizar el estado local sin validar aquí
                        const val = e.target.value.replace(/[^\d]/g, "");
                        setCanvasSize({
                          width: canvasWidth,
                          height: val === "" ? 0 : parseInt(val),
                        });
                      }}
                      onBlur={(e) => {
                        // Validar y corregir en onBlur
                        const val = e.target.value.replace(/[^\d]/g, "");
                        const numVal = val === "" ? 100 : parseInt(val);
                        const finalHeight = Math.max(
                          100,
                          Math.min(100000, numVal)
                        );

                        if (numVal < 100) {
                          toast.error("La altura mínima es 100px");
                        } else if (numVal > 100000) {
                          toast.error("La altura máxima es 100,000px");
                        }

                        handleCanvasSizeChange(canvasWidth, finalHeight);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base text-center font-medium shadow-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>

              {/* Background */}
              <div>
                <h3 className="font-bold md:text-lg mb-2 flex items-center gap-2">
                  <PaintBucket size={18} /> Canvas Background
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  <IconColorPicker
                    icon={Droplet}
                    color={backgroundColor}
                    onChange={handleBackgroundColorChange}
                    label="Color de fondo"
                    size={32}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium ml-2 hover:bg-blue-100 border border-blue-300 transition"
                    onClick={() => handleBackgroundColorChange("#FFFFFF")}
                  >
                    <RefreshCw size={16} className="mr-1" />
                    Restablecer
                  </button>
                </div>
              </div>

              {/* Fondo con Imagen */}
              <div>
                <label className="text-xs font-semibold mb-1 flex items-center gap-2">
                  <FileImage size={18} /> Fondo con Imagen:
                </label>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-md cursor-pointer border border-slate-200 hover:bg-blue-50 transition w-full">
                    <FileImage size={18} />
                    <span className="text-xs font-medium">
                      Seleccionar Imagen
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBackgroundImageInput}
                    />
                  </label>
                  {backgroundImage && (
                    <div className="flex items-center gap-1 mt-2 sm:mt-0 flex-nowrap text-nowrap w-full">
                      <img
                        src={backgroundImage}
                        alt="Fondo"
                        className="h-9 w-9 object-cover rounded"
                      />
                      <button
                        type="button"
                        className="px-2 py-1 text-xs flex gap-2 h-9 items-center rounded bg-red-100 hover:bg-red-200 transition"
                        onClick={handleClearBackgroundImage}
                      >
                        <X size={20} /> Quitar imagen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fondo PDF */}
              <div className="w-full">
                <label className="text-xs font-semibold mb-1 flex items-center gap-2">
                  <FileText size={18} /> Fondo desde PDF:
                </label>
                <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-md cursor-pointer border border-slate-200 hover:bg-blue-50 transition w-full">
                  <FileText size={18} />
                  <span className="text-xs font-medium">Seleccionar PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleBackgroundPdfInput}
                  />
                </label>
              </div>

              {/* Reset */}
              <div>
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-red-100 transition w-full sm:w-auto"
                  onClick={resetView}
                >
                  <RefreshCw size={16} /> Reiniciar Vista del Canvas
                </button>
              </div>
            </div>
          )}

          {tab === "export" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Download size={18} /> Exportar Canvas
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white font-semibold w-full sm:w-auto"
                  onClick={() => handleExport("png")}
                >
                  <Download size={16} /> PNG
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white font-semibold w-full sm:w-auto"
                  onClick={() => handleExport("jpg")}
                >
                  <Download size={16} /> JPG
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Solo se exportará la zona de trabajo actual. Las figuras fuera
                del área se recortan.
              </p>
            </div>
          )}

          {tab === "about" && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Info size={18} /> About
              </h3>
              <div className="text-sm">
                <b>Desarrollado por Raul Belloso M</b> <br />
                <span className="text-xs text-gray-500">
                  Cualquier sugerencia o contacto en <br />
                  <a
                    className="text-blue-500 underline"
                    href="https://racoondevs.com"
                  >
                    racoondevs.com
                  </a>
                  {/* mail */}
                  <br />
                  <a
                    className="text-blue-500 underline"
                    href="mailto:raul.belloso.m@gmail.com"
                  >
                    raul.belloso.m@gmail.com
                  </a>
                </span>
                <br />
                Esta aplicación es un editor de canvas simple para crear dibujos
                y diseños. Puedes usar herramientas básicas como lápiz, borrador
                y formas geométricas.
                <br />
                <br />
                {/* Redes sociales */}
                <p className="text-sm mb-2">
                  Sígueme en redes sociales para más contenido y
                  actualizaciones:
                </p>
                <span className="text-xs text-gray-500 flex gap-2">
                  <a
                    className="text-white rounded-full p-3 bg-blue-600 flex items-center justify-center"
                    href="https://www.facebook.com/raul.bellosom"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook size={16} className="inline" />
                  </a>{" "}
                  <a
                    className="text-white rounded-full p-3 bg-fuchsia-400 flex items-center justify-center"
                    href="https://www.instagram.com/raulbellosom/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram size={16} className="inline" />
                  </a>{" "}
                  <a
                    className="text-white rounded-full p-3 bg-black flex items-center justify-center"
                    href="https://x.com/Raul_BellosoM"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter size={16} className="inline" />
                  </a>
                </span>
                {/* Donaciones */}
                <p className="text-sm mt-4">
                  Si te gusta este proyecto, considera hacer una donación para
                  apoyar su desarrollo:
                </p>
                <div className="flex gap-2 mt-2">
                  {/* <a
                    href="https://www.paypal.com/donate/?hosted_button_id=Z3X5K6Y7V8W9U"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white font-semibold"
                  >
                    <Banknote className="w-5 h-5" />
                    Donar con PayPal
                  </a> */}
                  <a
                    href="https://coff.ee/raulbellosom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-500 text-white font-semibold"
                  >
                    <Coffee className="w-5 h-5" />
                    Comprame un café
                  </a>
                </div>
                {/* Codigo abierto */}
                <p className="text-xs text-gray-500 mt-4">
                  Este proyecto es{" "}
                  <a
                    href="https://github.com/raulbellosom/ntropia"
                    className="text-blue-500 underline"
                  >
                    código abierto
                  </a>
                  . Puedes contribuir o reportar problemas en GitHub.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </ModalWrapper>
  );
}
