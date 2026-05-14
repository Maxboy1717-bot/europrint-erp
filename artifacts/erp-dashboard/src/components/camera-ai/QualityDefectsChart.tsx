/**
 * @module QualityDefectsChart
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DEFECT_COLORS, type QualityAnalysisData, type DefectDistribution } from "./camera-ai.types";

interface QualityDefectsChartProps {
  data: QualityAnalysisData | undefined;
  loading: boolean;
  title: string;
  /** Localized label map (l[defectType] → display name) */
  labelMap: Record<string, string>;
  t: (key: string) => string;
}

export function QualityDefectsChart({ data, loading, title, labelMap, t }: QualityDefectsChartProps) {
  const distribution = Array.isArray(data?.distribution) ? data.distribution : [];

  return (
    <Card className="border" data-testid="card-quality-defects">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">{t('loading')}</div>
        ) : distribution.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={distribution.map((d: DefectDistribution) => ({
                  name: labelMap[d.defectType] ?? d.defectType,
                  value: Number(d.count),
                }))}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {distribution.map((_: DefectDistribution, i: number) => (
                  <Cell key={`k-${i}`} fill={DEFECT_COLORS[i % DEFECT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">{t('noData')}</div>
        )}
      </CardContent>
    </Card>
  );
}
