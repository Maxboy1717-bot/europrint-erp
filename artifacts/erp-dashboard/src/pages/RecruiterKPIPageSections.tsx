/** @module RecruiterKPIPageSections @description Urgent-vacancies widget, monthly trend line chart, and pipeline stage-breakdown bar list for the Recruiter KPI page. */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, AlertTriangle, Zap } from "lucide-react";
import { STAGE_LABELS } from "./RecruiterKPIPageTypes";
import type { KPIData, UrgentVacancy } from "./RecruiterKPIPageTypes";
import { useTranslation } from '@/lib/i18n';

// ── UrgentVacanciesSection ────────────────────────────────────────────────────

interface UrgentVacanciesSectionProps {
  urgentList: UrgentVacancy[];
}

export function UrgentVacanciesSection({ urgentList }: UrgentVacanciesSectionProps) {
  const { t } = useTranslation("common");
  if (urgentList.length === 0) return null;
  return (
    <Card className="border-red-500/40 bg-red-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          Shoshilinch Vakansiyalar ({urgentList.length})
          <span className="text-xs font-normal text-muted-foreground ml-1">
            {t("tezkorEtiborTalabQiladi")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {(Array.isArray(urgentList) ? urgentList : []).map(v => {
            const elapsed    = parseInt(v.working_days_elapsed ?? "0");
            const deadline   = v.deadline_working_days ?? 15;
            const pct        = Math.min(100, Math.round((elapsed / deadline) * 100));
            const isCritical = pct >= 80;
            return (
              <div
                key={v.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isCritical
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-orange-500/30 bg-orange-500/5"
                }`}
              >
                <Zap
                  className={`w-4 h-4 shrink-0 ${isCritical ? "text-red-400" : "text-orange-400"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{v.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.department_name ?? "—"} · {v.vacancy_type ?? "STANDARD"} · {v.candidate_count} nomzod
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-muted/40 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${isCritical ? "bg-red-500" : "bg-orange-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium shrink-0 ${
                        isCritical ? "text-red-400" : "text-orange-400"
                      }`}
                    >
                      {elapsed}/{deadline} ish kuni
                    </span>
                  </div>
                </div>
                <Badge
                  className={`text-xs shrink-0 ${
                    isCritical
                      ? "bg-[var(--ep-red)] text-white"
                      : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  }`}
                >
                  {pct}%
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── MonthlyTrendSection ───────────────────────────────────────────────────────

export interface TrendDatum {
  month: string;
  Qabul: number;
  "Rad etildi": number;
  "To'ldirish (kun)": number;
}

interface MonthlyTrendSectionProps {
  trendData: TrendDatum[];
}

export function MonthlyTrendSection({ trendData }: MonthlyTrendSectionProps) {
  if (trendData.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> {t("oylikTrendQabulVaRad")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left"  tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="Qabul" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
            <Line yAxisId="left" type="monotone" dataKey="Rad etildi" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="To'ldirish (kun)"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── StageBreakdownSection ─────────────────────────────────────────────────────

interface StageBreakdownSectionProps {
  kpi: KPIData;
}

export function StageBreakdownSection({ kpi }: StageBreakdownSectionProps) {
  const total = (Array.isArray(kpi.byStage) ? kpi.byStage : []).reduce(
    (a, b) => a + parseInt(b.count),
    0,
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> {t("bosqichlarBoyicha")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {kpi.byStage.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">{t("malumotYoq")}</p>
        )}
        <div className="space-y-2">
          {(Array.isArray(kpi.byStage) ? kpi.byStage : []).map(row => {
            const pctVal = total ? Math.round((parseInt(row.count) / total) * 100) : 0;
            return (
              <div key={row.stage} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-36 truncate">
                  {STAGE_LABELS[row.stage] ?? row.stage}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full">
                  <div
                    className="h-1.5 bg-blue-500 rounded-full"
                    style={{ width: `${pctVal}%` }}
                  />
                </div>
                <span className="text-xs font-semibold w-8 text-right">{row.count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
