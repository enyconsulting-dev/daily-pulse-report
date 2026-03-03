import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDepartments, useAllStaffMembers } from "@/hooks/useStaffAndMetrics";
import { format, subDays, subMonths, subYears, startOfWeek, startOfMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";

type DatePreset = "today" | "week" | "month" | "2months" | "year" | "custom";

function getDateRange(preset: DatePreset, customFrom: Date, customTo: Date) {
  const today = new Date();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week":
      return { from: startOfWeek(today, { weekStartsOn: 1 }), to: today };
    case "month":
      return { from: startOfMonth(today), to: today };
    case "2months":
      return { from: subMonths(today, 2), to: today };
    case "year":
      return { from: subYears(today, 1), to: today };
    case "custom":
      return { from: customFrom, to: customTo };
  }
}

export default function Dashboard() {
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customFrom, setCustomFrom] = useState<Date>(new Date());
  const [customTo, setCustomTo] = useState<Date>(new Date());
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedStaff, setSelectedStaff] = useState<string>("all");

  const { data: departments } = useDepartments();
  const { data: allStaff } = useAllStaffMembers();

  const filteredStaffList = useMemo(() => {
    if (!allStaff) return [];
    if (selectedDept === "all") return allStaff;
    return allStaff.filter((s) => s.department_id === selectedDept);
  }, [allStaff, selectedDept]);

  const { from, to } = getDateRange(datePreset, customFrom, customTo);
  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["dashboard_reports", fromStr, toStr, selectedDept, selectedStaff],
    queryFn: async () => {
      let query = supabase
        .from("daily_reports")
        .select(
          `
          id,
          report_date,
          created_at,
          staff_members!inner(id, name, department_id, departments(name)),
          report_entries(value, department_metrics(metric_name, metric_type, sort_order))
        `
        )
        .gte("report_date", fromStr)
        .lte("report_date", toStr)
        .order("report_date", { ascending: false });

      if (selectedDept !== "all") {
        query = query.eq("staff_members.department_id", selectedDept);
      }
      if (selectedStaff !== "all") {
        query = query.eq("staff_id", selectedStaff);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const exportCSV = () => {
    if (!reports || reports.length === 0) return;

    const allMetrics = new Set<string>();
    reports.forEach((r) =>
      r.report_entries?.forEach((e: any) => {
        if (e.department_metrics) allMetrics.add(e.department_metrics.metric_name);
      })
    );
    const metricNames = Array.from(allMetrics);

    const headers = ["Staff Name", "Department", "Date", ...metricNames];
    const rows = reports.map((r) => {
      const staff = r.staff_members as any;
      const values = metricNames.map((mn) => {
        const entry = r.report_entries?.find(
          (e: any) => e.department_metrics?.metric_name === mn
        ) as any;
        return entry ? entry.value : "";
      });
      return [staff.name, staff.departments?.name || "", r.report_date, ...values];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${fromStr}-to-${toStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presetLabel: Record<DatePreset, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    "2months": "Last 2 Months",
    year: "Last Year",
    custom: "Custom Range",
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Reports Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              View and export daily staff reports
            </p>
          </div>
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={!reports?.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:flex-wrap">
            {/* Date Preset */}
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Period</label>
              <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(presetLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom date pickers */}
            {datePreset === "custom" && (
              <>
                <div className="flex-1 min-w-[180px] space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(customFrom, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customFrom}
                        onSelect={(d) => d && setCustomFrom(d)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 min-w-[180px] space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(customTo, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customTo}
                        onSelect={(d) => d && setCustomTo(d)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {/* Department filter */}
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <Select
                value={selectedDept}
                onValueChange={(v) => {
                  setSelectedDept(v);
                  setSelectedStaff("all");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Staff filter */}
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Staff Member</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {filteredStaffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {reports && reports.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-foreground">{reports.length}</p>
                <p className="text-xs text-muted-foreground">Total Reports</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {new Set(reports.map((r) => (r.staff_members as any).id)).size}
                </p>
                <p className="text-xs text-muted-foreground">Staff Reported</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {new Set(reports.map((r) => r.report_date)).size}
                </p>
                <p className="text-xs text-muted-foreground">Days Covered</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : !reports?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No reports found for the selected period
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => {
              const staff = report.staff_members as any;
              const entries = (report.report_entries || []) as any[];
              const sorted = [...entries].sort(
                (a, b) =>
                  (a.department_metrics?.sort_order || 0) -
                  (b.department_metrics?.sort_order || 0)
              );

              return (
                <Card key={report.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{staff.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(report.report_date), "PPP")}
                        </p>
                      </div>
                      <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {staff.departments?.name}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sorted.map((entry: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>
                              {entry.department_metrics?.metric_name}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {entry.value}
                              {entry.department_metrics?.metric_type === "percentage" && "%"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
