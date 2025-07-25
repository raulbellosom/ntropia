import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Crown,
  Shield,
  Edit3,
  Eye,
  User,
  Settings,
  Users,
  Mail,
  Lock,
  Globe,
  UserPlus,
  X,
  Save,
} from "lucide-react";
import ModalWrapper from "../common/ModalWrapper";
import { useUpdateWorkspace } from "../../hooks/useWorkspaces";
import {
  useWorkspaceMembers,
  useDeleteWorkspaceMember,
  useUpdateWorkspaceMember,
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
  const updateMemberRole = useUpdateWorkspaceMember();
  const createInvitation = useCreateInvitation();
  const updateWorkspace = useUpdateWorkspace();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deletingMember, setDeletingMember] = useState(false);

  useEffect(() => {
    setName(workspace?.name || "");
    setDescription(workspace?.description || "");
    setIsPublic(!!workspace?.is_public);
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
        },
      });
      toast.success("Configuración actualizada");
      onClose?.();
      onSuccess?.();
    } catch {
      toast.error("Error al guardar los cambios");
    }
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Correo inválido");
      return;
    }
    setInviting(true);
    try {
      await createInvitation.mutateAsync({
        email: inviteEmail,
        workspace_id: workspace.id,
        invited_by: user.id,
        role: inviteRole,
      });
      toast.success("Invitación enviada");
      setInviteEmail("");
      onSuccess?.();
    } catch {
      toast.error("Error al invitar miembro");
    }
    setInviting(false);
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    setDeletingMember(true);
    try {
      await deleteMember.mutateAsync(memberToDelete.id);
      toast.success("Miembro eliminado");
      setMemberToDelete(null);
      onSuccess?.();
    } catch {
      toast.error("Error al eliminar miembro");
    }
    setDeletingMember(false);
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateMemberRole.mutateAsync({
        id: memberId,
        data: { role: newRole },
      });
      toast.success("Rol actualizado");
      onSuccess?.();
    } catch {
      toast.error("Error al actualizar rol");
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "owner":
        return "Propietario";
      case "editor":
        return "Editor";
      case "admin":
        return "Admin";
      default:
        return "Visualizador";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />;
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "editor":
        return <Edit3 className="h-3 w-3" />;
      case "viewer":
        return <Eye className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800";
      case "admin":
        return "bg-red-100 text-red-800";
      case "editor":
        return "bg-blue-100 text-blue-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!workspace) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración del Workspace"
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Configuración General */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" /> Configuración General
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del workspace</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Visibilidad</label>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm border border-gray-200  ${
                isPublic
                  ? "bg-green-100 text-green-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {isPublic ? (
                <Globe className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {isPublic ? "Público" : "Privado"}
            </button>
            <p className="text-xs text-gray-500">
              {isPublic
                ? "Cualquiera con el enlace puede ver el workspace"
                : "Solo los miembros invitados pueden acceder"}
            </p>
          </div>
        </div>

        {/* Invitar Miembro */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Invitar Miembro
          </h2>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-6">
              <label className="text-sm font-medium">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="col-span-6 md:col-span-3">
              <label className="text-sm font-medium">Rol</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              >
                <option value="viewer">Visualizador</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="col-span-6 md:col-span-3 flex items-end">
              <button
                onClick={handleInvite}
                className="w-full bg-blue-600  hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
              >
                <span>
                  <UserPlus className="h-4 w-4 text-white" />
                </span>
                Invitar
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Se enviará una invitación al correo especificado
          </p>
        </div>

        {/* Miembros actuales */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Miembros Actuales
          </h2>
          <div className="space-y-3">
            {members && members.length > 0 ? (
              members.map((m) => {
                const userM = m.user;
                const name =
                  userM?.first_name || userM?.email.split("@")[0] || "S/N";
                const canRemove =
                  workspace.owner === user.id && user.id !== userM.id;
                return (
                  <div
                    key={userM.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {userM.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.role !== "owner" ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(m.id, e.target.value)
                          }
                          className={`text-xs font-medium px-2 py-1 rounded-lg border ${getRoleColor(
                            m.role
                          )}`}
                        >
                          <option value="viewer">Visualizador</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Administrador</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full border ${getRoleColor(
                            m.role
                          )}`}
                        >
                          {getRoleIcon(m.role)}{" "}
                          <span className="ml-1">{getRoleLabel(m.role)}</span>
                        </span>
                      )}
                      {canRemove && (
                        <button
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => setMemberToDelete(m)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">Sin miembros</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 px-6 flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow flex items-center gap-2"
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="h-4 w-4" /> Guardar cambios
          </button>
        </div>
      </div>
      <ModalWrapper
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        title="Confirmar eliminación"
        className="max-w-md"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-700">
            ¿Estás seguro que deseas eliminar a
            <span className="font-semibold">
              {" "}
              {memberToDelete?.user?.email}
            </span>{" "}
            del workspace?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setMemberToDelete(null)}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700"
              disabled={deletingMember}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDeleteMember}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold"
              disabled={deletingMember}
            >
              {deletingMember ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </ModalWrapper>
    </ModalWrapper>
  );
}
