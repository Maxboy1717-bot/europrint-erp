/**
 * Quality AI Dashboard — /agents/quality
 */
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
interface TrendRes { pct7d: number; pct30d: number; trend: 'rising' | 'stable' | 'falling' }
interface QuarantineItem { batchId: string; daysInQuarantine: number }

export default function QualityDashboard() {
  const { t } = useTranslation('common');
  const trend = useQuery<TrendRes>({
    queryKey: ['/api/agents/quality/trend'],
    queryFn: () => apiRequest<TrendRes>('GET', '/api/agents/quality/trend'),
    refetchInterval: 60_000,
  });

  const quarantine = useQuery<QuarantineItem[]>({
    queryKey: ['/api/agents/quality/quarantine'],
    queryFn: () => apiRequest<QuarantineItem[]>('GET', '/api/agents/quality/quarantine'),
    refetchInterval: 60_000,
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <header className="flex items-center gap-3">
        <CheckCircle className="h-7 w-7 text-[var(--ep-green)]" />
        <div>
          <h1 className="text-2xl font-bold">{t("sifatAiVision")}</h1>
          <p className="text-sm text-muted-foreground">{t("brakTrendKarantinAiDefekt")}</p>
        </div>
      </header>

      {/* Brak trend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-2 border-blue-200 bg-blue-50/40">
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ep-blue)]">{t("k7KunlikBrak")}</div>
          <div className="text-3xl font-bold text-blue-800 mt-1">{(trend.data?.pct7d ?? 0).toFixed(1)}%</div>
        </Card>
        <Card className="p-4 border-2 border-slate-200 bg-slate-50/60">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-700">{t("k30KunlikBrak")}</div>
          <div className="text-3xl font-bold text-slate-800 mt-1">{(trend.data?.pct30d ?? 0).toFixed(1)}%</div>
        </Card>
        <Card className="p-4 border-2 border-amber-200 bg-amber-50/40">
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ep-yellow)]">{t('trend')}</div>
          <div className="flex items-center gap-2 mt-1">
            {trend.data?.trend === 'rising' && <><TrendingUp className="h-7 w-7 text-[var(--ep-red)]" /><span className="text-2xl font-bold text-[var(--ep-red)]">{t("oshmoqda")}</span></>}
            {trend.data?.trend === 'falling' && <><TrendingDown className="h-7 w-7 text-[var(--ep-green)]" /><span className="text-2xl font-bold text-[var(--ep-green)]">{t("pasaymoqda")}</span></>}
            {trend.data?.trend === 'stable' && <><Minus className="h-7 w-7 text-slate-500" /><span className="text-2xl font-bold text-slate-700">{t("barqaror")}</span></>}
          </div>
        </Card>
      </div>

      {/* Karantin */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
            48+ soat karantinda turgan partiyalar
          </h3>
          <span className="text-xs text-muted-foreground">{quarantine.data?.length ?? 0} ta</span>
        </div>
        {quarantine.isLoading ? <EPLoader /> :
         (quarantine.data?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">{t("hozirdaKarantinBosh")}</div>
        ) : (
          <div className="space-y-2">
            {quarantine.data?.map(b => (
              <div key={b.batchId} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <div className="font-mono text-sm">#{b.batchId.slice(-12)}</div>
                  <div className="text-xs text-muted-foreground">{t("qcQarorigaMuhtoj")}</div>
                </div>
                <div className="text-lg font-bold text-[var(--ep-yellow)] tabular-nums">{b.daysInQuarantine} kun</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-sm mb-2">{t("aiVisionDefektAniqlash")}</h3>
        <p className="text-xs text-muted-foreground">
          Kelajakda kameradan rasm yuborib, real-time AI defekt tahlilini olish mumkin bo'ladi.
          Hozir backend `analyzeDefect()` endpointi tayyor.
        </p>
      </Card>
    </div>
  );
}
