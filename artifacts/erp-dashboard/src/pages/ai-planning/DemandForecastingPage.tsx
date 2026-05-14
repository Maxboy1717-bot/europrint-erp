/**
 * @module DemandForecastingPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, BarChart3, AlertCircle } from "lucide-react";

interface ForecastItem {
  productId: number;
  productName: string;
  unit: string;
  currentMonthDemand: number;
  forecastNext1Month: number;
  forecastNext3Months: number;
  confidence: number;
  trend: "up" | "down" | "flat";
  modelName: string;
}

const CONFIDENCE_HIGH = 80;
const CONFIDENCE_MEDIUM = 60;

function getConfidenceVariant(c: number): "success" | "warning" | "danger" {
  if (c >= CONFIDENCE_HIGH) return "success";
  if (c >= CONFIDENCE_MEDIUM) return "warning";
  return "danger";
}

export default function DemandForecastingPage() {
  const { t } = useTranslation('ai');

  const { data, isLoading } = useQuery<{ items: ForecastItem[] }>({
    queryKey: ["/api/ai/forecast/demand"],
    queryFn: () => apiRequest("GET", "/api/ai/forecast/demand"),
  });

  const items = selectArray<ForecastItem>(data, "items");
  const totalNext1M = items.reduce((s, i) => s + i.forecastNext1Month, 0);
  const totalNext3M = items.reduce((s, i) => s + i.forecastNext3Months, 0);
  const avgConfidence = items.length > 0
    ? Math.round(items.reduce((s, i) => s + i.confidence, 0) / items.length)
    : 0;

  return (
    <DedicatedPageShell
      title={t('demandForecast.title', "Talab Bashorati")}
      description={t('demandForecast.description', "Mahsulotlar bo'yicha 1/3 oylik talab bashorati (Croston, Holt-Winters)")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('demandForecast.products', "Mahsulotlar")} value={items.length} icon={<BarChart3 className="h-4 w-4" />} />
        <KpiCard label={t('demandForecast.next1m', "1 oy bashorat")} value={totalNext1M.toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} variant="default" />
        <KpiCard label={t('demandForecast.next3m', "3 oy bashorat")} value={totalNext3M.toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} variant="default" />
        <KpiCard label={t('demandForecast.avgConfidence', "O'rtacha aniqlik")} value={`${avgConfidence}%`} icon={<AlertCircle className="h-4 w-4" />} variant={getConfidenceVariant(avgConfidence)} />
      </div>

      <Section title={t('demandForecast.list', "Mahsulotlar bashorati")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('demandForecast.empty', "Ma'lumot yo'q")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">{t('demandForecast.product', "Mahsulot")}</th>
                  <th className="text-right p-2">{t('demandForecast.current', "Joriy oy")}</th>
                  <th className="text-right p-2">{t('demandForecast.next1mShort', "+1 oy")}</th>
                  <th className="text-right p-2">{t('demandForecast.next3mShort', "+3 oy")}</th>
                  <th className="text-center p-2">{t('demandForecast.trend', "Trend")}</th>
                  <th className="text-center p-2">{t('demandForecast.confidence', "Aniqlik")}</th>
                  <th className="text-left p-2">{t('demandForecast.model', "Model")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.productId} className="border-b">
                    <td className="p-2">{i.productName}</td>
                    <td className="text-right p-2">{i.currentMonthDemand.toLocaleString()} {i.unit}</td>
                    <td className="text-right p-2 font-medium">{i.forecastNext1Month.toLocaleString()}</td>
                    <td className="text-right p-2 font-medium">{i.forecastNext3Months.toLocaleString()}</td>
                    <td className="text-center p-2">
                      {i.trend === "up" ? "↑" : i.trend === "down" ? "↓" : "→"}
                    </td>
                    <td className="text-center p-2">
                      <Badge variant="outline" className={
                        i.confidence >= CONFIDENCE_HIGH ? "text-[var(--ep-green)]" :
                        i.confidence >= CONFIDENCE_MEDIUM ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"
                      }>
                        {i.confidence}%
                      </Badge>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{i.modelName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
