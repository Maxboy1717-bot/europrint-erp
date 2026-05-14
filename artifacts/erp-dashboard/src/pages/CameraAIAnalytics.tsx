/**
 * @module CameraAIAnalytics
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Activity, Users, Lightbulb, Eye, TrendingUp, TrendingDown, Sparkles, Shield } from "lucide-react";
import {
  cameraAiLabels,
  ScoreCard,
  SEVERITY_COLORS,
  getScoreColor,
  type AISummary,
  type SafetyTrendsData,
  type QualityAnalysisData,
  type ProductivityData,
  type MachineUtilizationData,
  type AnomalyData,
  type Performer,
  type Anomaly,
  type Recommendation,
} from "@/components/camera-ai/camera-ai.types";
import { SafetyTrendsChart } from "@/components/camera-ai/SafetyTrendsChart";
import { QualityDefectsChart } from "@/components/camera-ai/QualityDefectsChart";
import { MachineUtilizationChart } from "@/components/camera-ai/MachineUtilizationChart";
import { EPErrorState } from "@/components/ep";

export default function CameraAIAnalytics() {
  const { t, language } = useTranslation('common');
  const l = cameraAiLabels[language] ?? cameraAiLabels.uz;

  const { data: summary, isLoading: summaryLoading, isError, refetch } = useQuery<AISummary>({
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
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{l.title}</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">{l.subtitle}</p>
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

      {/* KPI score cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <ScoreCard label={l.safetyScore}       value={summary?.safetyScore ?? 0}       icon={<Shield      className="w-5 h-5" />} loading={summaryLoading} testId="card-safety-score" />
        <ScoreCard label={l.qualityScore}      value={summary?.qualityScore ?? 0}      icon={<CheckCircle className="w-5 h-5" />} loading={summaryLoading} testId="card-quality-score" />
        <ScoreCard label={l.productivityScore} value={summary?.productivityScore ?? 0} icon={<Activity    className="w-5 h-5" />} loading={summaryLoading} testId="card-productivity-score" />

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
              <div className={`flex items-center gap-1 text-xs mt-1 ${summary.trendVsYesterday > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}`}>
                {summary.trendVsYesterday > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {summary.trendVsYesterday > 0 ? "+" : ""}{summary.trendVsYesterday}% {l.trendVsYesterday}
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

      {/* Safety trends + quality defects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SafetyTrendsChart data={safetyTrends} loading={safetyLoading} title={l.safetyTrends} t={t} />
        <QualityDefectsChart data={qualityData} loading={qualityLoading} title={l.qualityDefects} labelMap={l} t={t} />
      </div>

      {/* Productivity + machine utilization */}
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
                      {(Array.isArray(productivityData.topPerformers) ? productivityData.topPerformers : []).slice(0, 5).map((p: Performer, i: number) => (
                        <div key={p.userId} className="flex items-center justify-between gap-2 text-sm" data-testid={`row-top-performer-${i}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-muted-foreground w-5 text-right shrink-0">{i + 1}.</span>
                            <span className="truncate">{p.fullName}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`text-sm font-semibold ${getScoreColor(Number(p.avgScore))}`}>
                              {Number(p.avgScore).toFixed(0)}
                            </div>
                            <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(Number(p.avgScore), 100)}%` }} />
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
                        <div key={p.userId} className="flex items-center justify-between gap-2 text-sm" data-testid={`row-bottom-performer-${i}`}>
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

        <MachineUtilizationChart
          data={machineData}
          loading={machineLoading}
          title={l.machineUtilization}
          labels={{ running: l.running, idle: l.idle, stopped: l.stopped, overall: l.overall }}
          t={t}
        />
      </div>

      {/* Anomaly feed + recommendations */}
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
                {(Array.isArray(anomalyData.anomalies) ? anomalyData.anomalies : []).slice(0, 15).map((a: Anomaly) => (
                  <div key={a.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/30" data-testid={`anomaly-item-${a.id}`}>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs"
                      style={{ borderColor: SEVERITY_COLORS[a.severity] ?? SEVERITY_COLORS.medium, color: SEVERITY_COLORS[a.severity] ?? SEVERITY_COLORS.medium }}
                    >
                      {l[a.severity] ?? a.severity}
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
                  <div key={`k-${i}`} className="p-3 rounded-md bg-muted/30 space-y-1" data-testid={`recommendation-${i}`}>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="shrink-0 text-xs"
                        style={{ borderColor: SEVERITY_COLORS[r.priority] ?? SEVERITY_COLORS.medium, color: SEVERITY_COLORS[r.priority] ?? SEVERITY_COLORS.medium }}
                      >
                        {l[r.priority] ?? r.priority}
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
