/**
 * @module AssetSummaryCards
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { Layers, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import type { AssetSummary } from "@/components/assets/types";

interface AssetSummaryCardsProps {
  assetSummary: AssetSummary | undefined;
  summaryLoading: boolean;
  totalDepreciationPercent: string;
}

export function AssetSummaryCards({ assetSummary, summaryLoading, totalDepreciationPercent }: AssetSummaryCardsProps) {
  const { t } = useTranslation('mro');

  if (summaryLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-28 rounded-lg" />)}
      </div>
    );
  }

  if (!assetSummary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="from-primary to-amber-500 text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
          <CardTitle className="text-sm font-medium text-white/90">{t("cardTotalAssets")}</CardTitle>
          <Layers className="h-5 w-5 text-white/70" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{assetSummary.totalAssets}</div>
          <p className="text-xs text-white/70 mt-1">{t("cardActiveAssets")}</p>
        </CardContent>
      </Card>
      <Card className="bg-[var(--ep-blue)] text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">{t("cardPurchaseValue")}</CardTitle>
          <TrendingUp className="h-5 w-5 text-blue-200" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(assetSummary.totalPurchaseValue)}</div>
          <p className="text-xs text-blue-200 mt-1">{t("cardInitialValue")}</p>
        </CardContent>
      </Card>
      <Card className="bg-[var(--ep-green)] text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">{t("cardCurrentBalance")}</CardTitle>
          <DollarSign className="h-5 w-5 text-green-200" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(assetSummary.totalCurrentValue)}</div>
          <p className="text-xs text-green-200 mt-1">{t("cardCurrentValue")}</p>
        </CardContent>
      </Card>
      <Card className="bg-[var(--ep-red)] text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
          <CardTitle className="text-sm font-medium text-red-100">{t("cardTotalDepreciation")}</CardTitle>
          <TrendingDown className="h-5 w-5 text-red-200" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(assetSummary.totalAccumulatedDepreciation)}</div>
          <p className="text-xs text-red-200 mt-1">{totalDepreciationPercent}{t("depreciatedPct")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
