import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingDown, AlertOctagon, Zap } from "lucide-react";

interface BottleneckRow {
  workCenterId: number;
  workCenterName: string;
  utilization: number;
  queueDepth: number;
  averageWaitMinutes: number;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

const SEVERITY_CONFIG: Record<BottleneckRow["severity"], { label: string; className: string }> = {
  critical: { label: "Kritik",   className: "bg-rose-600 text-white" },
  high:     { label: "Yuqori",   className: "bg-orange-500 text-white" },
  medium:   { label: "O'rta",    className: "bg-yellow-500 text-white" },
  low:      { label: "Past",     className: "bg-slate-400 text-white" },
};

const UTILIZATION_BOTTLENECK_THRESHOLD = 90;

export default function BottleneckAnalysisPage() {
  const { t } = useTranslation('ai');

  const { data, isLoading } = useQuery<{ items: BottleneckRow[] }>({
    queryKey: ["/api/ai/bottleneck/analysis"],
    queryFn: () => apiRequest("GET", "/api/ai/bottleneck/analysis"),
  });

  const items = selectArray<BottleneckRow>(data, "items");
  const critical = items.filter((b) => b.severity === "critical").length;
  const overloaded = items.filter((b) => b.utilization > UTILIZATION_BOTTLENECK_THRESHOLD).length;
  const totalQueue = items.reduce((s, b) => s + b.queueDepth, 0);

  return (
    <DedicatedPageShell
      title={t('bottleneck.title', "Bottleneck Tahlili")}
      description={t('bottleneck.description', "Ishlab chiqarish zanjiridagi tor joylarni AI orqali aniqlash")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('bottleneck.workCenters', "Ish markazlari")} value={items.length} icon={<Activity className="h-4 w-4" />} />
        <KpiCard label={t('bottleneck.critical', "Kritik")} value={critical} icon={<AlertOctagon className="h-4 w-4" />} variant={critical > 0 ? "danger" : "success"} />
        <KpiCard label={t('bottleneck.overloaded', "90% dan oshgan")} value={overloaded} icon={<Zap className="h-4 w-4" />} variant={overloaded > 0 ? "warning" : "success"} />
        <KpiCard label={t('bottleneck.queue', "Jami navbat")} value={totalQueue} icon={<TrendingDown className="h-4 w-4" />} />
      </div>

      <Section title={t('bottleneck.list', "Ish markazlari yuklanishi")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('bottleneck.empty', "Ma'lumot yo'q")}</p>
        ) : (
          <div className="space-y-3">
            {items.map((b) => {
              const cfg = SEVERITY_CONFIG[b.severity];
              return (
                <div key={b.workCenterId} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{b.workCenterName}</span>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>
                  <Progress value={Math.min(100, b.utilization)} className="mb-2" />
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                    <span>Yuklanish: <strong>{b.utilization}%</strong></span>
                    <span>Navbat: <strong>{b.queueDepth}</strong></span>
                    <span>Kutish: <strong>{b.averageWaitMinutes} daq</strong></span>
                  </div>
                  <p className="text-xs italic">{b.recommendation}</p>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
