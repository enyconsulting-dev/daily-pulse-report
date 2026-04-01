import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useAllStaffMembers,
  useDepartmentMetrics,
  useCheckTodayReport,
  useStaffAssignedDepartments,
  useCheckTodayTimesheet,
} from "@/hooks/useStaffAndMetrics";
import { useHRSubmit } from "@/hooks/useHRPartner";
import { verifyPassword } from "@/lib/passwordUtils";
import { toast } from "sonner";
import { Send, Lock } from "lucide-react";
import { format, getDay, lastDayOfMonth } from "date-fns";
import AppLayout from "@/components/AppLayout";
import {
  WinButton,
  WinInput,
  WinTextarea,
  WinSelect,
  WinPanel,
  WinGroupBox,
  WinLabel,
  WinSeparator,
  WinTabs,
  WinInfoBox,
} from "@/components/Win2k";

interface TimesheetEntry {
  start_time: string;
  end_time: string;
  notes: string;
}

function isLastFridayOfMonth(date: Date): boolean {
  if (getDay(date) !== 5) return false;
  const monthEnd = lastDayOfMonth(date);
  const daysUntilEnd = monthEnd.getDate() - date.getDate();
  return daysUntilEnd < 7;
}

function getDefaultTimesheetEntries(date: Date): TimesheetEntry[] {
  const dayOfWeek = getDay(date);
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
  if (dayOfWeek === 5) {
    const lastSlotNote = isLastFridayOfMonth(date) ? "End of Month Review" : "Weekly PRD";
    const base: TimesheetEntry[] = Array.from({ length: 7 }, (_, i) => ({
      start_time: `${String(9 + i).padStart(2, "0")}:00`,
      end_time: `${String(10 + i).padStart(2, "0")}:00`,
      notes: "",
    }));
    base[6] = { ...base[6], end_time: "15:30" };
    base.push({ start_time: "15:30", end_time: "17:00", notes: lastSlotNote });
    return base;
  }
  return Array.from({ length: 8 }, (_, i) => ({
    start_time: `${String(9 + i).padStart(2, "0")}:00`,
    end_time: `${String(10 + i).padStart(2, "0")}:00`,
    notes: "",
  }));
}

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Tahoma, 'MS Sans Serif', Arial, sans-serif",
  fontSize: "11px",
};

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
  const [activeTab, setActiveTab] = useState("Daily Report");
  const [showDateInput, setShowDateInput] = useState(false);

  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>(
    () => getDefaultTimesheetEntries(new Date())
  );
  const [submittingTimesheet, setSubmittingTimesheet] = useState(false);
  const hrSubmit = useHRSubmit();

  const reportDateStr = format(reportDate, "yyyy-MM-dd");

  const { data: allStaff } = useAllStaffMembers();
  const { data: assignedDepartments } = useStaffAssignedDepartments(selectedStaffId);
  const { data: metrics } = useDepartmentMetrics(selectedDepartmentId);
  const { data: todayReports } = useCheckTodayReport(selectedStaffId, reportDateStr);
  const { data: todayTimesheets } = useCheckTodayTimesheet(selectedStaffId, reportDateStr);

  const selectedStaff = allStaff?.find((s) => s.id === selectedStaffId) as any;
  const selectedDept = assignedDepartments?.find((d) => d.id === selectedDepartmentId);

  const alreadySubmittedForDept = todayReports?.some(
    (r: any) => r.department_id === selectedDepartmentId
  ) || false;
  const alreadySubmittedTimesheet = (todayTimesheets?.length ?? 0) > 0;
  const departmentsNeedingReports = assignedDepartments?.filter(
    (d) => !todayReports?.some((r: any) => r.department_id === d.id)
  ) || [];

  const needsPasswordVerification = selectedStaff?.password_hash && !passwordVerified;
  const staffReady = selectedStaff && (passwordVerified || !selectedStaff.password_hash);

  const handlePasswordVerify = async () => {
    if (!selectedStaff?.password_hash) { setPasswordVerified(true); return; }
    setVerifyingPassword(true);
    try {
      const isValid = await verifyPassword(enteredPassword, selectedStaff.password_hash);
      if (isValid) { setPasswordVerified(true); toast.success("Password verified!"); }
      else { toast.error("Incorrect password"); setEnteredPassword(""); }
    } catch { toast.error("Error verifying password"); }
    setVerifyingPassword(false);
  };

  const updateTimesheetEntry = (index: number, field: keyof TimesheetEntry, value: string) => {
    setTimesheetEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "end_time" && index < updated.length - 1)
        updated[index + 1] = { ...updated[index + 1], start_time: value };
      return updated;
    });
  };

  const handleTimesheetSubmit = async () => {
    if (!selectedStaffId) return;
    if (alreadySubmittedTimesheet) { toast.error("Timesheet already submitted for this day"); return; }
    const filledEntries = timesheetEntries.filter((e) => e.start_time.trim() && e.end_time.trim());
    if (filledEntries.length === 0) { toast.error("Please fill in at least one time entry"); return; }
    const invalidEntries = filledEntries.filter((e) => e.end_time <= e.start_time);
    if (invalidEntries.length > 0) { toast.error("End time must be after start time for all entries"); return; }
    setSubmittingTimesheet(true);
    try {
      const rows = filledEntries.map((e) => ({
        staff_id: selectedStaffId,
        timesheet_date: reportDateStr,
        start_time: `${reportDateStr} ${e.start_time}`,
        end_time: `${reportDateStr} ${e.end_time}`,
        notes: e.notes || null,
      }));
      const { error } = await supabase.from("timesheets").insert(rows);
      if (error) throw error;
      toast.success("Timesheet submitted successfully!");
      if (selectedStaff?.employee_code) {
        hrSubmit.mutate({ employee_code: selectedStaff.employee_code, timesheet_data: filledEntries });
      }
    } catch (err: any) { toast.error(err.message || "Failed to submit timesheet"); }
    finally { setSubmittingTimesheet(false); }
  };

  const handleSubmit = async () => {
    if (!selectedStaffId || !selectedDepartmentId || !metrics) return;
    if (alreadySubmittedForDept) { toast.error("Report already submitted for this department today"); return; }
    const filledMetrics = metrics.filter((m) => metricValues[m.id]?.trim());
    if (filledMetrics.length === 0) { toast.error("Please fill in at least one metric"); return; }
    const invalidFields = filledMetrics.filter((m) => {
      const value = metricValues[m.id];
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) return true;
      if (m.metric_type === "percentage" && (numValue < 0 || numValue > 100)) return true;
      return false;
    });
    if (invalidFields.length > 0) {
      toast.error(`Invalid values for: ${invalidFields.map((f) => f.metric_name).join(", ")}`);
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
        if (reportError.code === "23505") { toast.error("Already submitted for this department today"); return; }
        throw reportError;
      }

      const entries = filledMetrics.map((m) => ({
        report_id: report.id,
        metric_id: m.id,
        value: parseFloat(metricValues[m.id]),
      }));
      const { error: entriesError } = await supabase.from("report_entries").insert(entries);
      if (entriesError) throw entriesError;

      const metricsText = filledMetrics
        .map((m) => `${m.metric_name}: ${metricValues[m.id]}${m.metric_type === "percentage" ? "%" : ""}`)
        .join("\n");

      const webhookMessage = {
        text: `Daily Report Submission`,
        cards: [{
          header: { title: "📊 Daily Report Submitted", subtitle: `${format(reportDate, "PPP")}` },
          sections: [{
            widgets: [
              { textParagraph: { text: `<b>Staff:</b> ${selectedStaff?.name}\n<b>Department:</b> ${selectedDept?.name}` } },
              { textParagraph: { text: `<b>Key Metrics:</b>\n${metricsText}` } },
              ...(completedNotes ? [{ textParagraph: { text: `<b>✓ Completed:</b>\n${completedNotes}` } }] : []),
              ...(blockerNotes ? [{ textParagraph: { text: `<b>⚠️ Blockers:</b>\n${blockerNotes}` } }] : []),
              ...(uncompletedNotes ? [{ textParagraph: { text: `<b>→ Next Priorities:</b>\n${uncompletedNotes}` } }] : []),
            ],
          }],
        }],
      };

      await fetch(
        "https://chat.googleapis.com/v1/spaces/AAQAvJmVRG8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=MuMyJFHu0KonPMNyB-qk3qbYka8MMR52yITuoaQUA_I",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(webhookMessage) }
      ).catch((err) => console.error("Error sending to Google Chat:", err));

      toast.success("Report submitted successfully!");
      setMetricValues({});
      setCompletedNotes("");
      setBlockerNotes("");
      setUncompletedNotes("");
      setSelectedDepartmentId(undefined);
      queryClient.invalidateQueries({ queryKey: ["today_report"] });
    } catch (err: any) { toast.error(err.message || "Failed to submit report"); }
    finally { setSubmitting(false); }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        {/* Page heading as a window title bar */}
        <WinPanel
          title="Daily Report Submission"
          titleBarColor="blue"
          icon={
            <svg width="14" height="14" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
              <rect x="2" y="1" width="10" height="14" fill="#fff" stroke="#fff" strokeWidth="0.5"/>
              <polygon points="8,1 12,5 8,5" fill="#A6CAF0"/>
              <line x1="4" y1="8" x2="10" y2="8" stroke="#fff" strokeWidth="1"/>
              <line x1="4" y1="10" x2="10" y2="10" stroke="#fff" strokeWidth="1"/>
            </svg>
          }
          style={{ marginBottom: "10px" }}
        >
          <p style={{ ...BASE_FONT, margin: 0 }}>
            Select your name and fill in {"today's"} metrics.
          </p>
        </WinPanel>

        {/* ── Staff Information ── */}
        <WinGroupBox legend="Staff Information" style={{ marginBottom: "10px" }}>
          {/* Date field */}
          <div style={{ marginBottom: "8px" }}>
            <WinLabel>Report Date:</WinLabel>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <WinInput
                type="date"
                value={reportDateStr}
                max={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => {
                  const d = new Date(e.target.value + "T12:00:00");
                  if (!isNaN(d.getTime())) {
                    setReportDate(d);
                    setSelectedDepartmentId(undefined);
                    setMetricValues({});
                    setTimesheetEntries(getDefaultTimesheetEntries(d));
                  }
                }}
                style={{ width: "160px" }}
              />
              <span style={{ ...BASE_FONT, color: "#555" }}>
                ({format(reportDate, "EEEE, MMMM d, yyyy")})
              </span>
            </div>
          </div>

          <WinSeparator />

          {/* Staff selector */}
          <div style={{ marginBottom: "8px" }}>
            <WinLabel htmlFor="staff-select">Select your name:</WinLabel>
            <WinSelect
              id="staff-select"
              value={selectedStaffId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedStaffId(v || undefined);
                setSelectedDepartmentId(undefined);
                setMetricValues({});
                setPasswordVerified(false);
                setEnteredPassword("");
                setTimesheetEntries(getDefaultTimesheetEntries(reportDate));
              }}
            >
              <option value="">-- Choose staff member --</option>
              {allStaff?.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </WinSelect>
          </div>

          {/* Password prompt */}
          {selectedStaff && selectedStaff.password_hash && !passwordVerified && (
            <div style={{
              background: "#FFFBE6",
              border: "1px solid #A07000",
              padding: "8px",
              marginTop: "6px",
            }}>
              <WinLabel htmlFor="staff-password" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Lock size={11} /> Password Required
              </WinLabel>
              <p style={{ ...BASE_FONT, color: "#555", margin: "2px 0 6px" }}>
                Please enter your password to access the reporting form.
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                <WinInput
                  id="staff-password"
                  type="password"
                  placeholder="Enter your password"
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handlePasswordVerify()}
                  style={{ flex: 1 }}
                />
                <WinButton
                  onClick={handlePasswordVerify}
                  disabled={!enteredPassword.trim() || verifyingPassword}
                >
                  {verifyingPassword ? "Verifying…" : "OK"}
                </WinButton>
              </div>
            </div>
          )}
        </WinGroupBox>

        {/* ── Tabs + content ── */}
        {staffReady && (
          <div>
            {/* Tab row */}
            <WinTabs
              tabs={["Daily Report", "Timesheet"]}
              active={activeTab}
              onChange={setActiveTab}
            />

            {/* Tab content area */}
            <div style={{
              background: "#D4D0C8",
              borderTop: "2px solid #808080",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #404040",
              borderBottom: "2px solid #404040",
              padding: "10px",
              boxShadow: "inset 1px 1px 0 #E8E4DC, inset -1px -1px 0 #808080",
            }}>

              {/* ════════ DAILY REPORT TAB ════════ */}
              {activeTab === "Daily Report" && (
                <div>
                  {/* Department selector */}
                  {selectedStaff && assignedDepartments && assignedDepartments.length > 0 && (
                    <WinGroupBox legend="Department / Job Role" style={{ marginBottom: "10px" }}>
                      <WinLabel htmlFor="dept-select">Job Role:</WinLabel>
                      <WinSelect
                        id="dept-select"
                        value={selectedDepartmentId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSelectedDepartmentId(v || undefined);
                          setMetricValues({});
                        }}
                      >
                        <option value="">-- Choose your department --</option>
                        {assignedDepartments.map((dept) => {
                          const submitted = todayReports?.some((r: any) => r.department_id === dept.id);
                          return (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}{submitted ? " (✓ Submitted)" : ""}
                            </option>
                          );
                        })}
                      </WinSelect>

                      {/* Multi-dept status */}
                      {assignedDepartments.length > 1 && (
                        <div style={{ marginTop: "8px" }}>
                          <div style={{ ...BASE_FONT, fontWeight: "bold", marginBottom: "4px" }}>
                            Assigned Departments ({assignedDepartments.length}):
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {assignedDepartments.map((dept) => {
                              const submitted = todayReports?.some((r: any) => r.department_id === dept.id);
                              return (
                                <span
                                  key={dept.id}
                                  style={{
                                    ...BASE_FONT,
                                    padding: "1px 6px",
                                    border: "1px solid #808080",
                                    background: submitted ? "#D4EDDA" : "#FFF3CD",
                                    color: submitted ? "#155724" : "#856404",
                                  }}
                                >
                                  {dept.name} {submitted ? "✓" : "✗"}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </WinGroupBox>
                  )}

                  {selectedStaff && assignedDepartments?.length === 0 && (
                    <WinInfoBox variant="warning">
                      No departments assigned. Please contact your administrator.
                    </WinInfoBox>
                  )}

                  {/* Already submitted */}
                  {selectedStaff && selectedDepartmentId && alreadySubmittedForDept && (
                    <WinInfoBox variant="success">
                      <strong>Report already submitted</strong> for {selectedDept?.name} on {format(reportDate, "PPP")}.
                      {departmentsNeedingReports.length > 0 && (
                        <> Consider submitting for: {departmentsNeedingReports.map((d) => d.name).join(", ")}.</>
                      )}
                    </WinInfoBox>
                  )}

                  {/* Metrics */}
                  {selectedStaff && selectedDepartmentId && !alreadySubmittedForDept && metrics && (
                    <WinGroupBox legend={`Metrics — ${format(reportDate, "PPP")} — ${selectedDept?.name ?? ""}`} style={{ marginBottom: "10px" }}>
                      {metrics.map((metric) => (
                        <div key={metric.id} style={{ marginBottom: "6px" }}>
                          <WinLabel htmlFor={metric.id}>{metric.metric_name}:</WinLabel>
                          <WinInput
                            id={metric.id}
                            type="number"
                            step={metric.metric_type === "percentage" ? "0.1" : "1"}
                            min="0"
                            max={metric.metric_type === "percentage" ? "100" : undefined}
                            placeholder={metric.metric_type === "percentage" ? "0 – 100" : "Enter value"}
                            value={metricValues[metric.id] || ""}
                            onChange={(e) =>
                              setMetricValues((prev) => ({ ...prev, [metric.id]: e.target.value }))
                            }
                            style={{ width: "200px" }}
                          />
                        </div>
                      ))}
                    </WinGroupBox>
                  )}

                  {/* Daily Notes */}
                  {selectedStaff && selectedDepartmentId && !alreadySubmittedForDept && metrics && (
                    <WinGroupBox legend="Daily Notes" style={{ marginBottom: "10px" }}>
                      <p style={{ ...BASE_FONT, color: "#555", margin: "0 0 8px" }}>
                        Share your daily progress and challenges.
                      </p>

                      <div style={{ marginBottom: "8px" }}>
                        <WinLabel htmlFor="completed-notes">✓ Key tasks completed:</WinLabel>
                        <WinTextarea
                          id="completed-notes"
                          placeholder="What did you accomplish today?"
                          value={completedNotes}
                          onChange={(e) => setCompletedNotes(e.target.value)}
                        />
                      </div>

                      <div style={{ marginBottom: "8px" }}>
                        <WinLabel htmlFor="blocker-notes">⚠ Blockers:</WinLabel>
                        <WinTextarea
                          id="blocker-notes"
                          placeholder="What challenges or blockers did you encounter?"
                          value={blockerNotes}
                          onChange={(e) => setBlockerNotes(e.target.value)}
                        />
                      </div>

                      <div style={{ marginBottom: "10px" }}>
                        <WinLabel htmlFor="uncompleted-notes">→ Priorities for the next day:</WinLabel>
                        <WinTextarea
                          id="uncompleted-notes"
                          placeholder="What tasks need to be carried over?"
                          value={uncompletedNotes}
                          onChange={(e) => setUncompletedNotes(e.target.value)}
                        />
                      </div>

                      <WinSeparator />

                      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "6px" }}>
                        <WinButton
                          onClick={handleSubmit}
                          disabled={submitting}
                          style={{ minWidth: "120px" }}
                        >
                          <Send size={11} />
                          {submitting ? "Submitting…" : "Submit Report"}
                        </WinButton>
                      </div>
                    </WinGroupBox>
                  )}
                </div>
              )}

              {/* ════════ TIMESHEET TAB ════════ */}
              {activeTab === "Timesheet" && (
                <div>
                  {alreadySubmittedTimesheet ? (
                    <WinInfoBox variant="success">
                      <strong>Timesheet already submitted</strong> for {format(reportDate, "PPP")}.
                    </WinInfoBox>
                  ) : (
                    <WinGroupBox legend={`Timesheet — ${format(reportDate, "PPP")}`}>
                      <p style={{ ...BASE_FONT, color: "#555", margin: "0 0 8px" }}>
                        Log your working hours — fill in start time, end time, and notes for each slot.
                      </p>

                      {/* Table header */}
                      <table style={{ width: "100%", borderCollapse: "collapse", ...BASE_FONT }}>
                        <thead>
                          <tr style={{ background: "#0A246A", color: "#fff" }}>
                            <th style={{ padding: "3px 6px", textAlign: "center", width: "32px", border: "1px solid #404040" }}>#</th>
                            <th style={{ padding: "3px 6px", textAlign: "left", border: "1px solid #404040" }}>Start</th>
                            <th style={{ padding: "3px 6px", textAlign: "left", border: "1px solid #404040" }}>End</th>
                            <th style={{ padding: "3px 6px", textAlign: "left", border: "1px solid #404040" }}>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timesheetEntries.map((entry, index) => (
                            <tr
                              key={index}
                              style={{ background: index % 2 === 0 ? "#E8E4DC" : "#D4D0C8" }}
                            >
                              <td style={{ padding: "2px 6px", textAlign: "center", border: "1px solid #808080", color: "#555" }}>
                                {index + 1}
                              </td>
                              <td style={{ padding: "2px 4px", border: "1px solid #808080" }}>
                                <WinInput
                                  type="time"
                                  value={entry.start_time}
                                  onChange={(e) => updateTimesheetEntry(index, "start_time", e.target.value)}
                                  style={{ width: "80px", fontFamily: "Courier New, monospace" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px", border: "1px solid #808080" }}>
                                <WinInput
                                  type="time"
                                  value={entry.end_time}
                                  onChange={(e) => updateTimesheetEntry(index, "end_time", e.target.value)}
                                  style={{ width: "80px", fontFamily: "Courier New, monospace" }}
                                />
                              </td>
                              <td style={{ padding: "2px 4px", border: "1px solid #808080" }}>
                                <WinInput
                                  type="text"
                                  placeholder="What did you work on?"
                                  value={entry.notes}
                                  onChange={(e) => updateTimesheetEntry(index, "notes", e.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Summary */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "8px",
                        paddingTop: "6px",
                        borderTop: "1px solid #808080",
                      }}>
                        <span style={BASE_FONT}>
                          <strong>{timesheetEntries.filter((e) => e.start_time && e.end_time).length}</strong> / {timesheetEntries.length} slots filled
                          {" — "}
                          <strong>
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
                              return `${hours}h${mins > 0 ? ` ${mins}m` : ""} total`;
                            })()}
                          </strong>
                        </span>
                        <WinButton
                          onClick={handleTimesheetSubmit}
                          disabled={submittingTimesheet}
                          style={{ minWidth: "130px" }}
                        >
                          <Send size={11} />
                          {submittingTimesheet ? "Submitting…" : "Submit Timesheet"}
                        </WinButton>
                      </div>
                    </WinGroupBox>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
