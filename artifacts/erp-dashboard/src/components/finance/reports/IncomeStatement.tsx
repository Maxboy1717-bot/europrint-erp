/**
 * @module IncomeStatement
 * @description React UI component.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { formatPercent } from "./helpers";
import { MonthlySummary } from "./types";
import { useTranslation } from '@/lib/i18n';

interface IncomeStatementProps {
  data: MonthlySummary | undefined;
  isLoading: boolean;
}

export function IncomeStatement({ data, isLoading }: IncomeStatementProps) {
  const { t } = useTranslation("common");
  return (
    <Card data-testid="card-profit-loss">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Foyda va Zarar Hisoboti (P&L)
        </CardTitle>
        <CardDescription>{t("joriyOyUchunToliqP")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {([...Array(6)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="font-medium text-[var(--ep-green)]">{t("jamiDaromad")}</span>
              <span className="font-bold text-[var(--ep-green)]">{formatCurrency(data?.profitLoss?.revenue || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Sotilgan mahsulot tannarxi (COGS)</span>
              <span className="font-medium text-[var(--ep-red)]">-{formatCurrency(data?.profitLoss?.costOfGoodsSold || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40/50">
              <span className="font-bold">{t("yalpiFoyda")}</span>
              <div className="text-right">
                <div className="font-bold text-[var(--ep-green)]">{formatCurrency(data?.profitLoss?.grossProfit || 0)}</div>
                <div className="text-xs text-muted-foreground">Marja: {formatPercent(data?.profitLoss?.grossMargin)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>{t("operatsionXarajatlar")}</span>
              <span className="font-medium text-[var(--ep-red)]">-{formatCurrency(data?.profitLoss?.operatingExpenses || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="font-bold">Operatsion foyda (EBIT)</span>
              <div className="text-right">
                <div className="font-bold text-[var(--ep-blue)]">{formatCurrency(data?.profitLoss?.operatingIncome || 0)}</div>
                <div className="text-xs text-muted-foreground">Marja: {formatPercent(data?.profitLoss?.operatingMargin)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--ep-green)] text-white">
              <span className="font-bold text-lg">{t("sofFoyda")}</span>
              <div className="text-right">
                <div className="font-bold text-xl">{formatCurrency(data?.profitLoss?.netProfit || 0)}</div>
                <div className="text-xs opacity-80">Sof marja: {formatPercent(data?.profitLoss?.netMargin)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
