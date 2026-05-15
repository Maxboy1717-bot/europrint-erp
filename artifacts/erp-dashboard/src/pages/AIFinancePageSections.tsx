/**
 * @module AIFinancePageSections
 * @description Anomaly detection and cashflow forecast tab components
 * for the AI Finance page.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, AlertTriangle, TrendingUp, Lightbulb, BarChart3, RefreshCw, CheckCircle2, Activity, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { AnomalyResult, CashflowForecast, HistoricalMonth } from "./AIFinancePageTypes";
import { lastNMonths } from "./AIFinancePageTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ─── Badge helpers ─────────────────────────────────────────────────────────────

function severityBadge(s: string) {
  const { t } = useTranslation("common");
  if (s === "HIGH")   return <Badge variant="error">{t("high")}</Badge>;
  if (s === "MEDIUM") return <Badge variant="warning">{t("medium")}</Badge>;
  return                     <Badge variant="success">{t("low")}</Badge>;
}

// ─── AnomalyTab ───────────────────────────────────────────────────────────────

export function AnomalyTab() {
  const { t } = useTranslation("common");
  const { data, isLoading, refetch, isFetching } = useQuery<AnomalyResult>({
    queryKey: ["/api/ai/finance/anomalies"],
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("songgi30KunIchidagiMoliyaviy")}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <EPLoader className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Yangilash
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : data ? (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="font-medium">{t("umumiyXavfDarajasi")}</span>
                </div>
                <span className="text-2xl font-bold">{data.overallRiskScore}/100</span>
              </div>
              <Progress value={data.overallRiskScore} className="h-3" />
              <div className="mt-3 flex items-center gap-2">
                {data.hasAnomalies ? (
                  <><AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" /><span className="text-sm text-[var(--ep-yellow)]">{t("anomaliyalarAniqlandi")}</span></>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 text-[var(--ep-green)]" /><span className="text-sm text-[var(--ep-green)]">{t("anomaliyalarTopilmadi")}</span></>
                )}
              </div>
            </CardContent>
          </Card>

          {data.anomalies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t("aniqlanganAnomaliyalar")}</h4>
              <ScrollArea className="max-h-64">
                <div className="space-y-2 pr-2">
                  {data.anomalies.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-[var(--ep-yellow)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{a.description}</p>
                        {a.amount != null && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Miqdor: {formatCurrency(a.amount)}
                          </p>
                        )}
                      </div>
                      {severityBadge(a.severity)}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {data.recommendation && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">{t("aiTavsiyasi")}</span>
              </div>
              <p className="text-sm">{data.recommendation}</p>
            </div>
          )}
        </>
      ) : (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{t("malumotYuklanmadi")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CashflowTab ──────────────────────────────────────────────────────────────

export function CashflowTab() {
  const { t } = useTranslation("common");
  const [rows, setRows] = useState<HistoricalMonth[]>(lastNMonths(6));
  const [result, setResult] = useState<CashflowForecast | null>(null);

  const mutation = useMutation({
    mutationFn: (historicalData: HistoricalMonth[]) =>
      apiRequest<CashflowForecast>("POST", "/api/ai/finance/cashflow-forecast", { historicalData }),
    onSuccess: (data) => setResult(data),
  });

  const updateRow = (idx: number, field: "inflow" | "outflow", val: string) => {
    setRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, [field]: parseFloat(val) || 0 } : r
    ));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("tarixiyPulOqimiMalumotlariniKiriting")}
      </p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Tarixiy Ma'lumotlar (oxirgi 6 oy)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-medium text-muted-foreground pb-1">
              <span>Oy</span><span>Kirim (UZS)</span><span>Chiqim (UZS)</span>
            </div>
            {rows.map((row, i) => (
              <div key={row.month} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <span className="text-sm font-medium">{row.month}</span>
                <Input type="number" value={row.inflow || ""} onChange={e => updateRow(i, "inflow", e.target.value)} placeholder="0" className="h-8 text-sm" />
                <Input type="number" value={row.outflow || ""} onChange={e => updateRow(i, "outflow", e.target.value)} placeholder="0" className="h-8 text-sm" />
              </div>
            ))}
          </div>
          <Button className="mt-4 w-full" onClick={() => mutation.mutate(rows)} disabled={mutation.isPending}>
            {mutation.isPending
              ? <><EPLoader className="mr-2" />{t("tahlilQilinmoqda")}</>
              : <><BarChart3 className="h-4 w-4 mr-2" />{t("aiBashoratiniOlish")}</>}
          </Button>
          {mutation.isError && (
            <p className="text-sm text-[var(--ep-red)] mt-2 text-center">{t("error.generic")}</p>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t("keyingiOyBashorati")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-xs text-muted-foreground mb-1">{t("kirim")}</p>
                <p className="font-bold text-[var(--ep-green)]">{formatCurrency(result.nextMonthInflow)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <p className="text-xs text-muted-foreground mb-1">{t("chiqim")}</p>
                <p className="font-bold text-[var(--ep-red)]">{formatCurrency(result.nextMonthOutflow)}</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${result.netCashflow >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                <p className="text-xs text-muted-foreground mb-1">{t("sofOqim")}</p>
                <p className={`font-bold ${result.netCashflow >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                  {formatCurrency(result.netCashflow)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{t("ishonchlilikDarajasi")}</span>
                <span className="font-medium">{result.confidence}%</span>
              </div>
              <Progress value={result.confidence} className="h-2" />
            </div>
            {result.warnings.length > 0 && (
              <div className="space-y-1">
                <h5 className="text-xs font-medium text-[var(--ep-yellow)] flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {t("ogohlantirishlar")}
                </h5>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-muted-foreground ml-4">• {w}</p>
                ))}
              </div>
            )}
            {result.opportunities.length > 0 && (
              <div className="space-y-1">
                <h5 className="text-xs font-medium text-[var(--ep-green)] flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> {t("imkoniyatlar")}
                </h5>
                {result.opportunities.map((o, i) => (
                  <p key={i} className="text-sm text-muted-foreground ml-4">• {o}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
