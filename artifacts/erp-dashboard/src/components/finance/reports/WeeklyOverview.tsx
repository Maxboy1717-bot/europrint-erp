/**
 * @module WeeklyOverview
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatShortCurrency, formatPercent } from "./helpers";
import { WeeklySummary } from "./types";

interface WeeklyOverviewProps {
  data: WeeklySummary | undefined;
  isLoading: boolean;
}

export function WeeklyOverview({ data, isLoading }: WeeklyOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-[var(--ep-green)] text-white border-0" data-testid="card-weekly-revenue">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Daromad</CardTitle>
          <TrendingUp className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32 bg-card/20 rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatShortCurrency(data?.revenue || 0)}</div>
              <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
                {(data?.revenueChange || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{formatPercent(Math.abs(data?.revenueChange || 0))} o'tgan haftaga nisbatan</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[var(--ep-red)] text-white border-0" data-testid="card-weekly-expenses">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Xarajatlar</CardTitle>
          <TrendingDown className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32 bg-card/20 rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatShortCurrency(data?.expenses || 0)}</div>
              <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
                {(data?.expensesChange || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{formatPercent(Math.abs(data?.expensesChange || 0))} o'tgan haftaga nisbatan</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={`${(data?.netProfit || 0) >= 0 ? "" : ""} text-white border-0`} data-testid="card-weekly-profit">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Sof foyda</CardTitle>
          <DollarSign className="h-5 w-5 opacity-80" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32 bg-card/20 rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatShortCurrency(data?.netProfit || 0)}</div>
              <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
                {(data?.profitChange || 0) >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{formatPercent(Math.abs(data?.profitChange || 0))} o'tgan haftaga nisbatan</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
