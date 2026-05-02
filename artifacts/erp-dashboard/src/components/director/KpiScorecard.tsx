import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiWithValue } from "@/components/director/types";

interface KpiScorecardProps {
  kpis: KpiWithValue[];
  kpisLoad: boolean;
}

function kpiStatus(kpi: KpiWithValue): "critical" | "warning" | "normal" {
  if (kpi.thresholdDirection === "above") {
    if (kpi.currentValue >= kpi.criticalThreshold) return "critical";
    if (kpi.currentValue >= kpi.warningThreshold) return "warning";
    return "normal";
  } else {
    if (kpi.currentValue <= kpi.criticalThreshold) return "critical";
    if (kpi.currentValue <= kpi.warningThreshold) return "warning";
    return "normal";
  }
}

export function KpiScorecard({ kpis, kpisLoad }: KpiScorecardProps) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">KPI Hisob Varag'i</h2>
      {kpisLoad ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : kpis.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">KPI ma'lumotlari mavjud emas</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="grid grid-cols-5 gap-0 border-b bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="col-span-2">Maqsad</span>
            <span className="text-right">Reja</span>
            <span className="text-right">Haqiqat</span>
            <span className="text-right">Holat</span>
          </div>
          {(Array.isArray(kpis) ? kpis : []).map((kpi, i) => {
            const st = kpiStatus(kpi);
            const diff = kpi.targetValue > 0 ? Math.round((kpi.currentValue - kpi.targetValue) / kpi.targetValue * 100) : 0;
            return (
              <div key={kpi.id} className={cn("grid grid-cols-5 gap-0 px-4 py-3 items-center", i % 2 === 0 ? "bg-background" : "bg-muted/20")} data-testid={`kpi-scorecard-${kpi.kpiCode}`}>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-foreground">{kpi.kpiName}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.category}</p>
                </div>
                <p className="text-sm text-right text-muted-foreground">{kpi.targetValue} {kpi.unit}</p>
                <p className="text-sm font-semibold text-right text-foreground">{kpi.currentValue} {kpi.unit}</p>
                <div className="flex items-center justify-end gap-2">
                  <span className={cn("text-xs font-bold", diff >= 0 ? "text-emerald-600" : "text-red-600")}>{diff >= 0 ? "+" : ""}{diff}%</span>
                  <span className={cn("w-2.5 h-2.5 rounded-full", st === "critical" ? "bg-red-500" : st === "warning" ? "bg-amber-500" : "bg-emerald-500")} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
