/**
 * @module QCAITrendTab
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface AiTrendData {
  summary: { totalTests: number; totalBraks: number; avgPassRate: number; trend: string };
  weeklyTrend: Array<{ week: string; total: number; passed: number; failed: number; passRate: number }>;
  byReason: Array<{ reason: string; count: number }>;
  byStage: Array<{ stage: string; count: number }>;
  categoryStats: Array<{ category: string; total: number; passed: number; passRate: number }>;
  aiInsights: string[];
}

export function QCAITrendTab() {
  const { t } = useTranslation("common");
  const { data: aiTrendData, isLoading: aiTrendLoading } = useQuery<AiTrendData>({
    queryKey: ["/api/qc/ai-trend"],
  });

  if (aiTrendLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <EPLoader tone="muted" className="w-8 h-8" />
      </div>
    );
  }

  if (!aiTrendData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">{t("malumotYuklanmadi")}</CardContent>
      </Card>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <p className="text-sm text-muted-foreground">{t("jamiTestlar1")}</p>
            <p className="text-2xl font-bold" data-testid="text-trend-total-tests">{aiTrendData.summary.totalTests}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <p className="text-sm text-muted-foreground">{t("jamiBrak")}</p>
            <p className="text-2xl font-bold text-destructive" data-testid="text-trend-total-braks">{aiTrendData.summary.totalBraks}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <p className="text-sm text-muted-foreground">{t("ortachaOtish")}</p>
            <p className="text-2xl font-bold" data-testid="text-trend-pass-rate">{aiTrendData.summary.avgPassRate}%</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <p className="text-sm text-muted-foreground">{t("trend3")}</p>
            <div className="mt-1">
              <Badge
                variant={aiTrendData.summary.trend === "improving" ? "default" : aiTrendData.summary.trend === "declining" ? "destructive" : "secondary"}
                data-testid="badge-trend-direction"
              >
                {aiTrendData.summary.trend === "improving" ? "Yaxshilanmoqda" : aiTrendData.summary.trend === "declining" ? "Yomonlashmoqda" : "Barqaror"}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" />
            {t("aiTavsiyalari")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Array.isArray(aiTrendData.aiInsights) ? aiTrendData.aiInsights : []).map((insight, i) => (
            <div key={`k-${i}`} className="flex gap-2 p-3 rounded-md bg-muted text-sm" data-testid={`text-ai-insight-${i}`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--ep-yellow)]" />
              <span>{insight}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("haftalikSifatTrendi")}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(aiTrendData.weeklyTrend) ? aiTrendData.weeklyTrend : []).map((w, i) => (
                <div key={`k-${i}`} className="flex items-center gap-3" data-testid={`row-weekly-trend-${i}`}>
                  <span className="w-12 text-xs text-muted-foreground shrink-0">{w.week}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: `${w.passRate}%` }} />
                  </div>
                  <span className="text-xs w-12 text-right">{w.passRate}%</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{w.passed}/{w.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("brakSabablariTop10")}</CardTitle></CardHeader>
          <CardContent>
            {aiTrendData.byReason.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("brakYozuvlariYoq")}</p>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(aiTrendData.byReason) ? aiTrendData.byReason : []).map((r, i) => {
                  const maxCount = aiTrendData.byReason[0]?.count || 1;
                  return (
                    <div key={`k-${i}`} className="flex items-center gap-3" data-testid={`row-brak-reason-${i}`}>
                      <span className="flex-1 text-xs truncate">{r.reason}</span>
                      <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full bg-destructive" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-xs w-8 text-right font-medium">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("bosqichBoyichaBrak")}</CardTitle></CardHeader>
          <CardContent>
            {aiTrendData.byStage.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("malumotYoq")}</p>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("milestone1")}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(aiTrendData.byStage) ? aiTrendData.byStage : []).map((s, i) => (
                    <TableRow key={`k-${i}`} data-testid={`row-brak-stage-${i}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="text-sm capitalize">{s.stage}</TableCell>
                      <TableCell className="text-right font-medium">{s.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("kategoriyaBoyichaOtishDarajasi")}</CardTitle></CardHeader>
          <CardContent>
            {aiTrendData.categoryStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("malumotYoq")}</p>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(aiTrendData.categoryStats) ? aiTrendData.categoryStats : []).map((c, i) => (
                  <div key={`k-${i}`} className="flex items-center gap-3" data-testid={`row-category-stat-${i}`}>
                    <span className="flex-1 text-xs truncate capitalize">{c.category}</span>
                    <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${c.passRate}%` }} />
                    </div>
                    <span className={`text-xs w-10 text-right font-medium ${c.passRate < 80 ? "text-destructive" : ""}`}>{c.passRate}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
    </>
  );
}
