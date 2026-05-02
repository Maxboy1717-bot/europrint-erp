import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Map, 
  ArrowLeft,
  Calendar,
  Users,
  AlertTriangle,
  Zap,
  Clock,
  User,
  MapPin,
  TrendingUp,
  Building2
} from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
  zone: string;
  violations: number;
}

interface Zone {
  id: string;
  name: string;
  nameRu: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HeatmapData {
  zones: Zone[];
  heatmapData: HeatmapCell[];
  period: string;
  metric: string;
}

interface Employee {
  id: string;
  name: string;
  department: string;
}

interface EmployeeHeatmapData {
  employee: Employee;
  trajectory: { x: number; y: number; time: string; zone: string }[];
  zoneStats: { zone: string; zoneName: string; duration: number; percentage: number }[];
  totalActiveTime: number;
  totalIdleTime: number;
  violations: number;
  productivity: number;
}

interface ZoneActivity {
  zone: string;
  visits: number;
  totalDuration: number;
  avgDuration: number;
}

interface Department {
  id: string;
  name: string;
  nameRu: string;
}

interface ZoneActivityResponse {
  department: Department;
  zoneActivities: ZoneActivity[];
}

export default function CameraHeatmap() {
  const [language, setLanguage] = useState<"uz" | "ru">("uz");
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");
  const [selectedMetric, setSelectedMetric] = useState<"movement" | "violations" | "productivity">("movement");
  const [viewMode, setViewMode] = useState<"general" | "employee" | "zone">("general");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const { data: heatmapResponse, isLoading, isError } = useQuery<HeatmapData>({
    queryKey: ["/api/camera-heatmap/data", selectedPeriod, selectedMetric],
    queryFn: async () => {
      const response = await fetch(`/api/camera-heatmap/data?period=${selectedPeriod}&metric=${selectedMetric}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch heatmap data");
      return response.json();
    }
  });

  const { data: employeesList } = useQuery<Employee[]>({
    queryKey: ["/api/camera-heatmap/employees"]
  });

  const { data: employeeHeatmap, isLoading: employeeLoading } = useQuery<EmployeeHeatmapData>({
    queryKey: ["/api/camera-heatmap/employee", selectedEmployeeId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/camera-heatmap/employee/${selectedEmployeeId}?period=${selectedPeriod}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch employee heatmap");
      return response.json();
    },
    enabled: !!selectedEmployeeId && viewMode === "employee"
  });

  const { data: departmentsList } = useQuery<Department[]>({
    queryKey: ["/api/erp/team-analytics/departments"]
  });

  const { data: zoneActivityResponse, isLoading: zoneActivityLoading } = useQuery<ZoneActivityResponse>({
    queryKey: ["/api/erp/team-analytics/zone-activity", selectedDepartmentId, selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/erp/team-analytics/zone-activity/${selectedDepartmentId}?period=${selectedPeriod}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch zone activity data");
      return response.json();
    },
    enabled: !!selectedDepartmentId && viewMode === "zone"
  });

  const t = {
    title: language === "uz" ? "Issiqlik Xaritasi" : "Тепловая карта",
    subtitle: language === "uz" ? "Ishlab chiqarish maydonida faollik vizualizatsiyasi" : "Визуализация активности на производстве",
    back: language === "uz" ? "Orqaga" : "Назад",
    today: language === "uz" ? "Bugun" : "Сегодня",
    week: language === "uz" ? "Hafta" : "Неделя",
    month: language === "uz" ? "Oy" : "Месяц",
    movement: language === "uz" ? "Harakat" : "Движение",
    violations: language === "uz" ? "Buzilishlar" : "Нарушения",
    productivity: language === "uz" ? "Samaradorlik" : "Производительность",
    legend: language === "uz" ? "Izoh" : "Легенда",
    low: language === "uz" ? "Past" : "Низкая",
    medium: language === "uz" ? "O'rta" : "Средняя",
    high: language === "uz" ? "Yuqori" : "Высокая",
    zones: language === "uz" ? "Zonalar" : "Зоны",
    production: language === "uz" ? "Ishlab chiqarish" : "Производство",
    warehouse: language === "uz" ? "Ombor" : "Склад",
    loading: language === "uz" ? "Yuklash" : "Погрузка",
    office: language === "uz" ? "Ofis" : "Офис",
    hotspots: language === "uz" ? "Faol nuqtalar" : "Горячие точки",
    generalView: language === "uz" ? "Umumiy ko'rinish" : "Общий вид",
    employeeView: language === "uz" ? "Xodim bo'yicha" : "По сотруднику",
    zoneActivityView: language === "uz" ? "Bo'lim bo'yicha" : "По зонам",
    selectEmployee: language === "uz" ? "Xodimni tanlang" : "Выберите сотрудника",
    selectDepartment: language === "uz" ? "Bo'limni tanlang" : "Выберите отдел",
    trajectory: language === "uz" ? "Harakat traektoriyasi" : "Траектория движения",
    timeInZones: language === "uz" ? "Zonalarda o'tkazgan vaqt" : "Время в зонах",
    activeTime: language === "uz" ? "Faol vaqt" : "Активное время",
    idleTime: language === "uz" ? "Bo'sh vaqt" : "Время простоя",
    productivityScore: language === "uz" ? "Samaradorlik balli" : "Балл производительности",
    minutes: language === "uz" ? "daqiqa" : "минут",
    noEmployee: language === "uz" ? "Xodim tanlanmagan" : "Сотрудник не выбран",
    noDepartment: language === "uz" ? "Bo'lim tanlanmagan" : "Отдел не выбран",
    zoneActivity: language === "uz" ? "Bo'lim bo'yicha faollik" : "Активность по зонам",
    zoneName: language === "uz" ? "Zona nomi" : "Название зоны",
    visits: language === "uz" ? "Tashrif" : "Посещения",
    duration: language === "uz" ? "Davomiyliq" : "Продолжительность",
    avgDuration: language === "uz" ? "O'rtacha davomiyliq" : "Средняя длительность"
  };

  const zoneColors: Record<string, string> = {
    production: "bg-blue-500",
    warehouse: "bg-green-500",
    loading: "bg-yellow-500",
    office: "bg-purple-500"
  };

  const zones = safeArray<Zone>(heatmapResponse?.zones).map(z => ({
    ...z,
    name: language === "uz" ? z.name : z.nameRu,
    color: zoneColors[z.id] || "bg-gray-500"
  }));

  const heatmapData = heatmapResponse?.heatmapData || [];

  const getIntensityColor = (intensity: number): string => {
    if (intensity < 0.3) return "bg-green-200";
    if (intensity < 0.5) return "bg-yellow-200";
    if (intensity < 0.7) return "bg-orange-300";
    if (intensity < 0.85) return "bg-red-400";
    return "bg-red-600";
  };

  const hotspots = heatmapData
    .filter(cell => cell.intensity > 0.7)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-surface min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/camera-dashboard">
              <Button variant="ghost" size="sm" className="rounded-lg text-on-surface-variant hover:bg-surface-container-low" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t.back}
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Issiqlik <span className="font-bold text-primary">Xaritasi</span>
          </h1>
          <p className="text-on-surface-variant">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPeriod} onValueChange={(v: "today" | "week" | "month") => setSelectedPeriod(v)}>
            <SelectTrigger className="w-[130px] bg-surface border-outline-variant rounded-lg h-9" data-testid="select-period">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-container-lowest border-outline-variant">
              <SelectItem value="today">{t.today}</SelectItem>
              <SelectItem value="week">{t.week}</SelectItem>
              <SelectItem value="month">{t.month}</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === "general" && (
            <Select value={selectedMetric} onValueChange={(v: "movement" | "violations" | "productivity") => setSelectedMetric(v)}>
              <SelectTrigger className="w-[160px] bg-surface border-outline-variant rounded-lg h-9" data-testid="select-metric">
                <Zap className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-lowest border-outline-variant">
                <SelectItem value="movement">{t.movement}</SelectItem>
                <SelectItem value="violations">{t.violations}</SelectItem>
                <SelectItem value="productivity">{t.productivity}</SelectItem>
              </SelectContent>
            </Select>
          )}

          {viewMode === "employee" && (
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="w-[200px] bg-surface border-outline-variant rounded-lg h-9" data-testid="select-employee">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.selectEmployee} />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-lowest border-outline-variant">
                {safeArray<Employee>(employeesList).map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {viewMode === "zone" && (
            <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
              <SelectTrigger className="w-[200px] bg-surface border-outline-variant rounded-lg h-9" data-testid="select-department">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.selectDepartment} />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-lowest border-outline-variant">
                {safeArray<Department>(departmentsList).map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {language === "uz" ? dept.name : dept.nameRu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex rounded-lg border border-outline-variant overflow-hidden">
            <Button 
              variant={language === "uz" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("uz")}
              data-testid="button-lang-uz"
            >
              UZ
            </Button>
            <Button 
              variant={language === "ru" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("ru")}
              data-testid="button-lang-ru"
            >
              RU
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "general" | "employee" | "zone")} className="space-y-6">
        <TabsList className="bg-surface-container-low p-1 rounded-lg">
          <TabsTrigger value="general" className="rounded-md data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-general">
            <Users className="h-4 w-4 mr-2" />
            {t.generalView}
          </TabsTrigger>
          <TabsTrigger value="employee" className="rounded-md data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-employee">
            <User className="h-4 w-4 mr-2" />
            {t.employeeView}
          </TabsTrigger>
          <TabsTrigger value="zone" className="rounded-md data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-zone">
            <Building2 className="h-4 w-4 mr-2" />
            {t.zoneActivityView}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
                <CardHeader className="bg-surface-container-low/50 py-4 px-6">
                  <CardTitle className="text-lg font-bold text-on-surface">{t.title}</CardTitle>
                  <CardDescription className="text-on-surface-variant">
                    {language === "uz" ? "Ishlab chiqarish maydonidagi faollik xaritasi" : "Карта активности производственной площади"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative">
                    <div className="grid grid-cols-10 gap-1 aspect-square max-w-[500px] mx-auto">
                      {(Array.isArray(heatmapData) ? heatmapData : []).map((cell, index) => (
                        <div
                          key={`k-${index}`}
                          className={`${getIntensityColor(cell.intensity)} rounded transition-all hover:scale-110 cursor-pointer`}
                          style={{ aspectRatio: "1/1" }}
                          title={`${cell.zone}: ${Math.round(cell.intensity * 100)}%`}
                          data-testid={`heatmap-cell-${cell.x}-${cell.y}`}
                        />
                      ))}
                    </div>

                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {(Array.isArray(zones) ? zones : []).map(zone => (
                        <Badge 
                          key={zone.id} 
                          variant="outline" 
                          className="bg-surface/80 backdrop-blur-sm border-outline-variant text-[10px] font-bold uppercase"
                          data-testid={`badge-zone-${zone.id}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${zone.color} mr-1`} />
                          {zone.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t.low}</span>
                    <div className="flex gap-1.5">
                      <div className="w-10 h-3 bg-green-200 rounded-full" />
                      <div className="w-10 h-3 bg-yellow-200 rounded-full" />
                      <div className="w-10 h-3 bg-orange-300 rounded-full" />
                      <div className="w-10 h-3 bg-red-400 rounded-full" />
                      <div className="w-10 h-3 bg-red-600 rounded-full" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t.high}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
                <CardHeader className="bg-surface-container-low/50 py-4 px-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    {t.hotspots}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {(Array.isArray(hotspots) ? hotspots : []).map((spot, index) => (
                      <div 
                        key={`k-${index}`} 
                        className="flex items-center justify-between p-3 rounded-lg bg-surface border border-outline-variant"
                        data-testid={`hotspot-${index}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getIntensityColor(spot.intensity)}`} />
                          <span className="font-bold text-on-surface capitalize">{spot.zone}</span>
                        </div>
                        <Badge className="bg-surface-container text-on-surface-variant border-none rounded-full px-2 py-0.5 font-bold">
                          {Math.round(spot.intensity * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
                <CardHeader className="bg-surface-container-low/50 py-4 px-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
                    <Users className="h-5 w-5 text-blue-500" />
                    {t.zones}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {(Array.isArray(zones) ? zones : []).map(zone => {
                      const zoneCells = (Array.isArray(heatmapData) ? heatmapData : []).filter(c => c.zone === zone.id);
                      const avgIntensity = zoneCells.length > 0 ? ((Array.isArray(zoneCells) ? zoneCells : []).reduce((s, c) => s + c.intensity, 0) / zoneCells.length) : 0;
                      return (
                        <div 
                          key={zone.id} 
                          className="space-y-1.5"
                          data-testid={`zone-stat-${zone.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${zone.color}`} />
                              <span className="text-sm font-bold text-on-surface">{zone.name}</span>
                            </div>
                            <span className="text-xs font-bold text-on-surface-variant">
                              {Math.round(avgIntensity * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={avgIntensity * 100} 
                            className="h-1.5 bg-surface-container"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
                <CardHeader className="bg-surface-container-low/50 py-4 px-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
                    <Clock className="h-5 w-5 text-green-500" />
                    {language === "uz" ? "Vaqt bo'yicha" : "По времени"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {([["08:00-10:00", 0.65], ["10:00-12:00", 0.82], ["12:00-14:00", 0.48], ["14:00-16:00", 0.87], ["16:00-18:00", 0.71]]).map(([time, intensity], i) => {
                      return (
                        <div key={String(time)} className="space-y-1.5" data-testid={`time-slot-${i}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-on-surface">{String(time)}</span>
                            <span className="text-xs font-bold text-on-surface-variant">{Math.round(Number(intensity) * 100)}%</span>
                          </div>
                          <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                            <div 
                              className={`${getIntensityColor(Number(intensity))} h-full transition-all`}
                              style={{ width: `${Number(intensity) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="employee">
          {!selectedEmployeeId ? (
            <Card className="p-12 text-center">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.noEmployee}</h3>
              <p className="text-muted-foreground">{t.selectEmployee}</p>
            </Card>
          ) : employeeLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-32" />
            </div>
          ) : employeeHeatmap ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
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
                          const isInTrajectory = employeeHeatmap.trajectory?.some(t => t.x === x && t.y === y);
                          const trajectoryPoint = employeeHeatmap.trajectory?.find(t => t.x === x && t.y === y);
                          return (
                            <div
                              key={`k-${index}`}
                              className={`rounded transition-all ${isInTrajectory ? "bg-blue-500 ring-2 ring-blue-300" : "bg-muted/30"}`}
                              style={{ aspectRatio: "1/1" }}
                              title={trajectoryPoint ? `${trajectoryPoint.time} - ${trajectoryPoint.zone}` : ""}
                              data-testid={`employee-cell-${x}-${y}`}
                            />
                          );
                        })}
                      </div>
                      <svg className="absolute inset-0 pointer-events-none max-w-[500px] mx-auto" viewBox="0 0 100 100">
                        <polyline
                          fill="none"
                          stroke="rgb(59, 130, 246)"
                          strokeWidth="0.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={(Array.isArray(employeeHeatmap.trajectory) ? employeeHeatmap.trajectory : []).map(t => `${t.x * 10 + 5},${t.y * 10 + 5}`).join(" ")}
                        />
                        {(Array.isArray(employeeHeatmap.trajectory) ? employeeHeatmap.trajectory : []).map((t, i) => (
                          <circle key={`k-${i}`} cx={t.x * 10 + 5} cy={t.y * 10 + 5} r="1.5" fill="rgb(59, 130, 246)" />
                        ))}
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-500" />
                      {t.timeInZones}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(Array.isArray(employeeHeatmap.zoneStats) ? employeeHeatmap.zoneStats : []).map(stat => (
                        <div key={stat.zone} className="space-y-1" data-testid={`zone-time-${stat.zone}`}>
                          <div className="flex justify-between text-sm">
                            <span>{stat.zoneName}</span>
                            <span className="font-medium">{stat.duration} {t.minutes}</span>
                          </div>
                          <Progress value={stat.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      {t.productivityScore}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary">{employeeHeatmap.productivity}%</div>
                        <p className="text-sm text-muted-foreground">{t.productivityScore}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <div className="text-lg font-semibold text-green-600">{employeeHeatmap.totalActiveTime}</div>
                          <p className="text-xs text-muted-foreground">{t.activeTime} ({t.minutes})</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                          <div className="text-lg font-semibold text-red-600">{employeeHeatmap.totalIdleTime}</div>
                          <p className="text-xs text-muted-foreground">{t.idleTime} ({t.minutes})</p>
                        </div>
                      </div>
                      {employeeHeatmap.violations > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">{employeeHeatmap.violations} {t.violations.toLowerCase()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="zone">
          {!selectedDepartmentId ? (
            <Card className="p-12 text-center">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.noDepartment}</h3>
              <p className="text-muted-foreground">{t.selectDepartment}</p>
            </Card>
          ) : zoneActivityLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96" />
              <Skeleton className="h-32" />
            </div>
          ) : zoneActivityResponse ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      {t.zoneActivity}
                    </CardTitle>
                    <CardDescription>
                      {zoneActivityResponse.department.name} - {selectedPeriod}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={zoneActivityResponse.zoneActivities}
                        margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="zone" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => Math.round(value as number)}
                          labelStyle={{ color: "black" }}
                        />
                        <Legend />
                        <Bar dataKey="visits" fill="#3b82f6" name={t.visits} />
                        <Bar dataKey="totalDuration" fill="#10b981" name={t.duration} />
                        <Bar dataKey="avgDuration" fill="#f59e0b" name={t.avgDuration} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-purple-500" />
                      {t.zones}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(Array.isArray(zoneActivityResponse.zoneActivities) ? zoneActivityResponse.zoneActivities : []).map((activity, index) => (
                        <div 
                          key={activity.zone} 
                          className="p-3 rounded-lg bg-muted/50"
                          data-testid={`zone-activity-card-${index}`}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-sm">{activity.zone}</span>
                            <Badge variant="secondary">{activity.visits} {t.visits.toLowerCase()}</Badge>
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      {language === "uz" ? "Statistika" : "Статистика"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {zoneActivityResponse.zoneActivities.length > 0 && (
                        <>
                          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <div className="text-sm text-muted-foreground">{language === "uz" ? "Jami tashrif" : "Всего посещений"}</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {zoneActivityResponse.zoneActivities?.reduce((sum, a) => sum + a.visits, 0)}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <div className="text-sm text-muted-foreground">{language === "uz" ? "Jami vaqt" : "Общее время"}</div>
                            <div className="text-2xl font-bold text-green-600">
                              {Math.round(zoneActivityResponse.zoneActivities?.reduce((sum, a) => sum + a.totalDuration, 0))} min
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                            <div className="text-sm text-muted-foreground">{language === "uz" ? "O'rtacha vaqt" : "Среднее время"}</div>
                            <div className="text-2xl font-bold text-orange-600">
                              {Math.round(
                                zoneActivityResponse.zoneActivities?.reduce((sum, a) => sum + a.avgDuration, 0) / 
                                zoneActivityResponse.zoneActivities.length
                              )} min
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
