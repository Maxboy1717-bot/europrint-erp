/**
 * HR Performance AI Dashboard — /agents/hr-performance
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, TrendingDown, RefreshCw, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface PerformanceRes { score: number; reasons: string[] }
interface ChurnRes { risk: 'low' | 'medium' | 'high'; reasonsUz: string[] }
interface BonusRes { bonus: number; details: { performanceScore: number; bonusPct: number; baseSalary: number } }

export default function HRPerformanceDashboard() {
  const { t } = useTranslation("common");
  const [employeeId, setEmployeeId] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [baseSalary, setBaseSalary] = useState('5000000');

  const performance = useQuery<PerformanceRes>({
    queryKey: ['/api/agents/hr/performance', activeId],
    queryFn: () => apiRequest<PerformanceRes>('GET', `/api/agents/hr/performance/${activeId}`),
    enabled: activeId !== null,
  });

  const churn = useQuery<ChurnRes>({
    queryKey: ['/api/agents/hr/churn', activeId],
    queryFn: () => apiRequest<ChurnRes>('GET', `/api/agents/hr/churn/${activeId}`),
    enabled: activeId !== null,
  });

  const bonus = useQuery<BonusRes>({
    queryKey: ['/api/agents/hr/bonus', activeId, baseSalary],
    queryFn: () => apiRequest<BonusRes>('GET', `/api/agents/hr/bonus/${activeId}?base=${baseSalary}`),
    enabled: activeId !== null,
  });

  const search = () => {
    const id = parseInt(employeeId, 10);
    if (id > 0) setActiveId(id);
  };

  const riskClass = (r?: string) => r === 'high' ? 'bg-red-50 border-red-200 text-red-800'
                                  : r === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-800'
                                                   : 'bg-emerald-50 border-emerald-200 text-emerald-800';

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-[var(--ep-red)]" />
          <div>
            <h1 className="text-2xl font-bold">{t("hrPerformanceAi")}</h1>
            <p className="text-sm text-muted-foreground">{t("xodimSamaradorligiChurnXavfiBonus")}</p>
          </div>
        </div>
      </header>

      <Card className="p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">{t("xodimId")}</label>
            <input type="number" className="w-full mt-1 px-3 py-2 border rounded-md text-sm" placeholder={t("masalan1")}
                   value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && search()} />
          </div>
          <div className="w-48">
            <label className="text-xs font-medium text-muted-foreground">{t("bazaviyOylikSoM")}</label>
            <input type="number" className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                   value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} />
          </div>
          <Button onClick={search} disabled={!employeeId}>
            <Search className="h-4 w-4 mr-1.5" /> {t("search")}
          </Button>
        </div>
      </Card>

      {activeId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Performance */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-[var(--ep-blue)]" />
              <h3 className="font-bold text-sm">{t("samaradorlik")}</h3>
            </div>
            {performance.isLoading ? <EPLoader /> : performance.data && (
              <>
                <div className={`text-4xl font-bold tabular-nums ${performance.data.score >= 80 ? 'text-[var(--ep-green)]' : performance.data.score >= 50 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`}>
                  {performance.data.score}
                </div>
                <div className="text-xs text-muted-foreground mb-3">{t("k100Ball")}</div>
                <ul className="text-xs space-y-1">
                  {performance.data.reasons.map((r, i) => <li key={i} className="text-slate-700">• {r}</li>)}
                </ul>
              </>
            )}
          </Card>

          {/* Churn */}
          <Card className={`p-5 border-2 ${riskClass(churn.data?.risk)}`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="font-bold text-sm">{t("chiqibKetishXavfi")}</h3>
            </div>
            {churn.isLoading ? <EPLoader /> : churn.data && (
              <>
                <div className="text-3xl font-bold uppercase">{churn.data.risk}</div>
                <ul className="text-xs space-y-1 mt-3">
                  {churn.data.reasonsUz.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </>
            )}
          </Card>

          {/* Bonus */}
          <Card className="p-5">
            <h3 className="font-bold text-sm mb-3">{t("oylikBonusTaxminiy")}</h3>
            {bonus.isLoading ? <EPLoader /> : bonus.data && (
              <>
                <div className="text-2xl font-bold text-[var(--ep-green)] tabular-nums">
                  {bonus.data.bonus.toLocaleString()} so'm
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ({bonus.data.details.bonusPct}% bonus, score {bonus.data.details.performanceScore})
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {!activeId && (
        <Card className="p-12 text-center text-muted-foreground">
          {t("yuqoridaXodimIdKiritingVa")}
        </Card>
      )}
    </div>
  );
}
