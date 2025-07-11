import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/ntropia/", // 👈 Esto es lo que corrige las rutas
  plugins: [
    react(),
    tailwindcss(),
  ],
});

