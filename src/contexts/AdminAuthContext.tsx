import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

async function readAuthResponse(response: Response): Promise<{ authenticated: boolean }> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Admin authentication API is unavailable. Deploy the Vercel API routes to enable management login.");
  }
  const result = await response.json();
  if (typeof result.authenticated !== "boolean") {
    throw new Error("Admin authentication API returned an invalid response.");
  }
  return result;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/admin-auth")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Admin session check failed (HTTP ${response.status})`);
        }
        return readAuthResponse(response);
      })
      .then(({ authenticated }) => {
        if (active) setIsAuthenticated(authenticated);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setIsAuthenticated(false);
        setAuthError(
          error instanceof Error
            ? `${error.message}. You can still try signing in below.`
            : "Unable to verify the existing admin session. You can still try signing in below.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const response = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.status === 401) return false;
      if (!response.ok) {
        const result = response.headers.get("content-type")?.includes("application/json")
          ? await response.json().catch(() => null)
          : null;
        throw new Error(result?.error || `Unable to sign in (HTTP ${response.status})`);
      }

      const result = await readAuthResponse(response);
      if (!result.authenticated) throw new Error("Admin authentication was not confirmed.");
      setIsAuthenticated(true);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to sign in";
      setAuthError(`${message}. Check that the admin authentication API is deployed and configured.`);
      throw new Error(message);
    }
  };

  const logout = async () => {
    const response = await fetch("/api/admin-auth", { method: "DELETE" });
    if (!response.ok) throw new Error("Unable to log out. Please try again.");
    await readAuthResponse(response);
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
