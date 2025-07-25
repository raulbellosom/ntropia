import { useState, useEffect } from "react";
import { API_URL } from "../config";
import api from "../services/api"; // 👈 Usa tu instancia con interceptores

export function useDirectusImage(src) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!src) return;

    if (src.startsWith("data:") || src.startsWith("blob:")) {
      setUrl(src);
      return;
    }

    // Si src ya viene como URL absoluta o relativa a /assets/
    if (src.startsWith("http") || src.startsWith("/assets/")) {
      setUrl(src.startsWith("http") ? src : `${window.location.origin}${src}`);
      return;
    }

    // Si src es un ID de Directus (ej. UUID)
    if (/^[a-zA-Z0-9-]{36}$/.test(src)) {
      const fetchImage = async () => {
        try {
          const response = await api.get(`/assets/${src}`, {
            responseType: "blob",
          });
          const blobUrl = URL.createObjectURL(response.data);
          setUrl(blobUrl);
        } catch (err) {
          console.error("Error fetching protected image:", err);
          setUrl(null);
        }
      };

      fetchImage();
      return;
    }

    setUrl(null);
  }, [src]);

  return url;
}
