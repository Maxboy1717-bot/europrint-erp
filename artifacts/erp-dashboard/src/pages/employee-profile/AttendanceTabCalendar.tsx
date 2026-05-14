/**
 * @module AttendanceTabCalendar
 * @description Calendar and view-toggle card components for AttendanceTab.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from "recharts";
import { Calendar, List, ChevronLeft, ChevronRight } from "lucide-react";
import type { AttendanceRecord, TranslationFn } from "./profile-types";
import {
  DAY_COLORS, DAY_LABELS, MONTH_NAMES,
  buildCalendarData,
  type DayStatus,
} from "./AttendanceTabTypes";

import { useTranslation } from "@/lib/i18n";
// ─── Attendance Calendar ────────────────────────────────────────────────────

export function AttendanceCalendar({ attendanceData }: { attendanceData: AttendanceRecord[] | undefined }) {
  const { t } = useTranslation("common");
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const calendarDays = buildCalendarData(viewYear, viewMonth, attendanceData);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button size="icon" variant="ghost" onClick={prevMonth} data-testid="btn-calendar-prev">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <Button size="icon" variant="ghost" onClick={nextMonth} data-testid="btn-calendar-next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-1 text-center">
        {(Array.isArray(DAY_LABELS) ? DAY_LABELS : []).map(d => (
          <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {(Array.isArray(calendarDays) ? calendarDays : []).map((day, idx) => {
          const cfg = DAY_COLORS[day.status];
          if (day.date === 0) return <div key={`empty-${idx}`} />;
          return (
            <div
              key={`day-${idx}`}
              className={`relative rounded-md border p-1 min-h-[42px] flex flex-col items-center justify-center cursor-default ${cfg.bg}`}
              title={day.status !== "none" && day.status !== "weekend"
                ? `${cfg.label}${day.checkIn ? ` — Kelish: ${day.checkIn}` : ""}${day.minutesLate ? `, Kechikish: ${day.minutesLate} min` : ""}`
                : ""}
              data-testid={`cell-calendar-${viewYear}-${viewMonth + 1}-${day.date}`}
            >
              <span className={`text-xs font-semibold ${cfg.text}`}>{day.date}</span>
              {day.status !== "none" && day.status !== "weekend" && (
                <span className={`text-[9px] leading-tight ${cfg.text}`}>{cfg.label}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {(["present", "late", "absent", "sick", "leave", "weekend"] as DayStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm border ${DAY_COLORS[s].bg}`} />
            <span className="text-xs text-muted-foreground">{DAY_COLORS[s].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Attendance View Card (Calendar + Pie toggle) ───────────────────────────

interface AttendanceViewCardProps {
  viewMode: "calendar" | "table";
  onSetViewMode: (mode: "calendar" | "table") => void;
  attendanceData: AttendanceRecord[] | undefined;
  attendancePieData: Array<{ name: string; value: number; color: string }>;
  tCommon: TranslationFn;
}

export function AttendanceViewCard({
  viewMode, onSetViewMode, attendanceData, attendancePieData, tCommon,
}: AttendanceViewCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          {t("davomatKorinishi")}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant={viewMode === "calendar" ? "default" : "ghost"}
            onClick={() => onSetViewMode("calendar")}
            data-testid="btn-view-calendar"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === "table" ? "default" : "ghost"}
            onClick={() => onSetViewMode("table")}
            data-testid="btn-view-pie"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "calendar" ? (
          <AttendanceCalendar attendanceData={attendanceData} />
        ) : (
          <>
            {attendancePieData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(Array.isArray(attendancePieData) ? attendancePieData : []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">{tCommon('noData')}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
