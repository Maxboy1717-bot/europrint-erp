/**
 * @module EmployeeDetailDialog
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  AlertTriangle, 
  Shield, 
  Clock,
  Phone,
  BedDouble,
  UserX,
  HardHat,
  Coffee,
  MapPin,
  Calendar
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

import { useTranslation } from '@/lib/i18n';
interface EmployeeDetailDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CameraEvent {
  id: string | number;
  eventType: string;
  description: string;
  severity: string;
  eventDate: string;
  eventTime: string;
}

interface CameraViolation {
  id: string | number;
  eventType: string;
  description: string;
  severity: string;
  eventDate: string;
  eventTime: string;
}

interface CameraAlert {
  id: string | number;
  eventType: string;
  description: string;
  severity: string;
  eventDate: string;
  eventTime: string;
  screenshotUrl?: string;
  aiConfidence?: number;
}

interface EmployeeInfo {
  avatarUrl?: string;
  fullName: string;
  employeeId?: string;
  department?: string;
  position?: string;
}

interface EmployeeSummary {
  totalEvents?: number;
  violations?: number;
  safetyAlerts?: number;
  criticalEvents?: number;
}

interface DailyActivityItem {
  date: string;
  events: number;
  violations: number;
}

interface EmployeeDetailData {
  employee: EmployeeInfo;
  summary: EmployeeSummary;
  violationsByType: Record<string, number>;
  dailyActivity: DailyActivityItem[];
  recentEvents: CameraEvent[];
  violations: CameraViolation[];
  safetyAlerts: CameraAlert[];
}

type LucideIconComponent = typeof Phone;

const VIOLATION_LABELS: Record<string, string> = {
  telefon_ishlatish: "Telefon ishlatish",
  uyqu: "Uyqu",
  loqaydlik: "Loqaydlik",
  himoya_kiyimi_yoq: "Himoya kiyimi yo'q",
  bosh_turish: "Bosh turish",
  unknown_face: "Notanish yuz",
  near_miss: "Near-miss",
  yiqilish: "Yiqilish",
  toqnashish: "To'qnashuv",
  kamera_yopilishi: "Kamera yopilishi",
};

const VIOLATION_ICONS: Record<string, LucideIconComponent> = {
  telefon_ishlatish: Phone,
  uyqu: BedDouble,
  loqaydlik: UserX,
  himoya_kiyimi_yoq: HardHat,
  bosh_turish: Coffee,
};

export default function EmployeeDetailDialog({userId, open, onOpenChange }: EmployeeDetailDialogProps) {
  const { t } = useTranslation('common');
  const { data: employeeData, isLoading } = useQuery<EmployeeDetailData>({
    queryKey: ["/api/erp/camera-reports/employees", userId],
    queryFn: () => apiRequest<EmployeeDetailData>('GET', `/api/erp/camera-reports/employees/${userId}`),
    enabled: !!userId && open,
  });

  if (!userId || !open) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse">{t("Yuklanmoqda...")}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { employee, summary, violationsByType, dailyActivity, recentEvents, violations, safetyAlerts } = employeeData || {};

  if (!employee) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t("xodimMalumotlariTopilmadi")}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Prepare chart data
  const violationsChartData = Object.entries(violationsByType || {}).map(([type, count]) => ({
    name: VIOLATION_LABELS[type] || type,
    count: count as number,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6" data-testid="dialog-employee-detail">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("xodimMonitoringMalumotlari")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Header - Avatar + Basic Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24" data-testid="avatar-employee">
                  <AvatarImage src={employee.avatarUrl || ""} alt={employee.fullName} />
                  <AvatarFallback className="text-2xl">
                    {employee.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold" data-testid="text-employee-name">{employee.fullName}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-medium">{employee.employeeId || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("bolim")}</span>
                      <span className="font-medium">{employee.department || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("lavozim")}</span>
                      <span className="font-medium">{employee.position || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover-elevate" data-testid="card-total-events">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("jamiHodisalar")}</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.totalEvents || 0}</div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-violations">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("intizomBuzilishlari")}</CardTitle>
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{summary?.violations || 0}</div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-safety-alerts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("xavfsizlikAlerts")}</CardTitle>
                <Shield className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{summary?.safetyAlerts || 0}</div>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-critical">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("kritikHodisalar")}</CardTitle>
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{summary?.criticalEvents || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts & Data */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList>
              <TabsTrigger value="timeline" data-testid="tab-timeline">{t("tarix")}</TabsTrigger>
              <TabsTrigger value="violations" data-testid="tab-violations">{t("buzilishlar")}</TabsTrigger>
              <TabsTrigger value="alerts" data-testid="tab-alerts">{t("xavfsizlik")}</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              {/* Daily Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Kunlik Faollik (So'nggi 7 kun)</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyActivity && dailyActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="events" stroke="#8884d8" name="Jami hodisalar" />
                        <Line type="monotone" dataKey="violations" stroke="#ef4444" name="Buzilishlar" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">{t("malumotYoq")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Events Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("songgiHodisalar")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentEvents && recentEvents.length > 0 ? (
                      recentEvents.slice(0, 10).map((event: CameraEvent, index: number) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                          data-testid={`event-${index}`}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">
                                {VIOLATION_LABELS[event.eventType] || event.eventType}
                              </p>
                              <p className="text-xs text-muted-foreground">{event.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={event.severity === "critical" ? "destructive" : "secondary"}>
                              {event.severity}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.eventDate} {event.eventTime}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">{t("malumotYoq")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="violations" className="space-y-4">
              {/* Violations Chart */}
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

              {/* Violations List */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("intizomBuzilishlariRoyxati")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {violations && violations.length > 0 ? (
                      (Array.isArray(violations) ? violations : []).map((violation: CameraViolation, index: number) => {
                        const Icon = VIOLATION_ICONS[violation.eventType] || AlertTriangle;
                        return (
                          <div
                            key={violation.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                            data-testid={`violation-${index}`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-destructive" />
                              <div>
                                <p className="font-medium">{VIOLATION_LABELS[violation.eventType]}</p>
                                <p className="text-sm text-muted-foreground">{violation.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={violation.severity === "critical" ? "destructive" : "secondary"}>
                                {violation.severity}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {violation.eventDate} {violation.eventTime}
                              </p>
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
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("xavfsizlikAlerts")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {safetyAlerts && safetyAlerts.length > 0 ? (
                      (Array.isArray(safetyAlerts) ? safetyAlerts : []).map((alert: CameraAlert, index: number) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                          data-testid={`alert-${index}`}
                        >
                          <div className="flex items-center gap-4">
                            <Shield className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">{VIOLATION_LABELS[alert.eventType]}</p>
                              <p className="text-sm text-muted-foreground">{alert.description}</p>
                              {alert.screenshotUrl && (
                                <img 
                                  src={alert.screenshotUrl} 
                                  alt={t('alertScreenshot')} 
                                  className="mt-2 rounded-lg max-w-xs"
                                />
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                              {alert.severity}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {alert.eventDate} {alert.eventTime}
                            </p>
                            {alert.aiConfidence && (
                              <Badge variant="outline" className="mt-1">
                                AI: {(alert.aiConfidence * 100).toFixed(0)}%
                              </Badge>
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
