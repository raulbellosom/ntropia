// src/components/Toolbar/ToolButton.jsx
import React from "react";
import { useCanvasStore } from "../../store/useCanvasStore";

export default function ToolButton({ toolName, Icon, title }) {
  const setTool = useCanvasStore((state) => state.setTool);
  const activeTool = useCanvasStore((state) => state.tool);
  const isActive = activeTool === toolName;

  return (
    <button
      onClick={() => setTool(toolName)}
      title={title}
      className={`
        inline-flex items-center justify-center
        p-2 mr-2 rounded
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${isActive ? "bg-blue-100" : "bg-transparent hover:bg-gray-100"}
      `}
    >
      <Icon size={20} />
    </button>
  );
}
