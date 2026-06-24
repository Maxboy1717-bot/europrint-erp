/**
 * @module HRPip
 * @description Performance Improvement Plans page. Route: /hr/pip
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Users, CheckCircle2, XCircle, Activity, Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

interface PipPlan {
  id: string | number;
  /** Drizzle ORM returns camelCase; raw SQL returns snake_case */
  employee_id?: string | number;
  employeeId?: string | number;
  /** goals (Drizzle) or goal (alias) */
  goals?: string;
  goal?: string;
  successCriteria?: string;
  success_criteria?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  durationDays?: number;
  duration_days?: number;
  status: "draft" | "active" | "completed" | "failed" | "cancelled";
  outcome?: string;
  createdAt?: string;
  created_at?: string;
}

interface Employee {
  id: string | number;
  full_name?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

type StatusFilter = "all" | "draft" | "active" | "completed" | "failed" | "cancelled";

/** Normalize a pip plan record regardless of camelCase or snake_case */
function normalizePip(p: PipPlan) {
  return {
    id: p.id,
    employeeId: p.employeeId ?? p.employee_id,
    goal: p.goals ?? p.goal ?? "—",
    successCriteria: p.successCriteria ?? p.success_criteria,
    startDate: p.startDate ?? p.start_date,
    endDate: p.endDate ?? p.end_date,
    status: p.status,
    outcome: p.outcome,
  };
}

function getEmployeeName(employeeId: string | number, employees: Employee[]): string {
  const emp = (Array.isArray(employees) ? employees : []).find(
    (e) => String(e.id) === String(employeeId)
  );
  if (!emp) return `#${employeeId}`;
  const composed = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim();
  return emp.full_name ?? emp.fullName ?? emp.name ?? (composed || `#${employeeId}`);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return dateStr.slice(0, 10);
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

export default function HRPip() {
  const { t } = useTranslation("hr");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const STATUS_LABELS: Record<string, string> = {
    draft:     t("pip.statusDraft"),
    active:    t("pip.statusActive"),
    completed: t("pip.statusCompleted"),
    failed:    t("pip.statusFailed"),
    cancelled: t("pip.statusCancelled"),
  };

  const STATUS_CONFIG: Record<string, { variant: "info" | "success" | "danger" | "secondary" }> = {
    draft:     { variant: "secondary" },
    active:    { variant: "info" },
    completed: { variant: "success" },
    failed:    { variant: "danger" },
    cancelled: { variant: "secondary" },
  };

  const TABS: { value: StatusFilter; label: string }[] = [
    { value: "all",       label: "Barchasi" },
    { value: "draft",     label: t("pip.statusDraft") },
    { value: "active",    label: t("pip.statusActive") },
    { value: "completed", label: t("pip.statusCompleted") },
    { value: "failed",    label: t("pip.statusFailed") },
  ];

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createDialog, setCreateDialog] = useState(false);
  const [progressPipId, setProgressPipId] = useState<number | null>(null);
  const [progressNotes, setProgressNotes] = useState("");
  const [progressStatus, setProgressStatus] = useState("");
  const [createForm, setCreateForm] = useState({
    employee_id: "",
    goals: "",
    success_criteria: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
  });

  const { data: rawPlans, isLoading: plansLoading, isError: plansError } = useQuery<PipPlan[]>({
    queryKey: ["/api/hr/pip"],
  });

  const { data: employeesData } = useQuery<{ items: Array<{ id: string; fullName: string }> }>({
    queryKey: ["/api/hr/employees", { limit: 200 }],
    queryFn: () => apiRequest("GET", "/api/hr/employees?limit=200"),
  });
  const employees = Array.isArray(employeesData?.items) ? employeesData.items : [];

  const plans = Array.isArray(rawPlans) ? rawPlans : [];

  const filtered = plans.filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );

  const totalCount     = plans.length;
  const activeCount    = plans.filter((p) => p.status === "active").length;
  const completedCount = plans.filter((p) => p.status === "completed").length;
  const failedCount    = plans.filter((p) => p.status === "failed").length;

  const addProgressMutation = useMutation({
    mutationFn: ({ pipId, notes, status }: { pipId: number; notes: string; status?: string }) =>
      apiRequest("POST", `/api/hr-v2/pip/${pipId}/progress`, { notes, ...(status ? { status } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/pip"] });
      setProgressPipId(null);
      setProgressNotes(""); setProgressStatus("");
      toast({ title: "Progress qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createPipMutation = useMutation({
    mutationFn: (data: typeof createForm) =>
      apiRequest("POST", "/api/hr/pip", {
        employee_id: Number(data.employee_id),
        goals: data.goals,
        success_criteria: data.success_criteria,
        start_date: data.start_date,
        end_date: data.end_date,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/pip"] });
      setCreateDialog(false);
      setCreateForm({
        employee_id: "",
        goals: "",
        success_criteria: "",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: "",
      });
      toast({ title: t("pip.createSuccess") });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 px-1 pb-4 flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-[var(--ep-blue)]" />
        <h1 className="font-semibold text-base">PIP Rejalar</h1>
        <span className="text-xs text-muted-foreground ml-1">Performance Improvement Plans</span>
        <div className="ml-auto">
          <Button onClick={() => setCreateDialog(true)} className="gap-1.5" size="sm">
            <Plus className="h-4 w-4" />
            {t("pip.createBtn")}
          </Button>
        </div>
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
                <div className="text-xs text-muted-foreground">{t("pip.statusActive")}</div>
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
                <div className="text-xs text-muted-foreground">{t("pip.statusCompleted")}</div>
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
                <div className="text-xs text-muted-foreground">{t("pip.statusFailed")}</div>
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
                      <TableHead>{t("pip.goals")}</TableHead>
                      <TableHead>{t("pip.startDate")}</TableHead>
                      <TableHead>{t("pip.endDate")}</TableHead>
                      <TableHead className="min-w-[180px]">{t("pip.successCriteria")}</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plansLoading ? (
                      <TableSkeleton />
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>
                            {plans.length === 0
                              ? "PIP rejalari mavjud emas"
                              : "Tanlangan filtrlarga mos reja topilmadi"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (Array.isArray(filtered) ? filtered : []).map((rawPlan) => {
                        const plan = normalizePip(rawPlan);
                        const cfg = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.active;
                        const label = STATUS_LABELS[plan.status] ?? plan.status;
                        const empName = getEmployeeName(plan.employeeId ?? 0, employees as Employee[]);
                        return (
                          <TableRow key={plan.id} className="hover:bg-muted/40 transition-colors">
                            <TableCell className="font-medium text-sm">{empName}</TableCell>
                            <TableCell className="text-sm max-w-[220px] truncate" title={plan.goal}>
                              {plan.goal}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(plan.startDate)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(plan.endDate)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                              {plan.successCriteria ?? "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={cfg.variant} className="text-xs">
                                {label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2"
                                onClick={() => setProgressPipId(Number(plan.id))}
                                data-testid={`button-pip-progress-${plan.id}`}
                              >
                                Progress
                              </Button>
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

      {/* Progress dialog */}
      <Dialog open={progressPipId !== null} onOpenChange={v => { if (!v) { setProgressPipId(null); setProgressNotes(""); setProgressStatus(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PIP #{progressPipId} — Progress qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Izoh *</Label>
              <Textarea
                value={progressNotes}
                onChange={e => setProgressNotes(e.target.value)}
                placeholder="Xodim nima qildi? Qanday natija bo'ldi?"
                rows={3}
                data-testid="textarea-progress-notes"
              />
            </div>
            <div>
              <Label>Status (ixtiyoriy)</Label>
              <Select value={progressStatus} onValueChange={setProgressStatus}>
                <SelectTrigger data-testid="select-progress-status">
                  <SelectValue placeholder="Status o'zgartirish (ixtiyoriy)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="completed">Yakunlangan</SelectItem>
                  <SelectItem value="failed">Muvaffaqiyatsiz</SelectItem>
                  <SelectItem value="cancelled">Bekor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressPipId(null)}>Bekor</Button>
            <Button
              onClick={() => {
                if (!progressNotes.trim() || progressPipId === null) return;
                addProgressMutation.mutate({
                  pipId: progressPipId,
                  notes: progressNotes.trim(),
                  ...(progressStatus ? { status: progressStatus } : {}),
                });
              }}
              disabled={addProgressMutation.isPending || !progressNotes.trim()}
              data-testid="button-save-progress"
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PIP Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("pip.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Xodim</Label>
              <Select
                value={createForm.employee_id}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, employee_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Xodimni tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("pip.goals")}</Label>
              <Textarea
                value={createForm.goals}
                onChange={(e) => setCreateForm((f) => ({ ...f, goals: e.target.value }))}
                rows={3}
                placeholder="Maqsadlarni kiriting..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("pip.successCriteria")}</Label>
              <Textarea
                value={createForm.success_criteria}
                onChange={(e) => setCreateForm((f) => ({ ...f, success_criteria: e.target.value }))}
                rows={3}
                placeholder="Muvaffaqiyat mezonini kiriting..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("pip.startDate")}</Label>
                <Input
                  type="date"
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("pip.endDate")}</Label>
                <Input
                  type="date"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => createPipMutation.mutate(createForm)}
              disabled={
                createPipMutation.isPending ||
                !createForm.employee_id ||
                !createForm.goals ||
                !createForm.end_date
              }
            >
              {createPipMutation.isPending ? "..." : t("pip.createBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
