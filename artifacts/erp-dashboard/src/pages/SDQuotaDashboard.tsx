/**
 * @module SDQuotaDashboard
 * @description React page component. Route-level UI.
 * State management, hooks, and orchestration only.
 * Sections: SDQuotaDashboardSections.tsx
 * Types:    SDQuotaDashboardTypes.ts
 * Dialogs:  SDQuotaDashboardDialogs.tsx
 */

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { QuotaData } from "./SDQuotaDashboardTypes";
import {
  QuotaPlanFactCard,
  KpiStatsRow,
  LeadStatusCard,
  ProposalStatusCard,
} from "./SDQuotaDashboardSections";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function SDQuotaDashboard() {
  const { t } = useTranslation("common");
  const { data: kpi, isLoading, refetch } = useQuery<QuotaData>({
    queryKey: ["/api/sd/dashboard/quota"],
    refetchInterval: 120_000,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted/40 rounded-xl w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([1, 2, 3]).map(i => <div key={`k-${i}`} className="h-32 bg-muted/40 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const q = kpi?.quota || { target: 0, achieved: 0, percent: 0, remaining: 0, dailyTarget: 0, dailyActual: 0, pace: 0 };
  const isOnTrack = q.pace >= 90;
  const isAhead = q.pace >= 110;

  return (
    <div className="space-y-6 min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 flex-wrap">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("meningKpiVaKvotam")}</b></>}
        title={t("meningKpiVaKvotam")}
        subtitle="{kpi?.period} — {kpi?.daysLeft} kun qoldi"
      />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("refresh")}
          </Button>
          {isAhead ? (
            <Badge className="bg-green-100 text-green-800 no-default-hover-elevate gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              {t("rejaBajarilmoqda")}
            </Badge>
          ) : isOnTrack ? (
            <Badge className="bg-amber-100 text-amber-800 no-default-hover-elevate gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              {t("maqsadgaYaqin")}
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 no-default-hover-elevate gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {t("orqadaQolmoqda")}
            </Badge>
          )}
          <Badge variant="secondary" className="no-default-hover-elevate gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {kpi?.daysLeft} kun qoldi
          </Badge>
        </div>
      </div>

      {/* Plan/Fakt — asosiy kartochka */}
      <QuotaPlanFactCard quota={q} isOnTrack={isOnTrack} />

      {/* Qisqacha statistika */}
      <KpiStatsRow
        ordersThisMonth={kpi?.ordersThisMonth || 0}
        leadsWon={kpi?.leadsWon || 0}
        conversionRate={kpi?.conversionRate || 0}
        totalProposals={kpi?.totalProposals || 0}
      />

      {/* Lead holatlari & Taklifnomalar holati */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeadStatusCard leadsByStatus={kpi?.leadsByStatus || {}} />
        <ProposalStatusCard proposalsByStatus={kpi?.proposalsByStatus || {}} />
      </div>
    </div>
  );
}
