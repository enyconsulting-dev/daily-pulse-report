import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { WinButton, WinInput, WinLabel, WinPanel, WinSeparator } from "@/components/Win2k";

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Tahoma, 'MS Sans Serif', Arial, sans-serif",
  fontSize: "11px",
};

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = login(password);
    setLoading(false);
    if (success) {
      toast.success("Welcome, Admin!");
      navigate(from, { replace: true });
    } else {
      toast.error("Incorrect admin password");
      setPassword("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#D4D0C8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ width: "320px" }}>
        {/* Window */}
        <div style={{
          background: "#D4D0C8",
          borderTop: "2px solid #ffffff",
          borderLeft: "2px solid #ffffff",
          borderRight: "2px solid #404040",
          borderBottom: "2px solid #404040",
          boxShadow: "1px 1px 0 #808080",
        }}>
          {/* Title bar */}
          <div style={{
            background: "linear-gradient(to right, #0A246A 0%, #A6CAF0 100%)",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "12px",
            padding: "3px 6px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            userSelect: "none",
            fontFamily: "Tahoma, Arial, sans-serif",
          }}>
            {/* Lock icon */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="8" rx="1" fill="#fff" stroke="#fff" strokeWidth="0.5"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#fff" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="11" r="1.5" fill="#0A246A"/>
            </svg>
            Log On to Windows — Admin
            <div style={{ marginLeft: "auto", display: "flex", gap: "2px" }}>
              {["_", "□", "✕"].map((ch, i) => (
                <button key={i} style={{
                  width: "18px", height: "18px", background: "#D4D0C8",
                  borderTop: "1px solid #fff", borderLeft: "1px solid #fff",
                  borderRight: "1px solid #404040", borderBottom: "1px solid #404040",
                  fontSize: "10px", cursor: "default", display: "flex",
                  alignItems: "center", justifyContent: "center", color: "#000",
                  fontFamily: "Tahoma, Arial, sans-serif", border: "none",
                }}>
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "16px" }}>
            {/* Windows logo area */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
              {/* Four-colour Windows flag */}
              <svg width="48" height="48" viewBox="0 0 48 48">
                <rect x="2"  y="2"  width="20" height="20" fill="#CC0000"/>
                <rect x="26" y="2"  width="20" height="20" fill="#00AA00"/>
                <rect x="2"  y="26" width="20" height="20" fill="#0000CC"/>
                <rect x="26" y="26" width="20" height="20" fill="#CCAA00"/>
              </svg>
              <div>
                <div style={{ ...BASE_FONT, fontWeight: "bold", fontSize: "14px" }}>
                  Daily Pulse Report
                </div>
                <div style={{ ...BASE_FONT, color: "#555" }}>
                  Eny Consulting — Admin Access
                </div>
              </div>
            </div>

            <WinSeparator />

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "10px" }}>
                <WinLabel htmlFor="admin-password">
                  Administrator Password:
                </WinLabel>
                <WinInput
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>

              <WinSeparator />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", paddingTop: "4px" }}>
                <WinButton
                  type="submit"
                  disabled={loading || !password}
                  style={{ minWidth: "75px" }}
                >
                  OK
                </WinButton>
                <WinButton
                  type="button"
                  onClick={() => setPassword("")}
                  style={{ minWidth: "75px" }}
                >
                  Cancel
                </WinButton>
              </div>
            </form>
          </div>
        </div>

        {/* Taskbar hint */}
        <p style={{ ...BASE_FONT, textAlign: "center", marginTop: "12px", color: "#555" }}>
          Press Ctrl+Alt+Delete to begin…
        </p>
      </div>
    </div>
  );
}
