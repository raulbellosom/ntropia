// src/components/Canvas/ContextMenu.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Copy,
  ClipboardPaste,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function ContextMenu({
  contextMenu,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onCopy,
  onPaste,
  onDelete,
  clipboardShape,
  onClose,
  onReplace,
}) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Smart positioning para no salirte de la pantalla
  useEffect(() => {
    if (!contextMenu) return;
    setTimeout(() => {
      const menu = menuRef.current;
      if (!menu) return;
      const { innerWidth, innerHeight } = window;
      const rect = menu.getBoundingClientRect();
      let left = contextMenu.x;
      let top = contextMenu.y;
      if (left + rect.width > innerWidth - 8)
        left = innerWidth - rect.width - 8;
      if (top + rect.height > innerHeight - 8)
        top = innerHeight - rect.height - 8;
      if (top < 8) top = 8;
      if (left < 8) left = 8;
      setPos({ top, left });
    }, 0);
  }, [contextMenu]);

  // Cierra con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Cierra con click fuera, touch o scroll
  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handle);
    window.addEventListener("touchstart", handle);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("mousedown", handle);
      window.removeEventListener("touchstart", handle);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  // Auto-focus para accesibilidad
  useEffect(() => {
    menuRef.current?.focus();
  }, [contextMenu]);

  if (!contextMenu) return null;

  const animation = "animate-fade-in duration-150 transition-all ease-in-out";

  // Opciones del menú contextual
  const menuOptions = [
    {
      label: "Copiar",
      icon: Copy,
      action: () => onCopy(contextMenu.shapeId),
      shortcut: "Ctrl+C",
    },
    clipboardShape
      ? {
          label: "Pegar",
          icon: ClipboardPaste,
          action: () => onPaste(contextMenu.shapeId),
          shortcut: "Ctrl+V",
        }
      : null,
    clipboardShape
      ? {
          label: "Reemplazar",
          icon: ClipboardPaste,
          action: () => onReplace(contextMenu.shapeId),
          shortcut: "Ctrl+R",
          disabled: !clipboardShape,
        }
      : null,
    {
      label: "Eliminar",
      icon: Trash2,
      action: () => onDelete(contextMenu.shapeId),
      shortcut: "Del",
      className: "text-red-600 dark:text-red-400",
    },
    { type: "divider" },
    {
      label: "Traer al frente",
      icon: ArrowUpToLine,
      action: () => onBringToFront(contextMenu.shapeId),
    },
    {
      label: "Enviar al fondo",
      icon: ArrowDownToLine,
      action: () => onSendToBack(contextMenu.shapeId),
    },
    {
      label: "Subir",
      icon: ArrowUp,
      action: () => onBringForward(contextMenu.shapeId),
    },
    {
      label: "Bajar",
      icon: ArrowDown,
      action: () => onSendBackward(contextMenu.shapeId),
    },
  ].filter(Boolean);

  return (
    <div
      ref={menuRef}
      tabIndex={-1}
      className={`
        fixed z-[9999] min-w-48 px-2 py-2 rounded-2xl
        border border-slate-200 dark:border-slate-700
        bg-white/90 dark:bg-slate-900/90
        shadow-xl shadow-black/10
        ring-1 ring-slate-300/70 dark:ring-slate-800/50
        backdrop-blur-md
        ${animation}
        select-none
      `}
      style={{
        top: pos.top,
        left: pos.left,
        outline: "none",
        position: "fixed",
      }}
    >
      <div className="flex flex-col gap-0.5">
        {menuOptions.map((item, i) =>
          item.type === "divider" ? (
            <div
              key={"divider-" + i}
              className="my-1 border-t border-slate-200 dark:border-slate-700"
            />
          ) : (
            <button
              key={item.label}
              className={`
                w-full text-left flex items-center gap-2
                px-4 py-2
                rounded-lg
                text-[15px] font-medium
                hover:bg-blue-50 dark:hover:bg-slate-500
                focus:bg-blue-100 dark:focus:bg-blue-900
                transition-colors
                ${item.className || "text-slate-700 dark:text-slate-200"}
              `}
              onMouseDown={(e) => {
                e.preventDefault();
                if (!item.disabled) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
            >
              <item.icon size={18} className="opacity-80" />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs opacity-60">{item.shortcut}</span>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// Animación fade-in (solo una vez por app)
if (typeof window !== "undefined" && !window.__contextmenu_fadein_css) {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fade-in {
      from { opacity: 0; transform: scale(0.96);}
      to   { opacity: 1; transform: scale(1);}
    }
    .animate-fade-in { animation: fade-in 0.18s cubic-bezier(.4,0,.2,1) both; }
  `;
  document.head.appendChild(style);
  window.__contextmenu_fadein_css = true;
}
