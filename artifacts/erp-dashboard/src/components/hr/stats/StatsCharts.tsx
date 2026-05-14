/**
 * @module StatsCharts
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Attempt } from "./types";

interface StatsChartsProps {
  employeeAttempts: Attempt[];
  attendanceChartData: Array<{ name: string; value: number }>;
  COLORS: string[];
}

export function StatsCharts({ employeeAttempts, attendanceChartData, COLORS }: StatsChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Test Scores Trend */}
      {employeeAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <CardTitle>Test natijalari tendensiyasi</CardTitle>
            </div>
            <CardDescription>Vaqt bo'yicha test ballari o'zgarishi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(Array.isArray(employeeAttempts) ? employeeAttempts : []).map((att: Attempt, idx: number) => ({
                  name: `Test ${idx + 1}`,
                  ball: att.score,
                  minimal: 50
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ball" stroke="#2563eb" name="Ball" strokeWidth={2} />
                  <Line type="monotone" dataKey="minimal" stroke="#dc2626" strokeDasharray="5 5" name="O'tish balli" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>Davomat taqsimoti</CardTitle>
          </div>
          <CardDescription>Kelgan, kelmagan va kechikkan kunlar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(Array.isArray(attendanceChartData) ? attendanceChartData : []).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
