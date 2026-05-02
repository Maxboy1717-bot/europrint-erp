import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Play,
  Bell,
  BellOff,
  Loader2,
  Database,
  BarChart3,
  TrendingUp,
  GraduationCap,
  ShoppingCart,
  Factory,
  Package,
  Landmark,
  Users,
  UserCheck,
  Warehouse as WarehouseIcon,
  Shield,
  Megaphone,
  Cpu,
  Camera,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import type { AiReportCategory, AiReportDefinition, AiReportRun, AiReportSubscription } from "@shared/schema";
import { ErrorState } from "@/components/ui/error-state";

const iconMap: Record<string, typeof FileText> = {
  GraduationCap, ShoppingCart, Factory, Package, Landmark,
  Users, UserCheck, Warehouse: WarehouseIcon, Shield, Megaphone,
  Cpu, Camera, TrendingUp,
};

const t = {
  uz: {
    title: "Hisobotlar markazi",
    subtitle: "155+ avtomatlashtirilgan hisobotlarni boshqarish",
    totalReports: "Jami hisobotlar",
    runsToday: "Bugungi ishga tushirishlar",
    insightsGenerated: "Yaratilgan tahlillar",
    activeSubscriptions: "Faol obunalar",
    categories: "Kategoriyalar",
    reports: "Hisobotlar",
    recentRuns: "So'nggi ishga tushirishlar",
    subscriptions: "Obunalar",
    seedButton: "155+ hisobotlarni yaratish",
    seeding: "Yaratilmoqda...",
    generate: "Ishga tushirish",
    generating: "Ishga tushirilmoqda...",
    subscribe: "Obuna bo'lish",
    unsubscribe: "Obunadan chiqish",
    name: "Nomi",
    module: "Modul",
    frequency: "Chastota",
    lastRun: "Oxirgi ishga tushirish",
    status: "Holat",
    actions: "Amallar",
    reportCount: "hisobot",
    noReports: "Hisobotlar topilmadi",
    noRuns: "Ishga tushirishlar topilmadi",
    noSubscriptions: "Obunalar topilmadi",
    back: "Orqaga",
    completed: "Yakunlangan",
    running: "Ishlayapti",
    failed: "Xatolik",
    pending: "Kutilmoqda",
    daily: "Kunlik",
    weekly: "Haftalik",
    monthly: "Oylik",
    realtime: "Real vaqt",
    active: "Faol",
    inactive: "Nofaol",
    generateSuccess: "Hisobot muvaffaqiyatli ishga tushirildi",
    subscribeSuccess: "Obuna muvaffaqiyatli yaratildi",
    unsubscribeSuccess: "Obuna bekor qilindi",
    seedSuccess: "Hisobotlar muvaffaqiyatli yaratildi",
    error: "Xatolik yuz berdi",
    loading: "Yuklanmoqda...",
    runId: "ID",
    report: "Hisobot",
    startedAt: "Boshlangan",
    duration: "Davomiyligi",
    channel: "Kanal",
    schedule: "Jadval",
  },
  ru: {
    title: "Центр отчётов",
    subtitle: "Управление 155+ автоматизированными отчётами",
    totalReports: "Всего отчётов",
    runsToday: "Запусков сегодня",
    insightsGenerated: "Сгенерировано аналитик",
    activeSubscriptions: "Активных подписок",
    categories: "Категории",
    reports: "Отчёты",
    recentRuns: "Последние запуски",
    subscriptions: "Подписки",
    seedButton: "Создать 155+ отчётов",
    seeding: "Создаётся...",
    generate: "Запустить",
    generating: "Запускается...",
    subscribe: "Подписаться",
    unsubscribe: "Отписаться",
    name: "Название",
    module: "Модуль",
    frequency: "Частота",
    lastRun: "Последний запуск",
    status: "Статус",
    actions: "Действия",
    reportCount: "отчётов",
    noReports: "Отчёты не найдены",
    noRuns: "Запуски не найдены",
    noSubscriptions: "Подписки не найдены",
    back: "Назад",
    completed: "Завершён",
    running: "Выполняется",
    failed: "Ошибка",
    pending: "Ожидание",
    daily: "Ежедневно",
    weekly: "Еженедельно",
    monthly: "Ежемесячно",
    realtime: "Реальное время",
    active: "Активен",
    inactive: "Неактивен",
    generateSuccess: "Отчёт успешно запущен",
    subscribeSuccess: "Подписка успешно создана",
    unsubscribeSuccess: "Подписка отменена",
    seedSuccess: "Отчёты успешно созданы",
    error: "Произошла ошибка",
    loading: "Загрузка...",
    runId: "ID",
    report: "Отчёт",
    startedAt: "Начат",
    duration: "Длительность",
    channel: "Канал",
    schedule: "Расписание",
  },
};

interface DashboardData {
  totalReports: number;
  runsToday: number;
  insightsGenerated: number;
  activeSubscriptions: number;
  categories: AiReportCategory[];
}

export default function ReportsHub() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const lang = language === "ru" ? "ru" : "uz";
  const tr = t[lang];

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("categories");

  const { data: dashboard, isLoading: dashboardLoading, isError, refetch} = useQuery<DashboardData>({
    queryKey: ["/api/reports-hub/dashboard"],
  });

  const { data: definitions, isLoading: definitionsLoading } = useQuery<AiReportDefinition[]>({
    queryKey: ["/api/reports-hub/definitions", { categoryId: selectedCategoryId }],
    queryFn: async () => {
      const res = await fetch(`/api/reports-hub/definitions?categoryId=${selectedCategoryId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch definitions");
      return res.json();
    },
    enabled: selectedCategoryId !== null,
  });

  const { data: runs, isLoading: runsLoading } = useQuery<AiReportRun[]>({
    queryKey: ["/api/reports-hub/runs"],
    enabled: activeTab === "runs",
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery<AiReportSubscription[]>({
    queryKey: ["/api/reports-hub/subscriptions"],
    enabled: activeTab === "subscriptions",
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reports-hub/seed-categories"),
    onSuccess: () => {
      toast({ title: tr.seedSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-hub"] });
    },
    onError: () => {
      toast({ title: tr.error, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: (definitionId: number) =>
      apiRequest("POST", `/api/reports-hub/generate/${definitionId}`),
    onSuccess: () => {
      toast({ title: tr.generateSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-hub"] });
    },
    onError: () => {
      toast({ title: tr.error, variant: "destructive" });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: (reportId: number) =>
      apiRequest("POST", "/api/reports-hub/subscriptions", { reportId }),
    onSuccess: () => {
      toast({ title: tr.subscribeSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-hub/subscriptions"] });
    },
    onError: () => {
      toast({ title: tr.error, variant: "destructive" });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/reports-hub/subscriptions/${id}`),
    onSuccess: () => {
      toast({ title: tr.unsubscribeSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-hub/subscriptions"] });
    },
    onError: () => {
      toast({ title: tr.error, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      running: "secondary",
      failed: "destructive",
      pending: "outline",
    };
    const labels: Record<string, string> = {
      completed: tr.completed,
      running: tr.running,
      failed: tr.failed,
      pending: tr.pending,
    };
    return (
      <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getScheduleLabel = (schedule: string | null) => {
    const labels: Record<string, string> = {
      daily: tr.daily,
      weekly: tr.weekly,
      monthly: tr.monthly,
      realtime: tr.realtime,
    };
    return labels[schedule || "daily"] || schedule;
  };

  const getCategoryIcon = (iconName: string | null) => {
    const Icon = iconMap[iconName || ""] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }
  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6" data-testid="reports-hub-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface" data-testid="text-page-title">
            Hisobotlar <span className="font-bold text-primary">Markazi</span>
          </h1>
          <p className="text-on-surface-variant mt-2" data-testid="text-page-subtitle">
            {tr.subtitle}
          </p>
        </div>
        <Button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          variant="outline"
          data-testid="button-seed-reports"
        >
          {seedMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          {seedMutation.isPending ? tr.seeding : tr.seedButton}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-stat-total-reports">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tr.totalReports}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-total-reports">
            {dashboard?.totalReports || 0}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-stat-runs-today">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tr.runsToday}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-runs-today">
            {dashboard?.runsToday || 0}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-stat-insights">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tr.insightsGenerated}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-insights-count">
            {dashboard?.insightsGenerated || 0}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-stat-subscriptions">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tr.activeSubscriptions}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-active-subs">
            {dashboard?.activeSubscriptions || 0}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "categories") setSelectedCategoryId(null); }}>
        <TabsList data-testid="tabs-reports-hub">
          <TabsTrigger value="categories" data-testid="tab-categories">{tr.categories}</TabsTrigger>
          <TabsTrigger value="runs" data-testid="tab-runs">{tr.recentRuns}</TabsTrigger>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">{tr.subscriptions}</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          {selectedCategoryId !== null ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedCategoryId(null)}
                data-testid="button-back-categories"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tr.back}
              </Button>

              {definitionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : definitions && definitions.length > 0 ? (
                <Card>
                  <Table data-testid="table-definitions">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tr.name}</TableHead>
                        <TableHead>{tr.frequency}</TableHead>
                        <TableHead>{tr.status}</TableHead>
                        <TableHead className="text-right">{tr.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(definitions) ? definitions : []).map((def) => (
                        <TableRow key={def.id} className="hover:bg-surface-container-low transition-colors" data-testid={`row-definition-${def.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium" data-testid={`text-def-name-${def.id}`}>
                                {lang === "ru" ? def.nameRu : def.name}
                              </p>
                              <p className="text-xs text-on-surface-variant">{def.code}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-schedule-${def.id}`}>
                              {getScheduleLabel(def.schedule)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={def.isActive ? "default" : "secondary"}
                              data-testid={`badge-active-${def.id}`}
                            >
                              {def.isActive ? tr.active : tr.inactive}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => generateMutation.mutate(def.id)}
                                disabled={generateMutation.isPending}
                                data-testid={`button-generate-${def.id}`}
                              >
                                {generateMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Play className="h-3 w-3 mr-1" />
                                )}
                                {tr.generate}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => subscribeMutation.mutate(def.id)}
                                disabled={subscribeMutation.isPending}
                                data-testid={`button-subscribe-${def.id}`}
                              >
                                <Bell className="h-3 w-3 mr-1" />
                                {tr.subscribe}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-reports">
                    {tr.noReports}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(dashboard?.categories || []).map((cat) => (
                <div
                  key={cat.id}
                  className="bg-surface-container-lowest rounded-lg p-5 hover:bg-surface-container-low cursor-pointer hover-elevate transition-all"
                  onClick={() => { setSelectedCategoryId(cat.id); }}
                  data-testid={`card-category-${cat.code}`}
                >
                  <div className="flex items-start gap-3">
                      <div
                        className="rounded-md p-2"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <span style={{ color: cat.color || undefined }}>
                          {getCategoryIcon(cat.icon)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`text-cat-name-${cat.code}`}>
                          {lang === "ru" ? cat.nameRu : cat.name}
                        </p>
                        <p className="text-xs text-on-surface-variant" data-testid={`text-cat-count-${cat.code}`}>
                          {cat.reportCount || 0} {tr.reportCount}
                        </p>
                      </div>
                    </div>
                </div>
              ))}
              {(!dashboard?.categories || dashboard.categories.length === 0) && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-categories">
                    {tr.noReports}. {tr.seedButton}.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          {runsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : runs && runs.length > 0 ? (
            <Card>
              <Table data-testid="table-runs">
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr.runId}</TableHead>
                    <TableHead>{tr.report}</TableHead>
                    <TableHead>{tr.status}</TableHead>
                    <TableHead>{tr.startedAt}</TableHead>
                    <TableHead>{tr.duration}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(runs) ? runs : []).map((run) => (
                    <TableRow key={run.id} data-testid={`row-run-${run.id}`}>
                      <TableCell className="font-mono text-sm" data-testid={`text-run-id-${run.id}`}>
                        #{run.id}
                      </TableCell>
                      <TableCell data-testid={`text-run-report-${run.id}`}>
                        {run.reportId ? `Report #${run.reportId}` : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell className="text-sm" data-testid={`text-run-started-${run.id}`}>
                        {run.startedAt
                          ? new Date(run.startedAt).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-run-duration-${run.id}`}>
                        {run.executionTimeMs ? `${(run.executionTimeMs / 1000).toFixed(1)}s` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-runs">
                {tr.noRuns}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {subsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptions && subscriptions.length > 0 ? (
            <Card>
              <Table data-testid="table-subscriptions">
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr.report}</TableHead>
                    <TableHead>{tr.channel}</TableHead>
                    <TableHead>{tr.schedule}</TableHead>
                    <TableHead className="text-right">{tr.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(subscriptions) ? subscriptions : []).map((sub) => (
                    <TableRow key={sub.id} data-testid={`row-sub-${sub.id}`}>
                      <TableCell data-testid={`text-sub-report-${sub.id}`}>
                        Report #{sub.reportId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid={`badge-sub-channel-${sub.id}`}>
                          {sub.deliveryChannel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid={`badge-sub-schedule-${sub.id}`}>
                          {getScheduleLabel(sub.schedule)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => unsubscribeMutation.mutate(sub.id)}
                          disabled={unsubscribeMutation.isPending}
                          data-testid={`button-unsubscribe-${sub.id}`}
                        >
                          <BellOff className="h-3 w-3 mr-1" />
                          {tr.unsubscribe}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-subs">
                {tr.noSubscriptions}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
