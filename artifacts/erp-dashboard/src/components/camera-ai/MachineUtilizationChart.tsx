/**
 * @module MachineUtilizationChart
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MachineUtilizationData, MachineInfo } from "./camera-ai.types";

interface MachineLabels {
  running: string;
  idle: string;
  stopped: string;
  overall: string;
}

interface MachineUtilizationChartProps {
  data: MachineUtilizationData | undefined;
  loading: boolean;
  title: string;
  labels: MachineLabels;
  t: (key: string) => string;
}

export function MachineUtilizationChart({ data, loading, title, labels, t }: MachineUtilizationChartProps) {
  const machines = Array.isArray(data?.machines) ? data.machines : [];

  return (
    <Card className="border" data-testid="card-machine-utilization">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Cpu className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-60 flex items-center justify-center text-muted-foreground">{t('loading')}</div>
        ) : machines.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={machines.slice(0, 10).map((m: MachineInfo) => ({
                name: (m.name ?? m.workCenterId ?? "").slice(0, 12),
                [labels.running]: m.runningPercent,
                [labels.idle]:    m.idlePercent,
                [labels.stopped]: m.stoppedPercent,
              }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Bar dataKey={labels.running} stackId="a" fill="#22c55e" />
              <Bar dataKey={labels.idle}    stackId="a" fill="#eab308" />
              <Bar dataKey={labels.stopped} stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-muted-foreground">
            {data?.overall ? (
              <div className="text-center space-y-2">
                <p className="text-sm">{labels.overall}</p>
                <div className="flex gap-4 justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-[var(--ep-green)]">{data.overall.runningPercent}%</div>
                    <div className="text-xs text-muted-foreground">{labels.running}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[var(--ep-yellow)]">{data.overall.idlePercent}%</div>
                    <div className="text-xs text-muted-foreground">{labels.idle}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[var(--ep-red)]">{data.overall.stoppedPercent}%</div>
                    <div className="text-xs text-muted-foreground">{labels.stopped}</div>
                  </div>
                </div>
              </div>
            ) : (
              t('noData')
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
