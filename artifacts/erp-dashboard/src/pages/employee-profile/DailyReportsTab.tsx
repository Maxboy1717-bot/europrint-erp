/**
 * @module DailyReportsTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle, Gauge, Activity, Wrench, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { useToast } from "@/hooks/use-toast";

interface DailyReport {
  id: number;
  report_date: string;
  status: string;
  tasks_completed?: string;
  metrics?: string;
  tomorrow_plan?: string;
  submitted_at?: string;
  is_auto_absent?: boolean;
  is_machine_operator_report?: boolean;
  gamification_points?: number;
  hr_user_id?: number;
  hr_updated_at?: string;
  reason?: string;
  hr_actor_name?: string;
}

interface Props {
  employeeId: number | string;
  isMachineOperator?: boolean;
}

function OperatorReportCard({ report }: { report: DailyReport }) {
  const { t } = useTranslation("common");
  let productionData: Record<string, unknown> = {};
  try {
    if (report.tasks_completed) {
      const parsed = JSON.parse(report.tasks_completed);
      if (typeof parsed === "object" && parsed !== null) {
        productionData = parsed as Record<string, unknown>;
      }
    }
  } catch {
    /* malformed tasks_completed JSON → leave productionData empty */
  }

  const oee = (productionData.oee as number) ?? (productionData.today_oee as number) ?? null;
  const produced = (productionData.produced as number) ?? (productionData.today_produced as number) ?? null;
  const defects = (productionData.defects as number) ?? (productionData.today_defects as number) ?? null;
  const target = (productionData.target as number) ?? (productionData.today_target as number) ?? null;
  const shift = (productionData.shift as string) ?? (productionData.shift_type as string) ?? null;
  const machineName = (productionData.machine_name as string) ?? null;
  const downtime = (productionData.downtime_minutes as number) ?? null;
  const tasksCompleted = (productionData.tasks_completed_count as number) ?? null;
  const tasksTotal = (productionData.tasks_total as number) ?? null;
  const defectRate = produced && defects !== null && produced > 0
    ? ((defects / produced) * 100).toFixed(2)
    : null;

  const date = new Date(report.report_date);
  const dateStr = date.toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "short" });

  let statusBadge;
  if (report.is_auto_absent) {
    statusBadge = <EPStatusPill tone="danger">{t("sababsizYoqlik1")}</EPStatusPill>;
  } else if (report.status === "submitted") {
    statusBadge = <EPStatusPill tone="success">{t("topshirildi1")}</EPStatusPill>;
  } else {
    statusBadge = <EPStatusPill tone="warning">{t("kutilmoqda")}</EPStatusPill>;
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/30 dark:border-blue-800/40 dark:bg-blue-950/10">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[var(--ep-blue)]" />
          <span className="font-semibold text-sm">{dateStr}</span>
          {shift && <Badge variant="outline" className="text-xs">{shift}</Badge>}
          {report.gamification_points ? (
            <span className="text-xs text-[var(--ep-green)] font-medium">+{report.gamification_points} ball</span>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          {statusBadge}
          {report.hr_user_id && (
            <Badge variant="outline" className="text-xs text-[var(--ep-yellow)] border-amber-400">{t("hrOzgartirdi")}</Badge>
          )}
        </div>
      </div>

      {machineName && (
        <p className="text-xs text-muted-foreground mb-2">
          <span className="font-medium">{t("dastgoh1")}</span> {machineName}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {oee !== null && (
          <div className="bg-white/60 dark:bg-black/20 rounded-md p-2 text-center">
            <Gauge className="w-4 h-4 mx-auto mb-0.5 text-[var(--ep-blue)]" />
            <p className={`font-bold ${oee >= 85 ? "text-[var(--ep-green)]" : oee >= 70 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
              {oee.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">OEE</p>
          </div>
        )}
        {produced !== null && (
          <div className="bg-white/60 dark:bg-black/20 rounded-md p-2 text-center">
            <Activity className="w-4 h-4 mx-auto mb-0.5 text-[var(--ep-green)]" />
            <p className="font-bold text-[var(--ep-green)]">{produced.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">
              {target ? `${target.toLocaleString()} me'yordan` : "dona"}
            </p>
          </div>
        )}
        {defects !== null && (
          <div className="bg-white/60 dark:bg-black/20 rounded-md p-2 text-center">
            <XCircle className="w-4 h-4 mx-auto mb-0.5 text-[var(--ep-red)]" />
            <p className="font-bold text-[var(--ep-red)]">{defects}</p>
            <p className="text-[10px] text-muted-foreground">
              {defectRate !== null ? `${defectRate}% nuqson` : "nuqsonli"}
            </p>
          </div>
        )}
        {downtime !== null && (
          <div className="bg-white/60 dark:bg-black/20 rounded-md p-2 text-center">
            <Clock className="w-4 h-4 mx-auto mb-0.5 text-[var(--ep-yellow)]" />
            <p className="font-bold text-[var(--ep-yellow)]">{downtime} daq</p>
            <p className="text-[10px] text-muted-foreground">{t("toxtash")}</p>
          </div>
        )}
      </div>

      {tasksCompleted !== null && tasksTotal !== null && (
        <p className="text-xs text-muted-foreground mt-2">
          Vazifalar: {tasksCompleted}/{tasksTotal} {tasksCompleted >= tasksTotal ? "✅" : ""}
        </p>
      )}

      {report.is_auto_absent && (
        <p className="text-xs text-[var(--ep-red)] mt-2 italic">{t("hisobotTopshirilmagan")}</p>
      )}
    </div>
    </>
  );
}

function OfficeReportCard({ report }: { report: DailyReport }) {
  const { t } = useTranslation("common");
  const date = new Date(report.report_date);
  const dateStr = date.toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "short" });

  let statusBadge;
  if (report.is_auto_absent) {
    statusBadge = <EPStatusPill tone="danger">{t("sababsizYoqlik1")}</EPStatusPill>;
  } else if (report.status === "submitted") {
    statusBadge = <EPStatusPill tone="success">{t("topshirildi1")}</EPStatusPill>;
  } else {
    statusBadge = <EPStatusPill tone="warning">{t("kutilmoqda")}</EPStatusPill>;
  }

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        report.is_auto_absent
          ? "border-red-200 bg-red-50/50 dark:border-red-800/40 dark:bg-red-950/20"
          : report.status === "submitted"
          ? "border-green-200 bg-green-50/30 dark:border-green-800/40 dark:bg-green-950/10"
          : "border-border bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{dateStr}</span>
          {report.gamification_points ? (
            <span className="text-xs text-[var(--ep-green)] font-medium">+{report.gamification_points} ball</span>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          {statusBadge}
          {report.hr_user_id && (
            <Badge variant="outline" className="text-xs text-[var(--ep-yellow)] border-amber-400">
              {t("hrOzgartirdi")}
            </Badge>
          )}
        </div>
      </div>

      {report.tasks_completed && !report.is_machine_operator_report && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
          {report.tasks_completed}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
        {report.submitted_at && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(report.submitted_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {report.hr_user_id && report.hr_updated_at && (
          <span className="text-[var(--ep-yellow)] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            HR o'zgartirdi: {new Date(report.hr_updated_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}
          </span>
        )}
        {report.reason && (
          <span className="text-muted-foreground/70 italic truncate max-w-xs" title={report.reason}>
            Sabab: {report.reason}
          </span>
        )}
      </div>
    </div>
  );
}

function SubmitReportDialog({ open, onClose, employeeId }: { open: boolean; onClose: () => void; employeeId: number | string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reportDate, setReportDate]       = useState("");
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [tomorrowPlan, setTomorrowPlan]   = useState("");
  const [blockers, setBlockers]           = useState("");
  const [mood, setMood]                   = useState<string>("neutral");

  const mutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiRequest<{ id: number }>("POST", "/api/hr-v2/daily-reports", dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/daily-reports/employee", employeeId] });
      toast({ title: "Hisobot topshirildi" });
      setReportDate(""); setTasksCompleted(""); setTomorrowPlan("");
      setBlockers(""); setMood("neutral");
      onClose();
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  function handleSubmit() {
    if (!tasksCompleted.trim()) {
      toast({ title: "Bajarilgan ishlar maydoni majburiy", variant: "destructive" });
      return;
    }
    const dto: Record<string, unknown> = {
      employee_id: Number(employeeId),
      tasks_completed: tasksCompleted.trim(),
      mood,
    };
    if (reportDate)          dto.report_date    = reportDate;
    if (tomorrowPlan.trim()) dto.tomorrow_plan  = tomorrowPlan.trim();
    if (blockers.trim())     dto.blockers       = blockers.trim();
    mutation.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kunlik hisobot topshirish</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Sana (ixtiyoriy, bo'sh = bugun)</Label>
            <Input type="date" value={reportDate}
              onChange={(e) => setReportDate(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Bugun bajarilgan ishlar *</Label>
            <Input placeholder="Masalan: 500 dona quti yig'ish, sifat tekshiruvi..." value={tasksCompleted}
              onChange={(e) => setTasksCompleted(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Ertangi reja</Label>
            <Input placeholder="Masalan: Yangi partiya boshlash..." value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>To'siqlar / muammolar</Label>
            <Input placeholder="Masalan: Xomashyo yetishmovchiligi..." value={blockers}
              onChange={(e) => setBlockers(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Kayfiyat</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Yaxshi</SelectItem>
                <SelectItem value="neutral">O'rtacha</SelectItem>
                <SelectItem value="bad">Yomon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit}
            disabled={mutation.isPending || !tasksCompleted.trim()}>
            {mutation.isPending ? "Saqlanmoqda..." : "Topshirish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DailyReportsTab({ employeeId, isMachineOperator }: Props) {
  const { t } = useTranslation("common");
  const [submitOpen, setSubmitOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["/api/hr-v2/daily-reports/employee", employeeId],
    queryFn: () =>
      apiRequest("GET", `/api/hr-v2/daily-reports/employee?employeeId=${employeeId}&limit=30`),
    enabled: !!employeeId,
  });

  const reports: DailyReport[] = Array.isArray(data) ? data : [];

  const submitted = (Array.isArray(reports) ? reports : []).filter(r => r.status === "submitted" && !r.is_auto_absent).length;
  const autoAbsent = (Array.isArray(reports) ? reports : []).filter(r => r.is_auto_absent).length;
  const hrOverridden = (Array.isArray(reports) ? reports : []).filter(r => r.hr_user_id).length;
  const totalPoints = (Array.isArray(reports) ? reports : []).reduce((sum, r) => sum + (r.gamification_points || 0), 0);

  const isOperator = isMachineOperator ?? (Array.isArray(reports) ? reports : []).some(r => r.is_machine_operator_report);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setSubmitOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Hisobot topshirish
        </Button>
      </div>
      {isOperator && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40">
          <Wrench className="w-4 h-4 text-[var(--ep-blue)] shrink-0" />
          <p className="text-xs text-[var(--ep-blue)] dark:text-blue-300 font-medium">
            {t("dastgohOperatoriIshlabChiqarishHisobotlari")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: "Topshirilgan", value: submitted, icon: CheckCircle, color: "text-[var(--ep-green)]", bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Sababsiz yo'qlik", value: autoAbsent, icon: XCircle, color: "text-[var(--ep-red)]", bg: "bg-red-50 dark:bg-red-950/30" },
          { label: "HR o'zgartirdi", value: hrOverridden, icon: AlertTriangle, color: "text-[var(--ep-yellow)]", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Jami ball", value: `+${totalPoints}`, icon: FileText, color: "text-[var(--ep-blue)]", bg: "bg-blue-50 dark:bg-blue-950/30" },
        ]).map(stat => (
          <Card key={stat.label} className={`border-border/50 ${stat.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-7 h-7 ${stat.color} shrink-0`} />
              <div>
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {isOperator ? (
              <><Wrench className="w-4 h-4 text-[var(--ep-blue)]" />{t("songgi30KunIshlabChiqarish")}</>
            ) : (
              <><FileText className="w-4 h-4 text-primary" />{t("songgi30KunHisobotlari")}</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <>{([1, 2, 3, 4, 5]).map(i => <Skeleton key={`k-${i}`} className="h-16 w-full rounded-lg" />)}</>
          )}

          {!isLoading && reports.length === 0 && (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("haliKunlikHisobotYuborilmagan")}</p>
            </div>
          )}

          {(Array.isArray(reports) ? reports : []).map(r => {
            if (r.is_machine_operator_report || isOperator) {
              return <OperatorReportCard key={r.id} report={r} />;
            }
            return <OfficeReportCard key={r.id} report={r} />;
          })}
        </CardContent>
      </Card>
      <SubmitReportDialog open={submitOpen} onClose={() => setSubmitOpen(false)} employeeId={employeeId} />
    </div>
  );
}
