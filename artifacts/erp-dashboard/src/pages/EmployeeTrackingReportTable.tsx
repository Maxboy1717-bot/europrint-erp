/**
 * @module EmployeeTrackingReportTable
 * @description Attendance table with expandable zone history for EmployeeTrackingReport.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import type { AttendanceRecord, ZoneHistory, Translations } from "./EmployeeTrackingReportTypes";
import { formatTime, formatDuration, getInitials } from "./EmployeeTrackingReportSections";
import { EPStatusPill } from "@/components/ep";

// ── ZoneHistoryRows ───────────────────────────────────────────────────────────

interface ZoneHistoryRowsProps {
  zoneHistory: ZoneHistory[];
  t: Translations;
}

function ZoneHistoryRows({ zoneHistory, t }: ZoneHistoryRowsProps) {
  return (
    <TableRow>
      <TableCell colSpan={9} className="bg-muted/50 p-4">
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t.zoneActivity}
          </h4>
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.zone}</TableHead>
                <TableHead>{t.entryTime}</TableHead>
                <TableHead>{t.exitTime}</TableHead>
                <TableHead>{t.duration}</TableHead>
                <TableHead>{t.visits}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zoneHistory.slice(0, 5).map((zone) => (
                <TableRow key={zone.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <EPStatusPill tone="neutral">{zone.zoneName || "Unknown"}</EPStatusPill>
                  </TableCell>
                  <TableCell>{zone.entryTime || "-"}</TableCell>
                  <TableCell>{zone.exitTime || "-"}</TableCell>
                  <TableCell>{formatDuration(zone.durationMinutes || 0, t)}</TableCell>
                  <TableCell>{zone.visitCount || 1}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── AttendanceTable ───────────────────────────────────────────────────────────

interface AttendanceTableProps {
  attendance: AttendanceRecord[];
  attendanceLoading: boolean;
  expandedEmployee: string | null;
  zoneHistory: ZoneHistory[];
  language: string;
  t: Translations;
  onToggleExpand: (employeeId: string) => void;
}

export function AttendanceTable({
  attendance,
  attendanceLoading,
  expandedEmployee,
  zoneHistory,
  language,
  t,
  onToggleExpand,
}: AttendanceTableProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      present: { label: t.present, variant: "default" as const },
      absent: { label: t.absent, variant: "destructive" as const },
      late: { label: t.late, variant: "secondary" as const },
    };
    const info = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "outline" as const,
    };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t.dailyAttendance}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attendanceLoading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">{t.noData}</p>
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.employee}</TableHead>
                <TableHead>{t.firstSeen}</TableHead>
                <TableHead>{t.lastSeen}</TableHead>
                <TableHead>{t.totalTime}</TableHead>
                <TableHead>{t.workZone}</TableHead>
                <TableHead>{t.restZone}</TableHead>
                <TableHead>{t.detections}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(attendance) ? attendance : []).map((record) => (
                <>
                  <TableRow
                    key={record.id}
                    className="hover-elevate cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => onToggleExpand(record.employeeId)}
                    data-testid={`row-attendance-${record.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(record.employeeName || "??")}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{record.employeeName || record.employeeId}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(record.firstSeenAt, language)}</TableCell>
                    <TableCell>{formatTime(record.lastSeenAt, language)}</TableCell>
                    <TableCell>{formatDuration(record.totalMinutes || 0, t)}</TableCell>
                    <TableCell>{formatDuration(record.workZoneMinutes || 0, t)}</TableCell>
                    <TableCell>{formatDuration(record.restZoneMinutes || 0, t)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.detectionCount || 0}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status || "present")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        {expandedEmployee === record.employeeId
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />
                        }
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expandedEmployee === record.employeeId && zoneHistory.length > 0 && (
                    <ZoneHistoryRows zoneHistory={zoneHistory} t={t} />
                  )}
                </>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}
