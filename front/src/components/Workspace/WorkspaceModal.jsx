import React, { useState, useEffect } from "react";
import ModalWrapper from "../common/ModalWrapper";
import { PlusCircle, Pencil, Loader2, Eye, EyeOff } from "lucide-react";
import {
  useCreateWorkspace,
  useUpdateWorkspace,
} from "../../hooks/useWorkspaces";
import useAuthStore from "../../store/useAuthStore";

export default function WorkspaceModal({
  isOpen,
  onClose,
  initialData = null, // Si viene un objeto, es modo edición
  onSuccess,
}) {
  const user = useAuthStore((s) => s.user);
  const isEdit = !!initialData;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();

  // Para mostrar loading global según si hay una mutation activa
  const loading = createWorkspace.isPending || updateWorkspace.isPending;

  useEffect(() => {
    if (isEdit) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setIsPublic(!!initialData.is_public);
    } else {
      setName("");
      setDescription("");
      setIsPublic(false);
    }
    setError("");
  }, [isEdit, initialData, isOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name,
      description,
      is_public: isPublic,
      owner: user.id,
    };

    if (isEdit) {
      updateWorkspace.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: (res) => {
            if (onSuccess) onSuccess(res.data.data);
            onClose();
          },
          onError: () => {
            setError("No se pudo guardar la mesa de trabajo.");
          },
        }
      );
    } else {
      createWorkspace.mutate(payload, {
        onSuccess: (res) => {
          if (onSuccess) onSuccess(res.data.data);
          onClose();
        },
        onError: () => {
          setError("No se pudo guardar la mesa de trabajo.");
        },
      });
    }
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {isEdit ? (
            <>
              <Pencil className="w-6 h-6 text-purple-600" />
              Editar Mesa de Trabajo
            </>
          ) : (
            <>
              <PlusCircle className="w-6 h-6 text-sky-600" />
              Nueva Mesa de Trabajo
            </>
          )}
        </span>
      }
      panelClassName="p-0"
    >
      <form className="space-y-5 p-6" onSubmit={handleSubmit}>
        <div>
          <label className="block mb-1 font-bold text-gray-700">
            Nombre <span className="text-sky-600">*</span>
          </label>
          <input
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500 outline-none text-lg"
            type="text"
            placeholder="Ej. Planos de mi proyecto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
          />
        </div>
        <div>
          <label className="block mb-1 font-bold text-gray-700">
            Descripción
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500 outline-none resize-none"
            placeholder="Describe brevemente esta mesa de trabajo..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={160}
            rows={3}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              className="form-checkbox accent-sky-600 w-5 h-5"
              checked={isPublic}
              onChange={() => setIsPublic((v) => !v)}
            />
            <span className="ml-2 text-sm font-semibold text-sky-700 flex items-center gap-1">
              {isPublic ? (
                <>
                  <Eye className="w-4 h-4" /> Pública
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" /> Privada
                </>
              )}
            </span>
          </label>
          <span className="text-xs text-gray-400">
            {isPublic
              ? "Cualquiera con el enlace podrá acceder"
              : "Solo usuarios invitados podrán acceder"}
          </span>
        </div>
        {error && (
          <div className="text-red-600 text-center font-bold">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition
            ${
              isEdit
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-sky-600 hover:bg-sky-700"
            }
            text-white`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isEdit ? "Guardando..." : "Creando..."}
            </>
          ) : (
            <>
              {isEdit ? (
                <>
                  <Pencil className="w-5 h-5" />
                  Guardar cambios
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  Crear mesa
                </>
              )}
            </>
          )}
        </button>
      </form>
    </ModalWrapper>
  );
}
