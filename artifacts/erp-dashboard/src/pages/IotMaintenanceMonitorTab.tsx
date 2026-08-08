/**
 * IotMaintenanceMonitorTab — Predictive maintenance, camera attendance,
 * room inspections, and employee health tabs for IoTDashboard.
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TabsContent } from "@/components/ui/tabs";
import {
  Wrench, ShieldAlert, AlertTriangle, CheckCircle2,
  RefreshCw, Users, MapPin, XCircle, Building2, DoorOpen,
  Clock, Heart, Activity,
} from "lucide-react";
import { EPStatusPill } from "@/components/ep";

/* ────────── Types ────────── */
interface PmSensor {
  sensorId: string; sensorCode: string; sensorName: string; type: string;
  machineId: string | null; riskLevel: string; riskScore: number;
  recommendation: string; lastValue: number | null; threshold: number | null;
  consecutiveCritical: number; avgLast10: number | null;
}

interface PmResult {
  sensors: PmSensor[];
  summary: { critical: number; high: number; medium: number; low: number };
  analyzedAt: string;
}

interface AttendanceEmployee {
  employee_id: string; full_name: string | null; department_name: string | null;
  gate_status: "in" | "out" | null; workplace_status: "in" | "out" | null;
  last_seen: string | null; status: "at_workplace" | "on_premises" | "absent";
}

interface AttendanceLive {
  live: AttendanceEmployee[];
  summary: { total: number; at_workplace: number; on_premises: number; absent: number };
  date: string;
}

interface RoomInspection {
  id: number; room_id: string; room_name: string | null; checked_at: string;
  inspector_id: string | null; inspector_name: string | null;
  status: string; notes: string | null; photo_url: string | null;
}

interface HealthDept {
  department: string; present_count: number; total_count: number;
  attendance_rate: number; mood_indicator: "good" | "moderate" | "low";
}

interface EmployeeHealth { date: string; note: string; health: HealthDept[] }

interface Props {
  pmResult: PmResult | undefined;
  pmLoading: boolean;
  attendanceLive: AttendanceLive | undefined;
  attendanceLoading: boolean;
  refetchAttendance: () => void;
  roomInspections: RoomInspection[];
  roomsLoading: boolean;
  refetchRooms: () => void;
  employeeHealth: EmployeeHealth | null;
  t: (key: string) => string;
  tCommon: (key: string) => string;
  language: string;
}

/* ────────── Component ────────── */
export function IotMaintenanceMonitorTab({ pmResult, pmLoading, attendanceLive, attendanceLoading, refetchAttendance, roomInspections, roomsLoading, refetchRooms, employeeHealth, t, tCommon, language, }: Props) {
  return (
    <>
      {/* ── Predictive Maintenance ── */}
      <TabsContent value="maintenance" className="focus-visible:outline-none">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[var(--ep-primary)]" />
              {t('predictiveMaintenance')}
            </h3>
            {pmResult?.analyzedAt && (
              <span className="text-xs text-muted-foreground">
                {t('analyzedAt')} {new Date(pmResult.analyzedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {pmResult?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { key: "critical", label: t('riskCritical'), color: "text-[var(--ep-red)]", bg: "bg-red-50", icon: <ShieldAlert className="h-5 w-5" /> },
                { key: "high",     label: t('riskHigh'),     color: "text-[var(--ep-primary)]", bg: "bg-orange-50", icon: <AlertTriangle className="h-5 w-5" /> },
                { key: "medium",   label: t('riskMedium'),   color: "text-[var(--ep-yellow)]", bg: "bg-yellow-50", icon: <Wrench className="h-5 w-5" /> },
                { key: "low",      label: t('riskLow'),      color: "text-[var(--ep-green)]",  bg: "bg-green-50",  icon: <CheckCircle2 className="h-5 w-5" /> },
              ]).map(({ key, label, color, bg, icon }) => (
                <div key={key} className={`rounded-xl p-4 ${bg} flex items-center gap-3`}>
                  <div className={color}>{icon}</div>
                  <div>
                    <div className={`text-2xl font-black ${color}`}>{pmResult.summary[key as keyof typeof pmResult.summary]}</div>
                    <div className="text-xs font-semibold text-muted-foreground">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pmLoading ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              <Wrench className="h-8 w-8 mx-auto mb-2 animate-pulse opacity-50" />
              <p>{t('analyzingSensors')}</p>
            </div>
          ) : !pmResult?.sensors?.length ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold">{t('noSensorData')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(pmResult.sensors) ? pmResult.sensors : []).map(s => {
                const riskColors: Record<string, string> = {
                  critical: "border-red-300 bg-red-50/50",
                  high:     "border-orange-200 bg-orange-50/50",
                  medium:   "border-yellow-200 bg-yellow-50/50",
                  low:      "border-green-200 bg-green-50/30",
                };
                const riskBadge: Record<string, string> = {
                  critical: "bg-red-100 text-[var(--ep-red)]",
                  high:     "bg-orange-100 text-[var(--ep-primary)]",
                  medium:   "bg-yellow-100 text-[var(--ep-yellow)]",
                  low:      "bg-green-100 text-[var(--ep-green)]",
                };
                return (
                  <div key={s.sensorId} className={`rounded-xl border p-4 ${riskColors[s.riskLevel] ?? "border-border"}`} data-testid={`pm-sensor-${s.sensorId}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${riskBadge[s.riskLevel] ?? ""}`}>
                            {s.riskLevel.toUpperCase()} — {s.riskScore}%
                          </span>
                          <Badge variant="outline" className="text-xs">{s.type}</Badge>
                          {s.machineId && <EPStatusPill tone="neutral" className="text-xs">{s.machineId}</EPStatusPill>}
                        </div>
                        <p className="font-bold text-foreground text-sm">{s.sensorName} <span className="text-muted-foreground font-normal">({s.sensorCode})</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{s.recommendation}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          <span>{t('lastValue')} <strong className="text-foreground">{s.lastValue ?? "—"}</strong></span>
                        </div>
                        {s.threshold && (
                          <div className="text-xs text-muted-foreground">
                            {t('sensorThreshold')} <strong>{s.threshold}</strong>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {t('consecutiveCritical')} <strong className="text-[var(--ep-red)]">{s.consecutiveCritical}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={s.riskScore} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </TabsContent>

      {/* ── Camera Attendance ── */}
      <TabsContent value="attendance" className="focus-visible:outline-none space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('realTimeAttendance')}
            </h3>
            <Button variant="outline" size="sm" onClick={refetchAttendance} className="rounded-lg border-border gap-2">
              <RefreshCw className="h-4 w-4" />{tCommon('refresh')}
            </Button>
          </div>

          {attendanceLive?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {([
                { label: t('atWorkplace'), count: attendanceLive.summary.at_workplace, color: "text-[var(--ep-green)]", bg: "bg-green-50",          icon: <CheckCircle2 className="h-4 w-4" /> },
                { label: t('onPremises'),  count: attendanceLive.summary.on_premises,  color: "text-[var(--ep-blue)]",  bg: "bg-blue-50",           icon: <MapPin       className="h-5 w-5" /> },
                { label: t('absent'),      count: attendanceLive.summary.absent,        color: "text-[var(--ep-red)]",   bg: "bg-red-50",            icon: <XCircle      className="h-5 w-5" /> },
                { label: tCommon('total'), count: attendanceLive.summary.total,         color: "text-foreground",bg: "bg-muted/60", icon: <Users        className="h-5 w-5" /> },
              ]).map((item, i) => (
                <div key={`k-${i}`} className={`${item.bg} rounded-xl p-4 flex items-center gap-3`}>
                  <div className={item.color}>{item.icon}</div>
                  <div>
                    <div className={`text-2xl font-black ${item.color}`}>{item.count}</div>
                    <div className="text-xs font-semibold text-muted-foreground">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {attendanceLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 animate-pulse opacity-50" />
              <p>{t('attendanceLoading')}</p>
            </div>
          ) : !attendanceLive?.live?.length ? (
            <div className="py-16 text-center border-2 border-dashed rounded-xl border-border">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-bold text-muted-foreground">{t('noAttendanceEvents')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {[t('employee'), t('department'), t('gate'), t('workplace'), tCommon('status'), t('lastSeen')].map(h => (
                      <th key={h} className="pb-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {(Array.isArray(attendanceLive.live) ? attendanceLive.live : []).map(emp => (
                    <tr key={emp.employee_id} className="hover:bg-muted/60/50 transition-colors" data-testid={`attendance-row-${emp.employee_id}`}>
                      <td className="py-3 font-semibold text-foreground">{emp.full_name ?? emp.employee_id}</td>
                      <td className="py-3 text-muted-foreground text-xs">{emp.department_name ?? "—"}</td>
                      <td className="py-3">
                        {emp.gate_status === "in"  ? <EPStatusPill tone="success">{t("statusIn")}</EPStatusPill>
                         : emp.gate_status === "out" ? <EPStatusPill tone="danger">{t("statusOut")}</EPStatusPill>
                         : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-3">
                        {emp.workplace_status === "in"  ? <EPStatusPill tone="success">{t("statusIn")}</EPStatusPill>
                         : emp.workplace_status === "out" ? <EPStatusPill tone="danger">{t("statusOut")}</EPStatusPill>
                         : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="py-3">
                        {emp.status === "at_workplace" ? <EPStatusPill tone="success">{t('statusAtWorkplace')}</EPStatusPill>
                         : emp.status === "on_premises"  ? <EPStatusPill tone="info">{t('statusOnPremises')}</EPStatusPill>
                         : <EPStatusPill tone="danger">{t('statusAbsent')}</EPStatusPill>}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {emp.last_seen ? new Date(emp.last_seen).toLocaleTimeString(language === "uz" ? "uz-UZ" : "ru-RU", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </TabsContent>

      {/* ── Room Inspections ── */}
      <TabsContent value="rooms" className="focus-visible:outline-none space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t('roomStatusInspection')}
            </h3>
            <Button variant="outline" size="sm" onClick={refetchRooms} className="rounded-lg border-border gap-2">
              <RefreshCw className="h-4 w-4" />{tCommon('refresh')}
            </Button>
          </div>

          {roomsLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 animate-pulse opacity-50" />
              <p>{t('roomInspectionLoading')}</p>
            </div>
          ) : roomInspections.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed rounded-xl border-border">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-bold text-muted-foreground">{t('noRoomInspections')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(Array.isArray(roomInspections) ? roomInspections : []).map(insp => (
                <div
                  key={insp.id}
                  className={`rounded-xl border p-4 transition-all ${
                    insp.status === "critical" ? "border-red-300 bg-red-50/50"
                    : insp.status === "issue"  ? "border-amber-200 bg-amber-50/50"
                    : "border-green-200 bg-green-50/30"
                  }`}
                  data-testid={`room-inspection-${insp.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-bold text-foreground text-sm">{insp.room_name ?? insp.room_id}</span>
                    </div>
                    {insp.status === "critical" ? <EPStatusPill tone="danger">{t('critical')}</EPStatusPill>
                     : insp.status === "issue"  ? <Badge className="bg-amber-100 text-[var(--ep-yellow)] text-xs rounded-full shrink-0">{t('problem')}</Badge>
                     : <EPStatusPill tone="success">{t('healthGood')}</EPStatusPill>}
                  </div>
                  {insp.notes && <p className="text-xs text-muted-foreground mt-1">{insp.notes}</p>}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(insp.checked_at).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {insp.inspector_name && (
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{insp.inspector_name}</span>
                    )}
                  </div>
                  {insp.photo_url && (
                    <a href={insp.photo_url} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
                      {t('viewPhoto')}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* ── Employee Health ── */}
      <TabsContent value="health" className="focus-visible:outline-none space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              {t('healthMonitoring')}
            </h3>
            <Badge className="bg-muted/60 text-muted-foreground text-xs rounded-full px-3 py-1">
              {t('anonymousHROnly')}
            </Badge>
          </div>

          {!employeeHealth ? (
            <div className="py-16 text-center border-2 border-dashed rounded-xl border-border">
              <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-bold text-muted-foreground">{t('healthNoAccess')}</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4 italic">{employeeHealth.note}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Array.isArray(employeeHealth.health) ? employeeHealth.health : []).map((dept, idx) => (
                  <div key={idx} className="bg-background rounded-xl border border-border/50 p-4" data-testid={`health-dept-${idx}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-foreground text-sm">{dept.department}</span>
                      {dept.mood_indicator === "good"     ? <EPStatusPill tone="success">{t('healthGood')}</EPStatusPill>
                       : dept.mood_indicator === "moderate" ? <Badge className="bg-amber-100 text-[var(--ep-yellow)] text-xs rounded-full">{t('healthModerate')}</Badge>
                       : <EPStatusPill tone="danger">{t('healthLow')}</EPStatusPill>}
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-3xl font-black text-foreground">{dept.attendance_rate}%</span>
                      <span className="text-xs text-muted-foreground mb-1">{dept.present_count}/{dept.total_count} {t('staffCount')}</span>
                    </div>
                    <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          dept.attendance_rate >= 80 ? "bg-green-500" : dept.attendance_rate >= 60 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${dept.attendance_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </TabsContent>
    </>
  );
}
