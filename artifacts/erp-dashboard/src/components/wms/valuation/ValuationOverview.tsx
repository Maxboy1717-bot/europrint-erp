/**
 * @module ValuationOverview
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useTranslation } from '@/lib/i18n';
import { 
  ClipboardList, 
  RefreshCw,
  Check,
  TrendingDown,
  TrendingUp
} from "lucide-react";

interface ValuationOverviewProps {
  totalCounts: number;
  inProgressCounts: number;
  completedCounts: number;
  totalVarianceValue: number;
}

export function ValuationOverview({
  totalCounts,
  inProgressCounts,
  completedCounts,
  totalVarianceValue
}: ValuationOverviewProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">{t("jamiInventarizatsiyalar")}</CardTitle>
          <ClipboardList className="h-5 w-5 text-indigo-200" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatNumber(totalCounts)}</div>
          <p className="text-xs text-indigo-200 mt-1">{t("barchaHisoblar")}</p>
        </CardContent>
      </Card>

      <Card className="bg-[var(--ep-yellow)] text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
          <CardTitle className="text-sm font-medium text-amber-100">{t("inProgress")}</CardTitle>
          <RefreshCw className="h-5 w-5 text-amber-200" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatNumber(inProgressCounts)}</div>
          <p className="text-xs text-amber-200 mt-1">{t("davomEtayotgan")}</p>
        </CardContent>
      </Card>

      <Card className="bg-[var(--ep-green)] text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">{t("yakunlangan")}</CardTitle>
          <Check className="h-5 w-5 text-green-200" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatNumber(completedCounts)}</div>
          <p className="text-xs text-green-200 mt-1">{t("progress.completed")}</p>
        </CardContent>
      </Card>

      <Card className="bg-[var(--ep-red)] text-white border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
          <CardTitle className="text-sm font-medium text-red-100">{t("jamiFarq")}</CardTitle>
          {totalVarianceValue >= 0 ? (
            <TrendingUp className="h-5 w-5 text-red-200" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-200" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(Math.abs(totalVarianceValue))}</div>
          <p className="text-xs text-red-200 mt-1">{totalVarianceValue >= 0 ? "Ortiqcha" : "Kamomad"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
