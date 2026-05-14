/**
 * @module WeeklyTrendChart
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { formatShortCurrency } from "./types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface WeeklyTrendChartProps {
  chartData: { date: string; daromad: number; xarajat: number; pulOqimi: number }[];
  isLoading: boolean;
}

export function WeeklyTrendChart({ chartData, isLoading }: WeeklyTrendChartProps) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <Card className="lg:col-span-2" data-testid="card-weekly-trend">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          Haftalik Trend
        </CardTitle>
        <CardDescription>So'nggi 7 kunlik daromad va xarajat tendensiyasi</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-full w-full rounded-lg" /></div>
        ) : chartData.length > 0 ? (
          <div className="glass-chart h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDaromad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145, 65%, 50%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(145, 65%, 50%)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorXarajat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 70%, 55%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(0, 70%, 55%)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorPulOqimi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(270, 60%, 60%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(270, 60%, 60%)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis tickFormatter={(value) => formatShortCurrency(value)} className="text-xs" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "daromad" ? "Daromad" : name === "xarajat" ? "Xarajat" : "Pul oqimi",
                  ]}
                  contentStyle={{ backgroundColor: "hsl(220, 15%, 18%)", border: "1px solid hsl(220, 10%, 28%)", borderRadius: "8px" }}
                />
                <Area type="monotone" dataKey="daromad" stroke="hsl(145, 65%, 50%)" fillOpacity={1} fill="url(#colorDaromad)" name="daromad" />
                <Area type="monotone" dataKey="xarajat" stroke="hsl(0, 70%, 55%)" fillOpacity={1} fill="url(#colorXarajat)" name="xarajat" />
                <Area type="monotone" dataKey="pulOqimi" stroke="hsl(270, 60%, 60%)" fillOpacity={1} fill="url(#colorPulOqimi)" name="pulOqimi" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <LineChart className="h-12 w-12 mb-4 opacity-40" />
            <p>Haftalik ma'lumotlar mavjud emas</p>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
