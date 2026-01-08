import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Force Password Change Logic
  // If user must change password, and is NOT already on the change page, redirect.
  // Also enable this check only if we have a profile loaded
  if (
    profile?.must_change_password &&
    location.pathname !== "/force-password-change" &&
    location.pathname !== "/update-password"
  ) {
    return <Navigate to="/force-password-change" replace />;
  }

  return children;
}
