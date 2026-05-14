/** @module OrderCostingSections @description Section/panel components for OrderCosting list page — summary stat cards, main costing table, and top profitable/loss ranking tables. */

import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Package, CheckCircle, Calculator } from "lucide-react";
import { OrderCosting, formatPercent } from "./OrderCostingTypes";

import { useTranslation } from '@/lib/i18n';
interface SummaryCardsProps {
  costings: OrderCosting[];
  isLoading: boolean;
}

export function SummaryCards({costings, isLoading }: SummaryCardsProps) {
  const { t } = useTranslation('common');
  const totalCostings = costings.length;
  const avgMargin = costings.length > 0
    ? (Array.isArray(costings) ? costings : []).reduce((sum, c) => sum + (c.profitMargin || 0), 0) / costings.length
    : 0;
  const mostProfitable = (Array.isArray(costings) ? costings : []).reduce(
    (max, c) => (c.grossProfit || 0) > (max?.grossProfit || 0) ? c : max,
    costings[0],
  );
  const mostLoss = (Array.isArray(costings) ? costings : []).reduce(
    (min, c) => (c.grossProfit || 0) < (min?.grossProfit || Infinity) ? c : min,
    costings[0],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card data-testid="card-total-costings">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jami Hisoblangan</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-8 w-20 rounded-lg" /> : <div className="text-2xl font-bold">{totalCostings}</div>}
          <p className="text-xs text-muted-foreground">Buyurtmalar tannarxi</p>
        </CardContent>
      </Card>
      <Card data-testid="card-avg-margin">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">O'rtacha Marja</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20 rounded-lg" />
          ) : (
            <div className={`text-2xl font-bold ${avgMargin >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
              {avgMargin.toFixed(1)}%
            </div>
          )}
          <p className="text-xs text-muted-foreground">Foyda marjasi</p>
        </CardContent>
      </Card>
      <Card data-testid="card-most-profitable">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eng Foydali</CardTitle>
          <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : mostProfitable ? (
            <>
              <div className="text-2xl font-bold text-[var(--ep-green)]">{formatCurrency(mostProfitable.grossProfit || 0)}</div>
              <p className="text-xs text-muted-foreground truncate">
                {mostProfitable.salesOrderId || "Buyurtma #" + mostProfitable.id.substring(0, 8)}
              </p>
            </>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>
      <Card data-testid="card-most-loss">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eng Zararli</CardTitle>
          <TrendingDown className="h-4 w-4 text-[var(--ep-red)]" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : mostLoss && (mostLoss.grossProfit || 0) < 0 ? (
            <>
              <div className="text-2xl font-bold text-[var(--ep-red)]">{formatCurrency(mostLoss.grossProfit || 0)}</div>
              <p className="text-xs text-muted-foreground truncate">
                {mostLoss.salesOrderId || "Buyurtma #" + mostLoss.id.substring(0, 8)}
              </p>
            </>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">—</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CostingsTableProps {
  costings: OrderCosting[];
  isLoading: boolean;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onRowClick: (id: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function CostingsTable({ costings, isLoading, statusFilter, onStatusFilterChange, onRowClick, getStatusBadge }: CostingsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Buyurtma Tannarxlari</CardTitle>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-status-filter">
            <SelectValue placeholder="Status bo'yicha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="draft">Qoralama</SelectItem>
            <SelectItem value="calculated">Hisoblangan</SelectItem>
            <SelectItem value="approved">Tasdiqlangan</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {([1, 2, 3]).map((i) => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : costings.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Hali buyurtma tannarxi mavjud emas</p>
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyurtma</TableHead>
                <TableHead className="text-right">{"Material"}</TableHead>
                <TableHead className="text-right">Mehnat</TableHead>
                <TableHead className="text-right">Ustama</TableHead>
                <TableHead className="text-right">Energiya</TableHead>
                <TableHead className="text-right">Isrof</TableHead>
                <TableHead className="text-right">Jami Xarajat</TableHead>
                <TableHead className="text-right">Sotish Narxi</TableHead>
                <TableHead className="text-right">Yalpi Foyda</TableHead>
                <TableHead className="text-right">Marja %</TableHead>
                <TableHead>{"Holat"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(costings) ? costings : []).map((costing) => (
                <TableRow
                  key={costing.id}
                  className="cursor-pointer hover-elevate hover:bg-muted/40 transition-colors"
                  onClick={() => onRowClick(costing.id)}
                  data-testid={`row-costing-${costing.id}`}
                >
                  <TableCell className="font-medium">
                    {costing.salesOrderId || "Buyurtma #" + costing.id.substring(0, 8)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(costing.materialCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(costing.laborCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(costing.overheadCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(costing.energyCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(costing.wasteCost)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(costing.totalCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(costing.sellingPrice)}</TableCell>
                  <TableCell className={`text-right font-medium ${(costing.grossProfit || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                    {formatCurrency(costing.grossProfit || 0)}
                  </TableCell>
                  <TableCell className={`text-right ${(costing.profitMargin || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                    {formatPercent(costing.profitMargin)}
                  </TableCell>
                  <TableCell>{getStatusBadge(costing.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

interface TopRankingsProps {
  topProfitable: OrderCosting[];
  topLoss: OrderCosting[];
  onRowClick: (id: string) => void;
}

export function TopRankings({ topProfitable, topLoss, onRowClick }: TopRankingsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--ep-green)]" />
            Top 10 Foydali Buyurtmalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProfitable.length === 0 ? (
            <div className="text-center py-4 text-[13px] text-muted-foreground"><p>Ma'lumot mavjud emas</p></div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Buyurtma</TableHead>
                  <TableHead className="text-right">Yalpi Foyda</TableHead>
                  <TableHead className="text-right">Marja %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(topProfitable) ? topProfitable : []).map((costing, index) => (
                  <TableRow
                    key={costing.id}
                    className="cursor-pointer hover-elevate hover:bg-muted/40 transition-colors"
                    onClick={() => onRowClick(costing.id)}
                    data-testid={`row-profitable-${costing.id}`}
                  >
                    <TableCell className="font-medium text-[var(--ep-green)]">{index + 1}</TableCell>
                    <TableCell>{costing.salesOrderId || "Buyurtma #" + costing.id.substring(0, 8)}</TableCell>
                    <TableCell className="text-right font-medium text-[var(--ep-green)]">{formatCurrency(costing.grossProfit || 0)}</TableCell>
                    <TableCell className="text-right text-[var(--ep-green)]">{formatPercent(costing.profitMargin)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-[var(--ep-red)]" />
            Top 10 Zararli Buyurtmalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topLoss.length === 0 ? (
            <div className="text-center py-4 text-[13px] text-muted-foreground"><p>Ma'lumot mavjud emas</p></div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Buyurtma</TableHead>
                  <TableHead className="text-right">Yalpi Zarar</TableHead>
                  <TableHead className="text-right">Marja %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(topLoss) ? topLoss : []).map((costing, index) => (
                  <TableRow
                    key={costing.id}
                    className="cursor-pointer hover-elevate hover:bg-muted/40 transition-colors"
                    onClick={() => onRowClick(costing.id)}
                    data-testid={`row-loss-${costing.id}`}
                  >
                    <TableCell className="font-medium text-[var(--ep-red)]">{index + 1}</TableCell>
                    <TableCell>{costing.salesOrderId || "Buyurtma #" + costing.id.substring(0, 8)}</TableCell>
                    <TableCell className="text-right font-medium text-[var(--ep-red)]">{formatCurrency(costing.grossProfit || 0)}</TableCell>
                    <TableCell className="text-right text-[var(--ep-red)]">{formatPercent(costing.profitMargin)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "draft":
      return <Badge variant="outline" className="bg-muted text-muted-foreground">Qoralama</Badge>;
    case "calculated":
      return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">Hisoblangan</Badge>;
    case "approved":
      return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">Tasdiqlangan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
