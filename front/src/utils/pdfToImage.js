import * as pdfjsLib from "pdfjs-dist/build/pdf";

// Usa import.meta.env.BASE_URL para obtener "/ntropia/" en producción/dev
pdfjsLib.GlobalWorkerOptions.workerSrc = `${
  import.meta.env.BASE_URL
}pdf.worker.js`;

export async function pdfToImage(file, scale = 2) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
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
    };
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  });
}
