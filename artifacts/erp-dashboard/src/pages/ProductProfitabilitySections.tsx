/**
 * @module ProductProfitabilitySections
 * @description KPI summary cards and margin-distribution panel for the
 * ProductProfitability page.
 *
 * Bar-chart sections (top profitable / top loss) live in
 * ProductProfitabilityCharts.tsx.
 */

import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Package, Percent, DollarSign } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DistributionItem, formatPercent } from "./ProductProfitabilityTypes";

// ---------------------------------------------------------------------------
// KPI Summary Cards
// ---------------------------------------------------------------------------

interface KpiSummaryProps {
  isLoading: boolean;
  totalProducts: number;
  avgMargin: number;
  totalProfitLoss: number;
}

export function KpiSummaryCards({ isLoading, totalProducts, avgMargin, totalProfitLoss }: KpiSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card data-testid="card-total-products">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tahlil Qilingan Mahsulotlar</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <div className="text-2xl font-bold">{totalProducts}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Jami mahsulotlar soni</p>
        </CardContent>
      </Card>

      <Card data-testid="card-avg-margin">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">O'rtacha Foyda Marjasi</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <div className={`text-2xl font-bold ${avgMargin >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
              {formatPercent(avgMargin)}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Barcha mahsulotlar bo'yicha</p>
        </CardContent>
      </Card>

      <Card data-testid="card-total-profit">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jami Foyda/Zarar</CardTitle>
          {totalProfitLoss >= 0 ? (
            <TrendingUp className="h-4 w-4 text-[var(--ep-green)]" />
          ) : (
            <TrendingDown className="h-4 w-4 text-[var(--ep-red)]" />
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
              {formatCurrency(totalProfitLoss)}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Umumiy natija</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Margin Distribution Pie Chart
// ---------------------------------------------------------------------------

interface DistributionProps {
  isLoading: boolean;
  distributionData: DistributionItem[];
}

export function DistributionSection({ isLoading, distributionData }: DistributionProps) {
  return (
    <Card data-testid="card-distribution">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Rentabellik Taqsimoti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Skeleton className="h-64 w-64 rounded-full" />
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {(Array.isArray(distributionData) ? distributionData : []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} ta mahsulot`,
                    name,
                  ]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Legend
                  formatter={(value: string) => {
                    const item = (Array.isArray(distributionData) ? distributionData : []).find((d) => d.name === value);
                    return `${value} (${item?.value || 0})`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-4">
          <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="text-xs text-muted-foreground">&gt;30%</div>
            <div className="text-lg font-bold text-[var(--ep-green)]">{distributionData[0]?.value ?? 0}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-lime-500/10 border border-lime-500/30">
            <div className="text-xs text-muted-foreground">15-30%</div>
            <div className="text-lg font-bold text-[var(--ep-green)]">{distributionData[1]?.value ?? 0}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="text-xs text-muted-foreground">0-15%</div>
            <div className="text-lg font-bold text-[var(--ep-yellow)]">{distributionData[2]?.value ?? 0}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <div className="text-xs text-muted-foreground">-15-0%</div>
            <div className="text-lg font-bold text-[var(--ep-primary)]">{distributionData[3]?.value ?? 0}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="text-xs text-muted-foreground">&lt;-15%</div>
            <div className="text-lg font-bold text-[var(--ep-red)]">{distributionData[4]?.value ?? 0}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
