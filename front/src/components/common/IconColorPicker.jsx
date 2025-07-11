import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SketchPicker } from "react-color";
import classNames from "classnames";
import { X } from "lucide-react";

function getContrastYIQ(hexcolor) {
  let hex = hexcolor.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((x) => x + x)
      .join("");
  }
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "black" : "white";
}

export default function IconColorPicker({
  color = "#000",
  onChange,
  icon: Icon,
  disabled = false,
  size = 28,
  label = "",
  pickerPlacement = "bottom",
  className,
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top:
          pickerPlacement === "top"
            ? rect.top + window.scrollY - 320
            : rect.top + rect.height + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [open, pickerPlacement]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  const iconColor = getContrastYIQ(color);

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className={classNames(
          "relative flex items-center justify-center rounded-full shadow transition-all border",
          { "opacity-60 cursor-not-allowed": disabled },
          className
        )}
        style={{
          width: size,
          height: size,
          background: color,
          borderColor: iconColor === "white" ? "#ddd" : "#222",
        }}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        title={label}
      >
        <Icon size={size * 0.6} color={iconColor} />
        <span
          className="absolute inset-0 rounded-full pointer-events-none border-2"
          style={{
            borderColor: iconColor === "white" ? "#bbb" : "#fff",
            opacity: 0.4,
          }}
        />
      </button>
      {open &&
        createPortal(
          <div
            className="z-[9999] absolute"
            style={{
              top: coords.top,
              left: coords.left,
            }}
            // <--- AQUI VA el onMouseDown y onClick
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-white p-2 rounded-xl shadow-2xl border"
              style={{ minWidth: 210, position: "relative" }}
            >
              <SketchPicker
                color={color}
                onChange={(c) => onChange?.(c.hex)}
                disableAlpha
              />
              <button
                className="absolute top-0 right-1 text-gray-500 hover:text-black text-xs"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
