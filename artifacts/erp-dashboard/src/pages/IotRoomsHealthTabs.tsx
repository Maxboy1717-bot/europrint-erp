/**
 * @module IotRoomsHealthTabs
 * @description Room inspections and employee health TabsContent blocks
 * for IotMaintenanceMonitorTab. Split from IotMaintenanceMonitorTab.tsx (Rule 16).
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import {
  RefreshCw, Users, DoorOpen, Building2, Clock, Heart,
} from "lucide-react";
import { EPStatusPill } from "@/components/ep";

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
  roomInspections: RoomInspection[];
  roomsLoading: boolean;
  refetchRooms: () => void;
  employeeHealth: EmployeeHealth | null;
  t: (key: string) => string;
  tCommon: (key: string) => string;
  language: string;
}

export function IotRoomsHealthTabs({ roomInspections, roomsLoading, refetchRooms, employeeHealth, t, tCommon, language }: Props) {
  return (
    <>
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
              {(Array.isArray(roomInspections) ? roomInspections : []).map((insp) => (
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
                     : insp.status === "issue" ? <Badge className="bg-amber-100 text-[var(--ep-yellow)] text-xs rounded-full shrink-0">{t('problem')}</Badge>
                     : <EPStatusPill tone="success">{t('healthGood')}</EPStatusPill>}
                  </div>
                  {insp.notes && <p className="text-xs text-muted-foreground mt-1">{insp.notes}</p>}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(insp.checked_at).toLocaleString(
                        language === "uz" ? "uz-UZ" : "ru-RU",
                        { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
                      )}
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
