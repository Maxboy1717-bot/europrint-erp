import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Percent,
  DollarSign,
  CalendarIcon,
  BarChart3,
} from "lucide-react";
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
import { ErrorState } from "@/components/ui/error-state";

interface OrderCosting {
  id: string;
  salesOrderId: string | null;
  productionOrderId: string | null;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  energyCost: number;
  wasteCost: number;
  totalCost: number;
  sellingPrice: number;
  grossProfit: number | null;
  profitMargin: number | null;
  status: string;
  calculatedBy: string | null;
  calculatedAt: string | null;
  createdAt: string;
}


function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1) + "%";
}

export default function ProductProfitability() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const { data: topProfitable = [], isLoading: profitableLoading, isError, refetch} = useQuery<OrderCosting[]>({
    queryKey: ["/api/order-costing/top-profitable"],
  });

  const { data: topLoss = [], isLoading: lossLoading } = useQuery<OrderCosting[]>({
    queryKey: ["/api/order-costing/top-loss"],
  });

  const { data: allCostings = [] } = useQuery<OrderCosting[]>({
    queryKey: ["/api/order-costing"],
  });

  const isLoading = profitableLoading || lossLoading;

  const totalProducts = allCostings.length;
  const avgMargin = allCostings.length > 0
    ? (Array.isArray(allCostings) ? allCostings : []).reduce((sum, c) => sum + (c.profitMargin || 0), 0) / allCostings.length
    : 0;
  const totalProfitLoss = (Array.isArray(allCostings) ? allCostings : []).reduce((sum, c) => sum + (c.grossProfit || 0), 0);

  const profitableChartData = (Array.isArray(topProfitable) ? topProfitable : []).slice(0, 10).map((item, index) => ({
    name: item.salesOrderId || `Mahsulot ${index + 1}`,
    profit: item.grossProfit || 0,
    margin: item.profitMargin || 0,
  }));

  const lossChartData = (Array.isArray(topLoss) ? topLoss : []).slice(0, 10).map((item, index) => ({
    name: item.salesOrderId || `Mahsulot ${index + 1}`,
    loss: Math.abs(item.grossProfit || 0),
    margin: item.profitMargin || 0,
  }));

  const getDistributionData = () => {
    const brackets = {
      ">30%": 0,
      "15-30%": 0,
      "0-15%": 0,
      "-15-0%": 0,
      "<-15%": 0,
    };

    (Array.isArray(allCostings) ? allCostings : []).forEach((c) => {
      const margin = c.profitMargin || 0;
      if (margin > 30) brackets[">30%"]++;
      else if (margin >= 15) brackets["15-30%"]++;
      else if (margin >= 0) brackets["0-15%"]++;
      else if (margin >= -15) brackets["-15-0%"]++;
      else brackets["<-15%"]++;
    });

    return [
      { name: ">30%", value: brackets[">30%"], color: "#22c55e" },
      { name: "15-30%", value: brackets["15-30%"], color: "#84cc16" },
      { name: "0-15%", value: brackets["0-15%"], color: "#eab308" },
      { name: "-15-0%", value: brackets["-15-0%"], color: "#f97316" },
      { name: "<-15%", value: brackets["<-15%"], color: "#ef4444" },
    ];
  };

  const distributionData = getDistributionData();

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="product-profitability-page">
      <div className="border-b bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Mahsulot Rentabelligi</h1>
                <p className="text-green-100 text-sm">Product Profitability Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-surface-container-lowest/10 border-white/30 text-white hover:bg-surface-container-lowest/20"
                    data-testid="button-date-filter"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd.MM.yyyy")} - {format(dateRange.to, "dd.MM.yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd.MM.yyyy")
                      )
                    ) : (
                      "Sana tanlang"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid="card-total-products">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tahlil Qilingan Mahsulotlar</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
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
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className={`text-2xl font-bold ${avgMargin >= 0 ? "text-green-500" : "text-red-500"}`}>
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
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(totalProfitLoss)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Umumiy natija</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-testid="card-top-profitable">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <TrendingUp className="h-5 w-5" />
                Top 10 Foydali Mahsulotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  {([...Array(5)]).map((_, i) => (
                    <Skeleton key={`k-${i}`} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={profitableChartData}
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

                  <Table>
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
                        <TableRow key={item.id} data-testid={`row-profitable-${index}`}>
                          <TableCell className="font-medium text-green-500">{index + 1}</TableCell>
                          <TableCell className="text-green-500">{item.salesOrderId || `Mahsulot ${index + 1}`}</TableCell>
                          <TableCell className="text-right text-green-500">{formatCurrency(item.sellingPrice)}</TableCell>
                          <TableCell className="text-right text-green-500">{formatCurrency(item.totalCost)}</TableCell>
                          <TableCell className="text-right text-green-500 font-medium">{formatCurrency(item.grossProfit || 0)}</TableCell>
                          <TableCell className="text-right text-green-500">{formatPercent(item.profitMargin)}</TableCell>
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
                  </Table>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-top-loss">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <TrendingDown className="h-5 w-5" />
                Top 10 Zararli Mahsulotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  {([...Array(5)]).map((_, i) => (
                    <Skeleton key={`k-${i}`} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={lossChartData}
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

                  <Table>
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
                        <TableRow key={item.id} data-testid={`row-loss-${index}`}>
                          <TableCell className="font-medium text-red-500">{index + 1}</TableCell>
                          <TableCell className="text-red-500">{item.salesOrderId || `Mahsulot ${index + 1}`}</TableCell>
                          <TableCell className="text-right text-red-500">{formatCurrency(item.sellingPrice)}</TableCell>
                          <TableCell className="text-right text-red-500">{formatCurrency(item.totalCost)}</TableCell>
                          <TableCell className="text-right text-red-500 font-medium">{formatCurrency(Math.abs(item.grossProfit || 0))}</TableCell>
                          <TableCell className="text-right text-red-500">{formatPercent(item.profitMargin)}</TableCell>
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
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </div>

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
            <div className="grid grid-cols-5 gap-2 mt-4">
              <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="text-xs text-muted-foreground">&gt;30%</div>
                <div className="text-lg font-bold text-green-500">{distributionData[0].value}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-lime-500/10 border border-lime-500/30">
                <div className="text-xs text-muted-foreground">15-30%</div>
                <div className="text-lg font-bold text-lime-500">{distributionData[1].value}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-xs text-muted-foreground">0-15%</div>
                <div className="text-lg font-bold text-yellow-500">{distributionData[2].value}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="text-xs text-muted-foreground">-15-0%</div>
                <div className="text-lg font-bold text-orange-500">{distributionData[3].value}</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="text-xs text-muted-foreground">&lt;-15%</div>
                <div className="text-lg font-bold text-red-500">{distributionData[4].value}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
