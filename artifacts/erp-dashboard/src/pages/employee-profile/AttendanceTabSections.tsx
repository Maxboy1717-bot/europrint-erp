/**
 * @module AttendanceTabSections
 * @description Table section components for AttendanceTab.
 * Calendar/view-toggle components live in AttendanceTabCalendar.tsx.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, MapPin, List, LogOut } from "lucide-react";
import type { AttendanceRecord, AttendanceStats, ShiftSwapRecord, ZoneTrackingLog, TranslationFn } from "./profile-types";
import { SHIFT_STATUS_MAP, formatDuration } from "./AttendanceTabTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

// Re-export calendar components so AttendanceTab only needs one import
export { AttendanceViewCard, AttendanceCalendar } from "./AttendanceTabCalendar";

// ─── Detailed Stats Card ────────────────────────────────────────────────────

interface DetailedStatsProps {
  attendanceStats: AttendanceStats;
  earlyDeparturesCount: number;
}

export function DetailedStatsCard({ attendanceStats, earlyDeparturesCount }: DetailedStatsProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("batafsilStatistika")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{t("kelganKunlar")}</span>
          <EPStatusPill tone="success">{attendanceStats.present}</EPStatusPill>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{t("kelmaganKunlar")}</span>
          <EPStatusPill tone="danger">{attendanceStats.absent}</EPStatusPill>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{t("kechikkanKunlar")}</span>
          <EPStatusPill tone="warning">{attendanceStats.late}</EPStatusPill>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{t("kasallikKunlari")}</span>
          <EPStatusPill tone="info">{attendanceStats.sick}</EPStatusPill>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{t("tatilKunlari")}</span>
          <Badge className="bg-purple-500">{attendanceStats.leave}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{t("ertaKetishlar")}</span>
          <Badge className="bg-orange-500">{earlyDeparturesCount}</Badge>
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-muted-foreground text-sm">{t("jamiKechikish")}</span>
          <Badge variant="outline">{attendanceStats.totalMinutesLate} min</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Early Departures Table ─────────────────────────────────────────────────

export function EarlyDeparturesSection({ earlyDepartures }: { earlyDepartures: AttendanceRecord[] }) {
  const { t } = useTranslation("common");
  if (earlyDepartures.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogOut className="h-5 w-5 text-[var(--ep-primary)]" />
          {t("ertaKetishlarTarixi")}
        </CardTitle>
        <CardDescription>{t("k1700DanOldinIsh")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("kelishVaqti")}</TableHead>
              <TableHead>{t("ketishVaqti")}</TableHead>
              <TableHead>{t("Izoh")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(earlyDepartures) ? earlyDepartures : []).slice(0, 15).map((record: AttendanceRecord) => (
              <TableRow key={record.id} data-testid={`row-early-${record.id}`} className="hover:bg-muted/40 transition-colors">
                <TableCell>{record.date ? new Date(record.date).toLocaleDateString('uz-UZ') : "-"}</TableCell>
                <TableCell>{record.checkIn || "-"}</TableCell>
                <TableCell>
                  <span className="text-[var(--ep-primary)] font-medium">{record.checkOut || "-"}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{record.notes || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}

// ─── Shift Swaps Table ──────────────────────────────────────────────────────

interface ShiftSwapsSectionProps {
  shiftSwaps: ShiftSwapRecord[];
  loadingShiftSwaps: boolean;
}

export function ShiftSwapsSection({ shiftSwaps, loadingShiftSwaps }: ShiftSwapsSectionProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-[var(--ep-cyan)]" />
          {t("smenaAlmashtirishTarixi")}
        </CardTitle>
        <CardDescription>{t("smenaniAlmashtirishSorovlari")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loadingShiftSwaps ? (
          <Skeleton className="h-32 rounded-lg" />
        ) : shiftSwaps.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("aslSmena")}</TableHead>
                <TableHead>{t("soralganSmena")}</TableHead>
                <TableHead>{t("sabab")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(shiftSwaps) ? shiftSwaps : []).map((swap: ShiftSwapRecord) => {
                const statusInfo = SHIFT_STATUS_MAP[swap.status] || { label: swap.status, color: "bg-muted" };
                return (
                  <TableRow key={swap.id} data-testid={`row-swap-${swap.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-sm">{swap.originalShiftDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{swap.originalShiftType}</Badge>
                    </TableCell>
                    <TableCell>
                      {swap.requestedShiftDate ? (
                        <span className="text-sm">
                          {swap.requestedShiftDate} — <Badge variant="outline">{swap.requestedShiftType}</Badge>
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{swap.reason}</TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {t("smenaAlmashtirishSorovlariYoq")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Zone Logs Table ────────────────────────────────────────────────────────

interface ZoneLogsSectionProps {
  zoneLogs: ZoneTrackingLog[];
  loadingZoneLogs: boolean;
}

export function ZoneLogsSection({ zoneLogs, loadingZoneLogs }: ZoneLogsSectionProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[var(--ep-blue)]" />
          {t("zonaKirishChiqishLoglari")}
        </CardTitle>
        <CardDescription>
          Turniket/yuz tanish tizimi orqali qayd etilgan zona loglari (so'nggi 100 ta)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingZoneLogs ? (
          <Skeleton className="h-32 rounded-lg" />
        ) : zoneLogs.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("zonaNomi")}</TableHead>
                <TableHead>{t("camera")}</TableHead>
                <TableHead>{t("kirishVaqti")}</TableHead>
                <TableHead>{t("chiqishVaqti")}</TableHead>
                <TableHead>{t("davomiylik")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(zoneLogs) ? zoneLogs : []).map((log: ZoneTrackingLog) => (
                <TableRow key={log.id} data-testid={`row-zone-log-${log.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-sm">{log.trackingDate}</TableCell>
                  <TableCell>
                    <span className="font-medium">{log.zoneName}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{log.cameraName || "-"}</TableCell>
                  <TableCell>{log.entryTime || "-"}</TableCell>
                  <TableCell>{log.exitTime || "-"}</TableCell>
                  <TableCell>
                    {log.durationMinutes > 0 ? (
                      <Badge variant="outline">{formatDuration(log.durationMinutes)}</Badge>
                    ) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        ) : (
          <p className="text-muted-foreground text-center py-8" data-testid="text-zone-logs-empty">
            {t("zonaLoglariMavjudEmas")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Attendance History Table ───────────────────────────────────────────────

interface AttendanceHistoryProps {
  attendanceData: AttendanceRecord[] | undefined;
  tCommon: TranslationFn;
}

export function AttendanceHistorySection({ attendanceData, tCommon }: AttendanceHistoryProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Davomat tarixi (jadval)
        </CardTitle>
        <CardDescription>{t("oxirgi20TaDavomatYozuvi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {attendanceData && attendanceData.length > 0 ? (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("kelishVaqti")}</TableHead>
                <TableHead>{t("ketishVaqti")}</TableHead>
                <TableHead>{t("status28")}</TableHead>
                <TableHead>{t("kechikish")}</TableHead>
                <TableHead>{t("Izoh")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(attendanceData) ? attendanceData : []).slice(0, 20).map((record: AttendanceRecord) => (
                <TableRow key={record.id} data-testid={`row-attendance-${record.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell>{record.date ? new Date(record.date).toLocaleDateString('uz-UZ') : "-"}</TableCell>
                  <TableCell>{record.checkIn || "-"}</TableCell>
                  <TableCell>
                    {record.checkOut && record.status === "present" && record.checkOut.substring(0, 5) < "17:00" ? (
                      <span className="text-[var(--ep-primary)] font-medium">{record.checkOut}</span>
                    ) : (record.checkOut || "-")}
                  </TableCell>
                  <TableCell>
                    {record.status === "present" && <EPStatusPill tone="success">{t("keldi")}</EPStatusPill>}
                    {record.status === "absent" && <EPStatusPill tone="danger">{t("kelmadi")}</EPStatusPill>}
                    {record.status === "sick" && <EPStatusPill tone="info">{t("kasal")}</EPStatusPill>}
                    {record.status === "leave" && <Badge className="bg-purple-500">{t("tatil")}</Badge>}
                  </TableCell>
                  <TableCell>
                    {record.isLate ? (
                      <EPStatusPill tone="warning">{record.minutesLate} min</EPStatusPill>
                    ) : record.status === "present" ? (
                      <EPStatusPill tone="success">{t("vaqtida")}</EPStatusPill>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {tCommon('noData')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
