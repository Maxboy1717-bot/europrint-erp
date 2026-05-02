import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Shield,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Cpu,
  Users,
  Lightbulb,
  Eye,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

const labels: Record<string, Record<string, string>> = {
  uz: {
    title: "AI Kamera Analitikasi",
    subtitle: "Sun'iy intellekt asosida kamera monitoringi tahlili",
    safetyScore: "Xavfsizlik balli",
    qualityScore: "Sifat balli",
    productivityScore: "Samaradorlik balli",
    violationsToday: "Bugungi buzilishlar",
    resolvedPercent: "Hal qilingan %",
    trendVsYesterday: "Kechaga nisbatan",
    safetyTrends: "Xavfsizlik tendentsiyalari (30 kun)",
    qualityDefects: "Sifat nuqsonlari taqsimoti",
    productivityOverview: "Samaradorlik ko'rsatkichlari",
    topPerformers: "Eng yaxshi xodimlar",
    bottomPerformers: "Yaxshilanish kerak",
    machineUtilization: "Mashina foydalanish",
    anomalyFeed: "Anomaliyalar oqimi",
    recommendations: "AI tavsiyalari",
    running: "Ishlayapti",
    idle: "Bekor",
    stopped: "To'xtagan",
    score: "Ball",
    employee: "Xodim",
    overall: "Umumiy",
    units: "birlik",
    defectsToday: "Bugungi nuqsonlar",
    eventsToday: "Bugungi hodisalar",
    avgScore: "O'rtacha ball",
    resolved: "Hal qilingan",
    unresolved: "Hal qilinmagan",
    tear: "Yirtiq",
    crush: "Ezilish",
    misprint: "Noto'g'ri bosma",
    misalignment: "Noto'g'ri joylashish",
    glue_issue: "Yelim muammosi",
    dimension_error: "O'lcham xatosi",
    other: "Boshqa",
  },
  ru: {
    title: "AI Аналитика камер",
    subtitle: "Анализ мониторинга камер на основе искусственного интеллекта",
    safetyScore: "Балл безопасности",
    qualityScore: "Балл качества",
    productivityScore: "Балл продуктивности",
    violationsToday: "Нарушения сегодня",
    resolvedPercent: "Решено %",
    trendVsYesterday: "По сравнению со вчера",
    safetyTrends: "Тренды безопасности (30 дней)",
    qualityDefects: "Распределение дефектов качества",
    productivityOverview: "Показатели продуктивности",
    topPerformers: "Лучшие сотрудники",
    bottomPerformers: "Необходимо улучшение",
    machineUtilization: "Использование оборудования",
    anomalyFeed: "Лента аномалий",
    recommendations: "Рекомендации AI",
    running: "Работает",
    idle: "Простой",
    stopped: "Остановлено",
    score: "Балл",
    employee: "Сотрудник",
    overall: "Общий",
    units: "единиц",
    defectsToday: "Дефектов сегодня",
    eventsToday: "Событий сегодня",
    avgScore: "Средний балл",
    resolved: "Решено",
    unresolved: "Не решено",
    tear: "Разрыв",
    crush: "Смятие",
    misprint: "Ошибка печати",
    misalignment: "Смещение",
    glue_issue: "Проблема клея",
    dimension_error: "Ошибка размера",
    other: "Другое",
  },
};

interface AISummary {
  safetyScore: number;
  qualityScore: number;
  productivityScore: number;
  totalViolationsToday: number;
  trendVsYesterday: number;
  resolvedPercent: number;
  totalEventsToday: number;
}

interface SafetyTrendsData {
  daily: Array<{
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
}

interface DefectDistribution {
  defectType: string;
  count: number;
}

interface QualityAnalysisData {
  distribution: DefectDistribution[];
}

interface Performer {
  userId: string;
  fullName: string;
  avgScore: string | number;
}

interface ProductivityData {
  topPerformers: Performer[];
  bottomPerformers: Performer[];
}

interface MachineInfo {
  name?: string;
  workCenterId?: string;
  runningPercent: number;
  idlePercent: number;
  stoppedPercent: number;
}

interface MachineUtilizationData {
  machines: MachineInfo[];
  overall?: {
    runningPercent: number;
    idlePercent: number;
    stoppedPercent: number;
  };
}

interface Anomaly {
  id: string;
  title: string;
  titleRu?: string;
  severity: string;
  timestamp?: string;
  isResolved: boolean;
}

interface Recommendation {
  priority: string;
  titleRu?: string;
  titleUz?: string;
  descriptionRu?: string;
  descriptionUz?: string;
}

interface AnomalyData {
  anomalies: Anomaly[];
  recommendations: Recommendation[];
}

const DEFECT_COLORS = ["#f97316", "#ef4444", "#8b5cf6", "#06b6d4", "#eab308", "#22c55e", "#64748b"];
const SEVERITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-green-500/10 border-green-500/20";
  if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

export default function CameraAIAnalytics() {
  const { t, language } = useTranslation('common');
  const l = labels[language] || labels.uz;

  const { data: summary, isLoading: summaryLoading, isError, refetch} = useQuery<AISummary>({
    queryKey: ["/api/camera-ai/summary"],
  });

  const { data: safetyTrends, isLoading: safetyLoading } = useQuery<SafetyTrendsData>({
    queryKey: ["/api/camera-ai/safety-trends"],
  });

  const { data: qualityData, isLoading: qualityLoading } = useQuery<QualityAnalysisData>({
    queryKey: ["/api/camera-ai/quality-analysis"],
  });

  const { data: productivityData, isLoading: productivityLoading } = useQuery<ProductivityData>({
    queryKey: ["/api/camera-ai/productivity-scores"],
  });

  const { data: machineData, isLoading: machineLoading } = useQuery<MachineUtilizationData>({
    queryKey: ["/api/camera-ai/machine-utilization"],
  });

  const { data: anomalyData, isLoading: anomalyLoading } = useQuery<AnomalyData>({
    queryKey: ["/api/camera-ai/anomaly-detection"],
  });

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {l.title}
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
            {l.subtitle}
          </p>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-1 px-0 text-muted-foreground">
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="text-xs">Yangilash</span>
          </Button>
        </div>
        <Badge variant="outline" className="gap-1" data-testid="badge-ai-status">
          <Sparkles className="w-3 h-3" />
          AI Analytics
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <ScoreCard
          label={l.safetyScore}
          value={summary?.safetyScore ?? 0}
          icon={<Shield className="w-5 h-5" />}
          loading={summaryLoading}
          testId="card-safety-score"
        />
        <ScoreCard
          label={l.qualityScore}
          value={summary?.qualityScore ?? 0}
          icon={<CheckCircle className="w-5 h-5" />}
          loading={summaryLoading}
          testId="card-quality-score"
        />
        <ScoreCard
          label={l.productivityScore}
          value={summary?.productivityScore ?? 0}
          icon={<Activity className="w-5 h-5" />}
          loading={summaryLoading}
          testId="card-productivity-score"
        />
        <Card className="border" data-testid="card-violations-today">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="w-4 h-4" />
              {l.violationsToday}
            </div>
            <div className="text-2xl font-bold">
              {summaryLoading ? "..." : summary?.totalViolationsToday ?? 0}
            </div>
            {summary?.trendVsYesterday !== undefined && summary.trendVsYesterday !== 0 && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${summary.trendVsYesterday > 0 ? "text-red-500" : "text-green-500"}`}>
                {summary.trendVsYesterday > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {summary.trendVsYesterday > 0 ? "+" : ""}
                {summary.trendVsYesterday}% {l.trendVsYesterday}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border" data-testid="card-resolved-percent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle className="w-4 h-4" />
              {l.resolvedPercent}
            </div>
            <div className="text-2xl font-bold">
              {summaryLoading ? "..." : `${summary?.resolvedPercent ?? 0}%`}
            </div>
          </CardContent>
        </Card>
        <Card className="border" data-testid="card-events-today">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Eye className="w-4 h-4" />
              {l.eventsToday}
            </div>
            <div className="text-2xl font-bold">
              {summaryLoading ? "..." : summary?.totalEventsToday ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border lg:col-span-2" data-testid="card-safety-trends">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">{l.safetyTrends}</CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {safetyLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">{t('loading')}</div>
            ) : safetyTrends?.daily?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={safetyTrends.daily}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(v: string) => v}
                  />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name={t('critical')} />
                  <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.5} name={t('high')} />
                  <Area type="monotone" dataKey="medium" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.4} name={t('medium')} />
                  <Area type="monotone" dataKey="low" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name={t('low')} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">{t('noData')}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border" data-testid="card-quality-defects">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">{l.qualityDefects}</CardTitle>
          </CardHeader>
          <CardContent>
            {qualityLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">{t('loading')}</div>
            ) : qualityData?.distribution?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={(Array.isArray(qualityData.distribution) ? qualityData.distribution : []).map((d: DefectDistribution) => ({
                      name: l[d.defectType] || d.defectType,
                      value: Number(d.count),
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(Array.isArray(qualityData.distribution) ? qualityData.distribution : []).map((_: DefectDistribution, i: number) => (
                      <Cell key={`k-${i}`} fill={DEFECT_COLORS[i % DEFECT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">{t('noData')}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border" data-testid="card-productivity-overview">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">{l.productivityOverview}</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {productivityLoading ? (
              <div className="h-60 flex items-center justify-center text-muted-foreground">{t('loading')}</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">{l.topPerformers}</h4>
                  {productivityData?.topPerformers?.length ? (
                    <div className="space-y-2">
                      {(Array.isArray(productivityData?.topPerformers) ? productivityData.topPerformers : []).slice(0, 5).map((p: Performer, i: number) => (
                        <div
                          key={p.userId}
                          className="flex items-center justify-between gap-2 text-sm"
                          data-testid={`row-top-performer-${i}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground w-5 text-right shrink-0">{i + 1}.</span>
                            <span className="truncate">{p.fullName}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`text-sm font-semibold ${getScoreColor(Number(p.avgScore))}`}>
                              {Number(p.avgScore).toFixed(0)}
                            </div>
                            <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-500"
                                style={{ width: `${Math.min(Number(p.avgScore), 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('noData')}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">{l.bottomPerformers}</h4>
                  {productivityData?.bottomPerformers?.length ? (
                    <div className="space-y-2">
                      {(Array.isArray(productivityData.bottomPerformers) ? productivityData.bottomPerformers : []).map((p: Performer, i: number) => (
                        <div
                          key={p.userId}
                          className="flex items-center justify-between gap-2 text-sm"
                          data-testid={`row-bottom-performer-${i}`}
                        >
                          <span className="truncate">{p.fullName}</span>
                          <div className={`text-sm font-semibold ${getScoreColor(Number(p.avgScore))}`}>
                            {Number(p.avgScore).toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('noData')}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border" data-testid="card-machine-utilization">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">{l.machineUtilization}</CardTitle>
            <Cpu className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {machineLoading ? (
              <div className="h-60 flex items-center justify-center text-muted-foreground">{t('loading')}</div>
            ) : machineData?.machines?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={(Array.isArray(machineData?.machines) ? machineData.machines : []).slice(0, 10).map((m: MachineInfo) => ({
                    name: (m.name || m.workCenterId || "").slice(0, 12),
                    [l.running]: m.runningPercent,
                    [l.idle]: m.idlePercent,
                    [l.stopped]: m.stoppedPercent,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey={l.running} stackId="a" fill="#22c55e" />
                  <Bar dataKey={l.idle} stackId="a" fill="#eab308" />
                  <Bar dataKey={l.stopped} stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground">
                {machineData?.overall ? (
                  <div className="text-center space-y-2">
                    <p className="text-sm">{l.overall}</p>
                    <div className="flex gap-4 justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-500">{machineData.overall.runningPercent}%</div>
                        <div className="text-xs text-muted-foreground">{l.running}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-500">{machineData.overall.idlePercent}%</div>
                        <div className="text-xs text-muted-foreground">{l.idle}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-500">{machineData.overall.stoppedPercent}%</div>
                        <div className="text-xs text-muted-foreground">{l.stopped}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  t('noData')
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border" data-testid="card-anomaly-feed">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">{l.anomalyFeed}</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {anomalyLoading ? (
              <div className="h-60 flex items-center justify-center text-muted-foreground">{t('loading')}</div>
            ) : anomalyData?.anomalies?.length ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {(Array.isArray(anomalyData?.anomalies) ? anomalyData.anomalies : []).slice(0, 15).map((a: Anomaly) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 p-2 rounded-md bg-muted/30"
                    data-testid={`anomaly-item-${a.id}`}
                  >
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs"
                      style={{
                        borderColor: SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.medium,
                        color: SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.medium,
                      }}
                    >
                      {l[a.severity] || a.severity}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {language === "ru" && a.titleRu ? a.titleRu : a.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.timestamp ? new Date(a.timestamp).toLocaleString(language === "ru" ? "ru-RU" : "uz-UZ") : ""}
                      </p>
                    </div>
                    <Badge variant={a.isResolved ? "default" : "secondary"} className="shrink-0 text-xs">
                      {a.isResolved ? l.resolved : l.unresolved}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground">{t('noData')}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border" data-testid="card-recommendations">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">{l.recommendations}</CardTitle>
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {anomalyLoading ? (
              <div className="h-60 flex items-center justify-center text-muted-foreground">{t('loading')}</div>
            ) : anomalyData?.recommendations?.length ? (
              <div className="space-y-3">
                {(Array.isArray(anomalyData.recommendations) ? anomalyData.recommendations : []).map((r: Recommendation, i: number) => (
                  <div
                    key={`k-${i}`}
                    className="p-3 rounded-md bg-muted/30 space-y-1"
                    data-testid={`recommendation-${i}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="shrink-0 text-xs"
                        style={{
                          borderColor: SEVERITY_COLORS[r.priority] || SEVERITY_COLORS.medium,
                          color: SEVERITY_COLORS[r.priority] || SEVERITY_COLORS.medium,
                        }}
                      >
                        {l[r.priority] || r.priority}
                      </Badge>
                      <span className="text-sm font-medium">
                        {language === "ru" ? r.titleRu : r.titleUz}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "ru" ? r.descriptionRu : r.descriptionUz}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground">{t('noData')}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  icon,
  loading,
  testId,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
  testId: string;
}) {
  return (
    <Card className={`border ${getScoreBg(value)}`} data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          {icon}
          {label}
        </div>
        <div className={`text-3xl font-bold ${getScoreColor(value)}`}>
          {loading ? "..." : value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">/ 100</div>
      </CardContent>
    </Card>
  );
}
