/**
 * @module AttendanceMonitorPageChart
 * @description Monthly late-arrival bar chart for AttendanceMonitorPage.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { MonthlyLatePoint } from './AttendanceMonitorPageTypes';
import { useTranslation } from '@/lib/i18n';

interface MonthlyChartProps {
  data: MonthlyLatePoint[];
}

export function MonthlyLateChart({ data }: MonthlyChartProps) {
  const { t } = useTranslation("common");
  if (data.length === 0) return null;
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{t("oylikKechKelishStatistikasi")}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-variant, #e2e8f0)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value: number) => [`${value} kishi`, 'Kech keldi']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="late_count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Kech keldi" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
