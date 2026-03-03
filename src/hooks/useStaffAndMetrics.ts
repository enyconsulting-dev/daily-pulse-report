import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useStaffMembers(departmentId?: string) {
  return useQuery({
    queryKey: ["staff_members", departmentId],
    queryFn: async () => {
      let query = supabase
        .from("staff_members")
        .select("*, departments(name)")
        .eq("is_active", true)
        .order("name");
      if (departmentId) query = query.eq("department_id", departmentId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAllStaffMembers() {
  return useQuery({
    queryKey: ["all_staff_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_members")
        .select("*, departments(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useDepartmentMetrics(departmentId?: string) {
  return useQuery({
    queryKey: ["department_metrics", departmentId],
    enabled: !!departmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_metrics")
        .select("*")
        .eq("department_id", departmentId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useCheckTodayReport(staffId?: string) {
  return useQuery({
    queryKey: ["today_report", staffId],
    enabled: !!staffId,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_reports")
        .select("id")
        .eq("staff_id", staffId!)
        .eq("report_date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
