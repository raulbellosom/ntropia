import React, { useMemo, useEffect } from "react";
import { LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import useAuthStore from "../store/useAuthStore";
import { useCurrentUser } from "../hooks/useAuth";

const PHRASES = [
  "Un gran proyecto empieza con una gran idea.",
  "¡Preparando tu espacio de trabajo!",
  "Ntropia, donde tus ideas toman forma.",
  "La creatividad es inteligencia divirtiéndose.",
  "¡Vamos por algo grande hoy!",
];

export default function AuthProvider({ children }) {
  const { isLoading, error, data } = useCurrentUser();
  const user = useAuthStore((s) => s.user);

  const phrase = useMemo(() => {
    return PHRASES[Math.floor(Math.random() * PHRASES.length)];
  }, []);

  // Logs mejorados para debug
  // useEffect(() => {
  //   console.log("AuthProvider state:", {
  //     isLoading,
  //     hasError: !!error,
  //     errorStatus: error?.response?.status,
  //     hasData: !!data,
  //     hasUser: !!user,
  //     hasToken: !!localStorage.getItem("access_token"),
  //     dataId: data?.id,
  //     userId: user?.id,
  //     // Nuevo: estado de sincronización
  //     isDataUserSynced: !!data && !!user && data.id === user.id,
  //   });
  // }, [isLoading, error, data, user]);

  const hasToken = !!localStorage.getItem("access_token");

  // Si hay error 401, no mostrar loading y permitir ir al login
  if (error?.response?.status === 401) {
    return children;
  }

  // Si no hay token, no mostrar loading
  if (!hasToken) {
    return children;
  }

  // Mejorar la condición de loading: esperar hasta que user y data estén sincronizados
  const shouldShowLoading =
    hasToken &&
    (isLoading || // Está cargando
      (!user && !error) || // No hay usuario y no hay error
      (data && !user) || // Hay data pero no user (estado de transición)
      (data && user && data.id !== user.id)); // Data y user no coinciden

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#101726] via-[#232C47] to-[#1C2338]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-6 border border-white/10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <LayoutGrid className="w-14 h-14 text-[#2563eb] drop-shadow-xl" />
          </motion.div>
          <span className="text-white/90 text-xl font-extrabold tracking-tight">
            Cargando Ntropia...
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

  return children;
}
