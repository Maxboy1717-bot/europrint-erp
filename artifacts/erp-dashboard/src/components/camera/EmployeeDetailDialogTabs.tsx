/**
 * @module EmployeeDetailDialogTabs
 * @description Three tab content panels for EmployeeDetailDialog.
 * Split from EmployeeDetailDialog.tsx (Rule 16).
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';
import type { CameraEvent, CameraViolation, CameraAlert, DailyActivityItem } from "./EmployeeDetailDialog.types";
import { VIOLATION_LABELS, VIOLATION_ICONS } from "./EmployeeDetailDialog.types";

// ── Timeline Tab ──────────────────────────────────────────────────────────────

interface TimelineTabProps {
  dailyActivity: DailyActivityItem[] | undefined;
  recentEvents: CameraEvent[] | undefined;
}

export function EmployeeTimelineTab({ dailyActivity, recentEvents }: TimelineTabProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{tLabel('common.EmployeeDetailDialog.kunlikFaollikSonggi7Kun', "Kunlik Faollik (So'nggi 7 kun)")}</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyActivity && dailyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="events" stroke="#8884d8" name={tLabel('common.EmployeeDetailDialog.jamiHodisalar', "Jami hodisalar")} />
                <Line type="monotone" dataKey="violations" stroke="#ef4444" name={tLabel('common.EmployeeDetailDialog.buzilishlar', "Buzilishlar")} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">{t("malumotYoq")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("songgiHodisalar")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentEvents && recentEvents.length > 0 ? (
              recentEvents.slice(0, 10).map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border hover-elevate" data-testid={`event-${index}`}>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{VIOLATION_LABELS[event.eventType] || event.eventType}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={event.severity === "critical" ? "destructive" : "secondary"}>{event.severity}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{event.eventDate} {event.eventTime}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">{t("malumotYoq")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Violations Tab ────────────────────────────────────────────────────────────

interface ViolationsTabProps {
  violations: CameraViolation[] | undefined;
  violationsChartData: { name: string; count: number }[];
}

export function EmployeeViolationsTab({ violations, violationsChartData }: ViolationsTabProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("buzilishlarTaqsimoti")}</CardTitle>
        </CardHeader>
        <CardContent>
          {violationsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={violationsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">{t("malumotYoq")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("intizomBuzilishlariRoyxati")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {violations && violations.length > 0 ? (
              (Array.isArray(violations) ? violations : []).map((violation, index) => {
                const Icon = VIOLATION_ICONS[violation.eventType] ?? AlertTriangle;
                return (
                  <div key={violation.id} className="flex items-center justify-between p-3 rounded-lg border hover-elevate" data-testid={`violation-${index}`}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-destructive" />
                      <div>
                        <p className="font-medium">{VIOLATION_LABELS[violation.eventType]}</p>
                        <p className="text-sm text-muted-foreground">{violation.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={violation.severity === "critical" ? "destructive" : "secondary"}>{violation.severity}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{violation.eventDate} {violation.eventTime}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-center py-8">{t("malumotYoq")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Alerts Tab ────────────────────────────────────────────────────────────────

interface AlertsTabProps {
  safetyAlerts: CameraAlert[] | undefined;
}

export function EmployeeAlertsTab({ safetyAlerts }: AlertsTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("xavfsizlikAlerts")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {safetyAlerts && safetyAlerts.length > 0 ? (
            (Array.isArray(safetyAlerts) ? safetyAlerts : []).map((alert, index) => (
              <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border hover-elevate" data-testid={`alert-${index}`}>
                <div className="flex items-center gap-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{VIOLATION_LABELS[alert.eventType]}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    {alert.screenshotUrl && (
                      <img src={alert.screenshotUrl} alt={t("alertScreenshot")} className="mt-2 rounded-lg max-w-xs" />
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>{alert.severity}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{alert.eventDate} {alert.eventTime}</p>
                  {alert.aiConfidence && (
                    <Badge variant="outline" className="mt-1">AI: {(alert.aiConfidence * 100).toFixed(0)}%</Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">{t("malumotYoq")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
