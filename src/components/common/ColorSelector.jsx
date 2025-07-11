import React from "react";
import { ChromePicker } from "react-color";
import { useState } from "react";

const PRESET_COLORS = [
  "#FF4D4F",
  "#36CFC9",
  "#40A9FF",
  "#9254DE",
  "#FADB14",
  "#A0D911",
  "#FA8C16",
  "#595959",
  "#000000",
  "#FFFFFF",
];

export default function ColorSelector({ color, onChange, label }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative flex items-center space-x-2">
      {label && <span className="text-xs mr-1">{label}</span>}
      {/* Swatches */}
      {PRESET_COLORS.map((preset) => (
        <button
          key={preset}
          className={`w-6 h-6 rounded-full border-2 ${
            color === preset ? "border-blue-500" : "border-white"
          } shadow cursor-pointer`}
          style={{ background: preset }}
          onClick={() => onChange(preset)}
          type="button"
        />
      ))}
      {/* Personalizado */}
      <button
        className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white text-gray-700"
        onClick={() => setShowPicker((v) => !v)}
        type="button"
        title="Color personalizado"
      >
        🎨
      </button>
      {showPicker && (
        <div className="absolute z-50 top-10 left-0 bg-white p-2 rounded shadow">
          <ChromePicker
            color={color}
            onChange={(c) => onChange(c.hex)}
            disableAlpha
          />
        </div>
      )}
      {/* Preview actual */}
      <span
        className="w-6 h-6 rounded-full border-2 border-gray-400 ml-2 inline-block"
        style={{ background: color }}
        title={`Color actual: ${color}`}
      />
    </div>
  );
}
