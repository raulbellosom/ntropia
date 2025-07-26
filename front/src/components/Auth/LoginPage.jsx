// src/components/Auth/LoginPage.jsx
import React, { useMemo, useState } from "react";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useLogin } from "../../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import NtropiaLogo from "../Logo/NtropiaLogo";
import LandingLayout from "../../layouts/LandingLayout";

const PHRASES = [
  "¡Nos alegra verte de vuelta!",
  "Tu creatividad comienza aquí.",
  "¡Bienvenido a Ntropia!",
  "Haz tus ideas realidad.",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const login = useLogin();
  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const { search } = useLocation();
  const next = new URLSearchParams(search).get("next") || "/dashboard";

  const phrase = useMemo(
    () => PHRASES[Math.floor(Math.random() * PHRASES.length)],
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login.mutateAsync({ email, password });
      navigate(next);
    } catch (error) {
      setError("Correo o contraseña incorrectos.");
    }
  };

  return (
    <LandingLayout>
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="bg-white/90 shadow-2xl rounded-2xl p-8 max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.98, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col items-center mb-6">
            <NtropiaLogo className="h-12 w-12  text-sky-600 mb-2 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h2>
            <motion.p
              className="text-gray-500 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {phrase}
            </motion.p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="on">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                className={`w-full py-2 pl-10 pr-3 rounded-xl border ${
                  error ? "border-red-400" : "border-gray-300"
                } focus:ring-2 focus:ring-sky-500 outline-none`}
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                autoComplete="username"
                disabled={login.isPending}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full py-2 pl-10 pr-10 rounded-xl border ${
                  error ? "border-red-400" : "border-gray-300"
                } focus:ring-2 focus:ring-sky-500 outline-none`}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={login.isPending}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sky-600"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div
                  className="text-red-600 text-sm text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <LogIn className="w-5 h-5" />
              {login.isPending ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <div className="text-center text-sm mt-6 text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-sky-600 font-bold hover:underline"
            >
              Regístrate aquí
            </Link>
          </div>
        </motion.div>
      </div>
    </LandingLayout>
  );
}
