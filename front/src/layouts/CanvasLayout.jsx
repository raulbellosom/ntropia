// src/layouts/CanvasLayout.jsx
import { Toaster } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useWorkspace } from "../hooks/useWorkspaces";
import NtropiaLogo from "../components/Logo/NtropiaLogo";

export default function CanvasLayout({ children }) {
  const { id: workspaceId } = useParams();
  const { data: workspace } = useWorkspace(workspaceId);

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

      {/* Logo y nombre del workspace */}
      <div className="absolute bottom-2 right-2 flex items-center gap-3 backdrop-blur-md rounded-lg p-2 opacity-25 hover:opacity-80 transition-opacity">
        {workspace?.name && (
          <span className="text-white font-medium text-sm hidden sm:block">
            {workspace.name}
          </span>
        )}
        <NtropiaLogo className="h-12 w-12" />
      </div>
    </div>
  );
}
