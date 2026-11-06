import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDepartments, useDepartmentMetrics } from "@/hooks/useStaffAndMetrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";

export default function ManageDepartmentMetrics() {
  const queryClient = useQueryClient();
  const { data: departments } = useDepartments();
  const [departmentId, setDepartmentId] = useState("");
  const { data: metrics, isLoading } = useDepartmentMetrics(departmentId);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"number" | "percentage">("number");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedType, setEditedType] = useState<"number" | "percentage">("number");
  const [metricToDelete, setMetricToDelete] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const saveMetric = async (payload: Record<string, unknown>, method: "POST" | "PATCH" | "DELETE") => {
    const response = await fetch("/api/metrics", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to save metric");
  };

  const refreshMetrics = async () => {
    await queryClient.invalidateQueries({ queryKey: ["department_metrics", departmentId] });
  };

  const handleAdd = async () => {
    if (!departmentId || !newName.trim()) {
      toast.error("Choose a department and enter a metric name");
      return;
    }

    setSaving(true);
    try {
      await saveMetric({
        department_id: departmentId,
        metric_name: newName.trim(),
        metric_type: newType,
        sort_order: metrics?.length ?? 0,
      }, "POST");
      setNewName("");
      setNewType("number");
      await refreshMetrics();
      toast.success("Deliverable added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add deliverable");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (id: string) => {
    if (!editedName.trim()) {
      toast.error("Metric name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      await saveMetric({ id, metric_name: editedName.trim(), metric_type: editedType }, "PATCH");
      setEditingId(null);
      await refreshMetrics();
      toast.success("Deliverable updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update deliverable");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!metricToDelete) return;

    setSaving(true);
    try {
      await saveMetric({ id: metricToDelete.id }, "DELETE");
      setMetricToDelete(null);
      await refreshMetrics();
      toast.success("Deliverable deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete deliverable");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Manage Deliverables (Metrics)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Edit the metrics staff are asked to submit for each role.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="max-w-md space-y-1.5">
            <Label>Department / role</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a department" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {departmentId && (
            <>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading deliverables…
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics?.map((metric) => (
                    <div key={metric.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center">
                      {editingId === metric.id ? (
                        <>
                          <Input
                            aria-label="Deliverable name"
                            value={editedName}
                            onChange={(event) => setEditedName(event.target.value)}
                            className="flex-1"
                          />
                          <Select value={editedType} onValueChange={(value: "number" | "percentage") => setEditedType(value)}>
                            <SelectTrigger className="sm:w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" disabled={saving} onClick={() => void handleSave(metric.id)}>
                            <Save className="mr-1 h-4 w-4" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" disabled={saving} onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-medium">{metric.metric_name}</p>
                            <p className="text-xs capitalize text-muted-foreground">{metric.metric_type}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(metric.id);
                              setEditedName(metric.metric_name);
                              setEditedType(metric.metric_type as "number" | "percentage");
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setMetricToDelete({ id: metric.id, name: metric.metric_name })}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  {!metrics?.length && (
                    <p className="py-4 text-sm text-muted-foreground">No deliverables configured for this role yet.</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
                <Input
                  aria-label="New deliverable name"
                  placeholder="New deliverable name"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="flex-1"
                />
                <Select value={newType} onValueChange={(value: "number" | "percentage") => setNewType(value)}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => void handleAdd()} disabled={saving || isLoading}>
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                  Add deliverable
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!metricToDelete}
        onOpenChange={(open) => {
          if (!open && !saving) setMetricToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deliverable?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting “{metricToDelete?.name}” also permanently deletes historical report values recorded for it.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete deliverable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
