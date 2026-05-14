/**
 * @module QCSPCTab
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle2, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface ControlChartData {
  dataPoints: Array<{
    id: string;
    date: string;
    defectRate: number;
    sampleSize: number;
    passedCount: number;
    defectCount: number;
    result: string;
  }>;
  controlLimits: {
    ucl: number;
    lcl: number;
    cl: number;
    sigma: number;
  };
  outOfControl: Array<{ id: string; date: string; defectRate: number; reason: string }>;
  processCapability: {
    cp: number | null;
    cpk: number | null;
    sigma: number;
    interpretation: string;
  };
  weeklyStats: Array<{ period: string; mean: number; max: number; min: number; n: number }>;
  summary: {
    n: number;
    mean: number;
    sigma: number;
    outOfControlCount: number;
    period: string;
  };
}

export function QCSPCTab() {
  const { t } = useTranslation("common");
  const { data, isLoading } = useQuery<ControlChartData>({
    queryKey: ["/api/qc/spc/control-chart"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <EPLoader tone="muted" className="w-8 h-8" />
      </div>
    );
  }

  if (!data || data.dataPoints.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("spcTahliliUchunYakuniyTekshiruv")}
        </CardContent>
      </Card>
    );
  }

  const { controlLimits, outOfControl, processCapability, weeklyStats, summary } = data;

  const cpkColor = processCapability.cpk === null
    ? "secondary"
    : processCapability.cpk >= 1.33
    ? "default"
    : processCapability.cpk >= 1.0
    ? "secondary"
    : "destructive";

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <p className="text-sm text-muted-foreground">O'lchov soni (n)</p>
            <p className="text-2xl font-bold" data-testid="spc-n">{summary.n}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <p className="text-sm text-muted-foreground">O'rtacha nuqson (X̄)</p>
            <p className="text-2xl font-bold">{summary.mean}%</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <p className="text-sm text-muted-foreground">Standart og'ish (σ)</p>
            <p className="text-2xl font-bold">{summary.sigma}%</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <p className="text-sm text-muted-foreground">{t("nazoratTashqarisi")}</p>
            <p className={`text-2xl font-bold ${outOfControl.length > 0 ? "text-destructive" : "text-[var(--ep-green)]"}`}
               data-testid="spc-out-of-control">{outOfControl.length}</p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Nazorat chegaralari (3σ qoida)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 rounded bg-red-50 dark:bg-red-950">
              <span className="text-sm font-medium">UCL (Yuqori chegarа)</span>
              <EPStatusPill tone="danger">{controlLimits.ucl}%</EPStatusPill>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-green-50 dark:bg-green-950">
              <span className="text-sm font-medium">CL (O'rta chiziq)</span>
              <EPStatusPill tone="success">{controlLimits.cl}%</EPStatusPill>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-blue-50 dark:bg-blue-950">
              <span className="text-sm font-medium">LCL (Pastki chegarа)</span>
              <EPStatusPill tone="neutral">{controlLimits.lcl}%</EPStatusPill>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Sigma (σ)</span>
                <span>{controlLimits.sigma}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Jarayon qobiliyati (Process Capability)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cp (Qobiliyat indeksi)</span>
              <span className="font-bold">{processCapability.cp ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cpk (O'chirilgan Cp)</span>
              <Badge variant={cpkColor}>{processCapability.cpk ?? "—"}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t("baholash")}</span>
              <span className="text-sm font-semibold">{processCapability.interpretation}</span>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p>USL = 5% (TZ-07 mezon: 5% dan yuqori nuqson — qayta ishlash)</p>
              <p>Cpk ≥ 1.33: Qodir | 1.0-1.33: Chegarada | &lt;1.0: Qodir emas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {outOfControl.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Nazorat chegarasidan tashqari nuqtalar ({outOfControl.length} ta)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(outOfControl) ? outOfControl : []).map((pt, i) => (
                <div key={`k-${i}`} className="flex items-center justify-between p-2 rounded border border-destructive/20 bg-destructive/5"
                     data-testid={`spc-ooc-${i}`}>
                  <div>
                    <span className="text-sm font-medium">{new Date(pt.date).toLocaleDateString("uz-UZ")}</span>
                    <span className="text-xs text-muted-foreground ml-2">{pt.reason}</span>
                  </div>
                  <EPStatusPill tone="danger">{pt.defectRate}%</EPStatusPill>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {outOfControl.length === 0 && (
        <Card>
          <CardContent className="py-4 flex items-center gap-2 text-[var(--ep-green)]">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{t("barchaOlchovNuqtalariNazoratChegarasida")}</span>
          </CardContent>
        </Card>
      )}

      {weeklyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Oylik taqsimot (Run Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(weeklyStats) ? weeklyStats : []).map((w, i) => (
                <div key={`k-${i}`} className="flex items-center gap-3" data-testid={`spc-weekly-${i}`}>
                  <span className="w-20 text-xs text-muted-foreground shrink-0">{w.period}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, (w.mean / Math.max(controlLimits.ucl, 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs w-14 text-right">{w.mean}% o'rt</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">(n={w.n})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
