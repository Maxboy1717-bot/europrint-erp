/**
 * @module CrmCohortAnalysis
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingDown, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState, EPLoader } from "@/components/ep";

type CohortMode = "count" | "revenue";

interface CohortRow {
  cohortMonth: string;
  cohortSize: number;
  retentionByPeriod: Record<number, number>;
}
interface CohortMatrix {
  rows: CohortRow[];
  maxPeriod: number;
  mode: CohortMode;
  message?: string;
}

function retentionColor(pct: number): string {
  if (pct >= 80) return "bg-[var(--ep-green)] text-white";
  if (pct >= 60) return "bg-emerald-400 text-white";
  if (pct >= 40) return "bg-yellow-400 text-gray-900";
  if (pct >= 20) return "bg-orange-400 text-white";
  if (pct > 0)  return "bg-red-400 text-white";
  return "bg-gray-100 text-gray-400";
}

function CohortHeatmap({ data, t }: { data: CohortMatrix; t: (k: string) => string }) {
  if (!data.rows?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
        <Info className="w-5 h-5" /> {data.message ?? t('cohortNoData')}
      </div>
    );
  }
  const periods = Array.from({ length: data.maxPeriod + 1 }, (_, i) => i);
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-separate border-spacing-0.5 min-w-max">
        <thead>
          <tr>
            <th className="text-left px-2 py-1 text-muted-foreground font-medium">Cohort</th>
            <th className="px-2 py-1 text-muted-foreground font-medium">
              {data.mode === "revenue" ? t('baseRevenue') : t('cohortSize')}
            </th>
            {periods.map(p => (
              <th key={p} className="px-2 py-1 text-muted-foreground font-medium text-center w-14">
                {p === 0 ? "M+0" : `M+${p}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map(row => {
            const basePct = row.retentionByPeriod[0] ?? 1;
            return (
              <tr key={row.cohortMonth}>
                <td className="px-2 py-1 font-medium whitespace-nowrap">{row.cohortMonth}</td>
                <td className="px-2 py-1 text-center font-mono">{row.cohortSize}</td>
                {periods.map(p => {
                  const val = row.retentionByPeriod[p];
                  if (val === undefined || val === null) {
                    return <td key={p} className="px-2 py-1 text-center rounded bg-gray-50 text-gray-300">—</td>;
                  }
                  const pct = basePct > 0 ? Math.round((val / basePct) * 100) : 0;
                  return (
                    <td key={p} className={`px-2 py-1 text-center rounded font-mono ${retentionColor(pct)}`}>
                      {pct}%
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CohortLegend({ t }: { t: (k: string) => string }) {
  const levels = [
    { color: "bg-emerald-600", label: "≥80%" },
    { color: "bg-emerald-400", label: "60-79%" },
    { color: "bg-yellow-400",  label: "40-59%" },
    { color: "bg-orange-400",  label: "20-39%" },
    { color: "bg-red-400",     label: "1-19%" },
    { color: "bg-gray-100 border", label: "0%" },
  ];
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
      <span>{t('retention')}:</span>
      {levels.map(l => (
        <div key={l.label} className="flex items-center gap-1">
          <div className={`w-4 h-4 rounded ${l.color}`} />
          <span>{l.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CrmCohortAnalysis() {
  const { t } = useTranslation('crm');
  const [mode, setMode] = useState<CohortMode>("count");

  const { data, isLoading, isError, refetch } = useQuery<CohortMatrix>({
    queryKey: ["crm-cohort", mode],
    queryFn:  () => apiRequest("GET", `/api/crm/cohort?months=12&mode=${mode}`),
    retry: 1,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><EPLoader className="w-8 h-8 text-[var(--ep-blue)]" /></div>;
  if (isError)   return <EPErrorState onRetry={refetch} />;

  const rowsWithM1  = data?.rows?.filter(r => r.retentionByPeriod[1] !== undefined) ?? [];
  const avgRetention = rowsWithM1.length
    ? rowsWithM1.reduce((s, r) => s + (r.retentionByPeriod[1] ?? 0), 0) / rowsWithM1.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-7 h-7 text-[var(--ep-blue)]" />
        <div>
          <h1 className="text-2xl font-bold">{t('cohortAnalysis')}</h1>
          <p className="text-muted-foreground text-sm">{t('cohortDesc')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">{t('retentionMode')}:</span>
        <div className="flex rounded-md border overflow-hidden">
          <button
            onClick={() => setMode("count")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${mode === "count" ? "bg-[var(--ep-blue)] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {t('countRetention')}
          </button>
          <button
            onClick={() => setMode("revenue")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${mode === "revenue" ? "bg-[var(--ep-blue)] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {t('revenueRetention')}
          </button>
        </div>
        {mode === "revenue" && (
          <Badge className="text-xs bg-purple-100 text-purple-800">
            {t('revenueBasedBadge')}
          </Badge>
        )}
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{t('cohortCount')}</p>
              <p className="text-2xl font-bold">{data.rows?.length ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{t('avgM1Retention')}</p>
              <p className="text-2xl font-bold">{(avgRetention * 100).toFixed(1)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">{t('maxPeriod')}</p>
              <p className="text-2xl font-bold">M+{data.maxPeriod}</p>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  {t('retentionMatrix')}
                  {mode === "revenue" && <Badge className="text-xs ml-2 bg-purple-100 text-purple-800">{t('revenuePercent')}</Badge>}
                </CardTitle>
                <CohortLegend t={t} />
              </div>
            </CardHeader>
            <CardContent>
              <CohortHeatmap data={data} t={t} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
