import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Camera, Eye, EyeOff, Loader2, User, Mail, Lock } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import useAuthStore from "../../store/useAuthStore";
import { useUpdateProfile, useUpdatePassword } from "../../hooks/useAuth";
import { useUploadFile } from "../../hooks/useFiles";

export default function EditProfileModal({ isOpen, onClose }) {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState("profile");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const uploadFile = useUploadFile();

  // Form para información básica
  const profileForm = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  // Form para contraseña
  const passwordForm = useForm({
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  // Cargar datos del usuario cuando se abre el modal
  useEffect(() => {
    if (isOpen && user) {
      profileForm.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });
      setAvatarPreview(
        user.avatar
          ? `${import.meta.env.VITE_API_URL}/assets/${user.avatar}`
          : null
      );
    }
  }, [isOpen, user, profileForm]);

  // Manejar cambio de avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar información del perfil
  const handleSaveProfile = async (data) => {
    try {
      let avatarId = user?.avatar;

      // Subir nuevo avatar si se seleccionó uno
      if (avatarFile) {
        const uploadResponse = await uploadFile.mutateAsync({
          file: avatarFile,
          fileName: `avatar_${user.id}_${Date.now()}.${avatarFile.name
            .split(".")
            .pop()}`,
        });
        avatarId = uploadResponse.data.data.id;
      }

      // Actualizar perfil
      await updateProfile.mutateAsync({
        ...data,
        avatar: avatarId,
      });

      toast.success("Perfil actualizado correctamente");
      setAvatarFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (data) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      await updatePassword.mutateAsync({
        new_password: data.new_password,
      });

      toast.success("Contraseña actualizada correctamente");
      passwordForm.reset();
      setActiveTab("profile");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Error al actualizar la contraseña");
    }
  };

  const handleClose = () => {
    profileForm.reset();
    passwordForm.reset();
    setAvatarFile(null);
    setAvatarPreview(null);
    setActiveTab("profile");
    onClose();
  };

  const isLoading =
    updateProfile.isPending || updatePassword.isPending || uploadFile.isPending;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Perfil"
      panelClassName="max-w-lg"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <User className="w-4 h-4 inline mr-2" />
            Información Personal
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "password"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("password")}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Contraseña
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <form
            onSubmit={profileForm.handleSubmit(handleSaveProfile)}
            className="space-y-4"
          >
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">
                Haz clic en el icono de cámara para cambiar tu avatar
              </p>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                {...profileForm.register("first_name", {
                  required: "El nombre es requerido",
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tu nombre"
              />
              {profileForm.formState.errors.first_name && (
                <p className="text-red-500 text-sm mt-1">
                  {profileForm.formState.errors.first_name.message}
                </p>
              )}
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos
              </label>
              <input
                {...profileForm.register("last_name", {
                  required: "Los apellidos son requeridos",
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tus apellidos"
              />
              {profileForm.formState.errors.last_name && (
                <p className="text-red-500 text-sm mt-1">
                  {profileForm.formState.errors.last_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  {...profileForm.register("email", {
                    required: "El email es requerido",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email inválido",
                    },
                  })}
                  type="email"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tu@email.com"
                />
              </div>
              {profileForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {profileForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        )}

        {activeTab === "password" && (
          <form
            onSubmit={passwordForm.handleSubmit(handleChangePassword)}
            className="space-y-4"
          >
            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  {...passwordForm.register("new_password", {
                    required: "La nueva contraseña es requerida",
                    minLength: {
                      value: 6,
                      message: "La contraseña debe tener al menos 6 caracteres",
                    },
                  })}
                  type={showNewPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  {...passwordForm.register("confirm_password", {
                    required: "Confirma la nueva contraseña",
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirmar nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">
                  {passwordForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cambiar contraseña
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
}
