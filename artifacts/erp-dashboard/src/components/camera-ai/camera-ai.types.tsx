/**
 * @module camera-ai.types
 * @description Type-only exports (interfaces, type aliases, enums). No runtime code.
 */

import { Card, CardContent } from "@/components/ui/card";

// ── i18n labels ──────────────────────────────────────────────────────────────

export const cameraAiLabels: Record<string, Record<string, string>> = {
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

// ── Shared types ──────────────────────────────────────────────────────────────

export interface AISummary {
  safetyScore: number;
  qualityScore: number;
  productivityScore: number;
  totalViolationsToday: number;
  trendVsYesterday: number;
  resolvedPercent: number;
  totalEventsToday: number;
}

export interface SafetyTrendsData {
  daily: Array<{
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>;
}

export interface DefectDistribution {
  defectType: string;
  count: number;
}

export interface QualityAnalysisData {
  distribution: DefectDistribution[];
}

export interface Performer {
  userId: string;
  fullName: string;
  avgScore: string | number;
}

export interface ProductivityData {
  topPerformers: Performer[];
  bottomPerformers: Performer[];
}

export interface MachineInfo {
  name?: string;
  workCenterId?: string;
  runningPercent: number;
  idlePercent: number;
  stoppedPercent: number;
}

export interface MachineUtilizationData {
  machines: MachineInfo[];
  overall?: {
    runningPercent: number;
    idlePercent: number;
    stoppedPercent: number;
  };
}

export interface Anomaly {
  id: string;
  title: string;
  titleRu?: string;
  severity: string;
  timestamp?: string;
  isResolved: boolean;
}

export interface Recommendation {
  priority: string;
  titleRu?: string;
  titleUz?: string;
  descriptionRu?: string;
  descriptionUz?: string;
}

export interface AnomalyData {
  anomalies: Anomaly[];
  recommendations: Recommendation[];
}

// ── Colors & helpers ──────────────────────────────────────────────────────────

export const DEFECT_COLORS = ["#f97316", "#ef4444", "#8b5cf6", "#06b6d4", "#eab308", "#22c55e", "#64748b"];
export const SEVERITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export function getScoreColor(score: number) {
  if (score >= 80) return "text-[var(--ep-green)] dark:text-green-400";
  if (score >= 60) return "text-[var(--ep-yellow)] dark:text-yellow-400";
  return "text-[var(--ep-red)] dark:text-red-400";
}

export function getScoreBg(score: number) {
  if (score >= 80) return "bg-green-500/10 border-green-500/20";
  if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

// ── ScoreCard ─────────────────────────────────────────────────────────────────

export function ScoreCard({
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
