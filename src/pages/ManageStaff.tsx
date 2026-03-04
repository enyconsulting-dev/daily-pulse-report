import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDepartments, useAllStaffMembers } from "@/hooks/useStaffAndMetrics";
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
import { Plus, UserX, UserCheck, Edit2, Save, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";

export default function ManageStaff() {
  const queryClient = useQueryClient();
  const { data: departments } = useDepartments();
  const { data: allStaff } = useAllStaffMembers();

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDeptId, setNewDeptId] = useState<string>();
  const [filterDept, setFilterDept] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");

  const filteredStaff =
    filterDept === "all"
      ? allStaff
      : allStaff?.filter((s) => s.department_id === filterDept);

  const handleAdd = async () => {
    if (!newName.trim() || !newDeptId) {
      toast.error("Please enter a name and select a department");
      return;
    }
    setAdding(true);
    const { error } = await supabase
      .from("staff_members")
      .insert({ 
        name: newName.trim(), 
        email: newEmail.trim() || null,
        department_id: newDeptId 
      });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${newName.trim()} added successfully`);
      setNewName("");
      setNewEmail("");
      setNewDeptId(undefined);
      queryClient.invalidateQueries({ queryKey: ["all_staff_members"] });
      queryClient.invalidateQueries({ queryKey: ["staff_members"] });
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

  const handleEdit = (id: string, currentName: string, currentEmail: string | null) => {
    setEditingId(id);
    setEditedName(currentName);
    setEditedEmail(currentEmail || "");
  };

  const handleSave = async (id: string) => {
    if (!editedName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    const { error } = await supabase
      .from("staff_members")
      .update({ 
        name: editedName.trim(),
        email: editedEmail.trim() || null
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Staff member updated successfully");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["all_staff_members"] });
      queryClient.invalidateQueries({ queryKey: ["staff_members"] });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedName("");
    setEditedEmail("");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl animate-fade-in">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <Label>Department</Label>
                  <Select value={newDeptId} onValueChange={setNewDeptId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAdd} disabled={adding} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff?.map((staff) => (
                  <TableRow key={staff.id}>
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
                      {staff.departments?.name}
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
                            onClick={() => handleEdit(staff.id, staff.name, staff.email)}
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
