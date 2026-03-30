import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDepartments, useAllStaffMembers } from "@/hooks/useStaffAndMetrics";
import { useHREmployees, HREmployee } from "@/hooks/useHRPartner";
import { hashPassword } from "@/lib/passwordUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, UserX, UserCheck, Edit2, Save, X, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

export default function ManageStaff() {
  const queryClient = useQueryClient();
  const { data: departments } = useDepartments();
  const { data: allStaff } = useAllStaffMembers();
  const { data: hrEmployees, isLoading: loadingHR } = useHREmployees();

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newEmployeeCode, setNewEmployeeCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDeptIds, setNewDeptIds] = useState<string[]>([]);
  const [filterDept, setFilterDept] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedEmployeeCode, setEditedEmployeeCode] = useState("");
  const [editedPassword, setEditedPassword] = useState("");
  const [editedDeptIds, setEditedDeptIds] = useState<string[]>([]);

  const filteredStaff =
    filterDept === "all"
      ? allStaff
      : allStaff?.filter((s) =>
          s.assigned_departments?.some((d) => d.id === filterDept)
        );

  const handleHRSelect = (code: string) => {
    setNewEmployeeCode(code);
    const employee = hrEmployees?.find(e => e.code === code);
    if (employee) {
      if (!newName.trim()) setNewName(employee.full_name);
      if (!newEmail.trim()) setNewEmail(employee.email);
    }
  };

  const handleEditHRSelect = (code: string) => {
    setEditedEmployeeCode(code);
    const employee = hrEmployees?.find(e => e.code === code);
    if (employee) {
      if (!editedName.trim()) setEditedName(employee.full_name);
      if (!editedEmail.trim()) setEditedEmail(employee.email);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || newDeptIds.length === 0) {
      toast.error("Please enter a name and select at least one department");
      return;
    }
    setAdding(true);
    try {
      // Hash password if provided
      let passwordHash = null;
      if (newPassword.trim()) {
        passwordHash = await hashPassword(newPassword.trim());
      }

      // Create staff member
      const { data: staffData, error: staffError } = await supabase
        .from("staff_members")
        .insert({ 
          name: newName.trim(), 
          email: newEmail.trim() || null,
          employee_code: newEmployeeCode.trim() || null,
          password_hash: passwordHash,
        })
        .select()
        .single();

      if (staffError) throw staffError;

      // Create department assignments
      const assignments = newDeptIds.map((deptId) => ({
        staff_id: staffData.id,
        department_id: deptId,
      }));

      const { error: assignmentError } = await supabase
        .from("staff_department_assignments")
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      toast.success(`${newName.trim()} added successfully`);
      setNewName("");
      setNewEmail("");
      setNewEmployeeCode("");
      setNewPassword("");
      setNewDeptIds([]);
      queryClient.invalidateQueries({ queryKey: ["all_staff_members"] });
      queryClient.invalidateQueries({ queryKey: ["staff_members"] });
    } catch (error: any) {
      toast.error(error.message);
    }
    setAdding(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("staff_members")
      .update({ is_active: !currentActive })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["all_staff_members"] });
      queryClient.invalidateQueries({ queryKey: ["staff_members"] });
    }
  };

  const handleEdit = (id: string, currentName: string, currentEmail: string | null, currentEmployeeCode: string | null, currentDepts: any[], currentPasswordHash: string | null = null) => {
    setEditingId(id);
    setEditedName(currentName);
    setEditedEmail(currentEmail || "");
    setEditedEmployeeCode(currentEmployeeCode || "");
    setEditedPassword(currentPasswordHash ? "***" : ""); // Show *** if password exists
    setEditedDeptIds(currentDepts.map((d) => d.id) || []);
  };

  const handleSave = async (id: string) => {
    if (!editedName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (editedDeptIds.length === 0) {
      toast.error("Please assign at least one department");
      return;
    }

    try {
      // Hash password if user entered a new one (not ***)
      let passwordHash: string | null = null;
      if (editedPassword.trim() && editedPassword !== "***") {
        passwordHash = await hashPassword(editedPassword.trim());
      }

      // Update staff member info
      const updateData: any = {
        name: editedName.trim(),
        email: editedEmail.trim() || null,
        employee_code: editedEmployeeCode.trim() || null
      };
      
      // Only update password if a new one was provided
      if (editedPassword.trim() && editedPassword !== "***") {
        updateData.password_hash = passwordHash;
      } else if (editedPassword === "") {
        // Clear password if user explicitly cleared it
        updateData.password_hash = null;
      }
      // If password is "***", don't update password field (keep existing)

      const { error: updateError } = await supabase
        .from("staff_members")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // Get current department assignments
      const { data: currentAssignments, error: fetchError } = await supabase
        .from("staff_department_assignments")
        .select("department_id")
        .eq("staff_id", id);

      if (fetchError) throw fetchError;

      const currentDeptIds = (currentAssignments || []).map((a: any) => a.department_id);
      
      // Find departments to add and remove
      const deptIdsToAdd = editedDeptIds.filter((id) => !currentDeptIds.includes(id));
      const deptIdsToRemove = currentDeptIds.filter((id) => !editedDeptIds.includes(id));

      // Remove departments
      if (deptIdsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("staff_department_assignments")
          .delete()
          .eq("staff_id", id)
          .in("department_id", deptIdsToRemove);

        if (deleteError) throw deleteError;
      }

      // Add departments
      if (deptIdsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("staff_department_assignments")
          .insert(
            deptIdsToAdd.map((deptId) => ({
              staff_id: id,
              department_id: deptId,
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success("Staff member updated successfully");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["all_staff_members"] });
      queryClient.invalidateQueries({ queryKey: ["staff_members"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedName("");
    setEditedEmail("");
    setEditedEmployeeCode("");
    setEditedPassword("");
    setEditedDeptIds([]);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Manage Staff
          </h1>
          <p className="mt-1 text-muted-foreground">
            Add new staff members or deactivate existing ones
          </p>
        </div>

        {/* Add staff */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Add New Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Employee Code</Label>
                  <Select value={newEmployeeCode} onValueChange={handleHRSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingHR ? "Loading..." : "Select Employee"} />
                    </SelectTrigger>
                    <SelectContent>
                      {hrEmployees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.code}>
                          {emp.full_name} ({emp.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Enter staff name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter staff email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Password (optional)</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank if no password needed"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If set, staff must enter this password to submit reports
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Job Roles</Label>
                  <div className="border rounded-md p-3 space-y-2 bg-background">
                    {departments?.map((d) => (
                      <div key={d.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`dept-${d.id}`}
                          checked={newDeptIds.includes(d.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewDeptIds([...newDeptIds, d.id]);
                            } else {
                              setNewDeptIds(newDeptIds.filter((id) => id !== d.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                          htmlFor={`dept-${d.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {d.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {newDeptIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newDeptIds.map((deptId) => (
                        <Badge key={deptId} variant="secondary">
                          {departments?.find((d) => d.id === deptId)?.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAdd} disabled={adding} className="w-full">
                    {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter + list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Staff Members</CardTitle>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff?.map((staff: any) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      {editingId === staff.id ? (
                        <Select value={editedEmployeeCode} onValueChange={handleEditHRSelect}>
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent>
                            {hrEmployees?.map((emp) => (
                              <SelectItem key={emp.id} value={emp.code}>
                                {emp.full_name} {emp.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                          {staff.employee_code || "—"}
                        </code>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {editingId === staff.id ? (
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        staff.name
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {editingId === staff.id ? (
                        <Input
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="h-8"
                        />
                      ) : (
                        staff.email || "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {editingId === staff.id ? (
                        <Input
                          type="password"
                          value={editedPassword}
                          onChange={(e) => setEditedPassword(e.target.value)}
                          placeholder={staff.password_hash ? "Leave blank to keep current" : "Set password"}
                          className="h-8 text-xs"
                        />
                      ) : (
                        staff.password_hash ? "✓ Set" : "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {editingId === staff.id ? (
                        <div className="border rounded-md p-2 space-y-2 bg-background max-h-40 overflow-y-auto">
                          {departments?.map((d) => (
                            <div key={d.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`edit-dept-${d.id}`}
                                checked={editedDeptIds.includes(d.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditedDeptIds([...editedDeptIds, d.id]);
                                  } else {
                                    setEditedDeptIds(editedDeptIds.filter((id) => id !== d.id));
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <Label
                                htmlFor={`edit-dept-${d.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {d.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {staff.assigned_departments?.map((dept) => (
                            <Badge key={dept.id} variant="outline" className="text-xs">
                              {dept.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.is_active ? "default" : "secondary"}>
                        {staff.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === staff.id ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSave(staff.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(staff.id, staff.name, staff.email, staff.employee_code, staff.assigned_departments || [], staff.password_hash)}
                          >
                            <Edit2 className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(staff.id, staff.is_active)}
                          >
                            {staff.is_active ? (
                              <>
                                <UserX className="mr-1 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-1 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredStaff?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No staff members found. Add some above!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
