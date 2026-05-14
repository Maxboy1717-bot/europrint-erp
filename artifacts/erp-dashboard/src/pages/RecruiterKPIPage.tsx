/** @module RecruiterKPIPage @description Route-level page component. Owns all state and data-fetching; delegates rendering to card and section sub-components. */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Printer } from "lucide-react";

import type { KPIData, UrgentVacancy, ChannelAnalyticsRow, WorkerTypeStatsRow } from "./RecruiterKPIPageTypes";
import { SummaryKPICards } from "./RecruiterKPIPageCards";
import {
  UrgentVacanciesSection,
  MonthlyTrendSection,
  StageBreakdownSection,
} from "./RecruiterKPIPageSections";
import { RecruiterTableSection, VacancyTypeSection } from "./RecruiterKPIPageTables";
import { WorkerTypeSection, ChannelAnalyticsSection } from "./RecruiterKPIPageAnalytics";

import { useTranslation } from '@/lib/i18n';
// ── Page component ────────────────────────────────────────────────────────────

export default function RecruiterKPIPage() {
  const { t } = useTranslation('common');
  const today        = new Date().toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);

  const [from, setFrom]       = useState(ninetyDaysAgo);
  const [to, setTo]           = useState(today);
  const [applied, setApplied] = useState({ from: ninetyDaysAgo, to: today });

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery<{ data: KPIData }>({
    queryKey: ["recruiter-kpi", applied.from, applied.to],
    queryFn:  () =>
      apiRequest("GET", `/api/hr/recruitment/kpi?from=${applied.from}&to=${applied.to}`),
  });

  const { data: urgentData } = useQuery<{ data: UrgentVacancy[] }>({
    queryKey: ["/api/hr/recruitment/urgent"],
    staleTime: 60_000,
  });

  const { data: channelData } = useQuery<{ data: ChannelAnalyticsRow[] }>({
    queryKey: ["/api/hr/recruitment/channel-analytics"],
    staleTime: 120_000,
  });

  const { data: workerTypeData } = useQuery<{ data: WorkerTypeStatsRow[] }>({
    queryKey: ["/api/hr/recruitment/worker-type-stats"],
    staleTime: 120_000,
  });

  // ── Derived values ────────────────────────────────────────────────────────────

  const urgentList    = urgentData?.data    ?? [];
  const channelRows   = channelData?.data   ?? [];
  const workerTypeRows = workerTypeData?.data ?? [];

  const kpi = data?.data;

  const trendData = (Array.isArray(kpi?.monthlyTrend) ? kpi?.monthlyTrend : []).map(r => ({
    month:              r.month,
    Qabul:              parseInt(r.monthly_hired    ?? "0"),
    "Rad etildi":       parseInt(r.monthly_rejected ?? "0"),
    "To'ldirish (kun)": parseFloat(r.avg_fill_days  ?? "0"),
  }));

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 print:p-4">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('recruiterKpi')}</h1>
          <p className="text-sm text-muted-foreground">Ishga qabul bo'limi samaradorligi tahlili</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          PDF / Chop etish
        </Button>
      </div>

      {/* Date filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs mb-1 block">Boshlanish sanasi</Label>
              <Input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tugash sanasi</Label>
              <Input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              onClick={() => setApplied({ from, to })}
              className="bg-primary hover:bg-primary/90"
            >
              <BarChart3 className="w-4 h-4 mr-2" /> Ko'rsatish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading / error states */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      {isError && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Ma'lumot yuklanmadi
          </CardContent>
        </Card>
      )}

      {/* Main content — only rendered when KPI data is available */}
      {kpi && (
        <>
          <SummaryKPICards summary={kpi.summary} />

          <UrgentVacanciesSection urgentList={urgentList} />

          <MonthlyTrendSection trendData={trendData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecruiterTableSection kpi={kpi} />
            <StageBreakdownSection kpi={kpi} />
            <VacancyTypeSection    kpi={kpi} />
          </div>

          <WorkerTypeSection workerTypeRows={workerTypeRows} />

          <ChannelAnalyticsSection channelRows={channelRows} />
        </>
      )}
    </div>
  );
}
