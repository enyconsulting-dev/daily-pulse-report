import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/admin-auth")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to verify admin session");
        return response.json() as Promise<{ authenticated: boolean }>;
      })
      .then(({ authenticated }) => {
        if (active) setIsAuthenticated(authenticated);
      })
      .catch(() => {
        if (active) setAuthError("Unable to verify admin session. Please try again later.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (password: string): Promise<boolean> => {
    const response = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.status === 401) return false;
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error || "Unable to sign in");
    }

    setAuthError(null);
    setIsAuthenticated(true);
    return true;
  };

  const logout = async () => {
    const response = await fetch("/api/admin-auth", { method: "DELETE" });
    if (!response.ok) throw new Error("Unable to log out. Please try again.");
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, authError, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
