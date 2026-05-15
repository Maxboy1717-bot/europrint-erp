/**
 * @module PerformanceTabSections
 * @description Top-level section re-exports and lightweight sections for PerformanceTab.
 * MES and WMS heavy content lives in PerformanceTabMesSections.tsx and
 * PerformanceTabWmsSections.tsx respectively.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from '@/lib/i18n';
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Clock, GraduationCap, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import type { PerformanceTabProps } from "./PerformanceTabTypes";

// ─── Re-exports for convenience ───────────────────────────────────────────────
export { MesSection } from "./PerformanceTabMesSections";
export { WmsSection } from "./PerformanceTabWmsSections";

// ─── MiniProgressBar ─────────────────────────────────────────────────────────

export function MiniProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const { t } = useTranslation("common");
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })}
        className="sr-only"
        aria-label={t("refresh")}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </>
  );
}

// ─── KPI Summary Cards ────────────────────────────────────────────────────────

type KpiSummaryProps = Pick<
  PerformanceTabProps,
  "t" | "loadingAbc" | "loadingProgress" | "abcData" | "courseProgress" | "attendanceStats" | "getGradeColor"
>;

export function KpiSummaryCards({
  t, loadingAbc, loadingProgress, abcData, courseProgress, attendanceStats, getGradeColor,
}: KpiSummaryProps) {
  if (loadingAbc || loadingProgress) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-blue-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("abcDaraja")}</p>
              {abcData ? (
                <span className={`inline-flex w-10 h-10 rounded-full items-center justify-center text-white text-lg font-bold mt-1 ${getGradeColor(abcData.grade)}`}>
                  {abcData.grade}
                </span>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground">—</p>
              )}
            </div>
            <BarChart3 className="h-6 w-6 text-[var(--ep-blue)]" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-green-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("kursTugatish")}</p>
              <p className="text-2xl font-bold text-[var(--ep-green)] mt-1">
                {courseProgress ? (Array.isArray(courseProgress) ? courseProgress : []).filter(p => p.isCompleted).length : 0}
                <span className="text-sm text-muted-foreground font-normal">/{courseProgress?.length || 0}</span>
              </p>
            </div>
            <GraduationCap className="h-6 w-6 text-[var(--ep-green)]" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-purple-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("samaradorlik")}</p>
              <p className="text-2xl font-bold text-[var(--ep-purple)] mt-1">{abcData?.performanceRate || 0}%</p>
            </div>
            <TrendingUp className="h-6 w-6 text-[var(--ep-purple)]" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-orange-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("punctuality")}</p>
              <p className="text-2xl font-bold text-[var(--ep-primary)] mt-1">
                {abcData?.punctualityRate || attendanceStats.punctualPercentage}%
              </p>
            </div>
            <Clock className="h-6 w-6 text-[var(--ep-primary)]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ABC + Monthly Charts ─────────────────────────────────────────────────────

type AbcChartSectionProps = Pick<PerformanceTabProps, "tCommon" | "abcData" | "metrics" | "getGradeColor">;

export function AbcChartSection({ tCommon, abcData, metrics, getGradeColor }: AbcChartSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {abcData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t("abcBaholash")}
            </CardTitle>
            <CardDescription>{t("xodimSamaradorlikKategoriyasi")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold ${getGradeColor(abcData.grade)}`}>
                {abcData.grade}
              </div>
              <div>
                <p className="text-2xl font-bold">{abcData.score}/5 ball</p>
                <p className="text-muted-foreground">{t("umumiyDaraja")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("samaradorlik")}</p>
                <p className="font-medium">{abcData.performanceRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("yoqlama")}</p>
                <p className="font-medium">{abcData.attendanceRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("vaqtidaKelish")}</p>
                <p className="font-medium">{abcData.punctualityRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("kursOtkazish")}</p>
                <p className="font-medium">{abcData.courseCompletionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("abcBaholash")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">{tCommon("noData")}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Oylik natijalar (HR KPI)
          </CardTitle>
          <CardDescription>{t("oxirgi6OylikSamaradorlik")}</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics && metrics.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(Array.isArray(metrics) ? metrics : []).slice(0, 6).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metricDate" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="productivityScore" name="Samaradorlik" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="qualityScore" name="Sifat" stroke="#10b981" />
                  <Line type="monotone" dataKey="speedScore" name="Tezlik" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">{tCommon("noData")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Course Stats Section ──────────────────────────────────────────────────────

type CourseStatsSectionProps = Pick<PerformanceTabProps, "courseProgress">;

export function CourseStatsSection({ courseProgress }: CourseStatsSectionProps) {
  const { t } = useTranslation("common");
  if (!courseProgress || courseProgress.length === 0) return null;
  const completed = (Array.isArray(courseProgress) ? courseProgress : []).filter(p => p.isCompleted).length;
  const completionPct = courseProgress.length > 0 ? Math.round((completed / courseProgress.length) * 100) : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {t("talimSamaradorligi")}
        </CardTitle>
        <CardDescription>{t("kurslarniTugatishStatistikasi")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/40 rounded-md">
            <p className="text-3xl font-bold text-[var(--ep-blue)]">{courseProgress.length}</p>
            <p className="text-sm text-muted-foreground">{t("jamiKurslar1")}</p>
          </div>
          <div className="text-center p-4 bg-muted/40 rounded-md">
            <p className="text-3xl font-bold text-[var(--ep-green)]">{completed}</p>
            <p className="text-sm text-muted-foreground">{t("progress.completed")}</p>
          </div>
          <div className="text-center p-4 bg-muted/40 rounded-md">
            <p className="text-3xl font-bold text-[var(--ep-purple)]">{completionPct}%</p>
            <p className="text-sm text-muted-foreground">{t("tugatishFoizi")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
