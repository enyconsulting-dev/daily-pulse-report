import { Link, useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, BarChart3, Users, LogOut } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const navItems = [
  { to: "/", label: "Submit Report", icon: ClipboardList },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/manage-staff", label: "Manage Staff", icon: Users },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen" style={{ background: "#D4D0C8", fontFamily: "Tahoma, 'MS Sans Serif', Arial, sans-serif" }}>

      {/* ── Window chrome ── */}
      <div className="win-window" style={{ margin: "0", border: "none", boxShadow: "none" }}>

        {/* Title bar */}
        <div className="win-titlebar" style={{ fontSize: "13px", paddingLeft: "8px" }}>
          {/* Window icon — tiny pixel-art document */}
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <rect x="2" y="1" width="10" height="14" fill="#fff" stroke="#000" strokeWidth="1"/>
            <polygon points="8,1 12,5 8,5" fill="#D4D0C8" stroke="#000" strokeWidth="1"/>
            <line x1="4" y1="8" x2="10" y2="8" stroke="#000" strokeWidth="1"/>
            <line x1="4" y1="10" x2="10" y2="10" stroke="#000" strokeWidth="1"/>
            <line x1="4" y1="12" x2="8" y2="12" stroke="#000" strokeWidth="1"/>
          </svg>
          <span>Daily Pulse Report — Eny Consulting</span>

          {/* Window control buttons */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "2px" }}>
            {["_", "□", "✕"].map((ch, i) => (
              <button
                key={i}
                aria-label={["Minimize", "Maximize", "Close"][i]}
                style={{
                  width: "18px", height: "18px",
                  background: "#D4D0C8",
                  border: "none",
                  borderTop: "1px solid #fff", borderLeft: "1px solid #fff",
                  borderRight: "1px solid #404040", borderBottom: "1px solid #404040",
                  fontSize: "10px", lineHeight: 1, cursor: "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#000",
                  fontFamily: "Tahoma, Arial, sans-serif",
                }}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Menu bar */}
        <div style={{
          background: "#D4D0C8",
          borderBottom: "1px solid #808080",
          padding: "2px 4px",
          display: "flex",
          gap: "0px",
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  fontSize: "11px",
                  textDecoration: "none",
                  color: "#000",
                  background: active ? "#0A246A" : "transparent",
                  color: active ? "#fff" : "#000",
                  borderTop: active ? "1px solid #fff" : "1px solid transparent",
                  borderLeft: active ? "1px solid #fff" : "1px solid transparent",
                  borderRight: active ? "1px solid #404040" : "1px solid transparent",
                  borderBottom: active ? "1px solid #404040" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "#0A246A";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "#000";
                  }
                }}
              >
                <item.icon size={12} />
                {item.label}
              </Link>
            );
          })}

          {/* Separator */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
            {/* Logo in toolbar */}
            <img
              src="/enyconsulting.png"
              alt="Eny Consulting"
              style={{ height: "20px", objectFit: "contain", marginRight: "6px" }}
            />
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "2px 8px", fontSize: "11px", cursor: "pointer",
                  background: "#D4D0C8",
                  borderTop: "1px solid #fff", borderLeft: "1px solid #fff",
                  borderRight: "1px solid #404040", borderBottom: "1px solid #404040",
                  color: "#000",
                  fontFamily: "Tahoma, Arial, sans-serif",
                }}
              >
                <LogOut size={11} />
                Log Off
              </button>
            )}
          </div>
        </div>

        {/* Toolbar divider */}
        <div style={{ borderTop: "1px solid #fff", borderBottom: "1px solid #808080", height: "2px", background: "#D4D0C8" }} />

        {/* Main content area */}
        <main style={{ padding: "12px 16px" }}>
          {children}
        </main>

        {/* Status bar */}
        <div style={{
          background: "#D4D0C8",
          borderTop: "2px solid #808080",
          padding: "2px 8px",
          display: "flex",
          gap: "4px",
          fontSize: "11px",
          color: "#000",
        }}>
          <div style={{
            border: "1px inset #808080",
            borderTop: "1px solid #808080", borderLeft: "1px solid #808080",
            borderRight: "1px solid #fff", borderBottom: "1px solid #fff",
            padding: "0 8px",
            flex: 1,
          }}>
            Ready
          </div>
          <div style={{
            border: "1px inset",
            borderTop: "1px solid #808080", borderLeft: "1px solid #808080",
            borderRight: "1px solid #fff", borderBottom: "1px solid #fff",
            padding: "0 8px",
          }}>
            {new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}
