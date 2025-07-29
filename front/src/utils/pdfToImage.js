import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { uploadFile } from "../services/files";

// Usa import.meta.env.BASE_URL para obtener "/ntropia/" en producción/dev
pdfjsLib.GlobalWorkerOptions.workerSrc = `${
  import.meta.env.BASE_URL
}pdf.worker.js`;

export async function pdfToImage(file, scale = 2) {
  return new Promise((resolve, reject) => {
    // Validar que el archivo sea un PDF
    if (!file || file.type !== "application/pdf") {
      reject(new Error("El archivo debe ser un PDF válido"));
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result);

        // Validar que el array tenga contenido
        if (typedarray.length === 0) {
          throw new Error("El archivo PDF está vacío");
        }

        // Validar que empiece con el header de PDF
        const header = String.fromCharCode(...typedarray.slice(0, 4));
        if (header !== "%PDF") {
          throw new Error("El archivo no es un PDF válido");
        }

        const pdf = await pdfjsLib.getDocument({
          data: typedarray,
          verbosity: 0, // Reducir logs de pdfjs
        }).promise;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        const imgDataUrl = canvas.toDataURL("image/png");

        resolve({
          dataUrl: imgDataUrl,
          width: viewport.width,
          height: viewport.height,
        });
      } catch (error) {
        console.error("Error procesando PDF:", error);
        if (error.name === "InvalidPDFException") {
          reject(new Error("El archivo PDF está corrupto o no es válido"));
        } else {
          reject(new Error(`Error al procesar PDF: ${error.message}`));
        }
      }
    };

    fileReader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };

    fileReader.readAsArrayBuffer(file);
  });
}

/**
 * Convierte un PDF a imagen y lo sube a Directus
 * @param {File} file - Archivo PDF
 * @param {number} scale - Escala para la conversión
 * @returns {Promise<{fileId: string, width: number, height: number}>}
 */
export async function pdfToImageAndUpload(file, scale = 2) {
  try {
    // 1. Convertir PDF a imagen
    const { dataUrl, width, height } = await pdfToImage(file, scale);

    // 2. Convertir dataURL a Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // 3. Crear File desde Blob
    const fileName = file.name.replace(".pdf", ".png");
    const imageFile = new File([blob], fileName, { type: "image/png" });

    // 4. Subir a Directus
    const uploadResult = await uploadFile(imageFile, fileName);
    const fileId = uploadResult.data.data.id;

    return {
      fileId,
      width,
      height,
    };
  } catch (error) {
    console.error("Error converting and uploading PDF:", error);
    throw error;
  }
}
