// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/Auth/LoginPage";
import RegisterPage from "./components/Auth/RegisterPage";
import AcceptInvitationPage from "./components/Auth/AcceptInvitationPage";
import DashboardHome from "./components/Dashboard/DashboardHome";
import WorkspacePage from "./components/Workspace/WorkspacePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import MainLayout from "./layouts/MainLayout";
import CanvasLayout from "./layouts/CanvasLayout";
import LandingPage from "./components/Landing/LandingPage";

export default function App() {
  return (
    <Routes>
      {/* Público: solo login/register */}
      <Route element={<PublicRoute />}>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Invitación: accesible siempre, incluso si ya estás logueado */}
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

      {/* Protegido: dashboard, workspaces, etc */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
        </Route>
        <Route
          path="/workspace/:id"
          element={
            <CanvasLayout>
              <WorkspacePage />
            </CanvasLayout>
          }
        />
      </Route>

      {/* Raíz */}
      <Route
        path="/"
        element={
          !!localStorage.getItem("access_token") ? (
            <Navigate to="/dashboard" />
          ) : (
            <Navigate to="/landing" />
          )
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
