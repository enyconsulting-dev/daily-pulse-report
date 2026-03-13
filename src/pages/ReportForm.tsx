import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useDepartments,
  useAllStaffMembers,
  useDepartmentMetrics,
  useCheckTodayReport,
  useStaffAssignedDepartments,
} from "@/hooks/useStaffAndMetrics";
import { verifyPassword } from "@/lib/passwordUtils";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CheckCircle2, Send, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";

export default function ReportForm() {
  const queryClient = useQueryClient();
  const [selectedStaffId, setSelectedStaffId] = useState<string>();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>();
  const [enteredPassword, setEnteredPassword] = useState<string>("");
  const [passwordVerified, setPasswordVerified] = useState<boolean>(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});
  const [completedNotes, setCompletedNotes] = useState<string>("");
  const [blockerNotes, setBlockerNotes] = useState<string>("");
  const [uncompletedNotes, setUncompletedNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [reportDate, setReportDate] = useState<Date>(new Date());

  const reportDateStr = format(reportDate, "yyyy-MM-dd");

  const { data: allStaff } = useAllStaffMembers();
  const { data: assignedDepartments } = useStaffAssignedDepartments(selectedStaffId);
  const { data: metrics } = useDepartmentMetrics(selectedDepartmentId);
  const { data: todayReports, isLoading: checkingReport } =
    useCheckTodayReport(selectedStaffId, reportDateStr);

  const selectedStaff = allStaff?.find((s) => s.id === selectedStaffId) as any;
  const selectedDept = assignedDepartments?.find((d) => d.id === selectedDepartmentId);
  
  // Check if already submitted for this specific department
  const alreadySubmittedForDept = todayReports?.some(
    (r: any) => r.department_id === selectedDepartmentId
  ) || false;

  // Get departments that still need reports
  const departmentsNeedingReports = assignedDepartments?.filter(
    (d) => !todayReports?.some((r: any) => r.department_id === d.id)
  ) || [];

  // Check if password verification is needed
  const needsPasswordVerification = selectedStaff?.password_hash && !passwordVerified;

  const handlePasswordVerify = async () => {
    if (!selectedStaff?.password_hash) {
      setPasswordVerified(true);
      return;
    }

    setVerifyingPassword(true);
    try {
      const isValid = await verifyPassword(enteredPassword, selectedStaff.password_hash);
      if (isValid) {
        setPasswordVerified(true);
        toast.success("Password verified!");
      } else {
        toast.error("Incorrect password");
        setEnteredPassword("");
      }
    } catch (error: any) {
      toast.error("Error verifying password");
    }
    setVerifyingPassword(false);
  };

  const handleSubmit = async () => {
    if (!selectedStaffId || !selectedDepartmentId || !metrics) return;

    // Get metrics that have values entered
    const filledMetrics = metrics.filter((m) => metricValues[m.id]?.trim());

    // Check if at least one metric is filled
    if (filledMetrics.length === 0) {
      toast.error("Please fill in at least one metric");
      return;
    }

    // Validate only the filled metrics have valid values
    const invalidFields = filledMetrics.filter((m) => {
      const value = metricValues[m.id];
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        return true;
      }
      
      if (numValue < 0) {
        return true;
      }
      
      if (m.metric_type === "percentage" && (numValue < 0 || numValue > 100)) {
        return true;
      }
      
      return false;
    });

    if (invalidFields.length > 0) {
      const fieldNames = invalidFields.map((f) => f.metric_name).join(", ");
      toast.error(`Invalid values for: ${fieldNames}. Please enter valid numbers.`);
      return;
    }

    setSubmitting(true);
    try {
      const { data: report, error: reportError } = await supabase
        .from("daily_reports")
        .insert({
          staff_id: selectedStaffId,
          department_id: selectedDepartmentId,
          report_date: reportDateStr,
          completed_tasks: completedNotes,
          blockers: blockerNotes,
          uncompleted_tasks: uncompletedNotes,
        })
        .select("id")
        .single();

      if (reportError) {
        if (reportError.code === "23505") {
          toast.error("You have already submitted a report for this department today");
          return;
        }
        throw reportError;
      }

      const entries = filledMetrics.map((m) => ({
        report_id: report.id,
        metric_id: m.id,
        value: parseFloat(metricValues[m.id]),
      }));

      const { error: entriesError } = await supabase
        .from("report_entries")
        .insert(entries);

      if (entriesError) throw entriesError;

      // Send data to Google Chat webhook
      const metricsText = filledMetrics
        .map((m) => `${m.metric_name}: ${metricValues[m.id]}${m.metric_type === "percentage" ? "%" : ""}`)
        .join("\n");

      const webhookMessage = {
        text: `Daily Report Submission`,
        cards: [
          {
            header: {
              title: "📊 Daily Report Submitted",
              subtitle: `${format(reportDate, "PPP")}`,
            },
            sections: [
              {
                widgets: [
                  {
                    textParagraph: {
                      text: `<b>Staff:</b> ${selectedStaff?.name}\n<b>Department:</b> ${selectedDept?.name}`,
                    },
                  },
                  {
                    textParagraph: {
                      text: `<b>Key Metrics:</b>\n${metricsText}`,
                    },
                  },
                  ...(completedNotes
                    ? [
                        {
                          textParagraph: {
                            text: `<b>✓ Completed:</b>\n${completedNotes}`,
                          },
                        },
                      ]
                    : []),
                  ...(blockerNotes
                    ? [
                        {
                          textParagraph: {
                            text: `<b>⚠️ Blockers:</b>\n${blockerNotes}`,
                          },
                        },
                      ]
                    : []),
                  ...(uncompletedNotes
                    ? [
                        {
                          textParagraph: {
                            text: `<b>→ Next Priorities:</b>\n${uncompletedNotes}`,
                          },
                        },
                      ]
                    : []),
                ],
              },
            ],
          },
        ],
      };

      // await fetch(
      //   "https://chat.googleapis.com/v1/spaces/AAQAvJmVRG8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=MuMyJFHu0KonPMNyB-qk3qbYka8MMR52yITuoaQUA_I",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(webhookMessage),
      //   }
      // ).catch((err) => {
      //   console.error("Error sending to Google Chat:", err);
      //   // Don't fail the report submission if webhook fails
      // });

      toast.success("Report submitted successfully!");
      setMetricValues({});
      setCompletedNotes("");
      setBlockerNotes("");
      setUncompletedNotes("");
      setSelectedDepartmentId(undefined);
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
              <Label>Report Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !reportDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reportDate ? format(reportDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reportDate}
                    onSelect={(date) => {
                      if (date) {
                        setReportDate(date);
                        setSelectedDepartmentId(undefined);
                        setMetricValues({});
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    fromMonth={new Date()}
                    toDate={new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Select your name</Label>
              <Select
                value={selectedStaffId}
                onValueChange={(v) => {
                  setSelectedStaffId(v);
                  setSelectedDepartmentId(undefined);
                  setMetricValues({});
                  setPasswordVerified(false);
                  setEnteredPassword("");
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

            {selectedStaff && selectedStaff.password_hash && !passwordVerified && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="password" className="text-sm">
                        Password Required
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Please enter your password to access the reporting form
                      </p>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={enteredPassword}
                        onChange={(e) => setEnteredPassword(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handlePasswordVerify()}
                      />
                    </div>
                    <Button
                      onClick={handlePasswordVerify}
                      disabled={!enteredPassword.trim() || verifyingPassword}
                      className="w-full"
                    >
                      {verifyingPassword ? "Verifying..." : "Verify Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedStaff && assignedDepartments && assignedDepartments.length > 0 && (passwordVerified || !selectedStaff.password_hash) && (
              <>
                <div className="space-y-2">
                  <Label>Job Roles</Label>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={(v) => {
                      setSelectedDepartmentId(v);
                      setMetricValues({});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your department..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedDepartments.map((dept) => {
                        const submitted = todayReports?.some(
                          (r: any) => r.department_id === dept.id
                        );
                        return (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} {submitted ? "✓ (Submitted)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {assignedDepartments.length > 1 && (
                  <div className="rounded-lg bg-blue-50 px-4 py-3 border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Assigned Departments ({assignedDepartments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {assignedDepartments.map((dept) => {
                        const submitted = todayReports?.some(
                          (r: any) => r.department_id === dept.id
                        );
                        return (
                          <span
                            key={dept.id}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              submitted
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {dept.name} {submitted ? "✓" : "✗"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedStaff && assignedDepartments && assignedDepartments.length === 0 && (
              <div className="rounded-lg bg-orange-50 px-4 py-3 border border-orange-200">
                <p className="text-sm text-orange-800">
                  No departments assigned. Please contact your administrator.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedStaff && selectedDepartmentId && alreadySubmittedForDept && (
          <Card className="mt-6 border-success/30 bg-success/5">
            <CardContent className="flex items-center gap-3 py-6">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium text-foreground">
                  Report already submitted
                </p>
                <p className="text-sm text-muted-foreground">
                  You've already submitted your report for {selectedDept?.name} on {format(reportDate, "PPP")}.
                  {departmentsNeedingReports.length > 0 && (
                    <> Consider submitting for other departments: {departmentsNeedingReports
                      .map((d) => d.name)
                      .join(", ")}</>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedStaff && selectedDepartmentId && !alreadySubmittedForDept && metrics && (
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg">
                Metrics for {format(reportDate, "PPP")} — {selectedDept?.name}
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

        {selectedStaff && selectedDepartmentId && !alreadySubmittedForDept && metrics && (
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
                  ✓ Key tasks completed
                </Label>
                <Textarea
                  id="completed-notes"
                  placeholder="What did you accomplish today? List your Key tasks completed..."
                  value={completedNotes}
                  onChange={(e) => setCompletedNotes(e.target.value)}
                  className="min-h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blocker-notes" className="text-sm font-medium">
                  ⚠️ Blockers
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
                  → Priorities for the next day
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
