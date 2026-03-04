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
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DatePreset = "today" | "week" | "month" | "2months" | "year" | "custom";

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#0ea5e9", // sky
];

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
    return allStaff.filter((s) =>
      s.assigned_departments?.some((d) => d.id === selectedDept)
    );
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
          department_id,
          completed_tasks,
          blockers,
          uncompleted_tasks,
          staff_members(id, name, email),
          departments(id, name),
          report_entries(value, department_metrics(metric_name, metric_type, sort_order))
        `
        )
        .gte("report_date", fromStr)
        .lte("report_date", toStr)
        .order("report_date", { ascending: false });

      if (selectedDept !== "all") {
        query = query.eq("department_id", selectedDept);
      }
      if (selectedStaff !== "all") {
        query = query.eq("staff_id", selectedStaff);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Aggregate data for charts
  const chartData = useMemo(() => {
    if (!reports || reports.length === 0) return { 
      deptData: [], 
      metricsData: [], 
      timeseriesData: [],
      departmentMetrics: {}
    };

    // Department distribution (pie chart)
    const deptCounts: Record<string, number> = {};
    reports.forEach((r) => {
      const deptName = (r.departments as any)?.name || "Unknown";
      deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
    });

    const deptData = Object.entries(deptCounts).map(([name, count]) => ({
      name,
      value: count,
    }));

    // Metrics aggregation (bar chart) - top 10 metrics by sum
    // Exclude revenue metrics and ensure each department has at least 1 metric
    const metricsMap: Record<string, number> = {};
    const metricsByDept: Record<string, Array<{ name: string; value: number }>> = {};
    
    reports.forEach((r) => {
      const deptName = (r.departments as any)?.name || "Unknown";
      if (!metricsByDept[deptName]) {
        metricsByDept[deptName] = [];
      }
      
      (r.report_entries || []).forEach((entry: any) => {
        if (entry.department_metrics && entry.department_metrics.metric_type === "number") {
          const name = entry.department_metrics.metric_name;
          const isRevenue = name.toLowerCase().includes("revenue") || 
                           name.toLowerCase().includes("naira") ||
                           name.toLowerCase().includes("usd") ||
                           name.toLowerCase().includes("cad");
          
          if (!isRevenue) {
            metricsMap[name] = (metricsMap[name] || 0) + parseFloat(entry.value || "0");
            
            const existing = metricsByDept[deptName].find(m => m.name === name);
            if (existing) {
              existing.value += parseFloat(entry.value || "0");
            } else {
              metricsByDept[deptName].push({ name, value: parseFloat(entry.value || "0") });
            }
          }
        }
      });
    });

    // Build top 10 with at least 1 from each department
    const metricsData: Array<{ name: string; value: number }> = [];
    const deptMetricsAdded = new Set<string>();
    
    // First, add the top metric from each department
    Object.entries(metricsByDept).forEach(([dept, metrics]) => {
      if (metrics.length > 0) {
        const topMetric = metrics.reduce((prev, current) => 
          prev.value > current.value ? prev : current
        );
        metricsData.push(topMetric);
        deptMetricsAdded.add(topMetric.name);
      }
    });
    
    // Then fill remaining slots with top overall metrics (excluding already added)
    const remainingMetrics = Object.entries(metricsMap)
      .map(([name, value]) => ({ name, value }))
      .filter(m => !deptMetricsAdded.has(m.name))
      .sort((a, b) => b.value - a.value);
    
    metricsData.push(...remainingMetrics.slice(0, Math.max(0, 10 - metricsData.length)));
    metricsData.sort((a, b) => b.value - a.value);

    // Timeseries data (line chart) - daily report count
    const dateMap: Record<string, number> = {};
    reports.forEach((r) => {
      dateMap[r.report_date] = (dateMap[r.report_date] || 0) + 1;
    });

    const timeseriesData = Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Department-specific metrics aggregation
    const departmentMetrics: Record<string, Array<{ name: string; value: number }>> = {};
    reports.forEach((r) => {
      const deptName = (r.departments as any)?.name || "Unknown";
      if (!departmentMetrics[deptName]) {
        departmentMetrics[deptName] = [];
      }
      
      (r.report_entries || []).forEach((entry: any) => {
        if (entry.department_metrics && entry.department_metrics.metric_type === "number") {
          const metricName = entry.department_metrics.metric_name;
          const existingMetric = departmentMetrics[deptName].find(m => m.name === metricName);
          if (existingMetric) {
            existingMetric.value += parseFloat(entry.value || "0");
          } else {
            departmentMetrics[deptName].push({
              name: metricName,
              value: parseFloat(entry.value || "0")
            });
          }
        }
      });
    });

    // Sort each department's metrics by value
    Object.keys(departmentMetrics).forEach(dept => {
      departmentMetrics[dept].sort((a, b) => b.value - a.value);
    });

    return { deptData, metricsData, timeseriesData, departmentMetrics };
  }, [reports]);

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
      const dept = r.departments as any;
      const values = metricNames.map((mn) => {
        const entry = r.report_entries?.find(
          (e: any) => e.department_metrics?.metric_name === mn
        ) as any;
        return entry ? entry.value : "";
      });
      return [staff.name, dept?.name || "", r.report_date, ...values];
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

        {/* Charts Section */}
        {reports && reports.length > 0 && (
          <div className="space-y-8 mb-8">
            {/* Top row - Pie and Line charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Department Distribution Pie Chart */}
              {chartData.deptData.length > 0 && (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Reports by Department</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData.deptData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name} (${value})`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.deptData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Daily Reports Trend */}
              {chartData.timeseriesData.length > 0 && (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Report Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData.timeseriesData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" style={{ fontSize: "12px" }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#10b981"
                          name="Reports"
                          connectNulls
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Top Metrics Bar Chart */}
            {chartData.metricsData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top 10 Metrics Overall</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={chartData.metricsData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 250, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={240} style={{ fontSize: "12px" }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Department-Specific Metrics Charts */}
        {reports && reports.length > 0 && Object.keys(chartData.departmentMetrics).length > 0 && (
          <div className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Department Performance Metrics</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Object.entries(chartData.departmentMetrics).map(([deptName, metrics]) => {
                // Split revenue and non-revenue metrics for Sales team
                const isScheduleTeam = deptName.includes("Sales");
                const revenueMetrics = metrics.filter(m => 
                  m.name.toLowerCase().includes("revenue") || 
                  m.name.toLowerCase().includes("naira") ||
                  m.name.toLowerCase().includes("usd") ||
                  m.name.toLowerCase().includes("cad")
                );
                const nonRevenueMetrics = metrics.filter(m => 
                  !m.name.toLowerCase().includes("revenue") && 
                  !m.name.toLowerCase().includes("naira") &&
                  !m.name.toLowerCase().includes("usd") &&
                  !m.name.toLowerCase().includes("cad")
                );

                const displayMetrics = isScheduleTeam ? nonRevenueMetrics : metrics;
                const colorIndex = Object.keys(chartData.departmentMetrics).indexOf(deptName);

                return (
                  <div key={deptName}>
                    {/* Main Metrics Chart */}
                    {displayMetrics.length > 0 && (
                      <Card className="overflow-hidden">
                        <CardHeader>
                          <CardTitle className="text-base">{deptName}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isScheduleTeam ? "Operational Metrics" : "Aggregated metrics from daily reports"}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                              data={displayMetrics.slice(0, 8)}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 180, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={170} style={{ fontSize: "11px" }} />
                              <Tooltip />
                              <Bar 
                                dataKey="value" 
                                fill={COLORS[colorIndex % COLORS.length]} 
                                radius={[0, 8, 8, 0]} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Revenue Chart for Sales Team */}
                    {isScheduleTeam && revenueMetrics.length > 0 && (
                      <Card className="overflow-hidden mt-6">
                        <CardHeader>
                          <CardTitle className="text-base">{deptName} - Revenue Breakdown</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">Revenue metrics in different currencies</p>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                              data={revenueMetrics}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={190} style={{ fontSize: "11px" }} />
                              <Tooltip 
                                formatter={(value) => {
                                  if (typeof value === 'number') {
                                    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
                                  }
                                  return value;
                                }}
                              />
                              <Bar 
                                dataKey="value" 
                                fill="#10b981" 
                                radius={[0, 8, 8, 0]} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
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
              const dept = report.departments as any;
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
                        {dept?.name}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-foreground">Key Metrics</h3>
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
                    </div>

                    {/* Daily Notes Section */}
                    {(report.completed_tasks || report.blockers || report.uncompleted_tasks) && (
                      <div className="pt-2 border-t space-y-3">
                        <h3 className="text-sm font-semibold text-foreground">Daily Notes</h3>
                        
                        {report.completed_tasks && (
                          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                            <p className="text-xs font-medium text-emerald-900 dark:text-emerald-300 mb-1">
                              ✓ Completed Tasks
                            </p>
                            <p className="text-sm text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap">
                              {report.completed_tasks}
                            </p>
                          </div>
                        )}

                        {report.blockers && (
                          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-3">
                            <p className="text-xs font-medium text-orange-900 dark:text-orange-300 mb-1">
                              ⚠️ Blockers
                            </p>
                            <p className="text-sm text-orange-800 dark:text-orange-200 whitespace-pre-wrap">
                              {report.blockers}
                            </p>
                          </div>
                        )}

                        {report.uncompleted_tasks && (
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                              → Uncompleted Tasks (Carry Over)
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                              {report.uncompleted_tasks}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
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
