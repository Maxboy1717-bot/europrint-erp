/**
 * @module RiskTab
 * @description React page component. Route-level UI.
 */

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, ShieldAlert, BarChart3, CheckCircle2, RefreshCw } from "lucide-react";
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import type { RiskEmployee } from "./types";
import { RISK_CONFIG } from "./types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

import { useTranslation } from '@/lib/i18n';
interface RiskTabProps {
  riskEmployees: RiskEmployee[];
  riskSummary: { low: number; medium: number; high: number; critical: number };
  isLoading: boolean;
}

export function RiskTab({riskEmployees, riskSummary, isLoading }: RiskTabProps) {
  const { t } = useTranslation('common');
  const highRisk = (Array.isArray(riskEmployees) ? riskEmployees : []).filter(e => e.riskLevel === "high" || e.riskLevel === "critical");

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {(["critical", "high", "medium", "low"] as const).map((level) => {
          const cfg = RISK_CONFIG[level];
          return (
            <div key={level} className={`${cfg.bg} rounded-lg p-5`} data-testid={`risk-stat-${level}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cfg.label} xavf</p>
              <p className="text-3xl font-bold tracking-tight text-foreground mt-1">{riskSummary[level] || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">xodim</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-card rounded-xl p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-sm"><Brain className="h-4 w-4 text-[var(--ep-purple)]" />{t("xavfTaqsimoti")}</CardTitle>
          </CardHeader>
          {isLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={([
                    { name: "Kritik", value: riskSummary.critical, fill: "#ef4444" },
                    { name: "Yuqori", value: riskSummary.high, fill: "#f97316" },
                    { name: "O'rta", value: riskSummary.medium, fill: "#f59e0b" },
                    { name: "Past", value: riskSummary.low, fill: "#22c55e" },
                  ]).filter(d => d.value > 0)}
                  cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(["#ef4444","#f97316","#f59e0b","#22c55e"]).map((fill, i) => <Cell key={`k-${i}`} fill={fill} />)}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4 text-[var(--ep-red)]" />{t("xavfOstidagiXodimlarYuqoriKritik")}</CardTitle>
          </CardHeader>
          {isLoading ? (
            <div className="space-y-2">{([1,2,3,4,5]).map(i => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}</div>
          ) : highRisk.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
              <p className="text-sm">{t("yuqoriXavfliXodimlarYoq")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("xodim1")}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("bolim1")}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("ball")}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("daraja")}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t('progress2')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(highRisk) ? highRisk : []).sort((a, b) => b.overallScore - a.overallScore).slice(0, 10).map((emp) => {
                  const cfg = RISK_CONFIG[emp.riskLevel];
                  return (
                    <TableRow key={emp.id} data-testid={`risk-row-${emp.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="text-sm font-medium text-foreground px-4">{emp.fullName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground px-4">{emp.departmentName || "—"}</TableCell>
                      <TableCell className="text-sm font-bold px-4 tabular-nums"><span className={cfg.color}>{emp.overallScore}</span></TableCell>
                      <TableCell className="px-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span></TableCell>
                      <TableCell className="px-4">
                        <div className="w-24 h-2 bg-muted/60 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${emp.overallScore}%`, backgroundColor: cfg.barColor }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4 text-[var(--ep-blue)]" />{t("barchaXodimlarXavfReytingi")}</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="space-y-2">{([1,2,3,4,5]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
        ) : riskEmployees.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-8">{t("malumotYoq")}</p>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("xodim1")}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("davomatRiski")}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("intizomRiski")}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("burnoutRiski")}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("umumiyBall")}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase py-3 px-4">{t("daraja")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(riskEmployees) ? riskEmployees : []).slice(0, 20).map((emp) => {
                const cfg = RISK_CONFIG[emp.riskLevel];
                return (
                  <TableRow key={emp.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-sm font-medium text-foreground px-4">{emp.fullName}</TableCell>
                    {(["attendance", "discipline", "burnout"] as const).map((factor) => (
                      <TableCell key={factor} className="px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                            <div className={`h-full ${factor === "attendance" ? "bg-orange-400" : factor === "discipline" ? "bg-red-400" : "bg-purple-400"} rounded-full`} style={{ width: `${emp.factors?.[factor] || 0}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">{emp.factors?.[factor] || 0}</span>
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="px-4 font-bold tabular-nums"><span className={cfg.color}>{emp.overallScore}</span></TableCell>
                    <TableCell className="px-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </div>
    </div>
    </>
  );
}
