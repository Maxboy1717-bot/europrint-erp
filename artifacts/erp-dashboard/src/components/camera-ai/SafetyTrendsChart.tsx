/**
 * @module SafetyTrendsChart
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SafetyTrendsData } from "./camera-ai.types";

interface SafetyTrendsChartProps {
  data: SafetyTrendsData | undefined;
  loading: boolean;
  title: string;
  t: (key: string) => string;
}

export function SafetyTrendsChart({ data, loading, title, t }: SafetyTrendsChartProps) {
  return (
    <Card className="border lg:col-span-2" data-testid="card-safety-trends">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Shield className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">{t('loading')}</div>
        ) : data?.daily?.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} labelFormatter={(v: string) => v} />
              <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name={t('critical')} />
              <Area type="monotone" dataKey="high"     stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.5} name={t('high')} />
              <Area type="monotone" dataKey="medium"   stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.4} name={t('medium')} />
              <Area type="monotone" dataKey="low"      stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name={t('low')} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">{t('noData')}</div>
        )}
      </CardContent>
    </Card>
  );
}
