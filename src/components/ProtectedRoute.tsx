import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, authError } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="container py-8 text-center text-muted-foreground">Checking admin access…</div>;
  }

  if (authError) {
    return <div className="container py-8 text-center text-destructive" role="alert">{authError}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
