/**
 * @module camera-reports-tabs-extra
 * @description Employees and Trend tab content for the camera-reports page,
 *   plus the summary cards. Split out so the sibling tabs file stays under
 *   300 lines.
 */

import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Users, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import type {
  ReportLabels,
  ReportLanguage,
  SafetyStat,
  QualityStat,
  TopEmployee,
} from "./camera-reports-types";

interface TrendDatum {
  day: string;
  safety: number;
  quality: number;
}

export function EmployeesTab({
  labels,
  language,
  topEmployees,
}: {
  labels: ReportLabels;
  language: ReportLanguage;
  topEmployees: TopEmployee[] | undefined;
}) {
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <Users className="h-5 w-5 text-[var(--ep-green)]" />
          {labels.topEmployees}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {language === "uz" ? "Bugungi eng samarali xodimlar" : "Самые продуктивные сотрудники сегодня"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="ep-table-scroll">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">#</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
                  {language === "uz" ? "Xodim ID" : "ID сотрудника"}
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
                  {language === "uz" ? "Smena" : "Смена"}
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
                  {language === "uz" ? "Faol vaqt" : "Активное время"}
                </TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">
                  {language === "uz" ? "Umumiy ball" : "Общий балл"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeArray<TopEmployee>(topEmployees).length > 0 ? (
                safeArray<TopEmployee>(topEmployees).map((emp, index) => (
                  <TableRow
                    key={emp.id}
                    className="hover:bg-muted/40 transition-colors border-none"
                    data-testid={`row-employee-${emp.id}`}
                  >
                    <TableCell className="py-4 px-6">
                      <Badge
                        className={`${
                          index < 3 ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground"
                        } border-none rounded-full w-6 h-6 p-0 flex items-center justify-center font-bold`}
                      >
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 font-bold text-foreground">{emp.userId}</TableCell>
                    <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">{emp.shift}</TableCell>
                    <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">{emp.activeTime} min</TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Progress value={emp.overallScore} className="w-20 h-1.5 bg-muted/60" />
                        <span className="text-sm font-bold text-foreground">{emp.overallScore}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-[13px] text-muted-foreground">
                    {labels.noData}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendTab({
  labels,
  language,
  trendData,
}: {
  labels: ReportLabels;
  language: ReportLanguage;
  trendData: TrendDatum[];
}) {
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5 text-[var(--ep-purple)]" />
          {labels.trend}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {language === "uz" ? "Haftalik trend tahlili" : "Анализ тенденций за неделю"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4fa" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
              <Tooltip cursor={{ fill: "#ddeaf3" }} />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="safety"
                stroke="#f97316"
                name={language === "uz" ? "Xavfsizlik" : "Безопасность"}
                strokeWidth={3}
                dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="quality"
                stroke="#3b82f6"
                name={language === "uz" ? "Sifat" : "Качество"}
                strokeWidth={3}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportSummaryCards({
  language,
  safetyStats,
  qualityStats,
  topEmployees,
}: {
  language: ReportLanguage;
  safetyStats: SafetyStat[] | undefined;
  qualityStats: QualityStat[] | undefined;
  topEmployees: TopEmployee[] | undefined;
}) {
  const summaryData = [
    {
      title: language === "uz" ? "Xavfsizlik buzilishlari" : "Нарушения безопасности",
      value: safetyStats?.reduce((sum, s) => sum + (s.count || 0), 0) || 0,
      icon: Shield,
      color: "text-[var(--ep-primary)]",
      bg: "bg-orange-100",
    },
    {
      title: language === "uz" ? "Sifat nuqsonlari" : "Дефекты качества",
      value: qualityStats?.reduce((sum, s) => sum + (s.count || 0), 0) || 0,
      icon: CheckCircle,
      color: "text-[var(--ep-blue)]",
      bg: "bg-blue-100",
    },
    {
      title: language === "uz" ? "Top xodimlar" : "Лучшие сотрудники",
      value: safeArray<TopEmployee>(topEmployees).length,
      icon: Users,
      color: "text-[var(--ep-green)]",
      bg: "bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {summaryData.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={`k-${index}`} className="bg-card border-none rounded-lg p-5" data-testid={`card-summary-${index}`}>
            <div className="flex flex-row items-center justify-between gap-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.title}</span>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-4xl font-bold tracking-tight text-foreground">{item.value}</div>
          </Card>
        );
      })}
    </div>
  );
}
