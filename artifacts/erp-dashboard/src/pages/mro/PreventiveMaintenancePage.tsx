/**
 * @module PreventiveMaintenancePage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";

interface PmSchedule {
  id: number;
  equipmentId: number;
  equipmentName: string;
  scheduleType: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  nextDueDate: string;
  lastCompletedDate: string | null;
  intervalDays: number;
  status: "scheduled" | "due" | "overdue" | "completed";
  estimatedDurationHours: number;
  assignedTechName: string | null;
}

const STATUS_CONFIG: Record<PmSchedule["status"], { label: string; className: string }> = {
  scheduled: { label: "Rejada",      className: "bg-blue-100 text-[var(--ep-blue)]" },
  due:       { label: "Bugun",       className: "bg-yellow-100 text-[var(--ep-yellow)]" },
  overdue:   { label: "Kechikkan",   className: "bg-rose-100 text-[var(--ep-red)]" },
  completed: { label: "Bajarilgan",  className: "bg-emerald-100 text-[var(--ep-green)]" },
};

const DUE_WINDOW_DAYS = 7;

export default function PreventiveMaintenancePage() {
  const { t } = useTranslation('mro' as 'admin');

  const { data, isLoading } = useQuery<{ items: PmSchedule[] }>({
    queryKey: ["/api/mro/pm/schedules"],
    queryFn: () => apiRequest("GET", "/api/mro/pm/schedules"),
  });

  const items = selectArray<PmSchedule>(data, "items");
  const overdue = items.filter((p) => p.status === "overdue").length;
  const dueSoon = items.filter((p) => {
    const days = (new Date(p.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= DUE_WINDOW_DAYS;
  }).length;
  const completed = items.filter((p) => p.status === "completed").length;

  return (
    <DedicatedPageShell
      title={t('pm.title', "Preventive Maintenance")}
      description={t('pm.description', "Oldindan rejalashtirilgan texnik xizmat (kunlik / haftalik / oylik)")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('pm.total', "Jami reja")} value={items.length} icon={<Wrench className="h-4 w-4" />} />
        <KpiCard label={t('pm.dueSoon', "Yaqin (7 kun)")} value={dueSoon} icon={<Calendar className="h-4 w-4" />} variant={dueSoon > 0 ? "warning" : "default"} />
        <KpiCard label={t('pm.overdue', "Kechikkan")} value={overdue} icon={<AlertTriangle className="h-4 w-4" />} variant={overdue > 0 ? "danger" : "success"} />
        <KpiCard label={t('pm.completed', "Bajarilgan")} value={completed} icon={<CheckCircle2 className="h-4 w-4" />} variant="success" />
      </div>

      <Section title={t('pm.schedules', "Texnik xizmat jadvali")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('pm.empty', "Reja yo'q")}</p>
        ) : (
          <div className="space-y-2">
            {items.map((p) => {
              const cfg = STATUS_CONFIG[p.status];
              return (
                <div key={p.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-[var(--ep-blue)]" />
                      <span className="font-medium">{p.equipmentName}</span>
                      <Badge variant="outline" className="text-xs">{p.scheduleType}</Badge>
                    </div>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span>{t("keyingi")}<strong>{p.nextDueDate}</strong></span>
                    <span>{t("oxirgi")}<strong>{p.lastCompletedDate ?? '—'}</strong></span>
                    <span>{t("vaqt")}<strong>{p.estimatedDurationHours} soat</strong></span>
                    <span>{t("texnik1")}<strong>{p.assignedTechName ?? '—'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
