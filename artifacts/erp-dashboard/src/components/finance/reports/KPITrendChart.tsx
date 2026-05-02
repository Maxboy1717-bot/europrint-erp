import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts";
import { formatPercent, formatRatio } from "./helpers";
import { KPIDashboard } from "./types";

interface KPITrendChartProps {
  data: KPIDashboard | undefined;
  isLoading: boolean;
}

export function KPITrendChart({ data, isLoading }: KPITrendChartProps) {
  return (
    <Card data-testid="card-kpi-trend">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          KPI Trendlari
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="glass-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.kpiTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 28%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "grossMargin" ? formatPercent(value) : formatRatio(value),
                    name === "currentRatio" ? "Current Ratio" : name === "grossMargin" ? "Gross Margin" : "ROA",
                  ]}
                  contentStyle={{ backgroundColor: "hsl(220 15% 18%)", border: "1px solid hsl(220 10% 28%)", borderRadius: "8px" }}
                />
                <Legend formatter={(value) => (value === "currentRatio" ? "Current Ratio" : value === "grossMargin" ? "Gross Margin (%)" : "ROA (%)")} />
                <Line yAxisId="left" type="monotone" dataKey="currentRatio" stroke="hsl(210 80% 55%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="grossMargin" stroke="hsl(145 65% 50%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="roa" stroke="hsl(280 65% 60%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
