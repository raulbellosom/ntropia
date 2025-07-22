import { useState, useEffect } from "react";
import { API_URL } from "../config";

export function useDirectusImage(src) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!src) return;
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      setUrl(src);
      return;
    }
    // Si el asset es público, solo usa la url pública
    if (src.match(/\/assets\/[a-zA-Z0-9-]+$/) || src.match(/^[a-zA-Z0-9-]+$/)) {
      const assetUrl = src.startsWith("http")
        ? src
        : src.startsWith("/assets/")
        ? `${window.location.origin}${src}`
        : `${API_URL}/assets/${src}`;
      setUrl(assetUrl); // ⬅️ no fetch!
      return;
    }
    setUrl(null);
  }, [src]);

  return url;
}
