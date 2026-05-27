/**
 * @module HRPip
 * @description Performance Improvement Plans page. Route: /hr/pip
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TrendingUp, Users, CheckCircle2, XCircle, Activity } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface PipPlan {
  id: string | number;
  employee_id: string | number;
  goal: string;
  actions?: string;
  start_date?: string;
  end_date?: string;
  status: "active" | "completed" | "failed";
  progress_percent?: number;
  manager_id?: string | number;
}

interface Employee {
  id: string | number;
  full_name?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

type StatusFilter = "all" | "active" | "completed" | "failed";

const STATUS_CONFIG: Record<string, { label: string; variant: "info" | "success" | "danger" }> = {
  active:    { label: "Faol",             variant: "info" },
  completed: { label: "Bajarilgan",       variant: "success" },
  failed:    { label: "Muvaffaqiyatsiz",  variant: "danger" },
};

function getEmployeeName(employeeId: string | number, employees: Employee[]): string {
  const emp = (Array.isArray(employees) ? employees : []).find(
    (e) => String(e.id) === String(employeeId)
  );
  if (!emp) return `#${employeeId}`;
  const composed = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim();
  return emp.full_name ?? (composed || `#${employeeId}`);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return dateStr.slice(0, 10);
}

function StatCard({
  icon, value, label, color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 flex items-center gap-3">
        <div className={`rounded-full p-2.5 ${color}-100`}>{icon}</div>
        <div>
          <div className={`text-2xl font-bold text-[var(--ep-${color === "bg-blue" ? "blue" : color === "bg-green" ? "green" : "red"})]`}>
            {value}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

const TABS: { value: StatusFilter; label: string }[] = [
  { value: "all",       label: "Barchasi" },
  { value: "active",    label: "Faol" },
  { value: "completed", label: "Bajarilgan" },
  { value: "failed",    label: "Muvaffaqiyatsiz" },
];

export default function HRPip() {
  const { t } = useTranslation("common");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: rawPlans, isLoading: plansLoading, isError: plansError } = useQuery<PipPlan[]>({
    queryKey: ["/api/hr/pip"],
  });

  const { data: rawEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
  });

  const plans = Array.isArray(rawPlans) ? rawPlans : [];
  const employees = Array.isArray(rawEmployees) ? rawEmployees : [];

  const filtered = plans.filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );

  const totalCount     = plans.length;
  const activeCount    = plans.filter((p) => p.status === "active").length;
  const completedCount = plans.filter((p) => p.status === "completed").length;
  const failedCount    = plans.filter((p) => p.status === "failed").length;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 px-1 pb-4 flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-[var(--ep-blue)]" />
        <h1 className="font-semibold text-base">PIP Rejalar</h1>
        <span className="text-xs text-muted-foreground ml-1">Performance Improvement Plans</span>
      </div>

      <div className="flex-1 overflow-auto space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2.5">
                <Users className="h-4 w-4 text-[var(--ep-purple)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-purple)]">{totalCount}</div>
                <div className="text-xs text-muted-foreground">Jami</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2.5">
                <Activity className="h-4 w-4 text-[var(--ep-blue)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-blue)]">{activeCount}</div>
                <div className="text-xs text-muted-foreground">Faol</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-green)]">{completedCount}</div>
                <div className="text-xs text-muted-foreground">Bajarilgan</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2.5">
                <XCircle className="h-4 w-4 text-[var(--ep-red)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-red)]">{failedCount}</div>
                <div className="text-xs text-muted-foreground">Muvaffaqiyatsiz</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Error state */}
        {plansError && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Ma&apos;lumotlarni yuklashda xatolik yuz berdi.
            </CardContent>
          </Card>
        )}

        {/* Table */}
        {!plansError && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Maqsad</TableHead>
                      <TableHead>Boshlanish</TableHead>
                      <TableHead>Tugash</TableHead>
                      <TableHead className="min-w-[140px]">Progress</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plansLoading ? (
                      <TableSkeleton />
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>
                            {plans.length === 0
                              ? "PIP rejalari mavjud emas"
                              : "Tanlangan filtrlarga mos reja topilmadi"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (Array.isArray(filtered) ? filtered : []).map((plan) => {
                        const cfg = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.active;
                        const pct = Math.min(100, Math.max(0, plan.progress_percent ?? 0));
                        const empName = getEmployeeName(plan.employee_id, employees);
                        return (
                          <TableRow key={plan.id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="font-medium text-sm">{empName}</TableCell>
                            <TableCell className="text-sm max-w-[220px] truncate" title={plan.goal}>
                              {plan.goal || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(plan.start_date)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(plan.end_date)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <Progress value={pct} className="h-1.5 flex-1" />
                                <span className="text-xs text-muted-foreground w-9 shrink-0 text-right">
                                  {pct}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={cfg.variant} className="text-xs">
                                {cfg.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
