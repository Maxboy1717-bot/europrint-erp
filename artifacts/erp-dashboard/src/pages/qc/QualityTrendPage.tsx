/**
 * @module QualityTrendPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

interface TrendPoint {
  period: string;
  passRate: number;
  defectRate: number;
  dpmo: number;
  inspectionsCount: number;
}

const SIGMA_4_DPMO = 6210;     // 4σ
const SIGMA_5_DPMO = 233;      // 5σ
const SIGMA_6_DPMO = 3.4;      // 6σ World Class

function getSigmaLevel(dpmo: number): { sigma: string; variant: "success" | "warning" | "danger" } {
  if (dpmo <= SIGMA_6_DPMO) return { sigma: "6σ", variant: "success" };
  if (dpmo <= SIGMA_5_DPMO) return { sigma: "5σ", variant: "success" };
  if (dpmo <= SIGMA_4_DPMO) return { sigma: "4σ", variant: "warning" };
  return { sigma: "<4σ", variant: "danger" };
}

export default function QualityTrendPage() {
  const { t } = useTranslation('qc');

  const { data, isLoading } = useQuery<{ items: TrendPoint[] }>({
    queryKey: ["/api/qc/ai-trend"],
    queryFn: () => apiRequest("GET", "/api/qc/ai-trend?periods=12"),
  });

  const items = selectArray<TrendPoint>(data, "items");
  const latest = items.length > 0 ? items[items.length - 1] : null;
  const previous = items.length > 1 ? items[items.length - 2] : null;
  const trendDirection = latest && previous
    ? (latest.passRate > previous.passRate ? "up" : latest.passRate < previous.passRate ? "down" : "flat")
    : "flat";

  const avgDpmo = items.length > 0
    ? Math.round(items.reduce((s, p) => s + p.dpmo, 0) / items.length)
    : 0;
  const sigma = getSigmaLevel(avgDpmo);

  return (
    <DedicatedPageShell
      title={t('qcTrend.title', "Sifat Trendi")}
      description={t('qcTrend.description', "Oylik sifat ko'rsatkichlari, DPMO va Six Sigma tahlili")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label={t('qcTrend.latestPass', "Joriy oy PASS%")}
          value={`${latest?.passRate ?? 0}%`}
          icon={<Activity className="h-4 w-4" />}
          variant={latest && latest.passRate > 95 ? "success" : "warning"}
          trend={trendDirection}
          trendValue={previous && latest ? `${((latest.passRate ?? 0) - previous.passRate).toFixed(1)}%` : undefined}
        />
        <KpiCard
          label={t('qcTrend.avgDpmo', "O'rtacha DPMO")}
          value={avgDpmo.toLocaleString()}
          icon={<BarChart3 className="h-4 w-4" />}
          variant={sigma.variant}
        />
        <KpiCard
          label={t('qcTrend.sigmaLevel', "Sigma darajasi")}
          value={sigma.sigma}
          icon={trendDirection === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          variant={sigma.variant}
        />
        <KpiCard
          label={t('qcTrend.totalInspections', "Jami tekshiruvlar")}
          value={items.reduce((s, p) => s + p.inspectionsCount, 0).toLocaleString()}
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      <Section title={t('qcTrend.byPeriod', "Davr bo'yicha")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('qcTrend.empty', "Ma'lumot yo'q")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">{t('qcTrend.period', "Davr")}</th>
                  <th className="text-right p-2">{t('qcTrend.passRate', "PASS%")}</th>
                  <th className="text-right p-2">{t('qcTrend.defectRate', "Brak%")}</th>
                  <th className="text-right p-2">DPMO</th>
                  <th className="text-center p-2">σ</th>
                  <th className="text-right p-2">{t('qcTrend.inspections', "Tekshiruv")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const ps = getSigmaLevel(p.dpmo);
                  return (
                    <tr key={p.period} className="border-b">
                      <td className="p-2 font-medium">{p.period}</td>
                      <td className="text-right p-2">{p.passRate}%</td>
                      <td className="text-right p-2 text-[var(--ep-red)]">{p.defectRate}%</td>
                      <td className="text-right p-2">{p.dpmo.toLocaleString()}</td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className={
                          ps.variant === "success" ? "text-[var(--ep-green)]" :
                          ps.variant === "warning" ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"
                        }>
                          {ps.sigma}
                        </Badge>
                      </td>
                      <td className="text-right p-2 text-muted-foreground">{p.inspectionsCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
