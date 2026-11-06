import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  adminPasswordMatches,
  clearAdminSessionCookie,
  createAdminSessionCookie,
  getAdminPassword,
  getAdminSessionSecret,
  isSecureRequest,
  isValidAdminSession,
  requestIsSameOrigin,
} from "../lib/adminSession";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const secret = getAdminSessionSecret();
  if (!secret || !getAdminPassword()) {
    if (req.method === "GET") return res.status(200).json({ authenticated: false });
    return res.status(503).json({ error: "Admin authentication is not configured. Set VITE_ADMIN_PASSWORD or ADMIN_PASSWORD." });
  }

  if (req.method === "GET") {
    return res.status(200).json({ authenticated: isValidAdminSession(req) });
  }

  if (!requestIsSameOrigin(req)) {
    return res.status(403).json({ error: "Request origin is not allowed" });
  }

  if (req.method === "POST") {
    if (!adminPasswordMatches(req.body?.password)) {
      return res.status(401).json({ error: "Incorrect admin password" });
    }
    res.setHeader("Set-Cookie", createAdminSessionCookie(secret, isSecureRequest(req)));
    return res.status(200).json({ authenticated: true });
  }

  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearAdminSessionCookie(isSecureRequest(req)));
    return res.status(200).json({ authenticated: false });
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
