/**
 * @module SPCChart
 * @description React UI component.
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import {
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface SPCDataPoint {
  label?: string;
  value: number;
  timestamp?: string;
}

interface SPCChartProps {
  data: SPCDataPoint[];
  ucl: number;
  lcl: number;
  mean: number;
  title?: string;
  unit?: string;
}

export function SPCChart({
  data,
  ucl,
  lcl,
  mean,
  title,
  unit = "",
}: SPCChartProps) {
  const { t } = useTranslation("common");
  const violations = (Array.isArray(data) ? data : []).filter((d) => d.value > ucl || d.value < lcl);

  return (
    <div className="space-y-3">
      {title && (
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
      )}

      {violations.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">
            {violations.length} ta o'lchov nazorat chegarasidan chiqdi
          </AlertDescription>
        </Alert>
      )}

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 11 }}
              formatter={(v: number) => [`${v}${unit}`, "O'lchov"]}
            />
            <ReferenceLine
              y={ucl}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: "UCL", fontSize: 10, fill: "#ef4444" }}
            />
            <ReferenceLine
              y={mean}
              stroke="#22c55e"
              label={{ value: "CL", fontSize: 10, fill: "#22c55e" }}
            />
            <ReferenceLine
              y={lcl}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: "LCL", fontSize: 10, fill: "#ef4444" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const isViolation =
                  payload.value > ucl || payload.value < lcl;
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={isViolation ? 5 : 3}
                    fill={isViolation ? "#ef4444" : "#3b82f6"}
                    stroke="white"
                    strokeWidth={1}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-red-400 border-dashed border" />
          UCL/LCL chegara
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-green-500" />
          {t("ortaChiziq")}
        </span>
        {violations.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
            {t("buzilish")}
          </span>
        )}
      </div>
    </div>
  );
}
