/**
 * @module SummaryCards
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { Summary } from "./types";

interface SummaryCardsProps {
  summary: Summary | undefined;
  loading: boolean;
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  const { t } = useTranslation("finance");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card data-testid="card-total-income">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("inflow")}</CardTitle>
          <TrendingUp className="h-4 w-4 text-[var(--ep-green)]" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <>
              <div
                className="text-2xl font-bold text-[var(--ep-green)]"
                data-testid="text-total-income"
              >
                {formatCurrency(summary?.totalIncome || 0)}
              </div>
              <p className="text-xs text-muted-foreground">{t("fiscalPeriod")}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-total-expense">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("outflow")}</CardTitle>
          <TrendingDown className="h-4 w-4 text-[var(--ep-red)]" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <>
              <div
                className="text-2xl font-bold text-[var(--ep-red)]"
                data-testid="text-total-expense"
              >
                {formatCurrency(summary?.totalExpense || 0)}
              </div>
              <p className="text-xs text-muted-foreground">{t("fiscalPeriod")}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-net-amount">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("netCashFlow")}</CardTitle>
          <Wallet className="h-4 w-4 text-[var(--ep-blue)]" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <>
              <div
                className={`text-2xl font-bold ${
                  (summary?.netAmount || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"
                }`}
                data-testid="text-net-amount"
              >
                {formatCurrency(summary?.netAmount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.transactionCount || 0} ta tranzaksiya
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
