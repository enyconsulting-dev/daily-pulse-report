import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Database } from "../src/integrations/supabase/types";
import { isValidAdminSession, requestIsSameOrigin } from "../lib/adminSession.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requestIsSameOrigin(req)) {
    return res.status(403).json({ error: "Request origin is not allowed" });
  }

  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  const staffId = req.query.id;
  if (typeof staffId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(staffId)) {
    return res.status(400).json({ error: "A valid staff ID is required" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Staff deletion requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    return res.status(500).json({ error: "Staff deletion is not configured" });
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("staff_members")
    .delete()
    .eq("id", staffId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Staff deletion failed:", error.message);
    return res.status(500).json({ error: "Unable to delete staff member" });
  }
  if (!data) return res.status(404).json({ error: "Staff member not found" });

  return res.status(200).json({ deleted: true });
}
