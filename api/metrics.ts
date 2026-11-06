import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Database } from "../src/integrations/supabase/types";
import { isValidAdminSession, requestIsSameOrigin } from "../lib/adminSession.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!["POST", "PATCH", "DELETE"].includes(req.method || "")) {
    res.setHeader("Allow", "POST, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requestIsSameOrigin(req)) {
    return res.status(403).json({ error: "Request origin is not allowed" });
  }

  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Metric management requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    return res.status(500).json({ error: "Metric management is not configured" });
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const body = req.body && typeof req.body === "object" ? req.body : {};

  if (req.method === "POST") {
    const { department_id, metric_name, metric_type, sort_order } = body;
    if (
      typeof department_id !== "string" ||
      !uuidPattern.test(department_id) ||
      typeof metric_name !== "string" ||
      !metric_name.trim() ||
      !["number", "percentage"].includes(metric_type) ||
      (sort_order !== undefined && (!Number.isInteger(sort_order) || sort_order < 0))
    ) {
      return res.status(400).json({ error: "A valid department, metric name, type, and sort order are required" });
    }

    const { data, error } = await supabase
      .from("department_metrics")
      .insert({
        department_id,
        metric_name: metric_name.trim(),
        metric_type,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Metric creation failed:", error.message);
      return res.status(500).json({ error: "Unable to create metric" });
    }
    return res.status(201).json(data);
  }

  const metricId = body.id;
  if (typeof metricId !== "string" || !uuidPattern.test(metricId)) {
    return res.status(400).json({ error: "A valid metric ID is required" });
  }

  if (req.method === "PATCH") {
    const update: Database["public"]["Tables"]["department_metrics"]["Update"] = {};
    if (body.metric_name !== undefined) {
      if (typeof body.metric_name !== "string" || !body.metric_name.trim()) {
        return res.status(400).json({ error: "Metric name cannot be empty" });
      }
      update.metric_name = body.metric_name.trim();
    }
    if (body.metric_type !== undefined) {
      if (!["number", "percentage"].includes(body.metric_type)) {
        return res.status(400).json({ error: "Metric type must be number or percentage" });
      }
      update.metric_type = body.metric_type;
    }
    if (body.sort_order !== undefined) {
      if (!Number.isInteger(body.sort_order) || body.sort_order < 0) {
        return res.status(400).json({ error: "Sort order must be a non-negative integer" });
      }
      update.sort_order = body.sort_order;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "At least one metric field must be provided" });
    }

    const { error } = await supabase
      .from("department_metrics")
      .update(update)
      .eq("id", metricId);
    if (error) {
      console.error("Metric update failed:", error.message);
      return res.status(500).json({ error: "Unable to update metric" });
    }
    return res.status(200).json({ updated: true });
  }

  const { error } = await supabase
    .from("department_metrics")
    .delete()
    .eq("id", metricId);
  if (error) {
    console.error("Metric deletion failed:", error.message);
    return res.status(500).json({ error: "Unable to delete metric" });
  }
  return res.status(200).json({ deleted: true });
}
