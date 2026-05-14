/**
 * @module QCDashboardSections
 * @description KPI and QC-flow section components for the QC Dashboard.
 * AttentionSection and SummarySection live in QCDashboardAttention.tsx.
 * Both are re-exported here so QCDashboard.tsx has a single import point.
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, AlertTriangle, XCircle,
  FlaskConical, TrendingDown,
  Package, ClipboardList, FileWarning,
  Gauge, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { KpiCard, StreamCard } from "./QCDashboardHelpers";
import type { QcStats, QcFlowData } from "./QCDashboardTypes";
import { RESULT_LABELS } from "./QCDashboardTypes";

import { useTranslation } from '@/lib/i18n';
// Re-export so callers only need one import
export { AttentionSection, SummarySection } from "./QCDashboardAttention";

// ─── KpiSection ───────────────────────────────────────────────────────────────

interface KpiSectionProps {
  stats: QcStats | undefined;
  loading: boolean;
  passColor: string;
  passRate: number;
}

export function KpiSection({stats, loading, passColor, passRate }: KpiSectionProps) {
  const { t } = useTranslation('common');
  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {t("hozirgiHolat")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title={t("jamiTestlar1")}
          value={stats?.tests?.total || 0}
          sub={`${stats?.tests?.passed || 0} ta o'tdi`}
          icon={FlaskConical}
          color="text-[var(--ep-blue)]"
          loading={loading}
        />
        <KpiCard
          title={t("otishDarajasi")}
          value={`${passRate}%`}
          sub="passed / total"
          icon={Gauge}
          color={passColor}
          loading={loading}
        />
        <KpiCard
          title={t("braklar")}
          value={stats?.braks?.count || 0}
          sub={`${stats?.braks?.totalQty || 0} dona`}
          icon={XCircle}
          color="text-[var(--ep-red)]"
          loading={loading}
        />
        <KpiCard
          title={t("brakXarajat")}
          value={
            stats?.braks?.totalCostImpact
              ? `${Number(stats.braks.totalCostImpact).toLocaleString()} so'm`
              : "0"
          }
          sub="umumiy yo'qotish"
          icon={TrendingDown}
          color="text-red-400"
          loading={loading}
        />
        <KpiCard
          title={t("reklamatsiyalar")}
          value={stats?.reclamations?.total || 0}
          sub={`${stats?.reclamations?.open || 0} ta ochiq`}
          icon={AlertTriangle}
          color="text-[var(--ep-yellow)]"
          loading={loading}
        />
        <KpiCard
          title={t("ochiqRca")}
          value={stats?.openRca || 0}
          sub="ildiz sabab tahlil"
          icon={Search}
          color="text-[var(--ep-primary)]"
          loading={loading}
        />
      </div>
    </section>
  );
}

// ─── QcFlowSection ────────────────────────────────────────────────────────────

interface QcFlowSectionProps {
  flow: QcFlowData | undefined;
  loading: boolean;
}

export function QcFlowSection({ flow, loading }: QcFlowSectionProps) {
  const { t } = useTranslation("common");
  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        4 ta QC oqimi
      </p>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={`k-${i}`}>
              <CardContent className="p-5">
                <Skeleton className="h-24 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1-oqim: Kiruvchi material */}
          <StreamCard
            label={"Kiruvchi material"}
            status={flow?.streams?.incoming?.status || "ok"}
            icon={Package}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("jamiTekshiruvlar")}</span>
                <span className="font-semibold">{flow?.streams?.incoming?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Past sifat (&lt;70)</span>
                <span className={cn(
                  "font-semibold",
                  (flow?.streams?.incoming?.lowQuality || 0) > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"
                )}>
                  {flow?.streams?.incoming?.lowQuality || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">MM reytingi avtomatik pasaytiriladi</p>
            </div>
          </StreamCard>

          {/* 2-oqim: Inline nazorat */}
          <StreamCard
            label={t("inlineNazorat")}
            status={flow?.streams?.inline?.status || "active"}
            icon={Shield}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("ishlabChiqarishda")}</span>
                <span className="font-semibold">{flow?.streams?.inline?.inProduction || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">{t("kritikOgishQcHoldAvtomatik")}</p>
            </div>
          </StreamCard>

          {/* 3-oqim: Final inspeksiya */}
          <StreamCard
            label={t("finalInspeksiya1")}
            status={flow?.streams?.finalInspection?.status || "ok"}
            icon={ClipboardList}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("Kutilmoqda")}</span>
                <span className="font-semibold">
                  {flow?.streams?.finalInspection?.pendingOrders || 0}
                </span>
              </div>
              {flow?.streams?.finalInspection?.resultCounts &&
                Object.entries(flow.streams.finalInspection.resultCounts)
                  .slice(0, 3)
                  .map(([result, cnt]) => (
                    <div key={result} className="flex justify-between items-center">
                      <Badge className={cn(
                        "text-xs",
                        RESULT_LABELS[result]?.cls || "bg-muted text-muted-foreground"
                      )}>
                        {RESULT_LABELS[result]?.label || result}
                      </Badge>
                      <span className="font-semibold text-xs">{cnt}</span>
                    </div>
                  ))}
            </div>
          </StreamCard>

          {/* 4-oqim: Reklamatsiya */}
          <StreamCard
            label={t("reklamatsiyalar")}
            status={flow?.streams?.reclamation?.status || "ok"}
            icon={FileWarning}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("yangi")}</span>
                <span className={cn(
                  "font-semibold",
                  (flow?.streams?.reclamation?.open || 0) > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"
                )}>
                  {flow?.streams?.reclamation?.open || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("koribChiqilmoqda")}</span>
                <span className="font-semibold text-[var(--ep-yellow)]">
                  {flow?.streams?.reclamation?.investigating || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">RCA avtomatik ochiladi</p>
            </div>
          </StreamCard>

        </div>
      )}
    </section>
  );
}
