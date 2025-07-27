// src/layouts/CanvasLayout.jsx
import { Toaster } from "react-hot-toast";
import NtropiaLogo from "../components/Logo/NtropiaLogo";

export default function CanvasLayout({ children }) {
  return (
    <div className="w-full h-full min-h-screen bg-slate-900 relative">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#181F37", color: "#fff", borderRadius: "1rem" },
          iconTheme: { primary: "#2563eb", secondary: "#fff" },
        }}
      />
      {children}
      <NtropiaLogo className="absolute bottom-2 right-2 h-12 w-12 opacity-25" />
    </div>
  );
}
