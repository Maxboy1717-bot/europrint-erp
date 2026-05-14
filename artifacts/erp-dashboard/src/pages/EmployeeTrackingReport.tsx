/**
 * @module EmployeeTrackingReport
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AttendanceRecord,
  ZoneHistory,
  Employee,
  Language,
} from "./EmployeeTrackingReportTypes";
import { translations } from "./EmployeeTrackingReportTypes";
import { StatCards, ChartSection, formatDuration } from "./EmployeeTrackingReportSections";
import { AttendanceTable } from "./EmployeeTrackingReportTable";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function EmployeeTrackingReport() {
  const { t } = useTranslation("common");
  const [language, setLanguage] = useState<Language>("uz");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const t = translations[language];

  const {
    data: attendance = [],
    isLoading: attendanceLoading,
    isError,
    refetch,
  } = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/daily-attendance?date=${selectedDate}`],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/users"],
  });

  const { data: zoneHistory = [] } = useQuery<ZoneHistory[]>({
    queryKey: [`/api/employee-zone-history/${expandedEmployee}`],
    enabled: !!expandedEmployee,
  });

  // ── Derived metrics ───────────────────────────────────────────────────────

  const safeAttendance = Array.isArray(attendance) ? attendance : [];

  const totalPresentEmployees = safeAttendance.filter(a => a.status === "present").length;
  const totalDetectionsSum = safeAttendance.reduce((sum, a) => sum + (a.detectionCount || 0), 0);
  const avgMinutes = safeAttendance.length > 0
    ? Math.round(safeAttendance.reduce((sum, a) => sum + (a.totalMinutes || 0), 0) / safeAttendance.length)
    : 0;
  const productivity = safeAttendance.length > 0
    ? Math.round((totalPresentEmployees / Math.max(employees.length, 1)) * 100)
    : 0;

  // ── Zone distribution chart data ──────────────────────────────────────────

  const zoneDistributionData = safeAttendance.reduce((acc, record) => {
    const workZone = record.workZoneMinutes || 0;
    const restZone = record.restZoneMinutes || 0;
    const workLabel = language === "uz" ? "Ish zonasi" : "Рабочая зона";
    const restLabel = language === "uz" ? "Dam olish" : "Отдых";

    if (workZone > 0) {
      const existing = acc.find(d => d.name === workLabel);
      if (existing) { existing.value += workZone; }
      else { acc.push({ name: workLabel, value: workZone }); }
    }
    if (restZone > 0) {
      const existing = acc.find(d => d.name === restLabel);
      if (existing) { existing.value += restZone; }
      else { acc.push({ name: restLabel, value: restZone }); }
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // ── Hourly presence chart data ────────────────────────────────────────────

  const hourlyData = Array.from({ length: 14 }, (_, i) => {
    const hour = 7 + i;
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;
    const count = safeAttendance.filter(a => {
      if (!a.firstSeenAt) return false;
      const firstDate = new Date(a.firstSeenAt);
      const lastDate = a.lastSeenAt ? new Date(a.lastSeenAt) : firstDate;
      const firstMinutes = firstDate.getHours() * 60 + firstDate.getMinutes();
      const lastMinutes = lastDate.getHours() * 60 + lastDate.getMinutes();
      return firstMinutes < hourEnd && lastMinutes >= hourStart;
    }).length;
    return { hour: `${hour}:00`, employees: count };
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleExpand = (employeeId: string) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId);
  };

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("xodimlarKuzatuvi")}</b></>}
        title={t("xodimlarKuzatuvi")}
        subtitle={t.subtitle}
      />
        </div>
        <div className="flex items-center gap-4 bg-muted/60 p-1 rounded-lg">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 bg-card border-none shadow-none h-9"
            data-testid="input-date-select"
          />
          <Button
            variant="outline"
            className="bg-card text-foreground rounded-md px-4 py-1.5 text-xs font-semibold hover:bg-muted border-none shadow-none"
            onClick={() => setLanguage(language === "uz" ? "ru" : "uz")}
            data-testid="button-lang-toggle"
          >
            {language === "uz" ? "RU" : "UZ"}
          </Button>
        </div>
      </div>

      <StatCards
        totalPresentEmployees={totalPresentEmployees}
        avgMinutes={avgMinutes}
        totalDetectionsSum={totalDetectionsSum}
        productivity={productivity}
        t={t}
      />

      <ChartSection
        hourlyData={hourlyData}
        zoneDistributionData={zoneDistributionData}
        t={t}
      />

      <AttendanceTable
        attendance={safeAttendance}
        attendanceLoading={attendanceLoading}
        expandedEmployee={expandedEmployee}
        zoneHistory={Array.isArray(zoneHistory) ? zoneHistory : []}
        language={language}
        t={t}
        onToggleExpand={handleToggleExpand}
      />
    </div>
  );
}
