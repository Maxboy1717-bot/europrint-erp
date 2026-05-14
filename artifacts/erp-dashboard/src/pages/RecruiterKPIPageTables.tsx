/** @module RecruiterKPIPageTables @description Tabular section components for the Recruiter KPI page: recruiter performance table and vacancy-type conversion table. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase } from "lucide-react";
import { CONVERSION_TARGET, TYPE_LABELS, TYPE_COLORS, fmt } from "./RecruiterKPIPageTypes";
import type { KPIData } from "./RecruiterKPIPageTypes";

// ── RecruiterTableSection ─────────────────────────────────────────────────────

interface RecruiterTableSectionProps {
  kpi: KPIData;
}

export function RecruiterTableSection({ kpi }: RecruiterTableSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Recruiter bo'yicha KPI
        </CardTitle>
      </CardHeader>
      <CardContent>
        {kpi.byRecruiter.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-2 font-medium">Recruiter</th>
                <th className="text-right pb-2 font-medium">Qabul</th>
                <th className="text-right pb-2 font-medium">O'rtacha (kun)</th>
                <th className="text-right pb-2 font-medium">Taklif %</th>
                <th className="text-right pb-2 font-medium">AI o'tish %</th>
                <th className="text-right pb-2 font-medium">Yopilgan (oy)</th>
                <th className="text-right pb-2 font-medium">Sifat %</th>
                <th className="text-right pb-2 font-medium">Foiz</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(kpi.byRecruiter) ? kpi.byRecruiter : []).map((r, i) => (
                <tr key={r.recruiter_name} className="border-b border-border/40">
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{r.recruiter_name}</span>
                  </td>
                  <td className="text-right py-2 font-semibold text-[var(--ep-green)]">{r.hired}</td>
                  <td className="text-right py-2">{fmt(r.avg_time_to_fill_working_days, " k")}</td>
                  <td className="text-right py-2">{fmt(r.offer_acceptance_rate, "%")}</td>
                  <td className="text-right py-2 text-[var(--ep-green)]">{fmt(r.ai_pass_rate, "%")}</td>
                  <td className="text-right py-2 font-medium">{r.monthly_closed ?? "0"}</td>
                  <td className="text-right py-2 text-[var(--ep-blue)]">{fmt(r.quality_of_hire, "%")}</td>
                  <td className="text-right py-2">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 bg-muted rounded-full">
                        <div
                          className="h-1.5 bg-primary rounded-full"
                          style={{ width: `${r.hire_rate ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{r.hire_rate ?? 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── VacancyTypeSection ────────────────────────────────────────────────────────

interface VacancyTypeSectionProps {
  kpi: KPIData;
}

export function VacancyTypeSection({ kpi }: VacancyTypeSectionProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" /> Vakansiya turi bo'yicha konversiya
          <span className="ml-auto text-xs font-normal text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/60" />
            Maqsad: {CONVERSION_TARGET}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {kpi.byVacancyType.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-2 font-medium">Tur</th>
                <th className="text-right pb-2 font-medium">Arizalar</th>
                <th className="text-right pb-2 font-medium">Qabul</th>
                <th className="text-right pb-2 font-medium">Konversiya</th>
                <th className="text-left pb-2 font-medium pl-4">Progress (60% maqsad)</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(kpi.byVacancyType) ? kpi.byVacancyType : []).map(row => {
                const convRate  = Number(row.conversion_rate ?? 0);
                const convColor =
                  convRate >= CONVERSION_TARGET ? "bg-green-500" : convRate >= 30 ? "bg-amber-500" : "bg-red-500";
                const textColor =
                  convRate >= CONVERSION_TARGET ? "text-[var(--ep-green)]" : convRate >= 30 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";
                return (
                  <tr key={row.vacancy_type} className="border-b border-border/50">
                    <td className="py-2">
                      <Badge className={`text-xs ${TYPE_COLORS[row.vacancy_type] ?? "bg-gray-100 text-gray-700"}`}>
                        {TYPE_LABELS[row.vacancy_type] ?? row.vacancy_type}
                      </Badge>
                    </td>
                    <td className="text-right py-2">{row.applications}</td>
                    <td className="text-right py-2 font-semibold text-[var(--ep-green)]">{row.hired}</td>
                    <td className={`text-right py-2 font-semibold ${textColor}`}>{convRate}%</td>
                    <td className="py-2 pl-4 w-48">
                      <div className="relative h-2 bg-muted rounded-full overflow-visible">
                        <div
                          className="absolute top-0 h-full w-0.5 bg-primary/50 z-10"
                          style={{ left: `${CONVERSION_TARGET}%` }}
                          title={`Maqsad: ${CONVERSION_TARGET}%`}
                        />
                        <div
                          className={`h-2 rounded-full ${convColor}`}
                          style={{ width: `${Math.min(100, convRate)}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">
                        {convRate >= CONVERSION_TARGET
                          ? "✓ Maqsadga erishildi"
                          : `${CONVERSION_TARGET - convRate}% yetishmaydi`}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
