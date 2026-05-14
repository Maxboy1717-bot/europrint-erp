/**
 * @module TurnoverTab
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon, Activity, RefreshCw } from "lucide-react";
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface TurnoverTabProps {
  resignationReasons: { reason: string; count: number; color: string }[];
  monthlyTrend: { month: string; newHires: number; resignations: number }[];
  totalResignations: number;
}

export function TurnoverTab({ resignationReasons, monthlyTrend, totalResignations }: TurnoverTabProps) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <PieChartIcon className="h-4 w-4 text-[var(--ep-blue)]" />
            Ketish Sabablari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={resignationReasons} cx="50%" cy="50%" labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={90} dataKey="count" nameKey="reason"
                >
                  {(Array.isArray(resignationReasons) ? resignationReasons : []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {(Array.isArray(resignationReasons) ? resignationReasons : []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.reason}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{item.count}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {((item.count / (totalResignations || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-[var(--ep-purple)]" />
            Oylik Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} barSize={14}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="newHires" name="Yangi qabul" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="resignations" name="Ketganlar" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
