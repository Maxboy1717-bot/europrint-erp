/**
 * @module ProductionOrder360Sections
 * @description Major section components for the ProductionOrder360 page:
 * KpiCard, InfoRow, and the Overview tab content.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Factory, Users, BarChart2, Calendar,
} from "lucide-react";
import ProductionOrder360Timeline from "./ProductionOrder360Timeline";
import { useTranslation } from '@/lib/i18n';
import {
  TYPE_LABELS,
  fmt,
  type Production360Overview,
  type Production360Kpi,
} from "./ProductionOrder360Types";

// ── KpiCard ──────────────────────────────────────────────────────────────────

export interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  color?: string;
}

export function KpiCard({ icon: Icon, label, value, sub, color }: KpiCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color || ""}`} data-testid={`kpi-${label}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color || "text-muted-foreground"}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

// ── OverviewSection ───────────────────────────────────────────────────────────

export interface OverviewSectionProps {
  overview: Production360Overview;
  kpi: Production360Kpi;
  statusInfo: { label: string; variant: "default" | "secondary" | "destructive" | "outline" };
}

export function OverviewSection({ overview, kpi, statusInfo }: OverviewSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">{t("asosiyMalumotlar")}</CardTitle>
            <Factory className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            <InfoRow label={t("buyurtmaRaqami")} value={<span className="font-mono">{overview.orderNumber}</span>} />
            <InfoRow label={t("Mahsulot")} value={overview.productName} />
            <InfoRow label={t("type")} value={TYPE_LABELS[overview.productionType ?? ''] || overview.productionType} />
            <InfoRow label={t("ustuvorlik")} value={<Badge variant="outline">P{overview.priority}</Badge>} />
            <InfoRow label={t("holati")} value={<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>} />
            <InfoRow label={t("eslatmalar")} value={overview.notes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">{t("miqdorKorsatkichlari")}</CardTitle>
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{t("bajarish")}</span>
                <span className="font-medium">{kpi.completionRate}%</span>
              </div>
              <Progress value={Math.min(100, kpi.completionRate)} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Ishlab chiq.: {fmt(kpi.produced)}</span>
                <span>Reja: {fmt(kpi.planned)}</span>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">{t("nosoz")}</p>
                <p className="font-semibold text-[var(--ep-primary)]">{fmt(kpi.defective)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{t("chiqindi")}</p>
                <p className="font-semibold text-[var(--ep-red)]">{fmt(kpi.scrapped)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">{t("masulShaxslar")}</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            <InfoRow label={t("masulMenejer")} value={overview.responsibleManagerName} />
            <InfoRow label={t("smenaNazoratchisi")} value={overview.shiftSupervisorName} />
            <InfoRow label="QC inspektori" value={overview.qcInspectorName} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">{t("sanaRejasi")}</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            <InfoRow label={t("rejaBoshlanish")} value={overview.plannedStartDate} />
            <InfoRow label={t("rejaTugash")} value={overview.plannedEndDate} />
            <InfoRow label={t("haqiqiyBoshlanish")} value={overview.actualStartDate} />
            <InfoRow label={t("haqiqiyTugash")} value={overview.actualEndDate} />
            {kpi.leadTimeDays != null && <InfoRow label={t("proceed")} value={`${kpi.leadTimeDays} kun`} />}
          </CardContent>
        </Card>
      </div>

      <ProductionOrder360Timeline statusHistory={overview.statusHistory} />
    </div>
  );
}
