// front/src/components/Auth/RegisterPage.jsx
import React, { useMemo, useState } from "react";
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useRegister } from "../../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import NtropiaLogo from "../Logo/NtropiaLogo";
import LandingLayout from "../../layouts/LandingLayout";

const PHRASES = [
  "¡Regístrate y crea sin límites!",
  "Construye tus ideas con Ntropia.",
  "Haz crecer tu creatividad.",
  "Una cuenta, infinitas posibilidades.",
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const navigate = useNavigate();
  const register = useRegister();
  const phrase = useMemo(
    () => PHRASES[Math.floor(Math.random() * PHRASES.length)],
    []
  );

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Simple email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    register.mutate(
      {
        email,
        password,
        first_name,
        last_name: last_name || "",
      },
      {
        onSuccess: () => {
          setSuccess(
            "¡Usuario registrado correctamente! Ahora puedes iniciar sesión."
          );
          setTimeout(() => navigate("/login"), 1800);
        },
        onError: () => {
          setError("No se pudo registrar. Contacta al administrador.");
        },
      }
    );
  };

  return (
    <LandingLayout>
      <div className="min-h-screen text-gray-700 flex items-center justify-center">
        <motion.div
          className="bg-white/90 shadow-2xl rounded-2xl p-8 max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.98, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col items-center mb-6">
            <NtropiaLogo className="h-12 w-12 mb-2 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-800">Crear Cuenta</h2>
            <motion.p
              className="text-gray-500 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {phrase}
            </motion.p>
          </div>
          <form
            className="space-y-4"
            onSubmit={handleRegister}
            autoComplete="on"
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className={`w-full py-2 pl-10 pr-3 rounded-xl border ${
                  error && !first_name ? "border-red-400" : "border-gray-300"
                } focus:ring-2 focus:ring-purple-500 outline-none`}
                placeholder="Nombre"
                value={first_name}
                autoFocus
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                disabled={register.isPending}
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className={`w-full py-2 pl-10 pr-3 rounded-xl border ${
                  error && !last_name ? "border-red-400" : "border-gray-300"
                } focus:ring-2 focus:ring-purple-500 outline-none`}
                placeholder="Apellidos"
                value={last_name}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                disabled={register.isPending}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                className={`w-full py-2 pl-10 pr-3 rounded-xl border ${
                  error && error.toLowerCase().includes("correo")
                    ? "border-red-400"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-purple-500 outline-none`}
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={register.isPending}
              />
            </div>
            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full py-2 pl-10 pr-10 rounded-xl border ${
                  error && error.toLowerCase().includes("contraseña")
                    ? "border-red-400"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-purple-500 outline-none`}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (confirmPassword && e.target.value === confirmPassword) {
                    setConfirmError("");
                  }
                }}
                required
                autoComplete="new-password"
                disabled={register.isPending}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? "text" : "password"}
                className={`w-full py-2 pl-10 pr-10 rounded-xl border ${
                  error && error.toLowerCase().includes("contraseña")
                    ? "border-red-400"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-purple-500 outline-none`}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                onBlur={() => {
                  if (confirmPassword && confirmPassword !== password) {
                    setConfirmError("Las contraseñas no coinciden.");
                  } else {
                    setConfirmError("");
                  }
                }}
                disabled={register.isPending}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={
                  showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {confirmError && (
              <div className="text-red-500 text-xs pl-2 mt-1">
                {confirmError}
              </div>
            )}
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
              {success && (
                <motion.div
                  className="text-green-600 text-sm text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="submit"
              disabled={register.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <UserPlus className="w-5 h-5" />
              {register.isPending ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>
          <div className="text-center text-sm mt-6 text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="text-purple-600 font-bold hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </motion.div>
      </div>
    </LandingLayout>
  );
}
