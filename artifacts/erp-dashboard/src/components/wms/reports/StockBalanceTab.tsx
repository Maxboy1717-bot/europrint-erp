/**
 * @module StockBalanceTab
 * @description React UI component.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, TrendingUp, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/format";
import { safeArray } from "@/lib/queryClient";
import { StockBalanceData, StockBalanceItem, TranslationType, STATUS_COLORS, PIE_COLORS } from "./types";
import { apiRequest } from '@/lib/queryClient';
interface StockBalanceTabProps {
  t: TranslationType;
  category: string;
  setCategory: (val: string) => void;
  lowStockOnly: boolean;
  setLowStockOnly: (val: boolean) => void;
}

export function StockBalanceTab({
  t,
  category,
  setCategory,
  lowStockOnly,
  setLowStockOnly,
}: StockBalanceTabProps) {
  const { data: stockBalanceData, isLoading: isLoadingStock, refetch: refetchStock } = useQuery<StockBalanceData>({
    queryKey: ["/api/warehouse/reports/stock-balance", category, lowStockOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (lowStockOnly) params.set('lowStockOnly', 'true');
      const res = await apiRequest('GET', `/api/warehouse/reports/stock-balance?${params}`) as unknown as Response;
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const top10ByValue = useMemo(() => {
    return safeArray<StockBalanceItem>(stockBalanceData?.data)
      .slice()
      .sort((a: StockBalanceItem, b: StockBalanceItem) => b.value - a.value)
      .slice(0, 10)
      .map((item: StockBalanceItem) => ({
        name: item.name?.slice(0, 15) || 'N/A',
        value: item.value,
      }));
  }, [stockBalanceData]);

  const stockStatusData = useMemo(() => {
    if (!stockBalanceData?.summary) return [];
    return [
      { name: t.stockBalance.normal, value: stockBalanceData.summary.totalMaterials - stockBalanceData.summary.lowStockCount - stockBalanceData.summary.criticalCount },
      { name: t.stockBalance.low, value: stockBalanceData.summary.lowStockCount },
      { name: t.stockBalance.critical, value: stockBalanceData.summary.criticalCount },
    ];
  }, [stockBalanceData, t]);

  if (isLoadingStock) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([1, 2, 3, 4]).map(i => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>{t.common.category}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40 h-9" data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.allCategories}</SelectItem>
              <SelectItem value="xom_ashyo">{"Xom ashyo"}</SelectItem>
              <SelectItem value="tayyor_mahsulot">{"Tayyor mahsulot"}</SelectItem>
              <SelectItem value="ehtiyot_qism">{"Ehtiyot qism"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={lowStockOnly}
            onCheckedChange={setLowStockOnly}
            data-testid="switch-low-stock"
          />
          <Label>{t.stockBalance.lowStockOnly}</Label>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetchStock()} data-testid="button-refresh-stock">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{stockBalanceData?.summary?.totalMaterials || 0}</p>
                <p className="text-sm text-muted-foreground">{t.stockBalance.totalMaterials}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stockBalanceData?.summary?.totalValue || 0)}</p>
                <p className="text-sm text-muted-foreground">{t.stockBalance.totalValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{stockBalanceData?.summary?.lowStockCount || 0}</p>
                <p className="text-sm text-muted-foreground">{t.stockBalance.lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold">{stockBalanceData?.summary?.criticalCount || 0}</p>
                <p className="text-sm text-muted-foreground">{t.stockBalance.criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.stockBalance.top10ByValue}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10ByValue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="name" fontSize={12} stroke="#888" />
                  <YAxis fontSize={12} stroke="#888" tickFormatter={(v) => `${v / 1e6}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                    formatter={(value: number) => [formatCurrency(value), t.stockBalance.value]}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.stockBalance.status}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(Array.isArray(stockStatusData) ? stockStatusData : []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.stockBalance.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.stockBalance.material}</TableHead>
                  <TableHead>{t.stockBalance.code}</TableHead>
                  <TableHead className="text-right">{t.stockBalance.currentStock}</TableHead>
                  <TableHead className="text-right">{t.stockBalance.minStock}</TableHead>
                  <TableHead className="text-right">{t.stockBalance.value}</TableHead>
                  <TableHead>{t.stockBalance.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockBalanceData?.data?.map((item: StockBalanceItem) => (
                  <TableRow key={item.materialId} data-testid={`row-stock-${item.materialId}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.currentStock)} {item.unitOfMeasure}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.minStock)} {item.unitOfMeasure}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.value)} {t.common.sum}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]}>
                        {t.stockBalance[item.status as keyof typeof t.stockBalance] || item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!stockBalanceData?.data || stockBalanceData.data.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t.common.noData}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
