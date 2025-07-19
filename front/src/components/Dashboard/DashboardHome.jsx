import {
  PlusCircle,
  UserCircle,
  Users,
  Pencil,
  Loader2,
  Table2,
} from "lucide-react";
import { motion } from "framer-motion";
import CreateWorkspaceModal from "../Workspace/WorkspaceModal";
import useAuthStore from "../../store/useAuthStore";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { API_URL } from "../../config"; // <-- usa tu config centralizada

const getPreviewUrl = (preview) =>
  preview?.id ? `${API_URL}/assets/${preview.id}` : null;

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const {
    data: workspacesData,
    isLoading: loadingWs,
    refetch: refetchWorkspaces,
  } = useWorkspaces();

  const workspaces = workspacesData || [];
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingWs, setEditingWs] = useState(null);

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-2 py-8">
      {/* Card principal */}
      <motion.div
        className="w-full max-w-xl mx-auto bg-white/10 rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 backdrop-blur"
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 70 }}
      >
        {/* Avatar + Edit */}
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-[#2563eb] bg-white shadow flex items-center justify-center overflow-hidden mb-1">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle className="w-16 h-16 text-[#2563eb]" />
            )}
          </div>
          <button
            className="absolute bottom-2 right-0 bg-white rounded-full shadow p-1.5 border-2 border-[#2563eb] hover:bg-[#e8f1fa] transition"
            onClick={() => navigate("/profile")}
            title="Editar perfil"
          >
            <Pencil className="w-5 h-5 text-[#2563eb]" />
          </button>
          <div className="absolute -bottom-2 left-0 text-[#2563eb] bg-white rounded-full shadow p-1 border hidden md:block">
            <Users className="w-6 h-6" />
          </div>
        </div>
        {/* Bienvenida */}
        <div className="w-full text-center flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
            {user?.first_name || user?.last_name
              ? `¡Bienvenido, ${user?.first_name ?? ""} ${
                  user?.last_name ?? ""
                }!`
              : "¡Bienvenido!"}
          </h1>
        </div>
        {/* Acción rápida */}
        <div className="w-full flex flex-col items-center gap-3">
          <span className="font-bold text-white/90 text-base">
            Tus Mesas de Trabajo
          </span>
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#274B8A] text-white font-bold shadow transition"
            onClick={() => {
              setEditingWs(null);
              setShowModal(true);
            }}
          >
            <PlusCircle className="w-5 h-5" />
            Nueva mesa
          </button>
          <span className="text-xs text-gray-300">
            Organiza, colabora y comparte tus ideas con tu equipo.
          </span>
        </div>
      </motion.div>

      {/* Lista de mesas */}
      <div className="w-full max-w-3xl mx-auto mt-12">
        <h2 className="text-xl font-extrabold text-white/90 mb-5 text-center">
          Tus mesas recientes
        </h2>
        {loadingWs ? (
          <div className="flex items-center gap-2 text-white/80 justify-center py-10">
            <Loader2 className="animate-spin" /> Cargando mesas...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-white/60 text-center py-12 text-lg">
            <span className="text-5xl block mb-3">🪑</span>
            No tienes mesas de trabajo todavía.
            <br />
            <span className="text-white/40">
              ¡Crea una nueva y comienza a organizar tus ideas!
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
            {workspaces.map((ws) => (
              <motion.div
                key={ws.id}
                className="relative flex rounded-2xl bg-white/90 shadow-xl hover:shadow-2xl border border-[#e6eaf7] hover:scale-[1.03] transition cursor-pointer overflow-hidden min-h-[120px]"
                onClick={() => navigate(`/workspace/${ws.id}`)}
                whileHover={{
                  y: -3,
                  scale: 1.02,
                  boxShadow: "0 6px 24px #2563eb30",
                }}
              >
                {/* Imagen de fondo con fade hacia la izquierda */}
                {ws.preview && (
                  <img
                    src={getPreviewUrl(ws.preview)}
                    alt="Vista previa"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      objectPosition: "right center",
                    }}
                  />
                )}
                {/* Overlay de gradiente para desvanecer la imagen y mejorar contraste del texto */}
                <div className="absolute inset-0 bg-gradient-to-l from-white/90 via-white/60 to-white/0 pointer-events-none" />

                {/* Contenido textual en la izquierda */}
                <div className="relative z-10 flex-1 flex flex-col justify-between p-5 min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1 font-bold text-lg text-[#274B8A]">
                      {ws.name}
                    </div>
                    <div className="text-sm text-gray-600 mb-2 line-clamp-2 min-h-[2em]">
                      {ws.description || (
                        <span className="text-gray-300 italic">
                          Sin descripción
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto text-xs text-gray-400">
                    {ws.date_created &&
                      new Date(ws.date_created).toLocaleDateString()}
                  </div>
                </div>
                {/* Si no hay preview, muestra el ícono a la derecha */}
                {!ws.preview && (
                  <div className="flex items-center justify-center w-32 bg-[#f4f7fb]">
                    <Table2 className="w-12 h-12 text-[#2563eb] opacity-80" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={showModal}
        onClose={() => {
          setEditingWs(null);
          setShowModal(false);
        }}
        initialData={editingWs}
        onSuccess={async () => {
          setShowModal(false);
          setEditingWs(null);
          await refetchWorkspaces();
        }}
      />
    </div>
  );
}
