import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  Eye,
  Activity,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Timer,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { ErrorState } from "@/components/ui/error-state";

type Language = "uz" | "ru";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  totalMinutes: number;
  workZoneMinutes: number;
  restZoneMinutes: number;
  detectionCount: number;
  status: string;
}

interface ZoneHistory {
  id: string;
  userId: string;
  cameraId: string;
  zoneName: string;
  trackingDate: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  visitCount: number;
}

interface Employee {
  id: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  photoUrl?: string;
}

const translations = {
  uz: {
    title: "Xodimlar Kuzatuvi Hisoboti",
    subtitle: "Zona va vaqt statistikasi",
    dailyAttendance: "Kunlik Davomad",
    weeklyStats: "Haftalik Statistika",
    zoneActivity: "Zona Faolligi",
    employeeDetails: "Xodim Ma'lumotlari",
    selectDate: "Sanani tanlang",
    selectEmployee: "Xodimni tanlang",
    allEmployees: "Barcha xodimlar",
    employee: "Xodim",
    firstSeen: "Birinchi ko'rilgan",
    lastSeen: "Oxirgi ko'rilgan",
    totalTime: "Jami vaqt",
    workZone: "Ish zonasi",
    restZone: "Dam olish",
    detections: "Aniqlashlar",
    status: "Holat",
    present: "Kelgan",
    absent: "Kelmagan",
    late: "Kechikkan",
    zone: "Zona",
    entryTime: "Kirish",
    exitTime: "Chiqish",
    duration: "Davomiylik",
    visits: "Tashriflar",
    hours: "soat",
    minutes: "daqiqa",
    noData: "Ma'lumot topilmadi",
    loading: "Yuklanmoqda...",
    today: "Bugun",
    thisWeek: "Bu hafta",
    thisMonth: "Bu oy",
    avgTimePerDay: "Kunlik o'rtacha vaqt",
    mostActiveZone: "Eng faol zona",
    totalDetections: "Jami aniqlashlar",
    presentEmployees: "Kelgan xodimlar",
    zoneDistribution: "Zona taqsimoti",
    timeTracking: "Vaqt kuzatuvi",
    productivity: "Samaradorlik",
  },
  ru: {
    title: "Отчёт по Отслеживанию Сотрудников",
    subtitle: "Статистика зон и времени",
    dailyAttendance: "Ежедневная Посещаемость",
    weeklyStats: "Недельная Статистика",
    zoneActivity: "Активность Зон",
    employeeDetails: "Данные Сотрудника",
    selectDate: "Выберите дату",
    selectEmployee: "Выберите сотрудника",
    allEmployees: "Все сотрудники",
    employee: "Сотрудник",
    firstSeen: "Первое появление",
    lastSeen: "Последнее появление",
    totalTime: "Общее время",
    workZone: "Рабочая зона",
    restZone: "Отдых",
    detections: "Обнаружения",
    status: "Статус",
    present: "Присутствует",
    absent: "Отсутствует",
    late: "Опоздал",
    zone: "Зона",
    entryTime: "Вход",
    exitTime: "Выход",
    duration: "Длительность",
    visits: "Посещения",
    hours: "часов",
    minutes: "минут",
    noData: "Данные не найдены",
    loading: "Загрузка...",
    today: "Сегодня",
    thisWeek: "Эта неделя",
    thisMonth: "Этот месяц",
    avgTimePerDay: "Среднее время в день",
    mostActiveZone: "Самая активная зона",
    totalDetections: "Всего обнаружений",
    presentEmployees: "Присутствующие сотрудники",
    zoneDistribution: "Распределение зон",
    timeTracking: "Отслеживание времени",
    productivity: "Продуктивность",
  },
};

const ZONE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function EmployeeTrackingReport() {
  const [language, setLanguage] = useState<Language>("uz");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const t = translations[language];

  const { data: attendance = [], isLoading: attendanceLoading, isError, refetch} = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/daily-attendance?date=${selectedDate}`],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/users'],
  });

  const { data: zoneHistory = [], refetch: refetchZoneHistory } = useQuery<ZoneHistory[]>({
    queryKey: [`/api/employee-zone-history/${expandedEmployee}`],
    enabled: !!expandedEmployee,
  });

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleTimeString(language === "uz" ? "uz-UZ" : "ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ${t.hours} ${mins} ${t.minutes}`;
    }
    return `${mins} ${t.minutes}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      present: { label: t.present, variant: "default" as const },
      absent: { label: t.absent, variant: "destructive" as const },
      late: { label: t.late, variant: "secondary" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const totalPresentEmployees = (Array.isArray(attendance) ? attendance : []).filter(a => a.status === "present").length;
  const totalDetectionsSum = (Array.isArray(attendance) ? attendance : []).reduce((sum, a) => sum + (a.detectionCount || 0), 0);
  const avgMinutes = attendance.length > 0 
    ? Math.round((Array.isArray(attendance) ? attendance : []).reduce((sum, a) => sum + (a.totalMinutes || 0), 0) / attendance.length) 
    : 0;

  const zoneDistributionData = (Array.isArray(attendance) ? attendance : []).reduce((acc, record) => {
    const workZone = record.workZoneMinutes || 0;
    const restZone = record.restZoneMinutes || 0;
    
    if (workZone > 0) {
      const existing = (Array.isArray(acc) ? acc : []).find(d => d.name === (language === "uz" ? "Ish zonasi" : "Рабочая зона"));
      if (existing) {
        existing.value += workZone;
      } else {
        acc.push({ name: language === "uz" ? "Ish zonasi" : "Рабочая зона", value: workZone });
      }
    }
    
    if (restZone > 0) {
      const existing = (Array.isArray(acc) ? acc : []).find(d => d.name === (language === "uz" ? "Dam olish" : "Отдых"));
      if (existing) {
        existing.value += restZone;
      } else {
        acc.push({ name: language === "uz" ? "Dam olish" : "Отдых", value: restZone });
      }
    }
    
    return acc;
  }, [] as { name: string; value: number }[]);

  const hourlyData = Array.from({ length: 14 }, (_, i) => {
    const hour = 7 + i;
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;
    
    const hourAttendance = (Array.isArray(attendance) ? attendance : []).filter(a => {
      if (!a.firstSeenAt) return false;
      const firstDate = new Date(a.firstSeenAt);
      const lastDate = a.lastSeenAt ? new Date(a.lastSeenAt) : firstDate;
      
      const firstMinutes = firstDate.getHours() * 60 + firstDate.getMinutes();
      const lastMinutes = lastDate.getHours() * 60 + lastDate.getMinutes();
      
      return firstMinutes < hourEnd && lastMinutes >= hourStart;
    });
    return {
      hour: `${hour}:00`,
      employees: hourAttendance.length,
    };
  });

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-surface min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Xodimlar <span className="font-bold text-primary">Kuzatuvi</span>
          </h1>
          <p className="text-on-surface-variant -mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container p-1 rounded-lg">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 bg-surface-container-lowest border-none shadow-none h-9"
            data-testid="input-date-select"
          />
          <Button
            variant="outline"
            className="bg-surface-container-lowest text-on-surface rounded-md px-4 py-1.5 text-xs font-semibold hover:bg-surface-container-high border-none shadow-none"
            onClick={() => setLanguage(language === "uz" ? "ru" : "uz")}
            data-testid="button-lang-toggle"
          >
            {language === "uz" ? "RU" : "UZ"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t.presentEmployees}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-present-count">{totalPresentEmployees}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t.avgTimePerDay}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-avg-time">{formatDuration(avgMinutes)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t.totalDetections}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-total-detections">{totalDetectionsSum}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t.productivity}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-productivity">
            {attendance.length > 0 ? Math.round((totalPresentEmployees / Math.max(employees.length, 1)) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t.timeTracking}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="employees"
                  stroke="#3b82f6"
                  name={t.presentEmployees}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t.zoneDistribution}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {zoneDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={zoneDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(Array.isArray(zoneDistributionData) ? zoneDistributionData : []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ZONE_COLORS[index % ZONE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t.noData}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
            <Table>
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
                      className="hover-elevate cursor-pointer"
                      onClick={() => {
                        setExpandedEmployee(expandedEmployee === record.employeeId ? null : record.employeeId);
                      }}
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
                      <TableCell>{formatTime(record.firstSeenAt)}</TableCell>
                      <TableCell>{formatTime(record.lastSeenAt)}</TableCell>
                      <TableCell>{formatDuration(record.totalMinutes || 0)}</TableCell>
                      <TableCell>{formatDuration(record.workZoneMinutes || 0)}</TableCell>
                      <TableCell>{formatDuration(record.restZoneMinutes || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.detectionCount || 0}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status || "present")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          {expandedEmployee === record.employeeId ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedEmployee === record.employeeId && zoneHistory.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/50 p-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {t.zoneActivity}
                            </h4>
                            <Table>
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
                                  <TableRow key={zone.id}>
                                    <TableCell>
                                      <Badge variant="secondary">{zone.zoneName || "Unknown"}</Badge>
                                    </TableCell>
                                    <TableCell>{zone.entryTime || "-"}</TableCell>
                                    <TableCell>{zone.exitTime || "-"}</TableCell>
                                    <TableCell>{formatDuration(zone.durationMinutes || 0)}</TableCell>
                                    <TableCell>{zone.visitCount || 1}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
