/**
 * @module MachineOperatorTabSections
 * @description KPI cards, charts, and table sections for MachineOperatorTab.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  AlertTriangle, Clock, Zap, Target,
  ChevronUp, ChevronDown, CheckCircle2, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { MesSummary } from "./profile-types";
import { KpiCardProps, STOPPAGE_COLORS } from "./MachineOperatorTabTypes";
import { useTranslation } from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/* KPI Card                                                             */
/* ------------------------------------------------------------------ */

export function KpiCard({ label, value, unit, icon: Icon, color, subtitle, trend }: KpiCardProps) {
  const { t } = useTranslation("common");
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })}
        className="sr-only"
        aria-label={t("refresh")}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Card className={`${color} border-0`}>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{value}</span>
                {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
              </div>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-1">
              {trend === "up" && <ChevronUp className="h-3.5 w-3.5 text-[var(--ep-green)]" />}
              {trend === "down" && <ChevronDown className="h-3.5 w-3.5 text-[var(--ep-red)]" />}
              <Icon className="h-7 w-7 opacity-50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Additional Stats row                                                 */
/* ------------------------------------------------------------------ */

interface StatsRowProps {
  completedSessions?: number;
  totalSessions?: number;
  totalStoppages?: number;
  totalActual?: number;
}

export function StatsRow({ completedSessions, totalSessions, totalStoppages, totalActual }: StatsRowProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      <div className="bg-muted/40 rounded-lg px-4 py-3 flex items-center gap-3">
        <CheckCircle2 className="h-4 w-4 text-[var(--ep-green)] shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{t("yakunlanganSessiyalar")}</p>
          <p className="font-bold text-sm">{completedSessions} / {totalSessions}</p>
        </div>
      </div>
      <div className="bg-muted/40 rounded-lg px-4 py-3 flex items-center gap-3">
        <Clock className="h-5 w-5 text-[var(--ep-yellow)] shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{t("toxtashlarSoni")}</p>
          <p className="font-bold text-sm">{totalStoppages ?? 0} ta</p>
        </div>
      </div>
      <div className="bg-muted/40 rounded-lg px-4 py-3 flex items-center gap-3">
        <Zap className="h-5 w-5 text-[var(--ep-blue)] shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{t("jamiIshlabChiqarilgan")}</p>
          <p className="font-bold text-sm">{(totalActual ?? 0).toLocaleString()} dona</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly Production Chart                                             */
/* ------------------------------------------------------------------ */

interface MonthlyChartProps {
  data: { month: string; Ishlab: number; Maqsad: number; Nuqson: number }[];
}

export function MonthlyProductionChart({ data }: MonthlyChartProps) {
  if (data.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart2 className="h-4 w-4 text-[var(--ep-blue)]" />
          Oylik ishlab chiqarish dinamikasi (6 oy)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <ReBarChart data={data} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 11 }}
              formatter={(val: number, name: string) => [val.toLocaleString(), name]}
            />
            <Bar dataKey="Maqsad" fill="#e2e8f0" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Ishlab" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Nuqson" fill="#ef4444" radius={[2, 2, 0, 0]} />
          </ReBarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center">
          {([
            { label: "Maqsad", color: "#e2e8f0" },
            { label: "Ishlab chiqarilgan", color: "#3b82f6" },
            { label: "Nuqsonli", color: "#ef4444" },
          ]).map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Stoppage Analysis                                                    */
/* ------------------------------------------------------------------ */

interface StoppageAnalysisProps {
  mes: MesSummary | null | undefined;
}

export function StoppageAnalysis({ mes }: StoppageAnalysisProps) {
  const { t } = useTranslation("common");
  const history = mes?.stoppageHistory ?? [];
  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
          {t("toxtashSabablariTahlili")}
        </CardTitle>
        {mes?.mostFrequentReason && (
          <CardDescription>
            Eng ko'p:{" "}
            <span className="font-medium text-foreground">
              {mes.mostFrequentReason.reasonDescription || mes.mostFrequentReason.reasonCode}
            </span>{" "}
            ({mes.mostFrequentReason.count} marta)
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <ResponsiveContainer width="100%" height={160}>
              <ReBarChart
                data={history.slice(0, 6).map((r, i) => ({
                  name: r.reasonDescription?.substring(0, 14) || r.reasonCode,
                  daqiqa: Math.round(r.totalMinutes),
                  fill: STOPPAGE_COLORS[i % STOPPAGE_COLORS.length],
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [`${v} daqiqa`, "To'xtash"]} />
                <Bar dataKey="daqiqa" radius={[0, 2, 2, 0]}>
                  {history.slice(0, 6).map((_, i) => (
                    <Cell key={`k-${i}`} fill={STOPPAGE_COLORS[i % STOPPAGE_COLORS.length]} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t("sabab")}</TableHead>
                <TableHead className="text-xs text-right">{t("marta")}</TableHead>
                <TableHead className="text-xs text-right">{t("daqiqa1")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.slice(0, 8).map((r, i) => (
                <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: STOPPAGE_COLORS[i % STOPPAGE_COLORS.length] }}
                      />
                      {r.reasonDescription || r.reasonCode}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-right py-1.5 font-medium">{r.count}</TableCell>
                  <TableCell className="text-xs text-right py-1.5 text-muted-foreground">
                    {Math.round(r.totalMinutes)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </div>
      </CardContent>
    </Card>
  );
}

