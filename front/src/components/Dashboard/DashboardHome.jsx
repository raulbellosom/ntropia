import {
  PlusCircle,
  UserCircle,
  Users,
  Pencil,
  Loader2,
  Trash2,
  Settings2,
  Lock,
  WholeWord,
} from "lucide-react";
import { motion } from "framer-motion";
import CreateWorkspaceModal from "../Workspace/WorkspaceModal";
import useAuthStore from "../../store/useAuthStore";
import { useDeleteWorkspace, useWorkspaces } from "../../hooks/useWorkspaces";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import WorkspaceMembers from "../Workspace/WorkspaceMembers";
import ModalWrapper from "../common/ModalWrapper";
import { useDeleteFiles } from "../../hooks/useFiles";
import { toast } from "react-hot-toast";
import WorkspaceConfigModal from "../Workspace/WorkspaceConfigModal";
// import WorkspaceConfigModal from "../Workspace/WorkspaceConfigModal"; // TODO

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [wsToDelete, setWsToDelete] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [wsToConfig, setWsToConfig] = useState(null);

  const deleteWorkspace = useDeleteWorkspace();
  const deleteFiles = useDeleteFiles();

  const handleDeleteWorkspace = async () => {
    try {
      // 1. Obtén los IDs de archivos asociados a ese workspace
      let fileIds = [];
      if (wsToDelete.background) fileIds.push(wsToDelete.background);
      if (wsToDelete.preview) fileIds.push(wsToDelete.preview);

      // Si tienes acceso a los shapes aquí, agrega:
      // wsToDelete.shapes.forEach(s => { ... });

      // Elimina primero los archivos (solo si hay archivos)
      if (fileIds.length) {
        await deleteFiles.mutateAsync(fileIds);
      }

      // 2. Elimina el workspace
      await deleteWorkspace.mutateAsync(wsToDelete.id);

      toast.success("Workspace y archivos eliminados");
      setDeleteModalOpen(false);
      setWsToDelete(null);
      await refetchWorkspaces();
    } catch {
      toast.error("Error al eliminar workspace y sus archivos");
    }
  };

  const openConfigModal = (ws) => {
    setWsToConfig(ws);
    setConfigModalOpen(true);
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center px-2 py-8">
      {/* Banner bienvenida */}
      <motion.div
        className={`w-full max-w-3xl mx-auto mb-8 rounded-3xl shadow-2xl p-6 flex items-center gap-5 backdrop-blur-xl transition-all
          ${
            workspaces.length === 0
              ? "flex-col bg-white/10 text-center py-12"
              : "flex-row bg-white/20"
          }`}
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 70 }}
        style={{
          border: "1.5px solid rgba(40,76,185,0.10)",
          background:
            workspaces.length === 0
              ? "linear-gradient(120deg,rgba(37,99,235,0.10),rgba(255,255,255,0.05))"
              : "linear-gradient(120deg,rgba(37,99,235,0.09),rgba(255,255,255,0.02))",
        }}
      >
        <div className="relative flex-shrink-0">
          <div
            className={`rounded-full border-4 border-[#2563eb] bg-white/70 shadow flex items-center justify-center overflow-hidden
            ${workspaces.length === 0 ? "h-24 w-24" : "h-14 w-14"}
          `}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle
                className={`${
                  workspaces.length === 0 ? "w-12 h-12" : "w-8 h-8"
                } text-[#2563eb]`}
              />
            )}
          </div>
          {workspaces.length === 0 && (
            <button
              className="absolute bottom-2 right-0 bg-white rounded-full shadow p-1.5 border-2 border-[#2563eb] hover:bg-[#e8f1fa] transition"
              onClick={() => navigate("/profile")}
              title="Editar perfil"
            >
              <Pencil className="w-5 h-5 text-[#2563eb]" />
            </button>
          )}
        </div>
        <div className="flex-1">
          <h1
            className={`font-extrabold text-white mb-1 ${
              workspaces.length === 0
                ? "text-2xl md:text-3xl"
                : "text-xl md:text-2xl"
            }`}
          >
            {user?.first_name || user?.last_name
              ? `¡Bienvenido, ${user?.first_name ?? ""} ${
                  user?.last_name ?? ""
                }!`
              : "¡Bienvenido!"}
          </h1>
          {workspaces.length === 0 ? (
            <>
              <span className="font-bold text-white/90 text-base">
                Tus Mesas de Trabajo
              </span>
              <button
                className="flex items-center justify-center w-full gap-2 px-5 py-2 mt-4 rounded-xl bg-[#2563eb] hover:bg-[#274B8A] text-white font-bold shadow transition"
                onClick={() => {
                  setEditingWs(null);
                  setShowModal(true);
                }}
              >
                <PlusCircle className="w-5 h-5" />
                Nueva mesa de trabajo
              </button>
              <div className="text-xs text-gray-300 mt-2">
                Organiza, colabora y comparte tus ideas con tu equipo.
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] hover:bg-[#274B8A] text-white font-bold shadow transition text-sm"
                onClick={() => {
                  setEditingWs(null);
                  setShowModal(true);
                }}
              >
                <PlusCircle className="w-4 h-4" />
                Nueva mesa
              </button>
              <span className="text-sm text-white/80 font-semibold">
                {workspaces.length} mesa{workspaces.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Lista de mesas */}
      <div className="w-full max-w-6xl mx-auto">
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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <motion.div
                key={ws.id}
                className="relative rounded-3xl bg-white shadow-2xl hover:shadow-2xl hover:bg-gray-100 transition cursor-pointer overflow-hidden flex flex-col min-h-[180px] group backdrop-blur-2xl"
                onClick={() => navigate(`/workspace/${ws.id}`)}
                style={{
                  borderLeft: "8px solid #2563eb22",
                  borderRight: "3px solid #2563eb09",
                }}
              >
                {/* Acciones en hover */}
                <div className="absolute top-3 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition pointer-events-auto z-30">
                  {ws.owner === user.id && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setWsToDelete(ws);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-full hover:bg-red-100 transition"
                        title="Eliminar mesa"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfigModal(ws);
                        }}
                        className="p-1.5 rounded-full hover:bg-blue-100 transition"
                        title="Configuraciones"
                      >
                        <Settings2 className="w-5 h-5 text-blue-500" />
                      </button>
                    </>
                  )}
                </div>
                {/* Info card */}
                <div className="flex-1 flex flex-col p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg text-[#274B8A]">
                      {ws.name}
                    </span>
                    {ws.is_public ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-green-100 text-green-700 font-semibold">
                        <WholeWord className="inline-block w-3 h-3" />
                        Público
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg bg-gray-200 text-indigo-700 font-semibold">
                        <Lock className="inline-block w-3 h-3" />
                        Privado
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 mb-3 line-clamp-2 min-h-[2em]">
                    {ws.description || (
                      <span className="text-gray-300 italic">
                        Sin descripción
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <WorkspaceMembers workspaceId={ws.id} />
                    <span className="ml-auto text-xs text-gray-400">
                      {ws.date_created &&
                        new Date(ws.date_created).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
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
      <ModalWrapper
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWsToDelete(null);
        }}
        title="¿Eliminar mesa?"
      >
        <div className="space-y-4">
          <p>
            ¿Estás seguro de que quieres eliminar la mesa{" "}
            <b>{wsToDelete?.name}</b>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setWsToDelete(null);
              }}
              className="px-3 py-1 rounded bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteWorkspace}
              className="px-3 py-1 rounded bg-red-500 text-white font-semibold"
            >
              Eliminar
            </button>
          </div>
        </div>
      </ModalWrapper>
      <WorkspaceConfigModal
        isOpen={configModalOpen}
        workspace={wsToConfig}
        onClose={() => setConfigModalOpen(false)}
        onSuccess={refetchWorkspaces}
      />
    </div>
  );
}
