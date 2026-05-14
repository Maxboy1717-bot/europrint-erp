/**
 * @module MESHomeDashboardSections
 * @description KPI cards and machine grid components for MESHomeDashboard.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Factory, Gauge, AlertTriangle, Play, Cpu, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import type { DashStats, Session, Downtime } from "./MESHomeDashboardTypes";
import { oeeColor, statusInfo } from "./MESHomeDashboardTypes";

// ─── Section Title ─────────────────────────────────────────────────────────────

export function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

export function KpiCard({
  title, value, sub, icon: Icon, color, loading, accent,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; loading?: boolean; accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        {loading ? (
          <><Skeleton className="h-4 w-20 mb-3 rounded-lg" /><Skeleton className="h-8 w-16 mb-1 rounded-lg" /><Skeleton className="h-3 w-20 rounded-lg" /></>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{title}</span>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", accent ?? "bg-primary/10")}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
            </div>
            <p className={cn("text-3xl font-bold tracking-tight", color)}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── KPI Row ───────────────────────────────────────────────────────────────────

interface MesKpiRowProps {
  stats: DashStats | undefined;
  sLoad: boolean;
  sessLoad: boolean;
  dtLoad: boolean;
  activeSessions: Session[];
  downtimes: Downtime[];
  totalProduced: number;
  defectRate: string;
  oeePercent: number;
  avgOee: number;
}

export function MesKpiRow({
  stats, sLoad, sessLoad, dtLoad, activeSessions, downtimes,
  totalProduced, defectRate, oeePercent, avgOee,
}: MesKpiRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Faol sessiyalar"
        value={sLoad ? "..." : (stats?.activeSessions ?? activeSessions.length)}
        sub={`Bugun bajarildi: ${stats?.completedToday ?? 0}`}
        icon={Play}
        color="text-[var(--ep-green)]"
        accent="bg-emerald-50 dark:bg-emerald-900/20"
        loading={sLoad}
      />
      <KpiCard
        title="O'rtacha OEE"
        value={sLoad ? "..." : `${oeePercent}%`}
        sub={oeePercent >= 85 ? "Yaxshi" : oeePercent >= 70 ? "Qabul qilinadi" : "Yaxshilash kerak"}
        icon={Gauge}
        color={oeeColor(avgOee)}
        accent={oeePercent >= 85 ? "bg-emerald-50 dark:bg-emerald-900/20" : oeePercent >= 70 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-red-50 dark:bg-red-900/20"}
        loading={sLoad}
      />
      <KpiCard
        title="Ishlab chiqarildi"
        value={sessLoad ? "..." : totalProduced.toLocaleString()}
        sub={`Brak: ${defectRate}%`}
        icon={Factory}
        color="text-[var(--ep-blue)]"
        accent="bg-blue-50 dark:bg-blue-900/20"
        loading={sessLoad}
      />
      <KpiCard
        title="To'xtashlar"
        value={dtLoad ? "..." : downtimes.length}
        sub={`Rejalashmagan: ${(Array.isArray(downtimes) ? downtimes : []).filter(d => !d.isPlanned).length}`}
        icon={AlertTriangle}
        color={(Array.isArray(downtimes) ? downtimes : []).filter(d => !d.isPlanned).length > 3 ? "text-[var(--ep-red)]" : "text-[var(--ep-yellow)]"}
        accent="bg-amber-50 dark:bg-amber-900/20"
        loading={dtLoad}
      />
    </div>
  );
}

// ─── Machine Grid ──────────────────────────────────────────────────────────────

export function MesMachineGrid({ sessions, sessLoad }: { sessions: Session[]; sessLoad: boolean }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={Cpu} title="Mashina holati" sub="Hozirgi sessiyalar" />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mes/work-centers">Barchasi <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
      </div>
      {sessLoad ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {([1,2,3,4]).map(i => <Skeleton key={`k-${i}`} className="h-28 rounded-lg" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-muted-foreground">Sessiya topilmadi</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sessions?.slice(0, 8).map(s => {
            const st = statusInfo(s.status);
            const progress = s.targetQuantity > 0 ? Math.min(100, Math.round((s.actualQuantity / s.targetQuantity) * 100)) : 0;
            const oeeVal = s.oee ? Math.round(s.oee * 100) : null;
            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-xl border p-4 space-y-2",
                  s.status === "running" || s.status === "active"
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-900/10"
                    : s.status === "stopped" || s.status === "paused"
                    ? "border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/10"
                    : "border-border bg-muted/30"
                )}
                data-testid={`machine-cell-${s.equipmentId}`}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", st.dot)} />
                  <span className="text-xs font-bold text-foreground truncate">{s.equipmentName || s.equipmentId}</span>
                </div>
                <p className={cn("text-xs font-medium", st.color)}>{st.label}</p>
                {s.orderNumber && <p className="text-[10px] text-muted-foreground truncate">{s.orderNumber}</p>}
                <div className="space-y-1">
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{s.actualQuantity}/{s.targetQuantity}</span>
                    {oeeVal !== null && <span className={oeeColor(s.oee ?? 0)}>OEE {oeeVal}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
