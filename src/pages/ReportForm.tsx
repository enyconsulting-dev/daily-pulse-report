import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useDepartments,
  useAllStaffMembers,
  useDepartmentMetrics,
  useCheckTodayReport,
  useStaffAssignedDepartments,
  useCheckTodayTimesheet,
} from "@/hooks/useStaffAndMetrics";
import { useHRSubmit } from "@/hooks/useHRPartner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle2, Send, CalendarIcon, Clock, FileText } from "lucide-react";
import { format, getDay, lastDayOfMonth, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";

interface TimesheetEntry {
  start_time: string;
  end_time: string;
  notes: string;
}

function isLastFridayOfMonth(date: Date): boolean {
  if (getDay(date) !== 5) return false; // Not a Friday
  const monthEnd = lastDayOfMonth(date);
  // Check if there's no more Friday left in this month
  const daysUntilEnd = monthEnd.getDate() - date.getDate();
  return daysUntilEnd < 7;
}

function getDefaultTimesheetEntries(date: Date): TimesheetEntry[] {
  const dayOfWeek = getDay(date); // 0=Sun, 1=Mon, ..., 5=Fri

  // Monday: first slot is 9:00–10:30 "Start of the week meeting", rest ends at 17:00
  if (dayOfWeek === 1) {
    return [
      { start_time: "09:00", end_time: "10:30", notes: "Start of the week meeting" },
      { start_time: "10:30", end_time: "11:30", notes: "" },
      { start_time: "11:30", end_time: "12:30", notes: "" },
      { start_time: "12:30", end_time: "13:30", notes: "" },
      { start_time: "13:30", end_time: "14:30", notes: "" },
      { start_time: "14:30", end_time: "15:30", notes: "" },
      { start_time: "15:30", end_time: "16:30", notes: "" },
      { start_time: "16:30", end_time: "17:00", notes: "" },
    ];
  }

  // Friday: last slot is 15:30–17:00
  if (dayOfWeek === 5) {
    const lastSlotNote = isLastFridayOfMonth(date) ? "End of Month Review" : "Weekly PRD";
    const base: TimesheetEntry[] = Array.from({ length: 7 }, (_, i) => ({
      start_time: `${String(9 + i).padStart(2, "0")}:00`,
      end_time: `${String(10 + i).padStart(2, "0")}:00`,
      notes: "",
    }));
    // Adjust slot 7 to end at 15:30 and add the final slot
    base[6] = { ...base[6], end_time: "15:30" };
    base.push({ start_time: "15:30", end_time: "17:00", notes: lastSlotNote });
    return base;
  }

  // Default: normal 1-hour slots from 9AM to 5PM
  return Array.from({ length: 8 }, (_, i) => ({
    start_time: `${String(9 + i).padStart(2, "0")}:00`,
    end_time: `${String(10 + i).padStart(2, "0")}:00`,
    notes: "",
  }));
}

function addOneHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

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
  const [activeTab, setActiveTab] = useState("report");

  // Timesheet state
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>(
    () => getDefaultTimesheetEntries(new Date())
  );
  const [submittingTimesheet, setSubmittingTimesheet] = useState(false);
  const hrSubmit = useHRSubmit();

  const reportDateStr = format(reportDate, "yyyy-MM-dd");

  const { data: allStaff } = useAllStaffMembers();
  const { data: assignedDepartments } = useStaffAssignedDepartments(selectedStaffId);
  const { data: metrics } = useDepartmentMetrics(selectedDepartmentId);
  const { data: todayReports, isLoading: checkingReport } =
    useCheckTodayReport(selectedStaffId, reportDateStr);
  const { data: todayTimesheets } = useCheckTodayTimesheet(selectedStaffId, reportDateStr);

  const activeStaff = allStaff?.filter((staff) => staff.is_active);
  const selectedStaff = activeStaff?.find((s) => s.id === selectedStaffId) as any;
  const selectedDept = assignedDepartments?.find((d) => d.id === selectedDepartmentId);
  
  // Check if already submitted for this specific department
  const alreadySubmittedForDept = todayReports?.some(
    (r: any) => r.department_id === selectedDepartmentId
  ) || false;

  // Check if timesheet already submitted
  const alreadySubmittedTimesheet = (todayTimesheets?.length ?? 0) > 0;

  // Get departments that still need reports
  const departmentsNeedingReports = assignedDepartments?.filter(
    (d) => !todayReports?.some((r: any) => r.department_id === d.id)
  ) || [];

  // Check if password verification is needed
  const needsPasswordVerification = selectedStaff?.password_hash && !passwordVerified;

  // Check if staff is ready (selected + password verified if needed)
  const staffReady = selectedStaff && (passwordVerified || !selectedStaff.password_hash);

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

  const updateTimesheetEntry = (index: number, field: keyof TimesheetEntry, value: string) => {
    setTimesheetEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // When end_time changes, cascade to the next row's start_time
      if (field === "end_time" && index < updated.length - 1) {
        updated[index + 1] = { ...updated[index + 1], start_time: value };
      }

      return updated;
    });
  };

  const handleTimesheetSubmit = async () => {
    if (!selectedStaffId) return;

    if (alreadySubmittedTimesheet) {
      toast.error("Timesheet already submitted for this day");
      return;
    }

    // Filter entries that have at least start_time and end_time filled
    const filledEntries = timesheetEntries.filter(
      (e) => e.start_time.trim() && e.end_time.trim()
    );

    if (filledEntries.length === 0) {
      toast.error("Please fill in at least one time entry");
      return;
    }

    // Validate that end_time is after start_time for each filled entry
    const invalidEntries = filledEntries.filter((e) => e.end_time <= e.start_time);
    if (invalidEntries.length > 0) {
      toast.error("End time must be after start time for all entries");
      return;
    }

    setSubmittingTimesheet(true);
    try {
      // const rows = filledEntries.map((e) => ({
      //   staff_id: selectedStaffId,
      //   timesheet_date: reportDateStr,
      //   start_time: `${reportDateStr} ${e.start_time}`,
      //   end_time: `${reportDateStr} ${e.end_time}`,
      //   notes: e.notes || null,
      // }));

      // const { error } = await supabase.from("timesheets").insert(rows);

      // if (error) throw error;

      // toast.success("Timesheet submitted successfully!");

      // setTimesheetEntries(getDefaultTimesheetEntries(reportDate));
      // queryClient.invalidateQueries({ queryKey: ["today_timesheet"] });

      // Send to HR Partner dummy hook
      if (selectedStaff?.employee_code) {
        hrSubmit.mutate({
          employee_code: selectedStaff.employee_code,
          timesheet_date: reportDateStr,
          timesheet_data: filledEntries
        });
      } else {
        console.warn("No employee code found for selected staff, skipping HR Partner submission");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit timesheet");
    } finally {
      setSubmittingTimesheet(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStaffId || !selectedDepartmentId || !metrics) return;

    if (alreadySubmittedForDept) {
      toast.error("Report already submitted for this department today");
      return;
    }

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

      await fetch(
        "https://chat.googleapis.com/v1/spaces/AAQAvJmVRG8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=MuMyJFHu0KonPMNyB-qk3qbYka8MMR52yITuoaQUA_I",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookMessage),
        }
      ).catch((err) => {
        console.error("Error sending to Google Chat:", err);
        // Don't fail the report submission if webhook fails
      });

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

  // Shared staff selection + password section
  const renderStaffSection = () => (
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
                    setTimesheetEntries(getDefaultTimesheetEntries(date));
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
              setTimesheetEntries(getDefaultTimesheetEntries(reportDate));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose staff member..." />
            </SelectTrigger>
            <SelectContent>
              {activeStaff?.map((staff) => (
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
      </CardContent>
    </Card>
  );

  // Report-specific department selector + status badges
  const renderDepartmentSection = () => (
    <>
      {selectedStaff && assignedDepartments && assignedDepartments.length > 0 && staffReady && (
        <>
          <Card className="mt-6 mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Department</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </>
      )}

      {selectedStaff && assignedDepartments && assignedDepartments.length === 0 && (
        <div className="mt-6 rounded-lg bg-orange-50 px-4 py-3 border border-orange-200">
          <p className="text-sm text-orange-800">
            No departments assigned. Please contact your administrator.
          </p>
        </div>
      )}
    </>
  );

  // Timesheet row number badge
  const RowBadge = ({ num }: { num: number }) => (
    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold shadow-md">
      {num}
    </div>
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Daily Report
          </h1>
          <p className="mt-1 text-muted-foreground">
            Select your name and fill in today's metrics or timesheet
          </p>
        </div>

        {/* Staff selection is always visible */}
        {renderStaffSection()}

        {/* Tabs only show after staff is ready */}
        {staffReady && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger
                value="report"
                className="flex items-center gap-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <FileText className="h-4 w-4" />
                Daily Report
              </TabsTrigger>
              <TabsTrigger
                value="timesheet"
                className="flex items-center gap-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                <Clock className="h-4 w-4" />
                Timesheet
              </TabsTrigger>
            </TabsList>

            {/* ==================== DAILY REPORT TAB ==================== */}
            <TabsContent value="report" className="mt-6 space-y-0">
              {renderDepartmentSection()}

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
                <Card className="mt-6 animate-fade-in mb-6">
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
                <Card className="mt-10 mb-6 animate-fade-in">
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
            </TabsContent>

            {/* ==================== TIMESHEET TAB ==================== */}
            <TabsContent value="timesheet" className="mt-6 space-y-0">
              {alreadySubmittedTimesheet ? (
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="flex items-center gap-3 py-6">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <div>
                      <p className="font-medium text-foreground">
                        Timesheet already submitted
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You've already submitted your timesheet for {format(reportDate, "PPP")}.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="animate-fade-in overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      Timesheet for {format(reportDate, "PPP")}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Log your working hours — fill in start time, end time, and notes for each slot
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Header row */}
                    <div className="hidden sm:grid grid-cols-[3rem_1fr_auto_1fr_2fr] gap-3 items-center px-5 py-3 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>#</span>
                      <span>Start</span>
                      <span></span>
                      <span>End</span>
                      <span>Notes</span>
                    </div>

                    <div className="divide-y">
                      {timesheetEntries.map((entry, index) => (
                        <div
                          key={index}
                          className={cn(
                            "grid grid-cols-1 sm:grid-cols-[3rem_1fr_auto_1fr_2fr] gap-3 items-center px-5 py-4 transition-colors duration-150",
                            index % 2 === 0
                              ? "bg-background"
                              : "bg-muted/20",
                            "hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
                          )}
                        >
                          {/* Row badge */}
                          <RowBadge num={index + 1} />

                          {/* Start time */}
                          <Input
                            type="time"
                            value={entry.start_time}
                            onChange={(e) =>
                              updateTimesheetEntry(index, "start_time", e.target.value)
                            }
                            className="font-mono text-sm h-10"
                          />

                          {/* Arrow separator */}
                          <span className="hidden sm:flex items-center justify-center text-muted-foreground font-bold text-lg">
                            →
                          </span>

                          {/* End time */}
                          <Input
                            type="time"
                            value={entry.end_time}
                            onChange={(e) =>
                              updateTimesheetEntry(index, "end_time", e.target.value)
                            }
                            className="font-mono text-sm h-10"
                          />

                          {/* Notes */}
                          <Input
                            type="text"
                            placeholder="What did you work on?"
                            value={entry.notes}
                            onChange={(e) =>
                              updateTimesheetEntry(index, "notes", e.target.value)
                            }
                            className="text-sm h-10"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Summary + Submit */}
                    <div className="px-5 py-5 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {timesheetEntries.filter((e) => e.start_time && e.end_time).length}
                          </span>{" "}
                          of 8 slots filled
                        </div>
                        <div className="text-sm font-medium text-violet-700 dark:text-violet-400">
                          {(() => {
                            const totalMinutes = timesheetEntries
                              .filter((e) => e.start_time && e.end_time && e.end_time > e.start_time)
                              .reduce((acc, e) => {
                                const [sh, sm] = e.start_time.split(":").map(Number);
                                const [eh, em] = e.end_time.split(":").map(Number);
                                return acc + (eh * 60 + em) - (sh * 60 + sm);
                              }, 0);
                            const hours = Math.floor(totalMinutes / 60);
                            const mins = totalMinutes % 60;
                            return `${hours}h ${mins > 0 ? `${mins}m` : ""} total`;
                          })()}
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 transition-all duration-200"
                        size="lg"
                        onClick={handleTimesheetSubmit}
                        disabled={submittingTimesheet}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {submittingTimesheet ? "Submitting..." : "Submit Timesheet"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
