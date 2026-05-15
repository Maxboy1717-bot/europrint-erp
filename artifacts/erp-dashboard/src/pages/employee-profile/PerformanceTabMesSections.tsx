/**
 * @module PerformanceTabMesSections
 * @description MES (manufacturing execution system) section components for PerformanceTab.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, Zap, Target, Activity, Pause, RotateCcw } from "lucide-react";
import { MiniProgressBar } from "./PerformanceTabSections";
import type { MesSummary } from "./PerformanceTabTypes";
import { REASON_LABELS } from "./PerformanceTabTypes";
import { useTranslation } from '@/lib/i18n';

interface MesSectionProps {
  mesSummary?: MesSummary | null;
  loadingMes?: boolean;
}

export function MesSection({ mesSummary, loadingMes }: MesSectionProps) {
  const { t } = useTranslation("common");
  const hasMesData = !!(mesSummary && mesSummary.summary?.totalSessions > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Activity className="h-4 w-4" />
        MES — Ishlab chiqarish natijalari
        {mesSummary && !loadingMes && (
          <span className="text-xs font-normal normal-case">(so'nggi {mesSummary.periodMonths} oy)</span>
        )}
      </h3>

      {loadingMes ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={`k-${i}`} className="h-20 rounded-lg" />)}
        </div>
      ) : !hasMesData ? (
        <Card>
          <CardContent className="py-10 flex flex-col items-center text-muted-foreground">
            <Activity className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">{t("buXodimUchunIshlabChiqarish")}</p>
            <p className="text-xs mt-1 opacity-60 text-center max-w-sm">
              Xodim hali MES tizimida ishlab chiqarish sessiyasida qatnashmagan yoki
              uning ID raqami MES tizimidagi ID bilan mos kelmaydi.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <MesKpiCards mesSummary={mesSummary!} />
          <MesStatsRow mesSummary={mesSummary!} />
          <MesCharts mesSummary={mesSummary!} />
          <MesRecentStoppages mesSummary={mesSummary!} />
        </div>
      )}
    </div>
  );
}

function MesKpiCards({ mesSummary }: { mesSummary: MesSummary }) {
  const { t } = useTranslation("common");
  const { summary } = mesSummary;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-emerald-500/20">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">{t("oeeOrtacha")}</p>
          <p className={`text-2xl font-bold mt-1 ${summary.avgOee >= 75 ? "text-[var(--ep-green)]" : summary.avgOee >= 50 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
            {summary.avgOee}%
          </p>
          <MiniProgressBar
            value={summary.avgOee}
            max={100}
            color={summary.avgOee >= 75 ? "bg-green-500" : summary.avgOee >= 50 ? "bg-yellow-500" : "bg-red-500"}
          />
        </CardContent>
      </Card>
      <Card className="border-blue-500/20">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">{t("brakFoizi")}</p>
          <p className={`text-2xl font-bold mt-1 ${summary.defectPercent <= 2 ? "text-[var(--ep-green)]" : summary.defectPercent <= 5 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
            {summary.defectPercent}%
          </p>
          <p className="text-xs text-muted-foreground">{summary.totalDefects} dona brak</p>
        </CardContent>
      </Card>
      <Card className="border-violet-500/20">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">{t("ishVaqtiNisbati")}</p>
          <p className={`text-2xl font-bold mt-1 ${summary.workTimeRatio >= 80 ? "text-[var(--ep-green)]" : summary.workTimeRatio >= 60 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
            {summary.workTimeRatio}%
          </p>
          <MiniProgressBar
            value={summary.workTimeRatio}
            max={100}
            color={summary.workTimeRatio >= 80 ? "bg-violet-500" : "bg-yellow-500"}
          />
        </CardContent>
      </Card>
      <Card className="border-cyan-500/20">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">{t("rejaBajarish")}</p>
          <p className={`text-2xl font-bold mt-1 ${summary.goalAchievement >= 95 ? "text-[var(--ep-green)]" : summary.goalAchievement >= 80 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
            {summary.goalAchievement}%
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.totalActual.toLocaleString()} / {summary.totalTarget.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MesStatsRow({ mesSummary }: { mesSummary: MesSummary }) {
  const { t } = useTranslation("common");
  const { summary, mostFrequentReason } = mesSummary;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("ishVaqti")}</p>
          </div>
          <p className="text-xl font-bold">{summary.totalRunningMinutes.toLocaleString()} min</p>
          <p className="text-xs text-muted-foreground">{Math.round(summary.totalRunningMinutes / 60)} soat</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Pause className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("toxtashVaqti")}</p>
          </div>
          <p className="text-xl font-bold text-[var(--ep-primary)]">{summary.totalStoppedMinutes.toLocaleString()} min</p>
          <p className="text-xs text-muted-foreground">{summary.totalStoppages} marta to'xtagan</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="h-4 w-4 text-[var(--ep-primary)]" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("kopUchraydiganSabab")}</p>
          </div>
          {mostFrequentReason ? (
            <>
              <Badge variant="outline" className="border-orange-300 text-[var(--ep-primary)] mb-1">
                {REASON_LABELS[mostFrequentReason.reasonCode] || mostFrequentReason.reasonCode}
              </Badge>
              <p className="text-xs text-muted-foreground">{mostFrequentReason.count} marta</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("toxtashYoq")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MesCharts({ mesSummary }: { mesSummary: MesSummary }) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {mesSummary.monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Oylik ishlab chiqarish (reja vs fakt)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mesSummary.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" name="Reja" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actual" name="Fakt" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {mesSummary.stoppageHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              {t("toxtashSabablariTahlili")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(Array.isArray(mesSummary.stoppageHistory) ? mesSummary.stoppageHistory : []).slice(0, 6).map((s, idx) => (
                <div key={s.reasonCode} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{REASON_LABELS[s.reasonCode] || s.reasonCode}</span>
                    <span className="text-muted-foreground text-xs">{s.count}x · {s.totalMinutes} min</span>
                  </div>
                  <MiniProgressBar
                    value={s.count}
                    max={mesSummary.stoppageHistory[0]?.count ?? 1}
                    color={idx === 0 ? "bg-red-500" : "bg-orange-400"}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MesRecentStoppages({ mesSummary }: { mesSummary: MesSummary }) {
  const { t } = useTranslation("common");
  if (!mesSummary.recentStoppages.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Pause className="h-4 w-4" />
          {t("songgiToxtashlarTarixi")}
        </CardTitle>
        <CardDescription>Oxirgi {mesSummary.recentStoppages.length} ta to'xtash hodisasi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sana/Vaqt</TableHead>
              <TableHead>{t("sabab")}</TableHead>
              <TableHead>{t("progress.description")}</TableHead>
              <TableHead className="text-right">{t("davomiylik")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(mesSummary.recentStoppages) ? mesSummary.recentStoppages : []).slice(0, 15).map((stop) => (
              <TableRow key={stop.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {stop.startedAt
                    ? new Date(stop.startedAt).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs border-orange-200 text-[var(--ep-primary)]">
                    {REASON_LABELS[stop.reasonCode] || stop.reasonCode}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm max-w-[180px] truncate">{stop.reasonDescription || "—"}</TableCell>
                <TableCell className="text-right text-sm">
                  {stop.durationSeconds != null ? `${Math.round(stop.durationSeconds / 60)} min` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}
