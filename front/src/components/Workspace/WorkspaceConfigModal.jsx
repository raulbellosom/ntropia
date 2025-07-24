import React, { useState } from "react";
import ModalWrapper from "../common/ModalWrapper";
import { toast } from "react-hot-toast";
import { Globe, Lock, MailPlus, Trash2 } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useUpdateWorkspace } from "../../hooks/useWorkspaces";
import {
  useWorkspaceMembers,
  useDeleteWorkspaceMember,
} from "../../hooks/useWorkspaceMembers";
import useAuthStore from "../../store/useAuthStore";
import { useCreateInvitation } from "../../hooks/useInvitations";

export default function WorkspaceConfigModal({
  isOpen,
  workspace,
  onClose,
  onSuccess,
}) {
  const user = useAuthStore((s) => s.user);
  const { data: members, isLoading: loadingMembers } = useWorkspaceMembers(
    workspace?.id
  );
  const deleteMember = useDeleteWorkspaceMember();
  const createInvitation = useCreateInvitation();

  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [isPublic, setIsPublic] = useState(!!workspace?.is_public);
  const [backgroundColor, setBackgroundColor] = useState(
    workspace?.backgroundColor || "#ffffff"
  );
  const [loading, setLoading] = useState(false);

  // Invitaciones
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const updateWorkspace = useUpdateWorkspace();

  React.useEffect(() => {
    setName(workspace?.name || "");
    setDescription(workspace?.description || "");
    setIsPublic(!!workspace?.is_public);
    setBackgroundColor(workspace?.backgroundColor || "#ffffff");
    setInviteEmail("");
  }, [workspace]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateWorkspace.mutateAsync({
        id: workspace.id,
        data: {
          name,
          description,
          is_public: isPublic,
          backgroundColor,
        },
      });
      toast.success("Configuración actualizada");
      onClose?.();
      onSuccess?.();
    } catch (e) {
      toast.error("Error al guardar los cambios");
    }
    setLoading(false);
  };

  // Simula la invitación, después conecta tu endpoint real
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Ingresa un correo válido.");
      return;
    }
    setInviting(true);
    try {
      await createInvitation.mutateAsync({
        email: inviteEmail,
        workspace_id: workspace.id,
        invited_by: user.id,
      });
      toast.success("Invitación enviada");
      setInviteEmail("");
      onSuccess?.();
    } catch {
      toast.error("Ocurrió un error al enviar la invitación");
    }
    setInviting(false);
  };

  // Eliminar miembro
  const handleRemoveMember = async (member) => {
    if (!window.confirm(`¿Eliminar a ${member.user?.email}?`)) return;
    try {
      await deleteMember.mutateAsync(member.id);
      toast.success("Miembro eliminado");
      onSuccess?.();
    } catch {
      toast.error("Error al eliminar miembro");
    }
  };

  if (!workspace) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración de mesa"
      className="max-w-lg"
    >
      <div className="flex flex-col gap-6">
        {/* Nombre y descripción */}
        <div>
          <label className="font-semibold text-sm text-gray-700 mb-1 block">
            Nombre de la mesa
          </label>
          <input
            className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-base"
            type="text"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="font-semibold text-sm text-gray-700 mb-1 block">
            Descripción
          </label>
          <textarea
            className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-base resize-none"
            rows={2}
            value={description}
            maxLength={160}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>
        {/* Público/Privado */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-gray-700">
            Visibilidad:
          </span>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            disabled={loading}
            className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold
              ${
                isPublic
                  ? "bg-green-100 text-green-700"
                  : "bg-indigo-100 text-indigo-700"
              }
              hover:shadow transition`}
            title={isPublic ? "Haz privado" : "Haz público"}
          >
            {isPublic ? (
              <>
                <Globe className="w-4 h-4" />
                Público
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Privado
              </>
            )}
          </button>
        </div>

        {/* Invitar miembro */}
        <div>
          <label className="font-semibold text-sm text-gray-700 mb-1 block">
            Invitar miembro
          </label>
          <form className="flex items-center gap-2" onSubmit={handleInvite}>
            <input
              className="flex-1 border px-3 py-2 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="email"
              placeholder="Correo electrónico"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviting || loading}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow disabled:opacity-60"
              disabled={inviting || loading || !inviteEmail}
            >
              <MailPlus className="w-4 h-4" />
              Invitar
            </button>
          </form>
          <div className="text-xs text-gray-400 mt-1">
            Se enviará una invitación (si el usuario existe recibirá una
            notificación).
          </div>

          {/* Miembros actuales */}
          <div className="mt-4">
            <label className="font-semibold text-sm text-gray-700 mb-1 block">
              Miembros actuales
            </label>
            <div className="flex flex-wrap gap-3 items-center">
              {loadingMembers ? (
                <span className="text-xs text-gray-400 animate-pulse">
                  Cargando...
                </span>
              ) : members && members.length > 0 ? (
                members.map((m) => {
                  const userM = m.user;
                  const name =
                    userM?.first_name ||
                    (userM?.email ? userM.email.split("@")[0] : "S/N");
                  const canRemove =
                    workspace.owner === user.id && user.id !== userM.id;
                  return (
                    <div
                      key={userM.id}
                      className="flex flex-col items-center relative"
                    >
                      <div
                        data-tooltip-id={`member-tooltip-${userM.id}`}
                        data-tooltip-content={userM.email}
                        data-tooltip-place="top"
                        className="cursor-pointer"
                      >
                        {userM.avatar ? (
                          <img
                            src={userM.avatar}
                            alt={name}
                            className="w-10 h-10 rounded-full border-2 border-white shadow object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-white bg-gray-200 text-gray-500 font-bold text-base">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <Tooltip id={`member-tooltip-${userM.id}`} />
                      </div>
                      <span className="text-xs text-gray-600 truncate max-w-[80px] mt-1">
                        {name}
                      </span>
                      {/* Eliminar (solo si eres owner y no eres tú mismo) */}
                      {canRemove && (
                        <button
                          className="absolute -top-2 -right-2 bg-white/90 rounded-full p-1 shadow-md border hover:bg-red-100 transition"
                          title="Eliminar miembro"
                          onClick={() => handleRemoveMember(m)}
                          disabled={deleteMember.isLoading}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-xs text-gray-400">Sin miembros</span>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow"
            onClick={handleSave}
            disabled={loading}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
