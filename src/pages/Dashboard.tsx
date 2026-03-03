import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDepartments } from "@/hooks/useStaffAndMetrics";
import { format } from "date-fns";
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

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDept, setSelectedDept] = useState<string>("all");

  const { data: departments } = useDepartments();

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["dashboard_reports", dateStr, selectedDept],
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
        .eq("report_date", dateStr)
        .order("created_at", { ascending: false });

      if (selectedDept !== "all") {
        query = query.eq("staff_members.department_id", selectedDept);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const exportCSV = () => {
    if (!reports || reports.length === 0) return;

    // Collect all unique metric names
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
    a.download = `reports-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <CardContent className="flex flex-col gap-4 py-4 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Department
              </label>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger>
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
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : !reports?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No reports found for {format(selectedDate, "PPP")}
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
                      <CardTitle className="text-base">{staff.name}</CardTitle>
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
                              {entry.department_metrics?.metric_type ===
                                "percentage" && "%"}
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
