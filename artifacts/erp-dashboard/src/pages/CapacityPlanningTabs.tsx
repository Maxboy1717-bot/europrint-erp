/**
 * @module CapacityPlanningTabs
 * @description Tab-content components for the Capacity Planning page:
 * capacity-data list and shift-calendar list. Split from
 * CapacityPlanningSections to keep file sizes within the 300-line limit.
 */

import { TrendingUp, CalendarClock, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { CapacityListItem, ShiftCalendar, WorkCenter } from "./CapacityPlanningTypes";
import { EPStatusPill } from "@/components/ep";

// ---------------------------------------------------------------------------
// CapacityDataTab
// ---------------------------------------------------------------------------

interface CapacityDataTabProps {
  capacityList: CapacityListItem[];
  onAddCapacity: () => void;
  t: (key: string) => string;
}

export function CapacityDataTab({ capacityList, onAddCapacity, t }: CapacityDataTabProps) {
  if (capacityList.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title={t("noCapacityEntries")}
            description={t("noCapacityEntriesDesc")}
            action={{ label: t("addCapacity"), onClick: onAddCapacity }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {(Array.isArray(capacityList) ? capacityList : []).map((item) => (
        <Card
          key={item.capacity.id}
          className="hover-elevate"
          data-testid={`card-capacity-${item.capacity.id}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {item.workCenter?.name || "Unknown"}
                </CardTitle>
                <CardDescription>{item.capacity.date}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <EPStatusPill tone="neutral" data-testid={`badge-hours-${item.capacity.id}`}>
                  {item.capacity.availableHours}h
                </EPStatusPill>
                <Badge variant="outline">Efficiency: {item.capacity.efficiency}%</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ShiftCalendarTab
// ---------------------------------------------------------------------------

interface ShiftCalendarTabProps {
  calendars: ShiftCalendar[];
  workCenters: WorkCenter[];
  onCreateCalendar: () => void;
  t: (key: string) => string;
}

export function ShiftCalendarTab({
  calendars,
  workCenters,
  onCreateCalendar,
  t,
}: ShiftCalendarTabProps) {
  const getWorkCenterName = (wcId: string) => {
    const wc = (Array.isArray(workCenters) ? workCenters : []).find((w) => w.id === wcId);
    return wc ? wc.name : wcId;
  };

  if (calendars.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={CalendarClock}
            title={t("noShiftCalendar")}
            description={t("noShiftCalendarDesc")}
            action={{ label: t("createShiftCalendar"), onClick: onCreateCalendar }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {(Array.isArray(calendars) ? calendars : []).map((cal) => (
        <Card
          key={cal.id}
          className="hover-elevate"
          data-testid={`card-calendar-${cal.id}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{cal.shiftName}</CardTitle>
                <CardDescription>{getWorkCenterName(cal.workCenterId)}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" data-testid={`badge-time-${cal.id}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {cal.startTime} - {cal.endTime}
                </Badge>
                <EPStatusPill tone="neutral">{cal.workingDays?.length || 0} days</EPStatusPill>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
