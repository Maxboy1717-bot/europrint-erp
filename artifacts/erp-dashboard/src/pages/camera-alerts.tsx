import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, safeArray } from "@/lib/queryClient";
import { 
  Bell, 
  Shield, 
  CheckCircle, 
  Factory,
  Activity,
  AlertTriangle,
  Search,
  Filter,
  Check,
  X,
  ArrowLeft,
  Clock,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { ErrorState } from "@/components/ui/error-state";

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
  acknowledgedBy: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

const alertTypeIcons: Record<string, typeof Shield> = {
  safety: Shield,
  quality: CheckCircle,
  machine: Factory,
  productivity: Activity,
  system: AlertTriangle
};

const alertTypeLabels: Record<string, { uz: string; ru: string }> = {
  safety: { uz: "Xavfsizlik", ru: "Безопасность" },
  quality: { uz: "Sifat", ru: "Качество" },
  machine: { uz: "Mashina", ru: "Машина" },
  productivity: { uz: "Samaradorlik", ru: "Производительность" },
  system: { uz: "Tizim", ru: "Система" }
};

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

const severityLabels: Record<string, { uz: string; ru: string }> = {
  low: { uz: "Past", ru: "Низкий" },
  medium: { uz: "O'rta", ru: "Средний" },
  high: { uz: "Yuqori", ru: "Высокий" },
  critical: { uz: "Kritik", ru: "Критический" }
};

export default function CameraAlerts() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<"uz" | "ru">("uz");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: alerts, isLoading, isError, refetch} = useQuery<CameraAlert[]>({
    queryKey: ["/api/camera-alerts"]
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/camera-alerts/${id}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera-alerts"] });
      toast({
        title: language === "uz" ? "Tasdiqlandi" : "Подтверждено",
        description: language === "uz" ? "Ogohlantirish tasdiqlandi" : "Уведомление подтверждено"
      });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/camera-alerts/${id}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera-alerts"] });
      toast({
        title: language === "uz" ? "Hal qilindi" : "Решено",
        description: language === "uz" ? "Ogohlantirish hal qilindi" : "Уведомление решено"
      });
    }
  });

  const t = {
    title: language === "uz" ? "Bildirishnomalar Markazi" : "Центр уведомлений",
    subtitle: language === "uz" ? "Barcha AI kamera ogohlantirishlarini boshqarish" : "Управление всеми уведомлениями AI камер",
    back: language === "uz" ? "Orqaga" : "Назад",
    search: language === "uz" ? "Qidirish..." : "Поиск...",
    type: language === "uz" ? "Turi" : "Тип",
    severity: language === "uz" ? "Darajasi" : "Уровень",
    status: language === "uz" ? "Holati" : "Статус",
    all: language === "uz" ? "Barchasi" : "Все",
    pending: language === "uz" ? "Kutilmoqda" : "Ожидает",
    acknowledged: language === "uz" ? "Tasdiqlangan" : "Подтверждено",
    resolved: language === "uz" ? "Hal qilingan" : "Решено",
    message: language === "uz" ? "Xabar" : "Сообщение",
    time: language === "uz" ? "Vaqt" : "Время",
    actions: language === "uz" ? "Amallar" : "Действия",
    acknowledge: language === "uz" ? "Tasdiqlash" : "Подтвердить",
    resolve: language === "uz" ? "Hal qilish" : "Решить",
    noAlerts: language === "uz" ? "Ogohlantirishlar topilmadi" : "Уведомления не найдены",
    total: language === "uz" ? "Jami" : "Всего",
    unresolved: language === "uz" ? "Hal qilinmagan" : "Нерешенные",
    critical: language === "uz" ? "Kritik" : "Критические"
  };

  const safeAlerts = safeArray<CameraAlert>(alerts);

  const filteredAlerts = (Array.isArray(safeAlerts) ? safeAlerts : []).filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || alert.alertType === filterType;
    const matchesSeverity = filterSeverity === "all" || alert.severity === filterSeverity;
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "pending" && !alert.isAcknowledged) ||
      (filterStatus === "acknowledged" && alert.isAcknowledged && !alert.isResolved) ||
      (filterStatus === "resolved" && alert.isResolved);
    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });

  const totalAlerts = safeAlerts.length;
  const unresolvedAlerts = (Array.isArray(safeAlerts) ? safeAlerts : []).filter(a => !a.isResolved).length;
  const criticalAlerts = (Array.isArray(safeAlerts) ? safeAlerts : []).filter(a => a.severity === "critical" && !a.isResolved).length;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6 min-h-screen">
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
            Kamera <span className="font-bold text-primary">Ogohlantirishlari</span>
          </h1>
          <p className="text-on-surface-variant">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-outline-variant overflow-hidden">
            <Button 
              variant={language === "uz" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("uz")}
            >
              UZ
            </Button>
            <Button 
              variant={language === "ru" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("ru")}
            >
              RU
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-total-alerts">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.total}</span>
            <Bell className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-total-alerts">{totalAlerts}</div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-unresolved-alerts">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.unresolved}</span>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-orange-600" data-testid="text-unresolved-alerts">{unresolvedAlerts}</div>
        </div>

        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-critical-alerts">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.critical}</span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-red-600" data-testid="text-critical-alerts">{criticalAlerts}</div>
        </div>
      </div>

      <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
        <CardHeader className="bg-surface-container-low/50 py-4 px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <Input
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-surface border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg h-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] bg-surface border-outline-variant rounded-lg h-9" data-testid="select-type">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t.type} />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-lowest border-outline-variant">
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="safety">{language === "uz" ? "Xavfsizlik" : "Безопасность"}</SelectItem>
                  <SelectItem value="quality">{language === "uz" ? "Sifat" : "Качество"}</SelectItem>
                  <SelectItem value="machine">{language === "uz" ? "Mashina" : "Машина"}</SelectItem>
                  <SelectItem value="productivity">{language === "uz" ? "Samaradorlik" : "Производительность"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[140px] bg-surface border-outline-variant rounded-lg h-9" data-testid="select-severity">
                  <SelectValue placeholder={t.severity} />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-lowest border-outline-variant">
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="low">{language === "uz" ? "Past" : "Низкий"}</SelectItem>
                  <SelectItem value="medium">{language === "uz" ? "O'rta" : "Средний"}</SelectItem>
                  <SelectItem value="high">{language === "uz" ? "Yuqori" : "Высокий"}</SelectItem>
                  <SelectItem value="critical">{language === "uz" ? "Kritik" : "Критический"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] bg-surface border-outline-variant rounded-lg h-9" data-testid="select-status">
                  <SelectValue placeholder={t.status} />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-lowest border-outline-variant">
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="pending">{t.pending}</SelectItem>
                  <SelectItem value="acknowledged">{t.acknowledged}</SelectItem>
                  <SelectItem value="resolved">{t.resolved}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.type}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.severity}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.message}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.status}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.time}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length > 0 ? (
                  (Array.isArray(filteredAlerts) ? filteredAlerts : []).map((alert) => {
                    const IconComponent = alertTypeIcons[alert.alertType] || AlertTriangle;
                    const typeLabel = alertTypeLabels[alert.alertType]?.[language] || alert.alertType;
                    const severityLabel = severityLabels[alert.severity]?.[language] || alert.severity;
                    
                    let rowClass = "hover:bg-surface-container-low transition-colors border-none";
                    if (alert.severity === "critical" && !alert.isResolved) {
                      rowClass += " bg-error-container/20 border-l-4 border-error";
                    } else if (alert.severity === "KRITIK") {
                      rowClass += " bg-error-container/20 border-l-4 border-error";
                    }

                    return (
                      <TableRow key={alert.id} className={rowClass} data-testid={`row-alert-${alert.id}`}>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              alert.alertType === "safety" ? "bg-orange-100 text-orange-600" :
                              alert.alertType === "quality" ? "bg-blue-100 text-blue-600" :
                              alert.alertType === "machine" ? "bg-purple-100 text-purple-600" :
                              "bg-green-100 text-green-600"
                            }`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-on-surface">{typeLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className={`${
                            alert.severity === "critical" ? "bg-red-100 text-red-800" :
                            alert.severity === "high" ? "bg-orange-100 text-orange-800" :
                            alert.severity === "medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-blue-100 text-blue-800"
                          } border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                            {severityLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div>
                            <p className="font-bold text-on-surface">{language === "uz" ? alert.title : (alert.titleRu || alert.title)}</p>
                            <p className="text-xs text-on-surface-variant truncate max-w-[200px] mt-0.5">{alert.message}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {alert.isResolved ? (
                            <Badge className="bg-green-100 text-green-800 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t.resolved}
                            </Badge>
                          ) : alert.isAcknowledged ? (
                            <Badge className="bg-blue-100 text-blue-800 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              <Check className="h-3 w-3 mr-1" />
                              {t.acknowledged}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-surface-container text-on-surface-variant border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              <Clock className="h-3 w-3 mr-1" />
                              {t.pending}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(alert.createdAt).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <div className="flex items-center justify-end gap-1">
                            {!alert.isAcknowledged && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acknowledgeMutation.mutate(alert.id)}
                                disabled={acknowledgeMutation.isPending}
                                className="rounded-lg border-outline-variant hover:bg-surface-container-high"
                                data-testid={`button-acknowledge-${alert.id}`}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            {!alert.isResolved && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => resolveMutation.mutate(alert.id)}
                                disabled={resolveMutation.isPending}
                                className="bg-primary text-white hover:bg-primary/90 rounded-lg"
                                data-testid={`button-resolve-${alert.id}`}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-on-surface-variant">
                      <Bell className="h-16 w-16 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">{t.noAlerts}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
