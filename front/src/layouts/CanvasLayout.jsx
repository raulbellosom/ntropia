// src/layouts/CanvasLayout.jsx
import { Toaster } from "react-hot-toast";

export default function CanvasLayout({ children }) {
  return (
    <div className="w-full h-full min-h-screen bg-slate-900">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#181F37", color: "#fff", borderRadius: "1rem" },
          iconTheme: { primary: "#2563eb", secondary: "#fff" },
        }}
      />
      {children}
    </div>
  );
}
