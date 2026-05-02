import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { formatCurrency } from "@/lib/format";
import { formatShortCurrency } from "./helpers";
import { MonthlySummary } from "./types";

interface MonthlyTrendChartProps {
  data: MonthlySummary | undefined;
  isLoading: boolean;
}

export function MonthlyTrendChart({ data, isLoading }: MonthlyTrendChartProps) {
  return (
    <Card data-testid="card-monthly-trend">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Daromad va xarajatlar dinamikasi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="glass-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 28%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} tickFormatter={(v) => formatShortCurrency(v)} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "revenue" ? "Daromad" : name === "expenses" ? "Xarajatlar" : "Foyda",
                  ]}
                  contentStyle={{ backgroundColor: "hsl(220 15% 18%)", border: "1px solid hsl(220 10% 28%)", borderRadius: "8px" }}
                />
                <Legend formatter={(value) => (value === "revenue" ? "Daromad" : value === "expenses" ? "Xarajat" : "Foyda")} />
                <Bar dataKey="revenue" fill="hsl(145 65% 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(0 70% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
