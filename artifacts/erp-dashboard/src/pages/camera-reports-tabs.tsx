/**
 * @module camera-reports-tabs
 * @description Safety and Quality tab content for camera-reports.
 *   Employees/Trend/Summary moved to `camera-reports-tabs-extra.tsx`.
 *   Split out so each tab file stays under 300 lines.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, CheckCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

import type { ReportLabels, ReportLanguage } from "./camera-reports-types";
import { CHART_COLORS } from "./camera-reports-types";

interface ChartDatum {
  name: string;
  count: number;
}

export function SafetyTab({
  labels,
  language,
  safetyChartData,
}: {
  labels: ReportLabels;
  language: ReportLanguage;
  safetyChartData: ChartDatum[];
}) {
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <Shield className="h-5 w-5 text-[var(--ep-primary)]" />
          {labels.violations}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {language === "uz" ? "Xavfsizlik buzilishlari turlari bo'yicha" : "По типам нарушений безопасности"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safetyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4fa" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: "#ddeaf3" }} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={safetyChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={5}>
                  {(Array.isArray(safetyChartData) ? safetyChartData : []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QualityTab({
  labels,
  language,
  qualityChartData,
}: {
  labels: ReportLabels;
  language: ReportLanguage;
  qualityChartData: ChartDatum[];
}) {
  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <CheckCircle className="h-5 w-5 text-[var(--ep-blue)]" />
          {labels.defects}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {language === "uz" ? "Sifat nuqsonlari turlari bo'yicha" : "По типам дефектов качества"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4fa" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: "#ddeaf3" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={qualityChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={5}>
                  {(Array.isArray(qualityChartData) ? qualityChartData : []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
