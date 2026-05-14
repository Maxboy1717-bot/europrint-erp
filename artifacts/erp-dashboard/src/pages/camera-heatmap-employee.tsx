/**
 * @module camera-heatmap-employee
 * @description "Employee" tab content for the Camera Heatmap page.
 *              Renders trajectory map, zone-time breakdown, and productivity card.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, User, MapPin, TrendingUp } from "lucide-react";
import { type EmployeeHeatmapData, type Translations } from "./camera-heatmap-types";

// ---------------------------------------------------------------------------
// EmployeeTabContent
// ---------------------------------------------------------------------------

export interface EmployeeTabContentProps {
  selectedEmployeeId: string;
  employeeLoading: boolean;
  employeeHeatmap: EmployeeHeatmapData | undefined;
  t: Translations;
}

export function EmployeeTabContent({
  selectedEmployeeId,
  employeeLoading,
  employeeHeatmap,
  t,
}: EmployeeTabContentProps) {
  if (!selectedEmployeeId) {
    return (
      <Card className="p-12 text-center">
        <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{t.noEmployee}</h3>
        <p className="text-muted-foreground">{t.selectEmployee}</p>
      </Card>
    );
  }

  if (employeeLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (!employeeHeatmap) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <TrajectoryMap employeeHeatmap={employeeHeatmap} t={t} />
      <div className="space-y-4">
        <ZoneTimeCard employeeHeatmap={employeeHeatmap} t={t} />
        <ProductivityCard employeeHeatmap={employeeHeatmap} t={t} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TrajectoryMap
// ---------------------------------------------------------------------------

interface TrajectoryMapProps {
  employeeHeatmap: EmployeeHeatmapData;
  t: Translations;
}

function TrajectoryMap({ employeeHeatmap, t }: TrajectoryMapProps) {
  const trajectory = Array.isArray(employeeHeatmap.trajectory)
    ? employeeHeatmap.trajectory
    : [];

  return (
    <div className="lg:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[var(--ep-blue)]" />
            {t.trajectory}
          </CardTitle>
          <CardDescription>
            {employeeHeatmap.employee.name} - {employeeHeatmap.employee.department}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="grid grid-cols-10 gap-1 aspect-square max-w-[500px] mx-auto">
              {Array.from({ length: 100 }).map((_, index) => {
                const x = index % 10;
                const y = Math.floor(index / 10);
                const trajectoryPoint = trajectory.find(tp => tp.x === x && tp.y === y);
                return (
                  <div
                    key={`k-${index}`}
                    className={`rounded transition-all ${trajectoryPoint ? "bg-blue-500 ring-2 ring-blue-300" : "bg-muted/30"}`}
                    style={{ aspectRatio: "1/1" }}
                    title={trajectoryPoint ? `${trajectoryPoint.time} - ${trajectoryPoint.zone}` : ""}
                    data-testid={`employee-cell-${x}-${y}`}
                  />
                );
              })}
            </div>
            <svg
              className="absolute inset-0 pointer-events-none max-w-[500px] mx-auto"
              viewBox="0 0 100 100"
            >
              <polyline
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={trajectory.map(tp => `${tp.x * 10 + 5},${tp.y * 10 + 5}`).join(" ")}
              />
              {trajectory.map((tp, i) => (
                <circle
                  key={`k-${i}`}
                  cx={tp.x * 10 + 5}
                  cy={tp.y * 10 + 5}
                  r="1.5"
                  fill="rgb(59, 130, 246)"
                />
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ZoneTimeCard
// ---------------------------------------------------------------------------

interface ZoneTimeCardProps {
  employeeHeatmap: EmployeeHeatmapData;
  t: Translations;
}

function ZoneTimeCard({ employeeHeatmap, t }: ZoneTimeCardProps) {
  const zoneStats = Array.isArray(employeeHeatmap.zoneStats) ? employeeHeatmap.zoneStats : [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[var(--ep-green)]" />
          {t.timeInZones}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {zoneStats.map(stat => (
            <div key={stat.zone} className="space-y-1" data-testid={`zone-time-${stat.zone}`}>
              <div className="flex justify-between text-sm">
                <span>{stat.zoneName}</span>
                <span className="font-medium">
                  {stat.duration} {t.minutes}
                </span>
              </div>
              <Progress value={stat.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ProductivityCard
// ---------------------------------------------------------------------------

interface ProductivityCardProps {
  employeeHeatmap: EmployeeHeatmapData;
  t: Translations;
}

function ProductivityCard({ employeeHeatmap, t }: ProductivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--ep-purple)]" />
          {t.productivityScore}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{employeeHeatmap.productivity}%</div>
            <p className="text-sm text-muted-foreground">{t.productivityScore}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <div className="text-lg font-semibold text-[var(--ep-green)]">
                {employeeHeatmap.totalActiveTime}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.activeTime} ({t.minutes})
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <div className="text-lg font-semibold text-[var(--ep-red)]">
                {employeeHeatmap.totalIdleTime}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.idleTime} ({t.minutes})
              </p>
            </div>
          </div>
          {employeeHeatmap.violations > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
              <span className="text-sm">
                {employeeHeatmap.violations} {t.violations.toLowerCase()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
