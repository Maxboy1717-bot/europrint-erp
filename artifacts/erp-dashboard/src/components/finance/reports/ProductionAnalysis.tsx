/**
 * @module ProductionAnalysis
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Calculator, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from "recharts";
import { formatCurrency } from "@/lib/format";
import { formatPercent, formatDays, formatShortCurrency } from "./helpers";
import { ProductionEfficiency } from "./types";

import { useTranslation } from '@/lib/i18n';
interface ProductionAnalysisProps {
  data: ProductionEfficiency | undefined;
  isLoading: boolean;
}

export function ProductionAnalysis({data, isLoading }: ProductionAnalysisProps) {
  const { t } = useTranslation('common');
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-efficiency-metrics">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("samaradorlikKorsatkichlari")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {([...Array(5)]).map((_, i) => (
                  <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span>{t("ortachaIshlabChiqarishVaqti")}</span>
                  <span className="font-bold">{formatDays(data?.efficiencyMetrics?.averageCycleTime)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span>{t("uskunalarYuklanishi")}</span>
                  <span className="font-bold text-[var(--ep-blue)]">{formatPercent(data?.efficiencyMetrics?.machineUtilization)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span>{t("mehnatSamaradorligi")}</span>
                  <span className="font-bold text-[var(--ep-green)]">{formatPercent(data?.efficiencyMetrics?.laborEfficiency)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span>{t("sifatKorsatkichi")}</span>
                  <span className="font-bold text-[var(--ep-purple)]">{formatPercent(data?.efficiencyMetrics?.qualityRate)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg from-green-600/10 to-emerald-600/10 border border-green-500/30">
                  <span className="font-medium">OEE (Umumiy samaradorlik)</span>
                  <span className="font-bold text-[var(--ep-green)] text-lg">{formatPercent(data?.efficiencyMetrics?.overallEquipmentEfficiency)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-cost-analysis">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t("xarajatTahlili")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {([...Array(5)]).map((_, i) => (
                  <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="font-medium">{t("jamiDaromad")}</span>
                  <span className="font-bold text-[var(--ep-green)]">{formatCurrency(data?.costAnalysis?.totalRevenue || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span>{t('materialXarajatlari')}</span>
                  <span className="font-medium">{formatCurrency(data?.costAnalysis?.materialCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span>{t("mehnatXarajatlari")}</span>
                  <span className="font-medium">{formatCurrency(data?.costAnalysis?.laborCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span>{t("ustamaXarajatlar")}</span>
                  <span className="font-medium">{formatCurrency(data?.costAnalysis?.overheadCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="font-medium">{t("jamiTannarx")}</span>
                  <span className="font-bold text-[var(--ep-red)]">{formatCurrency(data?.costAnalysis?.totalProductionCost || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--ep-blue)] text-white">
                  <span className="font-bold">{t("foydaMarjasi")}</span>
                  <span className="font-bold text-lg">{formatPercent(data?.costAnalysis?.profitMargin)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-production-trend">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("ishlabChiqarishVaDaromadTendensiyasi")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <div className="glass-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.productionTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 28%)" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} tickFormatter={(v) => formatShortCurrency(v)} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(0 0% 65%)", fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "produced" ? value.toString() : formatCurrency(value),
                      name === "produced" ? "Ishlab chiqarilgan" : name === "revenue" ? "Daromad" : "Xarajat",
                    ]}
                    contentStyle={{ backgroundColor: "hsl(220 15% 18%)", border: "1px solid hsl(220 10% 28%)", borderRadius: "8px" }}
                  />
                  <Legend formatter={(value) => (value === "produced" ? "Ishlab chiqarilgan (dona)" : value === "revenue" ? "Daromad" : "Xarajat")} />
                  <Bar yAxisId="left" dataKey="revenue" fill="hsl(145 65% 50%)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="cost" fill="hsl(0 70% 55%)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="produced" stroke="hsl(210 80% 55%)" strokeWidth={2} dot={{ r: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
