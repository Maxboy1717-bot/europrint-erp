/** @module EmployeeDailyKPIPanelSections @description Section-level components: KPI radar chart and evaluations data table for EmployeeDailyKPIPanel. */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Target, Bot } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getScoreColor } from "./EmployeeDailyKPIPanelTypes";
import type { KpiRecord } from "./EmployeeDailyKPIPanelTypes";

interface RadarDataPoint {
  dimension: string;
  "Kompaniya o'rtacha": number;
  "Bo'lim o'rtacha": number;
}

interface RadarChartSectionProps {
  radarData: RadarDataPoint[];
  isLoading: boolean;
  hasRecords: boolean;
}

export function RadarChartSection({ radarData, isLoading, hasRecords }: RadarChartSectionProps) {
  return (
    <Card data-testid="card-radar-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[var(--ep-green)]" />
          KPI O'lchovlari
        </CardTitle>
        <CardDescription>6 ta asosiy KPI bo'yicha tahlil</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : hasRecords ? (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" className="text-xs" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Kompaniya o'rtacha"
                  dataKey="Kompaniya o'rtacha"
                  stroke="hsl(160, 60%, 45%)"
                  fill="hsl(160, 60%, 45%)"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Bo'lim o'rtacha"
                  dataKey="Bo'lim o'rtacha"
                  stroke="hsl(220, 60%, 55%)"
                  fill="hsl(220, 60%, 55%)"
                  fillOpacity={0.2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <Target className="h-12 w-12 mb-4 opacity-40" />
            <p>Tanlangan sana uchun ma'lumot mavjud emas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EvaluationsTableSectionProps {
  records: KpiRecord[];
  isLoading: boolean;
  selectedDate: string;
}

export function EvaluationsTableSection({
  records,
  isLoading,
  selectedDate,
}: EvaluationsTableSectionProps) {
  return (
    <Card data-testid="card-evaluations-table">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--ep-green)]" />
          Baholashlar Jadvali
        </CardTitle>
        <CardDescription>{selectedDate} sanasi uchun barcha baholashlar</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead className="text-center">Davomad</TableHead>
                  <TableHead className="text-center">Vazifalar</TableHead>
                  <TableHead className="text-center">Sifat</TableHead>
                  <TableHead className="text-center">Samaradorlik</TableHead>
                  <TableHead className="text-center">Jamoa</TableHead>
                  <TableHead className="text-center">Intizom</TableHead>
                  <TableHead className="text-center">Umumiy</TableHead>
                  <TableHead className="text-center">Bonus%</TableHead>
                  <TableHead className="text-center">Jarima%</TableHead>
                  <TableHead className="text-center">Sof Ball</TableHead>
                  <TableHead className="text-center">AI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(records) ? records : []).map((record) => (
                  <TableRow key={record.id} data-testid={`row-kpi-${record.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell
                      className="font-medium"
                      data-testid={`text-employee-name-${record.id}`}
                    >
                      {record.fullName}
                    </TableCell>
                    <TableCell>{record.evaluationDate}</TableCell>
                    <TableCell
                      className={`text-center font-medium ${getScoreColor(record.attendanceScore ?? 0)}`}
                    >
                      {record.attendanceScore ?? 0}
                    </TableCell>
                    <TableCell
                      className={`text-center font-medium ${getScoreColor(record.taskCompletionScore ?? 0)}`}
                    >
                      {record.taskCompletionScore ?? 0}
                    </TableCell>
                    <TableCell
                      className={`text-center font-medium ${getScoreColor(record.qualityScore ?? 0)}`}
                    >
                      {record.qualityScore ?? 0}
                    </TableCell>
                    <TableCell
                      className={`text-center font-medium ${getScoreColor(record.productivityScore ?? 0)}`}
                    >
                      {record.productivityScore ?? 0}
                    </TableCell>
                    <TableCell
                      className={`text-center font-medium ${getScoreColor(record.teamworkScore ?? 0)}`}
                    >
                      {record.teamworkScore ?? 0}
                    </TableCell>
                    <TableCell
                      className={`text-center font-medium ${getScoreColor(record.disciplineScore ?? 0)}`}
                    >
                      {record.disciplineScore ?? 0}
                    </TableCell>
                    <TableCell
                      className={`text-center font-bold ${getScoreColor(record.overallScore ?? 0)}`}
                    >
                      {record.overallScore ?? 0}
                    </TableCell>
                    <TableCell className="text-center text-[var(--ep-green)] dark:text-green-400">
                      +{record.bonusPercent ?? 0}
                    </TableCell>
                    <TableCell className="text-center text-[var(--ep-red)] dark:text-red-400">
                      -{record.penaltyPercent ?? 0}
                    </TableCell>
                    <TableCell
                      className={`text-center font-bold ${getScoreColor(record.netScore ?? 0)}`}
                    >
                      {record.netScore ?? 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.aiGenerated ? (
                        <Badge variant="outline" className="gap-1">
                          <Bot className="h-3 w-3" />
                          AI
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-40" />
            <p>Tanlangan sana uchun baholashlar mavjud emas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
