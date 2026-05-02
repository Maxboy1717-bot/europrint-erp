import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";

interface CleaningTask {
  id: number;
  zoneName: string;
  taskType: "daily" | "weekly" | "monthly" | "deep";
  frequency: string;
  lastDoneAt: string | null;
  nextDueAt: string;
  assignedToName: string | null;
  status: "pending" | "in_progress" | "done" | "overdue";
}

const STATUS_CONFIG: Record<CleaningTask["status"], { label: string; className: string }> = {
  pending:     { label: "Kutmoqda",     className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "Jarayonda",    className: "bg-yellow-100 text-yellow-700" },
  done:        { label: "Bajarilgan",   className: "bg-emerald-100 text-emerald-700" },
  overdue:     { label: "Kechikkan",    className: "bg-rose-100 text-rose-700" },
};

export default function CleaningSchedulePage() {
  const { t } = useTranslation('mro' as 'admin');

  const { data, isLoading } = useQuery<{ items: CleaningTask[] }>({
    queryKey: ["/api/mro/cleaning/schedules"],
    queryFn: () => apiRequest("GET", "/api/mro/cleaning/schedules"),
  });

  const items = selectArray<CleaningTask>(data, "items");
  const overdue = items.filter((t) => t.status === "overdue").length;
  const today = items.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const done = items.filter((t) => t.status === "done").length;

  return (
    <DedicatedPageShell
      title={t('cleaning.title', "Tozalash Jadvali")}
      description={t('cleaning.description', "Zona/bino tozalash vazifalari va jadvali")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('cleaning.total', "Jami vazifalar")} value={items.length} icon={<Sparkles className="h-4 w-4" />} />
        <KpiCard label={t('cleaning.today', "Bugungi")} value={today} icon={<Calendar className="h-4 w-4" />} variant={today > 0 ? "default" : "success"} />
        <KpiCard label={t('cleaning.overdue', "Kechikkan")} value={overdue} icon={<AlertCircle className="h-4 w-4" />} variant={overdue > 0 ? "danger" : "success"} />
        <KpiCard label={t('cleaning.done', "Bajarilgan")} value={done} icon={<CheckCircle2 className="h-4 w-4" />} variant="success" />
      </div>

      <Section title={t('cleaning.list', "Tozalash vazifalari")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('cleaning.empty', "Vazifa yo'q")}</p>
        ) : (
          <div className="space-y-2">
            {items.map((task) => {
              const cfg = STATUS_CONFIG[task.status];
              return (
                <div key={task.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{task.zoneName}</span>
                      <Badge variant="outline" className="text-xs">{task.taskType}</Badge>
                    </div>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span>Davomiyligi: <strong>{task.frequency}</strong></span>
                    <span>Oxirgi: <strong>{task.lastDoneAt ?? '—'}</strong></span>
                    <span>Keyingi: <strong>{task.nextDueAt}</strong></span>
                    <span>Mas'ul: <strong>{task.assignedToName ?? '—'}</strong></span>
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
