/**
 * @module ProductProfitabilityCharts
 * @description Bar-chart + table section components for the top-profitable
 * and top-loss panels on the ProductProfitability page.
 */

import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  OrderCosting,
  ProfitableChartItem,
  LossChartItem,
  formatPercent,
} from "./ProductProfitabilityTypes";

// ---------------------------------------------------------------------------
// Top 10 Profitable Products
// ---------------------------------------------------------------------------

interface TopProfitableProps {
  isLoading: boolean;
  topProfitable: OrderCosting[];
  chartData: ProfitableChartItem[];
}

export function TopProfitableSection({ isLoading, topProfitable, chartData }: TopProfitableProps) {
  return (
    <Card data-testid="card-top-profitable">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--ep-green)]">
          <TrendingUp className="h-5 w-5" />
          Top 10 Foydali Mahsulotlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tickFormatter={(val) => formatCurrency(val).replace(" UZS", "")} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Foyda"]}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="profit" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Mahsulot</TableHead>
                  <TableHead className="text-right">Daromad</TableHead>
                  <TableHead className="text-right">Xarajat</TableHead>
                  <TableHead className="text-right">Foyda</TableHead>
                  <TableHead className="text-right">Marja %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(topProfitable) ? topProfitable : []).slice(0, 10).map((item, index) => (
                  <TableRow key={item.id} data-testid={`row-profitable-${index}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-[var(--ep-green)]">{index + 1}</TableCell>
                    <TableCell className="text-[var(--ep-green)]">{item.salesOrderId || `Mahsulot ${index + 1}`}</TableCell>
                    <TableCell className="text-right text-[var(--ep-green)]">{formatCurrency(item.sellingPrice)}</TableCell>
                    <TableCell className="text-right text-[var(--ep-green)]">{formatCurrency(item.totalCost)}</TableCell>
                    <TableCell className="text-right text-[var(--ep-green)] font-medium">{formatCurrency(item.grossProfit || 0)}</TableCell>
                    <TableCell className="text-right text-[var(--ep-green)]">{formatPercent(item.profitMargin)}</TableCell>
                  </TableRow>
                ))}
                {topProfitable.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Ma'lumot topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Top 10 Loss Products
// ---------------------------------------------------------------------------

interface TopLossProps {
  isLoading: boolean;
  topLoss: OrderCosting[];
  chartData: LossChartItem[];
}

export function TopLossSection({ isLoading, topLoss, chartData }: TopLossProps) {
  return (
    <Card data-testid="card-top-loss">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--ep-red)]">
          <TrendingDown className="h-5 w-5" />
          Top 10 Zararli Mahsulotlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tickFormatter={(val) => formatCurrency(val).replace(" UZS", "")} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Zarar"]}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="loss" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Mahsulot</TableHead>
                  <TableHead className="text-right">Daromad</TableHead>
                  <TableHead className="text-right">Xarajat</TableHead>
                  <TableHead className="text-right">Zarar</TableHead>
                  <TableHead className="text-right">Marja %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(topLoss) ? topLoss : []).slice(0, 10).map((item, index) => (
                  <TableRow key={item.id} data-testid={`row-loss-${index}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium text-[var(--ep-red)]">{index + 1}</TableCell>
                    <TableCell className="text-[var(--ep-red)]">{item.salesOrderId || `Mahsulot ${index + 1}`}</TableCell>
                    <TableCell className="text-right text-[var(--ep-red)]">{formatCurrency(item.sellingPrice)}</TableCell>
                    <TableCell className="text-right text-[var(--ep-red)]">{formatCurrency(item.totalCost)}</TableCell>
                    <TableCell className="text-right text-[var(--ep-red)] font-medium">{formatCurrency(Math.abs(item.grossProfit || 0))}</TableCell>
                    <TableCell className="text-right text-[var(--ep-red)]">{formatPercent(item.profitMargin)}</TableCell>
                  </TableRow>
                ))}
                {topLoss.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Ma'lumot topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
