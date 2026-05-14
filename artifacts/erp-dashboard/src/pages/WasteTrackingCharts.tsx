/**
 * @module WasteTrackingCharts
 * @description Chart components for WasteTracking: KPICards, WasteByTypeChart,
 * WasteTrendChart, WasteByMachineChart. Each fetches its own data.
 */

import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, DollarSign, TrendingDown, Recycle } from "lucide-react";
import {
  useWasteTranslations,
  COLORS,
  WasteDashboard,
  WasteTrend,
  WasteByTypeItem,
  WasteByMachineItem,
  ChartDataItem,
} from "./WasteTrackingTypes";
import { EPErrorState } from "@/components/ep";

// ── KPICards ──────────────────────────────────────────────────────────────────

export function KPICards() {
  const tr = useWasteTranslations();
  const { data: dashboard, isLoading, isError, refetch } = useQuery<WasteDashboard>({
    queryKey: ["/api/waste/dashboard"],
  });

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {([1, 2, 3, 4]).map(i => (
          <Card key={`k-${i}`}><CardContent className="p-4"><Skeleton className="h-16 w-full rounded-lg" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: `${tr("totalWaste")} (${tr("today")})`,
      value: `${Number(dashboard?.today?.totalQuantity || 0).toFixed(1)} ${tr("kg")}`,
      sub: `${dashboard?.today?.recordCount || 0} ${tr("records")}`,
      icon: Trash2,
      color: "text-[var(--ep-red)]",
    },
    {
      label: `${tr("wasteCost")} (${tr("thisMonth")})`,
      value: `${Number(dashboard?.month?.totalCost || 0).toLocaleString()} UZS`,
      sub: `${Number(dashboard?.month?.totalQuantity || 0).toFixed(1)} ${tr("kg")}`,
      icon: DollarSign,
      color: "text-[var(--ep-primary)]",
    },
    {
      label: `${tr("totalWaste")} (${tr("thisWeek")})`,
      value: `${Number(dashboard?.week?.totalQuantity || 0).toFixed(1)} ${tr("kg")}`,
      sub: `${dashboard?.week?.recordCount || 0} ${tr("records")}`,
      icon: TrendingDown,
      color: "text-[var(--ep-yellow)]",
    },
    {
      label: tr("recyclable"),
      value: dashboard?.recyclable?.totalQuantity
        ? `${((Number(dashboard.recyclable.totalRecyclable) / Number(dashboard.recyclable.totalQuantity)) * 100).toFixed(1)}%`
        : "0%",
      sub: `${Number(dashboard?.recyclable?.totalRecycled || 0).toFixed(1)} ${tr("kg")} ${tr("recycledQuantity").toLowerCase()}`,
      icon: Recycle,
      color: "text-[var(--ep-green)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(Array.isArray(cards) ? cards : []).map((card, i) => (
        <Card key={`k-${i}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate" data-testid={`text-kpi-label-${i}`}>{card.label}</p>
                <p className="text-xl font-bold mt-1" data-testid={`text-kpi-value-${i}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color} shrink-0`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── WasteByTypeChart ──────────────────────────────────────────────────────────

export function WasteByTypeChart() {
  const tr = useWasteTranslations();
  const { data: dashboard } = useQuery<WasteDashboard>({ queryKey: ["/api/waste/dashboard"] });
  const byType = dashboard?.byType || [];

  if (byType.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("wasteByType")}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">{tr("noData")}</CardContent>
      </Card>
    );
  }

  const chartData = (Array.isArray(byType) ? byType : []).map((item: WasteByTypeItem) => ({
    name: tr(item.wasteType),
    value: Number(item.totalQuantity),
  }));

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("wasteByType")}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {(Array.isArray(chartData) ? chartData : []).map((_: ChartDataItem, i: number) => <Cell key={`k-${i}`} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── WasteTrendChart ───────────────────────────────────────────────────────────

export function WasteTrendChart() {
  const tr = useWasteTranslations();
  const { data: trends } = useQuery<WasteTrend[]>({ queryKey: ["/api/waste/trends"] });

  if (!trends || trends.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("trendChart")}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">{tr("noData")}</CardContent>
      </Card>
    );
  }

  const chartData = (Array.isArray(trends) ? trends : []).map((item: WasteTrend) => ({
    period: item.period,
    quantity: Number(item.totalQuantity),
    cost: Number(item.totalCost),
  }));

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("trendChart")}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="quantity" stroke="#ef4444" name={`${tr("quantity")} (${tr("kg")})`} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── WasteByMachineChart ───────────────────────────────────────────────────────

export function WasteByMachineChart() {
  const tr = useWasteTranslations();
  const { data: dashboard } = useQuery<WasteDashboard>({ queryKey: ["/api/waste/dashboard"] });
  const byMachine = dashboard?.byMachine || [];

  if (byMachine.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("wasteByMachine")}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">{tr("noData")}</CardContent>
      </Card>
    );
  }

  const chartData = (Array.isArray(byMachine) ? byMachine : []).map((item: WasteByMachineItem) => ({
    machine: item.machineId || "N/A",
    quantity: Number(item.totalQuantity),
    cost: Number(item.totalCost),
  }));

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("wasteByMachine")}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="machine" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#3b82f6" name={`${tr("quantity")} (${tr("kg")})`} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
