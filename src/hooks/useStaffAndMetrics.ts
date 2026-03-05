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
    enabled: !!departmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_department_assignments")
        .select(
          "staff_members(id, name, email, is_active), department_id"
        )
        .eq("department_id", departmentId!)
        .order("staff_members(name)");
      if (error) throw error;
      return data
        ?.map((row: any) => ({
          ...row.staff_members,
          department_id: row.department_id,
        }))
        .filter((staff: any) => staff.is_active);
    },
  });
}

export function useAllStaffMembers() {
  return useQuery({
    queryKey: ["all_staff_members"],
    queryFn: async () => {
      const { data: staffData, error: staffError } = await supabase
        .from("staff_members")
        .select("id, name, email, is_active, password_hash")
        .order("name");
      if (staffError) throw staffError;

      // Get department assignments for all staff
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("staff_department_assignments")
        .select("staff_id, departments(id, name)");
      if (assignmentError) throw assignmentError;

      // Map departments to each staff member
      const staffWithDepts = staffData?.map((staff) => ({
        ...staff,
        assigned_departments: assignmentData
          ?.filter((a: any) => a.staff_id === staff.id)
          .map((a: any) => a.departments),
      }));

      return staffWithDepts;
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
        .select("id, department_id")
        .eq("staff_id", staffId!)
        .eq("report_date", today);
      if (error) throw error;
      return data;
    },
  });
}

export function useStaffAssignedDepartments(staffId?: string) {
  return useQuery({
    queryKey: ["staff_assigned_departments", staffId],
    enabled: !!staffId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_department_assignments")
        .select("department_id, departments(id, name)")
        .eq("staff_id", staffId!);
      if (error) throw error;
      return data?.map((row: any) => row.departments) || [];
    },
  });
}
