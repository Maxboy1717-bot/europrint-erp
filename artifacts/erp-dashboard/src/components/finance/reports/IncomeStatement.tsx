import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { formatPercent } from "./helpers";
import { MonthlySummary } from "./types";

interface IncomeStatementProps {
  data: MonthlySummary | undefined;
  isLoading: boolean;
}

export function IncomeStatement({ data, isLoading }: IncomeStatementProps) {
  return (
    <Card data-testid="card-profit-loss">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Foyda va Zarar Hisoboti (P&L)
        </CardTitle>
        <CardDescription>Joriy oy uchun to'liq P&L xulosasi</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {([...Array(6)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="font-medium text-green-700">Jami daromad</span>
              <span className="font-bold text-green-600">{formatCurrency(data?.profitLoss?.revenue || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Sotilgan mahsulot tannarxi (COGS)</span>
              <span className="font-medium text-red-600">-{formatCurrency(data?.profitLoss?.costOfGoodsSold || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low/50">
              <span className="font-bold">Yalpi foyda</span>
              <div className="text-right">
                <div className="font-bold text-green-600">{formatCurrency(data?.profitLoss?.grossProfit || 0)}</div>
                <div className="text-xs text-muted-foreground">Marja: {formatPercent(data?.profitLoss?.grossMargin)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Operatsion xarajatlar</span>
              <span className="font-medium text-red-600">-{formatCurrency(data?.profitLoss?.operatingExpenses || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="font-bold">Operatsion foyda (EBIT)</span>
              <div className="text-right">
                <div className="font-bold text-blue-600">{formatCurrency(data?.profitLoss?.operatingIncome || 0)}</div>
                <div className="text-xs text-muted-foreground">Marja: {formatPercent(data?.profitLoss?.operatingMargin)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white">
              <span className="font-bold text-lg">Sof foyda</span>
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
