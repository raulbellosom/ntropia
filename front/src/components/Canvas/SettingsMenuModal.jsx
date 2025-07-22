import React, { useEffect, useState } from "react";
import ModalWrapper from "../common/ModalWrapper";
import { useCanvasStore } from "../../store/useCanvasStore";
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
  Save,
  Undo2,
  Facebook,
  Instagram,
  Twitter,
  Coffee,
  Banknote,
} from "lucide-react";
import classNames from "classnames";
import IconColorPicker from "../common/IconColorPicker";
import { pdfToImage } from "../../utils/pdfToImage";

const TABS = [
  { key: "canvas", label: "Canvas", icon: <ImageIcon size={18} /> },
  { key: "export", label: "Exportar", icon: <Download size={18} /> },
  { key: "about", label: "About", icon: <Info size={18} /> },
];

export default function SettingsMenuModal({ isOpen, onClose }) {
  const [tab, setTab] = useState("canvas");

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

  // --- Estado temporal para edición (no guardes directo) ---
  const [draft, setDraft] = useState({
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor,
    backgroundImage,
  });
  useEffect(() => {
    if (isOpen) {
      setDraft({
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor,
        backgroundImage,
      });
    }
  }, [isOpen, canvasWidth, canvasHeight, backgroundColor, backgroundImage]);

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

  // Guardar los cambios generales
  function handleSaveAll() {
    setCanvasSize({
      width: Math.max(100, parseInt(draft.width)),
      height: Math.max(100, parseInt(draft.height)),
    });
    setBackgroundColor(draft.backgroundColor);
    if (draft.backgroundImage !== backgroundImage) {
      setBackgroundImage(draft.backgroundImage);
    }
    onClose();
  }
  // Deshacer los cambios locales
  function handleDiscard() {
    setDraft({
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor,
      backgroundImage,
    });
    onClose();
  }

  function handleBackgroundImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Generar dataURL para que sí pase la condición de subida en handleSaveAll
    const reader = new FileReader();
    reader.onload = function (ev) {
      const dataUrl = ev.target.result;
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        setDraft((d) => ({
          ...d,
          width: Math.round(img.width),
          height: Math.round(img.height),
          backgroundImage: dataUrl, // <-- Aquí guardamos el dataURL
        }));
      };
    };
    reader.readAsDataURL(file);
  }

  async function handleBackgroundPdfChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const { dataUrl, width, height } = await pdfToImage(file, 2);
    setDraft((d) => ({
      ...d,
      width: Math.round(width),
      height: Math.round(height),
      backgroundImage: dataUrl,
    }));
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex gap-2 items-center">
          <Settings size={20} />
          Menu
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
          {tab === "canvas" && (
            <form
              className="flex flex-col gap-y-8 md:gap-y-6 h-full"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveAll();
              }}
            >
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
                      max={6000}
                      step={1}
                      pattern="\d*"
                      value={draft.width}
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        // Evita punto, coma y letras
                        if (e.key === "." || e.key === "," || e.key === "e")
                          e.preventDefault();
                      }}
                      onChange={(e) => {
                        // Acepta solo enteros, elimina cualquier caracter no numérico
                        const val = e.target.value.replace(/[^\d]/g, "");
                        setDraft((d) => ({ ...d, width: val }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base text-center font-medium shadow-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-full sm:w-32">
                    <span className="text-xs font-semibold">Height</span>
                    <input
                      type="number"
                      min={100}
                      max={6000}
                      step={1}
                      pattern="\d*"
                      value={draft.height}
                      inputMode="numeric"
                      onChange={(e) => {
                        // Acepta solo enteros, elimina cualquier caracter no numérico
                        const val = e.target.value.replace(/[^\d]/g, "");
                        setDraft((d) => ({ ...d, height: val }));
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
                    color={draft.backgroundColor}
                    onChange={(color) =>
                      setDraft((d) => ({ ...d, backgroundColor: color }))
                    }
                    label="Color de fondo"
                    size={32}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium ml-2 hover:bg-blue-100 border border-blue-300 transition"
                    onClick={() =>
                      setDraft((d) => ({ ...d, backgroundColor: "#FFFFFF" }))
                    }
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
                      onChange={handleBackgroundImageChange}
                    />
                  </label>
                  {draft.backgroundImage && (
                    <div className="flex items-center gap-1 mt-2 sm:mt-0 flex-nowrap text-nowrap w-full">
                      <img
                        src={draft.backgroundImage}
                        alt="Fondo"
                        className="h-9 w-9 object-cover rounded"
                      />
                      <button
                        type="button"
                        className="px-2 py-1 text-xs flex gap-2 h-9 items-center rounded bg-red-100 hover:bg-red-200 transition"
                        onClick={() =>
                          setDraft((d) => ({ ...d, backgroundImage: null }))
                        }
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
                    onChange={handleBackgroundPdfChange}
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

              {/* Footer buttons */}
              <div className="flex sm:flex-row gap-3 justify-end items-center mt-2 pt-2 border-t">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition w-full sm:w-auto"
                  onClick={handleDiscard}
                >
                  <Undo2 size={18} /> Descartar
                </button>
                <button
                  type="submit"
                  className="flex items-center text-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow w-full sm:w-auto"
                >
                  <Save size={18} /> Guardar
                </button>
              </div>
            </form>
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
                  <a
                    href="https://www.paypal.com/donate/?hosted_button_id=Z3X5K6Y7V8W9U"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white font-semibold"
                  >
                    <Banknote className="w-5 h-5" />
                    Donar con PayPal
                  </a>
                  <a
                    href="https://ko-fi.com/raulbellosom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-500 text-white font-semibold"
                  >
                    <Coffee className="w-5 h-5" />
                    Donar con Ko-fi
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </ModalWrapper>
  );
}
