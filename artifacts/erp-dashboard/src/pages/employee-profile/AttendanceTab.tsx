/**
 * @module AttendanceTab
 * @description State, hooks, and orchestration for the Attendance tab.
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CheckCircle, Clock, Percent, ArrowLeftRight, LogOut } from "lucide-react";
import type { AttendanceRecord, AttendanceStats, ShiftSwapRecord, ZoneTrackingLog, TranslationFn } from "./profile-types";
import { getEarlyDepartures } from "./AttendanceTabTypes";
import {
  AttendanceViewCard,
  DetailedStatsCard,
  EarlyDeparturesSection,
  ShiftSwapsSection,
  ZoneLogsSection,
  AttendanceHistorySection,
} from "./AttendanceTabSections";

interface AttendanceTabProps {
  t: TranslationFn;
  tCommon: TranslationFn;
  loadingAttendance: boolean;
  attendanceStats: AttendanceStats;
  attendancePieData: Array<{ name: string; value: number; color: string }>;
  attendanceData: AttendanceRecord[] | undefined;
  shiftSwaps: ShiftSwapRecord[];
  loadingShiftSwaps: boolean;
  zoneLogs: ZoneTrackingLog[];
  loadingZoneLogs: boolean;
}

export function AttendanceTab({
  t, tCommon, loadingAttendance, attendanceStats, attendancePieData, attendanceData,
  shiftSwaps, loadingShiftSwaps, zoneLogs, loadingZoneLogs,
}: AttendanceTabProps) {
  const earlyDepartures = getEarlyDepartures(attendanceData);
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");

  if (loadingAttendance) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI kartalar — row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('totalDays')}</p>
                <p className="text-2xl font-bold text-[var(--ep-blue)]">{attendanceStats.total}</p>
              </div>
              <Calendar className="h-6 w-6 text-[var(--ep-blue)]" />
            </div>
          </CardContent>
        </Card>
        <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('presentDays')}</p>
                <p className="text-2xl font-bold text-[var(--ep-green)]">{attendanceStats.present}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-[var(--ep-green)]" />
            </div>
          </CardContent>
        </Card>
        <Card className="from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('lateDays')}</p>
                <p className="text-2xl font-bold text-[var(--ep-yellow)]">{attendanceStats.late}</p>
              </div>
              <Clock className="h-6 w-6 text-[var(--ep-yellow)]" />
            </div>
          </CardContent>
        </Card>
        <Card className="from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t('punctuality')}</p>
                <p className="text-2xl font-bold text-[var(--ep-purple)]">{attendanceStats.punctualPercentage}%</p>
              </div>
              <Percent className="h-6 w-6 text-[var(--ep-purple)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI kartalar — row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Erta ketishlar</p>
                <p className="text-2xl font-bold text-[var(--ep-primary)]">{earlyDepartures.length}</p>
                <p className="text-xs text-muted-foreground mt-1">17:00 dan oldin ketgan kunlar</p>
              </div>
              <LogOut className="h-6 w-6 text-[var(--ep-primary)]" />
            </div>
          </CardContent>
        </Card>
        <Card className="from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Smena almashtirishlar</p>
                <p className="text-2xl font-bold text-[var(--ep-cyan)]">{shiftSwaps.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(Array.isArray(shiftSwaps) ? shiftSwaps : []).filter(s => s.status === "approved").length} ta tasdiqlangan
                </p>
              </div>
              <ArrowLeftRight className="h-6 w-6 text-[var(--ep-cyan)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar / Pie + Detailed stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AttendanceViewCard
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          attendanceData={attendanceData}
          attendancePieData={attendancePieData}
          tCommon={tCommon}
        />
        <DetailedStatsCard
          attendanceStats={attendanceStats}
          earlyDeparturesCount={earlyDepartures.length}
        />
      </div>

      <EarlyDeparturesSection earlyDepartures={earlyDepartures} />
      <ShiftSwapsSection shiftSwaps={shiftSwaps} loadingShiftSwaps={loadingShiftSwaps} />
      <ZoneLogsSection zoneLogs={zoneLogs} loadingZoneLogs={loadingZoneLogs} />
      <AttendanceHistorySection attendanceData={attendanceData} tCommon={tCommon} />
    </div>
  );
}
