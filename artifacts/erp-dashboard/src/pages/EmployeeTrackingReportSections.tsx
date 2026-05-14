/**
 * @module EmployeeTrackingReportSections
 * @description Chart and stat card sections for EmployeeTrackingReport.
 * Attendance table lives in EmployeeTrackingReportTable.tsx.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, BarChart3 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Translations } from "./EmployeeTrackingReportTypes";
import { ZONE_COLORS } from "./EmployeeTrackingReportTypes";

// ── Shared helpers ────────────────────────────────────────────────────────────

export function formatTime(isoString: string | null, language: string) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleTimeString(language === "uz" ? "uz-UZ" : "ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(minutes: number, t: Translations) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours} ${t.hours} ${mins} ${t.minutes}`;
  return `${mins} ${t.minutes}`;
}

export function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
}

// ── StatCards ─────────────────────────────────────────────────────────────────

interface StatCardsProps {
  totalPresentEmployees: number;
  avgMinutes: number;
  totalDetectionsSum: number;
  productivity: number;
  t: Translations;
}

export function StatCards({
  totalPresentEmployees,
  avgMinutes,
  totalDetectionsSum,
  productivity,
  t,
}: StatCardsProps) {
  const items = [
    { label: t.presentEmployees, value: String(totalPresentEmployees), testId: "text-present-count" },
    { label: t.avgTimePerDay, value: formatDuration(avgMinutes, t), testId: "text-avg-time" },
    { label: t.totalDetections, value: String(totalDetectionsSum), testId: "text-total-detections" },
    { label: t.productivity, value: `${productivity}%`, testId: "text-productivity" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-card rounded-lg p-5 border border-border"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {item.label}
          </p>
          <p
            className="text-4xl font-bold tracking-tight text-foreground"
            data-testid={item.testId}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── ChartSection ──────────────────────────────────────────────────────────────

interface HourlyDataPoint {
  hour: string;
  employees: number;
}

interface ZoneDataPoint {
  name: string;
  value: number;
}

interface ChartSectionProps {
  hourlyData: HourlyDataPoint[];
  zoneDistributionData: ZoneDataPoint[];
  t: Translations;
}

export function ChartSection({ hourlyData, zoneDistributionData, t }: ChartSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t.timeTracking}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="employees"
                stroke="#3b82f6"
                name={t.presentEmployees}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t.zoneDistribution}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zoneDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={zoneDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {zoneDistributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ZONE_COLORS[index % ZONE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              {t.noData}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
