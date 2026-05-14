/**
 * @module ProductionOrder360
 * @description React page component. Route-level UI — state, hooks, and orchestration only.
 */

import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Factory, CheckCircle2, TrendingUp, TrendingDown,
  Clock, Package, ShieldCheck, Wrench, Coins,
  Gauge, Activity,
} from "lucide-react";
import ProductionOrder360Shifts from "./ProductionOrder360Shifts";
import ProductionOrder360Bom from "./ProductionOrder360Bom";
import ProductionOrder360Quality from "./ProductionOrder360Quality";
import ProductionOrder360Equipment from "./ProductionOrder360Equipment";
import ProductionOrder360TimeAnalysis from "./ProductionOrder360TimeAnalysis";
import ProductionOrder360Cost from "./ProductionOrder360Cost";
import { apiRequest } from '@/lib/queryClient';
import {
  STATUS_LABELS,
  TYPE_LABELS,
  fmt,
  fmtMoney,
  type Production360Response,
} from "./ProductionOrder360Types";
import { KpiCard, OverviewSection } from "./ProductionOrder360Sections";
import { useTranslation } from '@/lib/i18n';

export default function ProductionOrder360() {
  const { t } = useTranslation("common");
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery<Production360Response>({
    queryKey: ["/api/production/orders", id, "360-card"],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/production/orders/${id}/360-card`);
      if (!res.ok) throw new Error("Xato");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (!data) return (
    <div className="p-8 text-center text-muted-foreground">{t("noData")}</div>
  );

  const { overview, kpi, shifts, materials, quality, equipment, timeAnalysis, costAnalysis } = data;
  const statusInfo = STATUS_LABELS[overview.status] || { label: overview.status, variant: "secondary" as const };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="border-b px-6 py-4 flex items-center gap-3 flex-wrap">
        <Button size="icon" variant="ghost" onClick={() => navigate("/production/orders")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold font-mono" data-testid="text-order-number">{overview.orderNumber}</h1>
            <Badge variant={statusInfo.variant} data-testid="badge-status">{statusInfo.label}</Badge>
            {overview.productionType && (
              <Badge variant="outline" data-testid="badge-type">
                {TYPE_LABELS[overview.productionType] || overview.productionType}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{overview.productName || "Mahsulot ko'rsatilmagan"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 space-y-4">
          {/* ── KPI row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              icon={CheckCircle2} label={t("bajarishFoizi")} value={`${kpi.completionRate}%`}
              sub={`${fmt(kpi.produced)} / ${fmt(kpi.planned)} dona`}
              color={kpi.completionRate >= 100 ? "text-[var(--ep-green)]" : kpi.completionRate >= 50 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}
            />
            <KpiCard
              icon={Gauge} label={t("ortachaOee")} value={kpi.avgOee != null ? `${fmt(kpi.avgOee * 100, 1)}%` : "—"}
              sub="Umumiy samaradorlik"
              color={kpi.avgOee != null && kpi.avgOee >= 0.85 ? "text-[var(--ep-green)]" : kpi.avgOee != null && kpi.avgOee >= 0.65 ? "text-[var(--ep-yellow)]" : "text-muted-foreground"}
            />
            <KpiCard
              icon={ShieldCheck} label={t("qcOtishDarajasi")} value={`${kpi.qcPassRate}%`}
              sub={`${fmt(quality?.totalFailed)} rad etildi`}
              color={kpi.qcPassRate >= 95 ? "text-[var(--ep-green)]" : kpi.qcPassRate >= 85 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}
            />
            <KpiCard
              icon={kpi.costVariance > 0 ? TrendingUp : TrendingDown} label={t("tannarxOgishi")}
              value={kpi.costVariance !== 0 ? fmtMoney(Math.abs(kpi.costVariance)) : "0"}
              sub={kpi.costVariancePct !== 0 ? `${kpi.costVariance > 0 ? "+" : ""}${kpi.costVariancePct}% (${kpi.costVariance > 0 ? "ortiq" : "tejaldi"})` : "Reja bajarildi"}
              color={kpi.costVariance > 0 ? "text-[var(--ep-red)]" : kpi.costVariance < 0 ? "text-[var(--ep-green)]" : "text-muted-foreground"}
            />
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="flex flex-wrap h-auto gap-1" data-testid="tabs-360">
              <TabsTrigger value="overview" data-testid="tab-overview"><Factory className="w-3.5 h-3.5 mr-1.5" />{t("umumiy")}</TabsTrigger>
              <TabsTrigger value="shifts" data-testid="tab-shifts"><Clock className="w-3.5 h-3.5 mr-1.5" />{t("smenalar")}</TabsTrigger>
              <TabsTrigger value="materials" data-testid="tab-materials"><Package className="w-3.5 h-3.5 mr-1.5" />{t("Materiallar")}</TabsTrigger>
              <TabsTrigger value="quality" data-testid="tab-quality"><ShieldCheck className="w-3.5 h-3.5 mr-1.5" />{t("Sifat")}</TabsTrigger>
              <TabsTrigger value="equipment" data-testid="tab-equipment"><Wrench className="w-3.5 h-3.5 mr-1.5" />{t("Uskuna")}</TabsTrigger>
              <TabsTrigger value="time" data-testid="tab-time"><Activity className="w-3.5 h-3.5 mr-1.5" />{t("vaqtTahlili")}</TabsTrigger>
              <TabsTrigger value="cost" data-testid="tab-cost"><Coins className="w-3.5 h-3.5 mr-1.5" />{t("tannarx1")}</TabsTrigger>
            </TabsList>

            {/* ── TAB 1: OVERVIEW ── */}
            <TabsContent value="overview" className="mt-4">
              <OverviewSection overview={overview} kpi={kpi} statusInfo={statusInfo} />
            </TabsContent>

            {/* ── TAB 2: SHIFTS ── */}
            <TabsContent value="shifts" className="mt-4">
              <ProductionOrder360Shifts
                sessions={shifts?.sessions}
                downtimes={shifts?.downtimes}
                totalRunningHours={shifts?.totalRunningHours}
                totalStoppedHours={shifts?.totalStoppedHours}
              />
            </TabsContent>

            {/* ── TAB 3: MATERIALS (BOM) ── */}
            <TabsContent value="materials" className="mt-4">
              <ProductionOrder360Bom
                totalPlannedCost={materials?.totalPlannedCost}
                totalActualCost={materials?.totalActualCost}
                components={materials?.components}
              />
            </TabsContent>

            {/* ── TAB 4: QUALITY ── */}
            <TabsContent value="quality" className="mt-4">
              <ProductionOrder360Quality
                qcPassRate={kpi.qcPassRate}
                totalChecked={quality?.totalChecked}
                totalFailed={quality?.totalFailed}
                checks={quality?.checks}
              />
            </TabsContent>

            {/* ── TAB 5: EQUIPMENT ── */}
            <TabsContent value="equipment" className="mt-4">
              <ProductionOrder360Equipment
                list={equipment?.list}
                sessions={equipment?.sessions}
              />
            </TabsContent>

            {/* ── TAB 6: TIME ANALYSIS ── */}
            <TabsContent value="time" className="mt-4">
              <ProductionOrder360TimeAnalysis
                totalRunningSeconds={timeAnalysis?.totalRunningSeconds}
                totalStoppedSeconds={timeAnalysis?.totalStoppedSeconds}
                plannedStartDate={timeAnalysis?.plannedStartDate}
                plannedEndDate={timeAnalysis?.plannedEndDate}
                actualStartDate={timeAnalysis?.actualStartDate}
                actualEndDate={timeAnalysis?.actualEndDate}
                downtimes={timeAnalysis?.downtimes}
                totalDowntimeMins={kpi.totalDowntimeMins}
                leadTimeDays={kpi.leadTimeDays}
              />
            </TabsContent>

            {/* ── TAB 7: COST ANALYSIS ── */}
            <TabsContent value="cost" className="mt-4">
              <ProductionOrder360Cost
                plannedCost={costAnalysis?.plannedCost}
                actualCost={costAnalysis?.actualCost}
                variance={costAnalysis?.variance}
                variancePct={costAnalysis?.variancePct}
                materialCost={costAnalysis?.materialCost}
                components={costAnalysis?.components}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
