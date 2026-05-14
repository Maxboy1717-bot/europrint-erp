/**
 * @module MachineOperatorTab
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Settings2, Activity, Target, AlertTriangle, Zap, Gauge } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { MesSummary } from "./profile-types";
import { MachineOperatorTabProps } from "./MachineOperatorTabTypes";
import {
  KpiCard,
  StatsRow,
  MonthlyProductionChart,
  StoppageAnalysis,
} from "./MachineOperatorTabSections";
import { RecentStoppages, OeeRatingCard } from "./MachineOperatorTabExtras";
import { useTranslation } from '@/lib/i18n';

export function MachineOperatorTab({ employeeId }: MachineOperatorTabProps) {
  const { t } = useTranslation("common");
  const { data: mes, isLoading } = useQuery<MesSummary>({
    queryKey: ["/api/integration/employee-mes-summary", employeeId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/integration/employee-mes-summary/${employeeId}?months=3`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!employeeId,
  });

  const { data: mes6 } = useQuery<MesSummary>({
    queryKey: ["/api/integration/employee-mes-summary", employeeId, 6],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/integration/employee-mes-summary/${employeeId}?months=6`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!employeeId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  const s = mes?.summary;
  const noData = !s || s.totalSessions === 0;

  const oee = s ? Math.round(s.avgOee * 100) / 100 : 0;
  const productivity = s ? Math.round(s.goalAchievement) : 0;
  const defectPct = s ? Math.round(s.defectPercent * 10) / 10 : 0;
  const uptime = s ? Math.round(s.workTimeRatio) : 0;

  const monthlyChartData = (Array.isArray(mes6?.monthlyData) ? mes6?.monthlyData : []).map(d => ({
    month: d.month?.substring(0, 7) ?? "",
    Ishlab: d.actual ?? 0,
    Maqsad: d.target ?? 0,
    Nuqson: d.defects ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
          <Settings2 className="h-5 w-5 text-[var(--ep-primary)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("dastgohOperatoriProfili")}</h2>
          <p className="text-sm text-muted-foreground">
            So'nggi {mes?.periodMonths ?? 3} oy uchun ishlab chiqarish ko'rsatkichlari
          </p>
        </div>
      </div>

      {noData ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Activity className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">{t("ishlabChiqarishMalumotlariTopilmadi")}</p>
            <p className="text-xs opacity-60">{t("dastgohSessiyalariMesTizimidaQayd")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="OEE (Samaradorlik)"
              value={`${oee.toFixed(1)}%`}
              icon={Gauge}
              color="from-blue-500/10 to-blue-600/10"
              subtitle={oee >= 80 ? "A'lo" : oee >= 60 ? "Qoniqarli" : "Past"}
            />
            <KpiCard
              label={t("maqsadBajarilishi")}
              value={`${productivity}%`}
              icon={Target}
              color="from-green-500/10 to-green-600/10"
              subtitle={`${(s?.totalActual ?? 0).toLocaleString()} / ${(s?.totalTarget ?? 0).toLocaleString()} dona`}
              trend={productivity >= 90 ? "up" : productivity < 70 ? "down" : "neutral"}
            />
            <KpiCard
              label={t("nuqsonUlushi")}
              value={`${defectPct}%`}
              icon={AlertTriangle}
              color={defectPct <= 2 ? "from-green-500/10 to-green-600/10" : defectPct <= 5 ? "from-amber-500/10 to-amber-600/10" : "from-red-500/10 to-red-600/10"}
              subtitle={`${(s?.totalDefects ?? 0).toLocaleString()} dona nuqsonli`}
              trend={defectPct <= 2 ? "up" : defectPct > 5 ? "down" : "neutral"}
            />
            <KpiCard
              label={t("ishVaqtiUlushi")}
              value={`${uptime}%`}
              icon={Zap}
              color="from-purple-500/10 to-purple-600/10"
              subtitle={`${Math.round((s?.totalRunningMinutes ?? 0) / 60)}h ish / ${Math.round((s?.totalStoppedMinutes ?? 0) / 60)}h to'xtash`}
            />
          </div>

          <StatsRow
            completedSessions={s?.completedSessions}
            totalSessions={s?.totalSessions}
            totalStoppages={s?.totalStoppages}
            totalActual={s?.totalActual}
          />

          <MonthlyProductionChart data={monthlyChartData} />

          <StoppageAnalysis mes={mes} />

          <RecentStoppages mes={mes} />

          <OeeRatingCard oee={oee} />
        </>
      )}
    </div>
  );
}
