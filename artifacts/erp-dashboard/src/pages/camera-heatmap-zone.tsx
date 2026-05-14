/**
 * @module camera-heatmap-zone
 * @description "Zone Activity" tab content for the Camera Heatmap page.
 *              Renders a bar chart of zone activities per department plus
 *              an activity list and aggregate statistics sidebar.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  type ZoneActivityResponse,
  type Translations,
  type Language,
} from "./camera-heatmap-types";
import { EPStatusPill } from "@/components/ep";

// ---------------------------------------------------------------------------
// ZoneTabContent
// ---------------------------------------------------------------------------

export interface ZoneTabContentProps {
  selectedDepartmentId: string;
  zoneActivityLoading: boolean;
  zoneActivityResponse: ZoneActivityResponse | undefined;
  language: Language;
  selectedPeriod: string;
  t: Translations;
}

export function ZoneTabContent({
  selectedDepartmentId,
  zoneActivityLoading,
  zoneActivityResponse,
  language,
  selectedPeriod,
  t,
}: ZoneTabContentProps) {
  if (!selectedDepartmentId) {
    return (
      <Card className="p-12 text-center">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{t.noDepartment}</h3>
        <p className="text-muted-foreground">{t.selectDepartment}</p>
      </Card>
    );
  }

  if (zoneActivityLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (!zoneActivityResponse) return null;

  const activities = Array.isArray(zoneActivityResponse.zoneActivities)
    ? zoneActivityResponse.zoneActivities
    : [];

  const deptName =
    language === "uz"
      ? zoneActivityResponse.department.name
      : zoneActivityResponse.department.nameRu;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar chart */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--ep-blue)]" />
              {t.zoneActivity}
            </CardTitle>
            <CardDescription>
              {deptName} - {selectedPeriod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={activities}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value) => Math.round(value as number)}
                  labelStyle={{ color: "black" }}
                />
                <Legend />
                <Bar dataKey="visits"        fill="#3b82f6" name={t.visits}      />
                <Bar dataKey="totalDuration" fill="#10b981" name={t.duration}    />
                <Bar dataKey="avgDuration"   fill="#f59e0b" name={t.avgDuration} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <ZoneActivityList activities={activities} t={t} />
        {activities.length > 0 && <ZoneStatsCard activities={activities} t={t} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ZoneActivityList (private sub-component)
// ---------------------------------------------------------------------------

interface ZoneActivityListProps {
  activities: ZoneActivityResponse["zoneActivities"];
  t: Translations;
}

function ZoneActivityList({ activities, t }: ZoneActivityListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[var(--ep-purple)]" />
          {t.zones}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={activity.zone}
              className="p-3 rounded-lg bg-muted/50"
              data-testid={`zone-activity-card-${index}`}
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium text-sm">{activity.zone}</span>
                <EPStatusPill tone="neutral">
                  {activity.visits} {t.visits.toLowerCase()}
                </EPStatusPill>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t.duration}:</span>
                  <span className="font-medium">{Math.round(activity.totalDuration)} min</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.avgDuration}:</span>
                  <span className="font-medium">{Math.round(activity.avgDuration)} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ZoneStatsCard (private sub-component)
// ---------------------------------------------------------------------------

interface ZoneStatsCardProps {
  activities: ZoneActivityResponse["zoneActivities"];
  t: Translations;
}

function ZoneStatsCard({ activities, t }: ZoneStatsCardProps) {
  const totalVisits   = activities.reduce((sum, a) => sum + a.visits, 0);
  const totalDuration = Math.round(activities.reduce((sum, a) => sum + a.totalDuration, 0));
  const avgDurationAll = Math.round(
    activities.reduce((sum, a) => sum + a.avgDuration, 0) / activities.length
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--ep-blue)]" />
          {t.statistics}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <div className="text-sm text-muted-foreground">{t.totalVisits}</div>
            <div className="text-2xl font-bold text-[var(--ep-blue)]">{totalVisits}</div>
          </div>
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
            <div className="text-sm text-muted-foreground">{t.totalTime}</div>
            <div className="text-2xl font-bold text-[var(--ep-green)]">{totalDuration} min</div>
          </div>
          <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <div className="text-sm text-muted-foreground">{t.avgTime}</div>
            <div className="text-2xl font-bold text-[var(--ep-primary)]">{avgDurationAll} min</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
