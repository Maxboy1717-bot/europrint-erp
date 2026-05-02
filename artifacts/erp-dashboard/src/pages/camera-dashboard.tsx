import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { 
  Camera, 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  Settings,
  Bell,
  RefreshCw,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  HardDrive,
  Gauge,
  Factory,
  User,
  BarChart3,
  MapPin
} from "lucide-react";
import { Link } from "wouter";
import { ErrorState } from "@/components/ui/error-state";

interface DashboardStats {
  date: string;
  totalCameras: number;
  activeCameras: number;
  totalEvents: number;
  safetyViolationsCount: number;
  qualityDefectsCount: number;
  unresolvedAlerts: number;
  avgProductivityScore: number;
  runningMachines: number;
  stoppedMachines: number;
  idleMachines: number;
}

interface CameraEvent {
  id: string;
  cameraId: string;
  eventType: string;
  severity: string;
  eventDate: string;
  eventTime: string;
  description: string;
  status: string;
  createdAt: string;
}

interface CameraAlert {
  id: number;
  cameraId: string;
  alertType: string;
  severity: string;
  title: string;
  titleRu: string;
  message: string;
  isAcknowledged: boolean;
  isResolved: boolean;
  createdAt: string;
}

interface CameraInfo {
  id: string;
  code: string;
  name: string;
  nameRu: string;
  location: string;
  isActive: boolean;
}

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const alertTypeIcons: Record<string, typeof Shield> = {
  safety: Shield,
  quality: CheckCircle,
  productivity: Activity,
  machine: Factory,
  system: Settings
};

const eventTypeLabels: Record<string, { uz: string; ru: string }> = {
  telefon_ishlatish: { uz: "Telefon ishlatish", ru: "Использование телефона" },
  uyqu: { uz: "Uxlash", ru: "Сон" },
  loqaydlik: { uz: "Loqaydlik", ru: "Безразличие" },
  himoya_kiyimi_yoq: { uz: "Himoya kiyimi yo'q", ru: "Нет защитной одежды" },
  bosh_turish: { uz: "Bo'sh turish", ru: "Простой" },
  unknown_face: { uz: "Noma'lum shaxs", ru: "Неизвестное лицо" },
  near_miss: { uz: "Xavfli holat", ru: "Опасная ситуация" },
  safety_violation: { uz: "Xavfsizlik buzilishi", ru: "Нарушение безопасности" },
  quality_issue: { uz: "Sifat muammosi", ru: "Проблема качества" },
  downtime: { uz: "To'xtab qolish", ru: "Простой" }
};

export default function CameraDashboard() {
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation('common');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isError} = useQuery<DashboardStats>({
    queryKey: ["/api/camera-dashboard/stats"]
  });

  const { data: recentEvents, isLoading: eventsLoading, refetch: refetchEvents } = useQuery<CameraEvent[]>({
    queryKey: ["/api/camera-dashboard/recent-events"]
  });

  const { data: pendingAlerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery<CameraAlert[]>({
    queryKey: ["/api/camera-dashboard/pending-alerts"]
  });

  const { data: cameras, isLoading: camerasLoading } = useQuery<CameraInfo[]>({
    queryKey: ["/api/cameras"]
  });

  const safePendingAlerts = safeArray<CameraAlert>(pendingAlerts);
  const safeRecentEvents = safeArray<CameraEvent>(recentEvents);
  const safeCameraInfos = safeArray<CameraInfo>(cameras);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchStats();
        refetchEvents();
        refetchAlerts();
      }, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, refetchStats, refetchEvents, refetchAlerts]);

  const handleRefresh = () => {
    refetchStats();
    refetchEvents();
    refetchAlerts();
    toast({
      title: t('refresh'),
      description: language === "uz" ? "Ma'lumotlar yangilandi" : "Данные обновлены"
    });
  };

  if (isError) {
    return <ErrorState onRetry={refetchStats} />;
  }

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {([...Array(8)]).map((_, i) => (
            <Skeleton key={`k-${i}`} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Kamera <span className="font-bold text-primary">AI Monitoring</span>
          </h1>
          <p className="text-on-surface-variant">
            {language === "uz" ? "Real-vaqt monitoring va analitika" : "Мониторинг и аналитика в реальном времени"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="rounded-lg px-4"
            onClick={() => setAutoRefresh(!autoRefresh)}
            data-testid="button-auto-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            {language === "uz" ? "Avtomatik yangilash" : "Автообновление"}
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg" onClick={handleRefresh} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-cameras-stat">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{language === "uz" ? "Kameralar" : "Камеры"}</span>
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-on-surface">{stats?.activeCameras || 0}/{stats?.totalCameras || 0}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className={`h-2 w-2 rounded-full ${(stats?.activeCameras || 0) > 0 ? "bg-green-500 animate-pulse" : "bg-error"}`} />
            <p className="text-xs text-on-surface-variant">{t('active')}</p>
          </div>
          <Progress 
            value={stats?.totalCameras ? ((stats.activeCameras / stats.totalCameras) * 100) : 0} 
            className="mt-4 h-1.5 bg-surface-container"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-events-stat">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{language === "uz" ? "Hodisalar" : "События"}</span>
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-on-surface">{stats?.totalEvents || 0}</div>
          <p className="text-xs text-on-surface-variant mt-1">{t('today')}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-safety-stat">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{language === "uz" ? "Xavfsizlik" : "Безопасность"}</span>
            <Shield className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-orange-600">{stats?.safetyViolationsCount || 0}</div>
          <p className="text-xs text-on-surface-variant mt-1">{language === "uz" ? "Buzilishlar" : "Нарушения"}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-quality-stat">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{language === "uz" ? "Sifat" : "Качество"}</span>
            <CheckCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-blue-600">{stats?.qualityDefectsCount || 0}</div>
          <p className="text-xs text-on-surface-variant mt-1">{language === "uz" ? "Nuqsonlar" : "Дефекты"}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-alerts-stat">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('notifications')}</span>
            <Bell className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-red-600">{stats?.unresolvedAlerts || 0}</div>
          <p className="text-xs text-on-surface-variant mt-1">{t('pending')}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-productivity-stat">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{language === "uz" ? "Samaradorlik" : "Производительность"}</span>
            <Gauge className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-green-600">
            {stats?.avgProductivityScore ? Math.round(stats.avgProductivityScore) : 0}%
          </div>
          <p className="text-xs text-on-surface-variant mt-1">{t('average')}</p>
          <Progress 
            value={stats?.avgProductivityScore || 0} 
            className="mt-4 h-1.5 bg-surface-container"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-machines-running">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{language === "uz" ? "Mashinalar" : "Машины"}</span>
            <Factory className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-green-600">{stats?.runningMachines || 0}</span>
            <span className="text-sm font-medium text-on-surface-variant">{language === "uz" ? "Ishlayapti" : "Работают"}</span>
          </div>
          <div className="flex gap-4 mt-2 text-xs font-semibold">
            <span className="text-yellow-600">{stats?.idleMachines || 0} {language === "uz" ? "BO'SH" : "ПРОСТОЙ"}</span>
            <span className="text-red-600">{stats?.stoppedMachines || 0} {language === "uz" ? "TO'XTAGAN" : "ОСТАНОВ"}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-date">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('date')}</span>
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-on-surface">{stats?.date || new Date().toISOString().split('T')[0]}</div>
          <p className="text-xs text-on-surface-variant mt-1">
            {new Date().toLocaleTimeString(language === "uz" ? "uz-UZ" : "ru-RU")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/cameras">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group" data-testid="link-cameras-management">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{language === "uz" ? "Kameralar" : "Камеры"}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">{language === "uz" ? "Boshqarish" : "Управление"}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/camera-safety">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group" data-testid="link-safety-monitoring">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{language === "uz" ? "Xavfsizlik" : "Безопасность"}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">{language === "uz" ? "Nazorat" : "Контроль"}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/camera-quality">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group" data-testid="link-quality-control">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{language === "uz" ? "Sifat" : "Качество"}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">{language === "uz" ? "Nazorat" : "Контроль"}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/camera-employees">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group" data-testid="link-employees-monitoring">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{language === "uz" ? "Xodimlar" : "Сотрудники"}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">{language === "uz" ? "Kuzatuv" : "Мониторинг"}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/camera-machines">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group" data-testid="link-machines-status">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{language === "uz" ? "Mashinalar" : "Машины"}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">{language === "uz" ? "Holat" : "Статус"}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/camera-live-monitoring">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group" data-testid="link-live-monitoring">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{language === "uz" ? "Jonli ko'rish" : "Живой просмотр"}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Real-vaqt</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/erp/cameras/reports">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group" data-testid="link-reports">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{t('reports')}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Analitika</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/camera-heatmap">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group" data-testid="link-heatmap">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">{language === "uz" ? "Issiqlik" : "Тепловая"}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Xarita</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none" data-testid="card-pending-alerts">
          <CardHeader className="bg-surface-container-low/50 flex flex-row items-center justify-between gap-2 py-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                {language === "uz" ? "Kutilayotgan ogohlantirishlar" : "Ожидающие уведомления"}
              </CardTitle>
              <CardDescription className="text-on-surface-variant">
                {safePendingAlerts.length} {t('pending')}
              </CardDescription>
            </div>
            <Link href="/camera-alerts">
              <Button variant="outline" size="sm" className="rounded-lg font-semibold" data-testid="link-view-all-alerts">
                {t('seeAll')}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[300px]">
              {alertsLoading ? (
                <div className="space-y-3">
                  {([...Array(3)]).map((_, i) => (
                    <Skeleton key={`k-${i}`} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : safePendingAlerts.length > 0 ? (
                <div className="space-y-3">
                  {safePendingAlerts.slice(0, 5).map((alert) => {
                    const IconComponent = alertTypeIcons[alert.alertType] || AlertCircle;
                    return (
                      <div 
                        key={alert.id} 
                        className="flex items-start gap-4 p-4 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container-low transition-colors group"
                        data-testid={`alert-item-${alert.id}`}
                      >
                        <div className={`p-2.5 rounded-lg ${
                          alert.severity === "critical" ? "bg-red-100 text-red-600" :
                          alert.severity === "high" ? "bg-orange-100 text-orange-600" :
                          "bg-yellow-100 text-yellow-600"
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-on-surface truncate">
                              {language === "uz" ? alert.title : (alert.titleRu || alert.title)}
                            </p>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                              {new Date(alert.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant line-clamp-1 mb-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={`${
                              alert.severity === "critical" ? "bg-red-100 text-red-800" :
                              alert.severity === "high" ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            } border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`} variant="outline">
                              {alert.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mb-2 text-green-500" />
                  <p>{language === "uz" ? "Kutilayotgan ogohlantirish yo'q" : "Нет ожидающих уведомлений"}</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none" data-testid="card-recent-events">
          <CardHeader className="bg-surface-container-low/50 flex flex-row items-center justify-between gap-2 py-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
                <Activity className="h-5 w-5 text-blue-500" />
                {language === "uz" ? "So'nggi hodisalar" : "Последние события"}
              </CardTitle>
              <CardDescription className="text-on-surface-variant">
                {recentEvents?.length || 0} {language === "uz" ? "hodisalar" : "события"}
              </CardDescription>
            </div>
            <Link href="/camera-alerts">
              <Button variant="outline" size="sm" className="rounded-lg font-semibold" data-testid="link-view-all-events">
                {t('seeAll')}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            <ScrollArea className="h-[300px]">
              {eventsLoading ? (
                <div className="space-y-3">
                  {([...Array(3)]).map((_, i) => (
                    <Skeleton key={`k-${i}`} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : safeRecentEvents.length > 0 ? (
                <div className="space-y-3">
                  {safeRecentEvents.slice(0, 5).map((event) => {
                    const label = eventTypeLabels[event.eventType] || { uz: event.eventType, ru: event.eventType };
                    return (
                      <div 
                        key={event.id} 
                        className="flex items-start gap-4 p-4 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container-low transition-colors group"
                        data-testid={`event-item-${event.id}`}
                      >
                        <div className={`p-2.5 rounded-lg ${
                          event.severity === "critical" ? "bg-red-100 text-red-600" :
                          event.severity === "high" ? "bg-orange-100 text-orange-600" :
                          event.severity === "medium" ? "bg-yellow-100 text-yellow-600" :
                          "bg-blue-100 text-blue-600"
                        }`}>
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-on-surface">
                              {language === "uz" ? label.uz : label.ru}
                            </p>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                              {event.eventTime || new Date(event.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant line-clamp-1 mb-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={`${
                              event.severity === "critical" ? "bg-red-100 text-red-800" :
                              event.severity === "high" ? "bg-orange-100 text-orange-800" :
                              event.severity === "medium" ? "bg-yellow-100 text-yellow-800" :
                              "bg-blue-100 text-blue-800"
                            } border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`} variant="outline">
                              {event.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant py-12">
                  <Activity className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-bold">{language === "uz" ? "Bugun hodisa yo'q" : "Сегодня нет событий"}</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none" data-testid="card-camera-grid">
        <CardHeader className="bg-surface-container-low/50 flex flex-row items-center justify-between gap-2 py-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
              <Camera className="h-5 w-5 text-primary" />
              {language === "uz" ? "Kameralar holati" : "Статус камер"}
            </CardTitle>
            <CardDescription className="text-on-surface-variant">
              {cameras?.length || 0} {language === "uz" ? "kameralar" : "камеры"}
            </CardDescription>
          </div>
          <Link href="/cameras">
            <Button variant="outline" size="sm" className="rounded-lg font-semibold" data-testid="link-manage-cameras">
              <Settings className="h-4 w-4 mr-1" />
              {language === "uz" ? "Boshqarish" : "Управление"}
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-4">
          {camerasLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {([...Array(5)]).map((_, i) => (
                <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : safeCameraInfos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {safeCameraInfos.slice(0, 10).map((camera) => (
                <div
                  key={camera.id}
                  className={`p-4 rounded-lg border-2 transition-all group ${
                    camera.isActive 
                      ? "bg-surface border-outline-variant hover:border-green-500" 
                      : "bg-surface-container-low border-transparent opacity-60"
                  }`}
                  data-testid={`camera-card-${camera.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{camera.code}</span>
                    <div className={`h-2 w-2 rounded-full ${camera.isActive ? "bg-green-500 animate-pulse" : "bg-error"}`} />
                  </div>
                  <p className="font-bold text-on-surface truncate mb-1">
                    {language === "uz" ? camera.name : (camera.nameRu || camera.name)}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider truncate">
                    <MapPin className="h-3 w-3" />
                    {camera.location}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <Camera className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-bold">{t('noResults')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/camera-safety">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group shadow-none" data-testid="link-safety-module">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Shield className="h-10 w-10 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-on-surface text-center">
                {language === "uz" ? "Xavfsizlik Nazorati" : "Контроль безопасности"}
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/camera-quality">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group shadow-none" data-testid="link-quality-module">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-10 w-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-on-surface text-center">
                {language === "uz" ? "Sifat Nazorati" : "Контроль качества"}
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/camera-employees">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group shadow-none" data-testid="link-employees-module">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="h-10 w-10 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-on-surface text-center">
                {language === "uz" ? "Xodim Kuzatuvi" : "Мониторинг сотрудников"}
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/europrint/camera-ai-analytics">
          <Card className="bg-surface-container-lowest hover:bg-surface-container-high border-none rounded-lg transition-all cursor-pointer overflow-hidden group shadow-none" data-testid="link-ai-analytics">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Activity className="h-10 w-10 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-on-surface text-center">
                {language === "uz" ? "AI Analitika" : "AI Аналитика"}
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
