import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Gauge, Clock, CheckCircle2 } from "lucide-react";

interface OEEMachine {
  workCenterId: number;
  machineCode: string;
  machineName: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  status: "running" | "idle" | "stopped" | "maintenance";
  lastUpdate: string;
}

const OEE_TARGET_WORLD_CLASS = 85;
const OEE_TARGET_GOOD = 70;
const REFRESH_INTERVAL_MS = 15_000;

const STATUS_CONFIG: Record<OEEMachine["status"], { label: string; className: string }> = {
  running:     { label: "Ishlamoqda", className: "bg-emerald-100 text-emerald-700" },
  idle:        { label: "Bo'sh",      className: "bg-slate-100 text-slate-700" },
  stopped:     { label: "To'xtagan",  className: "bg-rose-100 text-rose-700" },
  maintenance: { label: "TX",         className: "bg-yellow-100 text-yellow-700" },
};

function getOeeVariant(oee: number): "success" | "warning" | "danger" {
  if (oee >= OEE_TARGET_WORLD_CLASS) return "success";
  if (oee >= OEE_TARGET_GOOD) return "warning";
  return "danger";
}

export default function OEELiveMonitorPage() {
  const { t } = useTranslation('ai');

  const { data, isLoading } = useQuery<{ items: OEEMachine[] }>({
    queryKey: ["/api/iot/oee/live"],
    queryFn: () => apiRequest("GET", "/api/iot/oee/live"),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const items = selectArray<OEEMachine>(data, "items");
  const running = items.filter((m) => m.status === "running").length;
  const avgOee = items.length > 0
    ? Math.round(items.reduce((s, m) => s + m.oee, 0) / items.length)
    : 0;
  const worldClass = items.filter((m) => m.oee >= OEE_TARGET_WORLD_CLASS).length;

  return (
    <DedicatedPageShell
      title={t('oeeLive.title', "OEE Live Monitor")}
      description={t('oeeLive.description', "Real-time OEE = Availability × Performance × Quality (har 15 sek yangilanadi)")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('oeeLive.machines', "Mashinalar")} value={items.length} icon={<Activity className="h-4 w-4" />} />
        <KpiCard label={t('oeeLive.running', "Ishlayotgan")} value={running} icon={<CheckCircle2 className="h-4 w-4" />} variant="success" />
        <KpiCard label={t('oeeLive.avgOee', "O'rtacha OEE")} value={`${avgOee}%`} icon={<Gauge className="h-4 w-4" />} variant={getOeeVariant(avgOee)} />
        <KpiCard label={t('oeeLive.worldClass', "World Class (85%+)")} value={worldClass} icon={<Clock className="h-4 w-4" />} variant={worldClass > 0 ? "success" : "default"} />
      </div>

      <Section title={t('oeeLive.machineList', "Mashina holati")}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('oeeLive.empty', "Mashina yo'q")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((m) => {
              const cfg = STATUS_CONFIG[m.status];
              return (
                <div key={m.workCenterId} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{m.machineName}</p>
                      <p className="text-xs text-muted-foreground">{m.machineCode}</p>
                    </div>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>OEE</span>
                        <strong>{m.oee}%</strong>
                      </div>
                      <Progress value={m.oee} />
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs text-center">
                      <div>
                        <p className="text-muted-foreground">A</p>
                        <p className="font-medium">{m.availability}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">P</p>
                        <p className="font-medium">{m.performance}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Q</p>
                        <p className="font-medium">{m.quality}%</p>
                      </div>
                    </div>
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
