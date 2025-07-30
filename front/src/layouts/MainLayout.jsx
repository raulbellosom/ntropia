// src\layouts\MainLayout.jsx
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { LayoutGrid, UserCircle, LogOut, Menu, X, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import clsx from "clsx";
import NtropiaLogo from "../components/Logo/NtropiaLogo";
import NotificationsDropdown from "../components/common/NotificationsDropdown";
import EditProfileModal from "../components/common/EditProfileModal";
import { useDirectusImage } from "../hooks/useDirectusImage";

const navLinks = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/workspace", label: "Mesas de trabajo", icon: LayoutGrid },
];

export default function MainLayout() {
  const user = useAuthStore((s) => s.user);
  const imageUrl = useDirectusImage(user?.avatar || "");
  const clearUser = useAuthStore((s) => s.clearUser);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

  function handleLogout() {
    toast("Cerrando sesión...", { icon: "👋" });
    localStorage.removeItem("access_token");
    clearUser(); // Limpiar el store
    setTimeout(() => navigate("/login"), 1000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101726] via-[#232C47] to-[#1C2338] flex flex-col">
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#181F37", color: "#fff", borderRadius: "1rem" },
          iconTheme: { primary: "#2563eb", secondary: "#fff" },
        }}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo + Burger */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
              onClick={() => setSidebarOpen((x) => !x)}
            >
              <Menu className="w-6 h-6 text-[#2563eb]" />
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              <NtropiaLogo className="h-12 w-12 " />
              <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow">
                Ntropia
              </span>
            </div>
          </div>
          {/* Navbar (desktop) */}
          <nav className="hidden md:flex gap-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                to={to}
                key={to}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-base hover:bg-[#2563eb]/10 transition",
                    isActive
                      ? "bg-[#2563eb]/20 text-[#2563eb]"
                      : "text-white/80"
                  )
                }
              >
                <Icon className="w-5 h-5" /> {label}
              </NavLink>
            ))}
          </nav>
          {/* User info */}
          <div className="flex items-center gap-4">
            {/* Notificaciones */}
            <NotificationsDropdown />
            {/* Avatar + menu */}
            <motion.div whileHover={{ scale: 1.06 }} className="group relative">
              <button
                className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition"
                onClick={() => setEditProfileModalOpen(true)}
              >
                <span className="inline-block h-10 w-10 rounded-full overflow-hidden bg-[#e5e9f1] border-2 border-[#2563eb] shadow">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-10 h-10 text-[#2563eb]" />
                  )}
                </span>
                <span className="hidden md:flex flex-col text-left">
                  <span className="font-bold text-white text-sm leading-tight">
                    {user?.first_name || ""} {user?.last_name || ""}
                  </span>
                  <span className="text-xs text-white/80">
                    {user?.email || ""}
                  </span>
                </span>
              </button>
            </motion.div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-[#2563eb] hover:bg-[#274B8A] text-white font-bold shadow transition ml-2"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* SIDEBAR MOBILE */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-br from-[#16203b] via-[#232C47] to-[#1C2338] shadow-2xl border-r border-[#2563eb]/20 flex flex-col py-6 px-4"
          >
            <button
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-2 mb-8">
              <LayoutGrid className="text-[#2563eb] h-8 w-8" />
              <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow">
                Ntropia
              </span>
            </div>
            <nav className="flex flex-col gap-2">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  to={to}
                  key={to}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 px-4 py-2 rounded-2xl font-semibold text-lg hover:bg-[#2563eb]/20 transition",
                      isActive
                        ? "bg-[#2563eb]/30 text-[#2563eb]"
                        : "text-white/90"
                    )
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-6 h-6" /> {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto pt-12 flex items-center gap-3">
              <button
                className="flex items-center gap-3 w-full"
                onClick={() => {
                  setSidebarOpen(false);
                  setEditProfileModalOpen(true);
                }}
              >
                <span className="inline-block h-9 w-9 rounded-full overflow-hidden bg-[#e5e9f1] border-2 border-[#2563eb] shadow">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-9 h-9 text-[#2563eb]" />
                  )}
                </span>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-white text-sm">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="text-xs text-white/70">{user?.email}</span>
                </div>
              </button>
            </div>
            <button
              className="mt-6 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#274B8A] text-white font-bold shadow transition flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" /> Cerrar sesión
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="text-center text-xs text-white/40 py-4 mt-auto">
        &copy; {new Date().getFullYear()} Ntropia &bull; Creado por{" "}
        <a
          href="https://racoondevs.com"
          className="text-white font-bold hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          RacoonDevs
        </a>
      </footer>

      {/* MODAL DE EDICIÓN DE PERFIL */}
      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
      />
    </div>
  );
}
