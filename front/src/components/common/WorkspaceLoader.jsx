// src/components/common/WorkspaceLoader.jsx
import React, { useMemo } from "react";
import { LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";

const PHRASES = [
  "¡Cargando tu mesa de trabajo!",
  "Preparando tus capas y herramientas...",
  "Ntropia, la creatividad en acción.",
  "La imaginación nunca duerme.",
  "Tus ideas están por tomar forma.",
  "Listando shapes y fondos...",
  "Todo listo para crear algo grande.",
];

export default function WorkspaceLoader({ text = "Cargando Workspace..." }) {
  // Elige una frase aleatoria al montar
  const phrase = useMemo(() => {
    return PHRASES[Math.floor(Math.random() * PHRASES.length)];
  }, []);

  return (
    <div className="fixed inset-0 min-h-screen flex items-center justify-center bg-gradient-to-br from-[#101726] via-[#232C47] to-[#1C2338] z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-6 border border-white/10"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        >
          <LayoutGrid className="w-14 h-14 text-[#2563eb] drop-shadow-xl" />
        </motion.div>
        <span className="text-white/90 text-xl font-extrabold tracking-tight">
          {text}
        </span>
        <motion.div
          className="w-40 h-2 bg-white/20 rounded-full overflow-hidden"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <motion.div
            className="h-full bg-[#2563eb] rounded-full"
            animate={{ x: [0, 128, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            }}
            style={{ width: "40%" }}
          />
        </motion.div>
        <span className="text-white/70 text-base italic mt-3">{phrase}</span>
      </motion.div>
    </div>
  );
}
