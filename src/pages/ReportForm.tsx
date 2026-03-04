import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useDepartments,
  useStaffMembers,
  useDepartmentMetrics,
  useCheckTodayReport,
} from "@/hooks/useStaffAndMetrics";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";
import AppLayout from "@/components/AppLayout";

export default function ReportForm() {
  const queryClient = useQueryClient();
  const [selectedStaffId, setSelectedStaffId] = useState<string>();
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});
  const [completedNotes, setCompletedNotes] = useState<string>("");
  const [blockerNotes, setBlockerNotes] = useState<string>("");
  const [uncompletedNotes, setUncompletedNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const { data: departments } = useDepartments();
  const { data: allStaff } = useStaffMembers();

  const selectedStaff = allStaff?.find((s) => s.id === selectedStaffId);
  const departmentId = selectedStaff?.department_id;
  const departmentName = selectedStaff?.departments?.name;

  const { data: metrics } = useDepartmentMetrics(departmentId);
  const { data: todayReport, isLoading: checkingReport } =
    useCheckTodayReport(selectedStaffId);

  const alreadySubmitted = !!todayReport;

  const handleSubmit = async () => {
    if (!selectedStaffId || !metrics) return;

    // Validate all fields
    const emptyFields = metrics.filter((m) => !metricValues[m.id]?.trim());
    if (emptyFields.length > 0) {
      toast.error("Please fill in all metric fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: report, error: reportError } = await supabase
        .from("daily_reports")
        .insert({ 
          staff_id: selectedStaffId,
          completed_tasks: completedNotes,
          blockers: blockerNotes,
          uncompleted_tasks: uncompletedNotes,
        })
        .select("id")
        .single();

      if (reportError) {
        if (reportError.code === "23505") {
          toast.error("You have already submitted a report for today");
          return;
        }
        throw reportError;
      }

      const entries = metrics.map((m) => ({
        report_id: report.id,
        metric_id: m.id,
        value: parseFloat(metricValues[m.id] || "0"),
      }));

      const { error: entriesError } = await supabase
        .from("report_entries")
        .insert(entries);

      if (entriesError) throw entriesError;

      toast.success("Report submitted successfully!");
      setMetricValues({});
      setCompletedNotes("");
      setBlockerNotes("");
      setUncompletedNotes("");
      queryClient.invalidateQueries({ queryKey: ["today_report"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Daily Report
          </h1>
          <p className="mt-1 text-muted-foreground">
            Select your name and fill in today's metrics
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Staff Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select your name</Label>
              <Select
                value={selectedStaffId}
                onValueChange={(v) => {
                  setSelectedStaffId(v);
                  setMetricValues({});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {allStaff?.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStaff && (
              <div className="rounded-lg bg-secondary px-4 py-3">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium text-foreground">{departmentName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedStaff && alreadySubmitted && (
          <Card className="mt-6 border-success/30 bg-success/5">
            <CardContent className="flex items-center gap-3 py-6">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium text-foreground">
                  Report already submitted
                </p>
                <p className="text-sm text-muted-foreground">
                  You've already submitted your report for today. Come back
                  tomorrow!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedStaff && !alreadySubmitted && metrics && (
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">
                Today's Metrics — {departmentName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="space-y-1.5">
                  <Label htmlFor={metric.id} className="text-sm">
                    {metric.metric_name}
                  </Label>
                  <Input
                    id={metric.id}
                    type="number"
                    step={metric.metric_type === "percentage" ? "0.1" : "1"}
                    min="0"
                    max={metric.metric_type === "percentage" ? "100" : undefined}
                    placeholder={
                      metric.metric_type === "percentage"
                        ? "Enter percentage (0-100)"
                        : "Enter value"
                    }
                    value={metricValues[metric.id] || ""}
                    onChange={(e) =>
                      setMetricValues((prev) => ({
                        ...prev,
                        [metric.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {selectedStaff && !alreadySubmitted && metrics && (
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">Daily Notes</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Share your daily progress and challenges
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="completed-notes" className="text-sm font-medium">
                  ✓ Completed Tasks for Today
                </Label>
                <Textarea
                  id="completed-notes"
                  placeholder="What did you accomplish today? List your completed tasks..."
                  value={completedNotes}
                  onChange={(e) => setCompletedNotes(e.target.value)}
                  className="min-h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blocker-notes" className="text-sm font-medium">
                  ⚠️ Blockers for Today
                </Label>
                <Textarea
                  id="blocker-notes"
                  placeholder="What challenges or blockers did you encounter? Include any issues that prevented progress..."
                  value={blockerNotes}
                  onChange={(e) => setBlockerNotes(e.target.value)}
                  className="min-h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uncompleted-notes" className="text-sm font-medium">
                  → Uncompleted Tasks (Carry Over)
                </Label>
                <Textarea
                  id="uncompleted-notes"
                  placeholder="What tasks are still in progress? List items that need to be carried over to tomorrow..."
                  value={uncompletedNotes}
                  onChange={(e) => setUncompletedNotes(e.target.value)}
                  className="min-h-24 resize-none"
                />
              </div>

              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={submitting}
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
