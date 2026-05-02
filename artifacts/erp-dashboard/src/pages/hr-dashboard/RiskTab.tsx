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

interface RiskTabProps {
  riskEmployees: RiskEmployee[];
  riskSummary: { low: number; medium: number; high: number; critical: number };
  isLoading: boolean;
}

export function RiskTab({ riskEmployees, riskSummary, isLoading }: RiskTabProps) {
  const highRisk = (Array.isArray(riskEmployees) ? riskEmployees : []).filter(e => e.riskLevel === "high" || e.riskLevel === "critical");

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["critical", "high", "medium", "low"] as const).map((level) => {
          const cfg = RISK_CONFIG[level];
          return (
            <div key={level} className={`${cfg.bg} rounded-lg p-5`} data-testid={`risk-stat-${level}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{cfg.label} xavf</p>
              <p className="text-3xl font-bold tracking-tight text-on-surface mt-1">{riskSummary[level] || 0}</p>
              <p className="text-xs text-on-surface-variant mt-1">xodim</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-surface-container-lowest rounded-xl p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-sm"><Brain className="h-4 w-4 text-purple-500" />Xavf taqsimoti</CardTitle>
          </CardHeader>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
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

        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4 text-red-500" />Xavf ostidagi xodimlar (yuqori + kritik)</CardTitle>
          </CardHeader>
          {isLoading ? (
            <div className="space-y-2">{([1,2,3,4,5]).map(i => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}</div>
          ) : highRisk.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-on-surface-variant">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
              <p className="text-sm">Yuqori xavfli xodimlar yo'q</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Xodim</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Bo'lim</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Ball</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Daraja</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(highRisk) ? highRisk : []).sort((a, b) => b.overallScore - a.overallScore).slice(0, 10).map((emp) => {
                  const cfg = RISK_CONFIG[emp.riskLevel];
                  return (
                    <TableRow key={emp.id} data-testid={`risk-row-${emp.id}`} className="hover:bg-surface-container-low transition-colors">
                      <TableCell className="text-sm font-medium text-on-surface px-4">{emp.fullName}</TableCell>
                      <TableCell className="text-xs text-on-surface-variant px-4">{emp.departmentName || "—"}</TableCell>
                      <TableCell className="text-sm font-bold px-4 tabular-nums"><span className={cfg.color}>{emp.overallScore}</span></TableCell>
                      <TableCell className="px-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span></TableCell>
                      <TableCell className="px-4">
                        <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${emp.overallScore}%`, backgroundColor: cfg.barColor }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-4 w-4 text-blue-500" />Barcha xodimlar xavf reytingi</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="space-y-2">{([1,2,3,4,5]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
        ) : riskEmployees.length === 0 ? (
          <p className="text-sm text-center text-on-surface-variant py-8">Ma'lumot yo'q</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Xodim</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Davomat riski</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Intizom riski</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Burnout riski</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Umumiy ball</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase py-3 px-4">Daraja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(riskEmployees) ? riskEmployees : []).slice(0, 20).map((emp) => {
                const cfg = RISK_CONFIG[emp.riskLevel];
                return (
                  <TableRow key={emp.id} className="hover:bg-surface-container-low transition-colors">
                    <TableCell className="text-sm font-medium text-on-surface px-4">{emp.fullName}</TableCell>
                    {(["attendance", "discipline", "burnout"] as const).map((factor) => (
                      <TableCell key={factor} className="px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className={`h-full ${factor === "attendance" ? "bg-orange-400" : factor === "discipline" ? "bg-red-400" : "bg-purple-400"} rounded-full`} style={{ width: `${emp.factors?.[factor] || 0}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-on-surface-variant">{emp.factors?.[factor] || 0}</span>
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="px-4 font-bold tabular-nums"><span className={cfg.color}>{emp.overallScore}</span></TableCell>
                    <TableCell className="px-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
    </>
  );
}
