/**
 * @module WarehouseRentalSections
 * @description Summary section components for the Warehouse Rental page:
 * - `KpiCards`     — 4-column statistics grid (active / revenue / paid / closed)
 * - `OverdueAlert` — orange alert banner listing records past the free-day threshold
 *
 * The records table lives in `WarehouseRentalTable.tsx`.
 * The settings form lives in `WarehouseRentalSettings.tsx`.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import { formatMoney, type RentalSummary } from "./WarehouseRentalTypes";
import { useTranslation } from '@/lib/i18n';

// ─── KpiCards ─────────────────────────────────────────────────────────────────

interface KpiCardsProps {
  summary: RentalSummary | undefined;
  isLoading: boolean;
}

export function KpiCards({ summary, isLoading }: KpiCardsProps) {
  const { t } = useTranslation("common");
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-[var(--ep-blue)]" />
            <span className="text-sm text-muted-foreground">{t("aktivYozuvlar")}</span>
          </div>
          <p className="text-2xl font-bold" data-testid="stat-active-count">
            {summary?.activeCount ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary?.overdueCount ?? 0} ta pullik boshlandi
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-[var(--ep-primary)]" />
            <span className="text-sm text-muted-foreground">{t("joriyIjara")}</span>
          </div>
          <p
            className="text-xl font-bold text-[var(--ep-primary)] dark:text-orange-400"
            data-testid="stat-active-amount"
          >
            {formatMoney(summary?.totalActiveAmount ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">{t("aktivYozuvlarJami")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
            <span className="text-sm text-muted-foreground">{t("tolangan")}</span>
          </div>
          <p
            className="text-xl font-bold text-[var(--ep-green)] dark:text-green-400"
            data-testid="stat-paid-amount"
          >
            {formatMoney(summary?.totalPaidAmount ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">{t("jamiTolov")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-[var(--ep-purple)]" />
            <span className="text-sm text-muted-foreground">{t("yopilgan")}</span>
          </div>
          <p className="text-xl font-bold" data-testid="stat-closed-amount">
            {formatMoney(summary?.totalClosedAmount ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">{t("jamiYopilgan")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── OverdueAlert ─────────────────────────────────────────────────────────────

interface OverdueAlertProps {
  summary: RentalSummary | undefined;
}

export function OverdueAlert({ summary }: OverdueAlertProps) {
  if ((summary?.overdueCount ?? 0) === 0) return null;

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-[var(--ep-primary)]" />
          <span className="font-semibold text-[var(--ep-primary)] dark:text-orange-400">
            {summary?.overdueCount} ta buyurtma bepul kundan oshdi — ijara to'lovi boshlandi
          </span>
        </div>
        <div className="space-y-1">
          {summary?.overdueRecords?.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{r.productName}</span>
              <span className="text-muted-foreground">•</span>
              <span>{r.customerName || "—"}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-semibold text-[var(--ep-primary)]">
                {formatMoney(Number(r.totalAmount))}
              </span>
              <span className="text-muted-foreground">
                ({r.billableDays} kun × {r.areaM2} m²)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
