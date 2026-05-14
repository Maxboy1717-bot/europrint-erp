/**
 * @module ForecastAnalytics
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from "recharts";
import { Brain, TrendingUp, AlertCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
type ForecastModel = "ema" | "hw" | "croston" | "ensemble";

interface EmaResult {
  materialId: string;
  model: string;
  predicted: number[];
  alpha: number;
  metrics: { mase: number; rmse: number };
}

interface HwResult {
  materialId: string;
  model: string;
  predicted: number[];
  fitted: number[];
  params: { alpha: number; beta: number; gamma: number; seasonLength: number };
  metrics: { mase: number; rmse: number };
}

interface CrostonResult {
  materialId: string;
  model: string;
  fitted: number[];
  predicted: number[];
  params: { alpha: number; beta: number };
  mase: number;
  rmse: number;
  mape: number;
  demandProbability: number;
  avgDemandSize: number;
}

interface EnsembleResult {
  materialId: string;
  model: string;
  predicted: number[];
  ci80Lower: number[];
  ci80Upper: number[];
  ci95Lower: number[];
  ci95Upper: number[];
  modelWeights: { ema: number; hw: number; croston: number };
  modelMapes:   { ema: number; hw: number; croston: number };
  confidence:   number;
  hitlRequired: boolean;
  ciWidthRatio: number;
  hitlReason:   string | null;
}

type AnyResult = EmaResult | HwResult | CrostonResult | EnsembleResult | null;

const SAMPLE_SPORADIC = [0, 0, 12, 0, 0, 0, 8, 0, 0, 15, 0, 0, 0, 6, 0, 0, 0, 0, 11, 0, 0, 0, 9, 0];
const SAMPLE_SEASONAL = [42, 48, 55, 60, 52, 45, 39, 36, 44, 58, 65, 70, 63, 56, 48, 41, 38, 45, 62, 72, 78, 74, 66, 55, 47, 43];

export default function ForecastAnalytics() {
  const { t } = useTranslation('ai');

  const MODEL_OPTIONS = useMemo<{ value: ForecastModel; label: string }[]>(() => [
    { value: "ema",      label: t('modelEma') },
    { value: "hw",       label: t('modelHw') },
    { value: "croston",  label: t('modelCroston') },
    { value: "ensemble", label: t('modelEnsemble') },
  ], [t]);
  const { toast } = useToast();
  const [model, setModel]       = useState<ForecastModel>("croston");
  const [materialId, setMatId]  = useState("MAT-001");
  const [horizon, setHorizon]   = useState(8);
  const [seasonLen, setSeasonLen] = useState(12);
  const [rawSeries, setRawSeries] = useState(SAMPLE_SPORADIC.join(", "));
  const [result, setResult]     = useState<AnyResult>(null);

  const refreshForecastMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/forecasts/run", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forecasts"] });
      toast({ title: "Prognoz yangilandi", description: "Barcha prognozlar muvaffaqiyatli yangilandi." });
    },
    onError: (e: Error) => toast({ title: t('error'), description: e.message, variant: "destructive" }),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const series = rawSeries.split(/[\s,]+/).map(Number).filter(Number.isFinite);
      if (model === "ema") {
        return apiRequest("POST", `/api/forecast/${encodeURIComponent(materialId)}/ema`, { series, horizon });
      }
      if (model === "hw") {
        return apiRequest("POST", `/api/forecast/${encodeURIComponent(materialId)}/hw`, { series, horizon, seasonLength: seasonLen });
      }
      if (model === "croston") {
        return apiRequest("POST", `/api/forecast/${encodeURIComponent(materialId)}/croston`, { series, horizon });
      }
      const sl = Math.max(4, Math.floor(series.length / 4));
      return apiRequest("POST", `/api/forecast/${encodeURIComponent(materialId)}/ensemble`, { series, horizon, seasonLength: sl });
    },
    onSuccess: (data) => setResult(data as AnyResult),
    onError: (e: Error) => toast({ title: t('error'), description: e.message, variant: "destructive" }),
  });

  const series = rawSeries.split(/[\s,]+/).map(Number).filter(Number.isFinite);

  const buildChartData = () => {
    const base = series.map((v, i) => ({ period: `T${i + 1}`, actual: v }));
    if (!result) return base;
    const r = result as Record<string, unknown>;
    const predicted = (r.predicted as number[] | undefined) ?? [];
    const fitted = (r.fitted as number[] | undefined) ?? [];

    if (fitted.length) {
      fitted.forEach((v, i) => { (base[i] as Record<string, number>)["fitted"] = Math.round(v * 100) / 100; });
    }
    predicted.forEach((v, j) => {
      const point: Record<string, string | number> = { period: `T${series.length + j + 1}`, predicted: Math.round(v * 100) / 100 };
      if (model === "ensemble") {
        const ens = result as EnsembleResult;
        point["ci80Low"] = Math.round((ens.ci80Lower[j] ?? 0) * 100) / 100;
        point["ci80High"] = Math.round((ens.ci80Upper[j] ?? 0) * 100) / 100;
        point["ci95Low"] = Math.round((ens.ci95Lower[j] ?? 0) * 100) / 100;
        point["ci95High"] = Math.round((ens.ci95Upper[j] ?? 0) * 100) / 100;
      }
      (base as object[]).push(point);
    });
    return base;
  };

  const chartData = buildChartData();
  const ensResult = model === "ensemble" && result ? result as EnsembleResult : null;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-7 h-7 text-[var(--ep-purple)]" />
          <div>
            <h1 className="text-2xl font-bold">{t('forecastAnalytics')}</h1>
            <p className="text-muted-foreground text-sm">{t('forecastDesc')}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshForecastMutation.mutate()}
          disabled={refreshForecastMutation.isPending}
          data-testid="button-refresh-forecast"
        >
          {refreshForecastMutation.isPending
            ? <EPLoader className="w-4 h-4 mr-2" />
            : <RefreshCw className="w-4 h-4 mr-2" />}
          Prognoz yangilash
        </Button>
      </div>

      {ensResult?.hitlRequired && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-[var(--ep-primary)]">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{t('hitlWarning')}: {ensResult.hitlReason}</span>
          <Badge className="ml-auto text-xs bg-orange-200 text-orange-800">
            {t('confidence')}: {(ensResult.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t('forecastSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>{t('forecastModel')}</Label>
              <Select value={model} onValueChange={v => { setModel(v as ForecastModel); setResult(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('materialId')}</Label>
              <Input value={materialId} onChange={e => setMatId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('forecastHorizon')}</Label>
              <Input type="number" min={1} max={52} value={horizon} onChange={e => setHorizon(Number(e.target.value))} />
            </div>
            {(model === "hw") && (
              <div className="space-y-1">
                <Label>{t('seasonLength')}</Label>
                <Input type="number" min={2} max={52} value={seasonLen} onChange={e => setSeasonLen(Number(e.target.value))} />
              </div>
            )}
            <div className="space-y-1">
              <Label>{t('historySeries')}</Label>
              <textarea
                className="w-full h-24 text-xs border rounded p-2 font-mono resize-none"
                value={rawSeries}
                onChange={e => setRawSeries(e.target.value)}
              />
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setRawSeries(SAMPLE_SPORADIC.join(", "))}>{t('sporadicSample')}</Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setRawSeries(SAMPLE_SEASONAL.join(", "))}>{t('seasonalSample')}</Button>
              </div>
            </div>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? <EPLoader className="w-4 h-4 mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              {t('calculate')}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {model === "ema" && result && (
                <>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Alpha</p>
                    <p className="text-xl font-bold">{((result as EmaResult).alpha ?? 0).toFixed(3)}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">RMSE</p>
                    <p className="text-xl font-bold">{((result as EmaResult).metrics?.rmse ?? 0).toFixed(2)}</p>
                  </Card>
                </>
              )}
              {model === "hw" && result && (
                <>
                  {(['alpha','beta','gamma'] as const).map(k => (
                    <Card key={k} className="p-3">
                      <p className="text-xs text-muted-foreground">{k}</p>
                      <p className="text-xl font-bold">{((result as HwResult).params?.[k] ?? 0).toFixed(3)}</p>
                    </Card>
                  ))}
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">RMSE</p>
                    <p className="text-xl font-bold">{((result as HwResult).metrics?.rmse ?? 0).toFixed(2)}</p>
                  </Card>
                </>
              )}
              {model === "croston" && result && (
                <>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">MASE</p>
                    <p className="text-xl font-bold">{((result as CrostonResult).mase ?? 0).toFixed(3)}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">MAPE</p>
                    <p className="text-xl font-bold">{((result as CrostonResult).mape ?? 0).toFixed(1)}%</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">{t('demandProbability')}</p>
                    <p className="text-xl font-bold">{(((result as CrostonResult).demandProbability ?? 0) * 100).toFixed(1)}%</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">{t('avgDemandSize')}</p>
                    <p className="text-xl font-bold">{((result as CrostonResult).avgDemandSize ?? 0).toFixed(1)}</p>
                  </Card>
                </>
              )}
              {model === "ensemble" && ensResult && (
                <>
                  {Object.entries(ensResult.modelWeights).map(([name, w]) => (
                    <Card key={name} className="p-3">
                      <p className="text-xs text-muted-foreground">{name.toUpperCase()} {t('modelWeight')}</p>
                      <p className="text-xl font-bold">{(w * 100).toFixed(1)}%</p>
                      <p className="text-xs text-[var(--ep-primary)]">MAPE: {((ensResult.modelMapes as Record<string, number>)[name] ?? 0).toFixed(1)}%</p>
                    </Card>
                  ))}
                  <Card className="p-3 col-span-2">
                    <p className="text-xs text-muted-foreground">{t('confidence')}</p>
                    <p className={`text-xl font-bold ${ensResult.confidence < 0.70 ? 'text-[var(--ep-primary)]' : 'text-[var(--ep-green)]'}`}>
                      {(ensResult.confidence * 100).toFixed(1)}%
                    </p>
                  </Card>
                </>
              )}
            </div>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> {t('forecastChart')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  <AlertCircle className="w-5 h-5 mr-2" /> {t('clickToCalculate')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="actual"    stroke="#3b82f6" fill="#dbeafe" name={t('actual')} />
                    {(model === "croston" || model === "hw") && (
                      <Area type="monotone" dataKey="fitted" stroke="#10b981" fill="#d1fae5" name="Fitted" strokeDasharray="4 2" />
                    )}
                    <Area type="monotone" dataKey="predicted" stroke="#f59e0b" fill="#fef3c7" name={t('forecast')} />
                    {model === "ensemble" && (
                      <>
                        <Area type="monotone" dataKey="ci95High" stroke="#c7d2fe" fill="#ede9fe" name={t('ci95Upper')} strokeDasharray="2 2" />
                        <Area type="monotone" dataKey="ci95Low"  stroke="#c7d2fe" fill="#ede9fe" name={t('ci95Lower')} strokeDasharray="2 2" />
                        <Area type="monotone" dataKey="ci80High" stroke="#e2e8f0" fill="#f1f5f9" name={t('ci80Upper')} strokeDasharray="2 2" />
                        <Area type="monotone" dataKey="ci80Low"  stroke="#e2e8f0" fill="#f1f5f9" name={t('ci80Lower')} strokeDasharray="2 2" />
                      </>
                    )}
                    <ReferenceLine x={`T${series.length}`} stroke="#6b7280" strokeDasharray="4 2" label={t('forecastStart')} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
