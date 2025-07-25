// src/components/Auth/AcceptInvitationPage.jsx
import React, { useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  LogIn,
  MailOpen,
  Mail,
  UserPlus,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import {
  useInvitationByToken,
  useAcceptInvitation,
} from "../../hooks/useInvitations";
import { useCurrentUser } from "../../hooks/useAuth";

const PHRASES = [
  "¡Estás a punto de unirte a una nueva mesa de trabajo!",
  "Colabora, comparte y crea sin límites.",
  "Las mejores ideas nacen en equipo.",
  "¿Listo para empezar a colaborar?",
];

export default function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  const { data: invitation, isLoading, isError } = useInvitationByToken(token);
  const { mutate: acceptInvitation, isLoading: isAccepting } =
    useAcceptInvitation();

  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  const phrase = useMemo(
    () => PHRASES[Math.floor(Math.random() * PHRASES.length)],
    []
  );

  const handleAccept = () => {
    setError("");
    acceptInvitation(
      { token },
      {
        onSuccess: () => {
          setAccepted(true);
          toast.success("¡Invitación aceptada!");
          setTimeout(() => navigate("/dashboard"), 1800);
        },
        onError: () =>
          setError("No se pudo aceptar la invitación. Intenta nuevamente."),
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-900 via-indigo-900 to-fuchsia-800 px-2">
      <motion.div
        className="bg-white/90 shadow-2xl rounded-3xl p-8 w-full max-w-lg mx-auto"
        initial={{ opacity: 0, scale: 0.96, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Loader */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading"
              className="flex flex-col items-center gap-3 py-14"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Loader2 className="w-12 h-12 animate-spin text-sky-600" />
              <div className="text-lg text-gray-600">
                Verificando invitación...
              </div>
              <div className="text-sm text-gray-400">{phrase}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {!isLoading && (error || isError) && (
          <motion.div
            key="error"
            className="flex flex-col items-center gap-2 py-14"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <XCircle className="w-14 h-14 text-red-500 mb-1 animate-pulse" />
            <div className="text-xl font-bold text-red-600 mb-1">
              {error || "Invitación no encontrada o ya utilizada."}
            </div>
            <Link
              to="/dashboard"
              className="mt-4 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow transition"
            >
              Ir al Dashboard
            </Link>
          </motion.div>
        )}

        {/* Invitación válida y NO aceptada */}
        {!isLoading && invitation && !accepted && (
          <motion.div
            key="valid"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <MailOpen className="h-14 w-14 text-sky-600 mb-2 animate-bounce" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 text-center">
              ¡Te han invitado a{" "}
              <span className="text-sky-700">{invitation.workspace.name}</span>!
            </h1>
            <div className="text-gray-500 mb-1 text-center">
              {invitation.workspace.description ||
                "Colabora con tu equipo en esta mesa de trabajo."}
            </div>
            <div className="flex flex-col items-center my-3 w-full">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-sky-400" />
                <span className="text-gray-600 text-xs">
                  Invitación enviada por:{" "}
                  <b>
                    {" "}
                    {invitation?.invited_by?.first_name}{" "}
                    {invitation?.invited_by?.last_name || ""}{" "}
                  </b>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                {invitation.workspace.is_public ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold">
                    <UserPlus className="w-4 h-4" />
                    Pública
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                    <Lock className="w-4 h-4" />
                    Privada
                  </span>
                )}
              </div>
            </div>

            {!user ? (
              <Link
                to={`/login?next=/accept-invitation?token=${token}`}
                className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow transition text-lg"
              >
                <LogIn className="w-5 h-5" />
                Inicia sesión para aceptar
              </Link>
            ) : (
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className={`mt-4 w-full flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold transition text-lg shadow ${
                  isAccepting
                    ? "bg-sky-400 cursor-not-allowed"
                    : "bg-sky-600 hover:bg-sky-700 text-white"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                {isAccepting ? "Aceptando..." : "Aceptar invitación"}
              </button>
            )}
          </motion.div>
        )}

        {/* Invitación aceptada */}
        {!isLoading && accepted && (
          <motion.div
            key="accepted"
            className="flex flex-col items-center gap-3 py-14"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle2 className="w-14 h-14 text-green-500 mb-2 animate-pulse" />
            <div className="text-2xl font-extrabold text-green-700 text-center">
              ¡Bienvenido al equipo!
            </div>
            <div className="text-gray-600 mb-2">
              Ya eres miembro de{" "}
              <span className="font-bold">{invitation.workspace.name}</span>.
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow transition text-lg"
            >
              Ir al Dashboard
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
