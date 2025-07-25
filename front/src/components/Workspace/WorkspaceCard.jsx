import React from "react";
import { motion } from "framer-motion";
import { Trash2, Settings2, WholeWord, Lock } from "lucide-react";
import WorkspaceMembers from "./WorkspaceMembers";

export default function WorkspaceCard({
  ws,
  user,
  onClick,
  onDelete,
  onConfig,
  isInvited = false,
}) {
  return (
    <motion.div
      className="relative rounded-3xl bg-white shadow-2xl hover:shadow-2xl hover:bg-gray-100 transition cursor-pointer overflow-hidden flex flex-col min-h-[180px] group backdrop-blur-2xl"
      onClick={onClick}
      style={{
        borderLeft: "8px solid #2563eb22",
        borderRight: "3px solid #2563eb09",
      }}
    >
      {/* Acciones si es dueño */}
      {!isInvited && ws.owner === user.id && (
        <div className="absolute top-3 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition pointer-events-auto z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-full hover:bg-red-100 transition"
            title="Eliminar mesa"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfig();
            }}
            className="p-1.5 rounded-full hover:bg-blue-100 transition"
            title="Configuraciones"
          >
            <Settings2 className="w-5 h-5 text-blue-500" />
          </button>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold text-lg text-[#274B8A]">{ws.name}</span>
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
            <span className="text-gray-300 italic">Sin descripción</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <WorkspaceMembers workspaceId={ws.id} />
          <span className="ml-auto text-xs text-gray-400">
            {ws.date_created && new Date(ws.date_created).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
