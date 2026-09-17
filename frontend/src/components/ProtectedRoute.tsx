import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-primary-500 animate-spin" />
          <p className="text-[13px] text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/login"
        state={{ from: location, error: "Access denied. Admin account required." }}
        replace
      />
    );
  }

  return <>{children}</>;
}