import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/Auth/LoginPage";
import RegisterPage from "./components/Auth/RegisterPage";
import DashboardHome from "./components/Dashboard/DashboardHome";
import WorkspacePage from "./components/Workspace/WorkspacePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import MainLayout from "./layouts/MainLayout"; // <--- Nuevo layout principal

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas protegidas, todas bajo MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          {/* Agrega aquí más rutas protegidas si quieres */}
        </Route>
        <Route path="/workspace/:id" element={<WorkspacePage />} />
      </Route>

      {/* Ruta raíz */}
      <Route
        path="/"
        element={
          !!localStorage.getItem("access_token") ? (
            <Navigate to="/dashboard" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      {/* Ruta catch-all para 404 (opcional) */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
