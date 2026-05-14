/**
 * Strategic AI Dashboard — /agents/strategic
 * Daromad bashorat (3 scenario) + scenario simulator + investitsiya tavsiyalari
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Lightbulb, Sparkles, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface RevenueRes { optimistic: number; realistic: number; pessimistic: number }
interface ScenarioRes { analysis: string }
interface InvestmentRes { recommendations: Array<{ item: string; cost: number; roi: number; priority: 'high'|'medium'|'low' }> }

export default function StrategicDashboard() {
  const { t } = useTranslation("common");
  const [scenarioInput, setScenarioInput] = useState('Xom ashyo narxi 15% ga oshib ketsa nima bo\'ladi?');
  const [scenarioResult, setScenarioResult] = useState<string | null>(null);

  const revenue = useQuery<RevenueRes>({
    queryKey: ['/api/agents/strategic/forecast-revenue'],
    queryFn: () => apiRequest<RevenueRes>('GET', '/api/agents/strategic/forecast-revenue?months=6'),
  });

  const investment = useQuery<InvestmentRes>({
    queryKey: ['/api/agents/strategic/investment'],
    queryFn: () => apiRequest<InvestmentRes>('GET', '/api/agents/strategic/investment'),
  });

  const scenarioMutation = useMutation<ScenarioRes, Error, string>({
    mutationFn: (s) => apiRequest<ScenarioRes>('POST', '/api/agents/strategic/scenario', { scenario: s }),
    onSuccess: (data) => setScenarioResult(data.analysis),
    onError: (e) => setScenarioResult(`Xatolik: ${e.message}`),
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <header className="flex items-center gap-3">
        <Target className="h-7 w-7 text-[var(--ep-primary)]" />
        <div>
          <h1 className="text-2xl font-bold">{t("strategikAi")}</h1>
          <p className="text-sm text-muted-foreground">6 oylik bashorat + scenario simulator + investitsiya tavsiyalari</p>
        </div>
      </header>

      {/* 6 oylik daromad bashorat — 3 scenario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-2 border-emerald-200 bg-emerald-50/40">
          <div className="text-xs uppercase font-bold text-[var(--ep-green)]">{t("optimistik")}</div>
          <div className="text-2xl font-bold text-emerald-800 mt-2 tabular-nums">
            {revenue.isLoading ? <EPLoader size={20} /> :
              `${(revenue.data?.optimistic ?? 0).toLocaleString()} so'm`}
          </div>
        </Card>
        <Card className="p-5 border-2 border-amber-200 bg-amber-50/40">
          <div className="text-xs uppercase font-bold text-[var(--ep-yellow)]">{t("realistik")}</div>
          <div className="text-2xl font-bold text-amber-800 mt-2 tabular-nums">
            {revenue.isLoading ? <EPLoader size={20} /> :
              `${(revenue.data?.realistic ?? 0).toLocaleString()} so'm`}
          </div>
        </Card>
        <Card className="p-5 border-2 border-red-200 bg-red-50/40">
          <div className="text-xs uppercase font-bold text-[var(--ep-red)]">{t("pessimistik")}</div>
          <div className="text-2xl font-bold text-red-800 mt-2 tabular-nums">
            {revenue.isLoading ? <EPLoader size={20} /> :
              `${(revenue.data?.pessimistic ?? 0).toLocaleString()} so'm`}
          </div>
        </Card>
      </div>

      {/* Scenario simulator */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[var(--ep-blue)]" />
          <h3 className="font-bold text-sm">Scenario simulator (AI tahlil)</h3>
        </div>
        <textarea
          className="w-full border rounded-md p-3 text-sm min-h-[80px]"
          placeholder={t("masalanYangiRaqobatchiBozorgaKirsa")}
          value={scenarioInput}
          onChange={(e) => setScenarioInput(e.target.value)}
        />
        <Button onClick={() => scenarioMutation.mutate(scenarioInput)} disabled={!scenarioInput.trim() || scenarioMutation.isPending} className="mt-3">
          <Send className="h-4 w-4 mr-1.5" />
          {scenarioMutation.isPending ? 'AI tahlil qilmoqda...' : 'Scenarioni tahlil qilish'}
        </Button>
        {scenarioResult && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm whitespace-pre-wrap">
            <div className="text-xs font-bold text-[var(--ep-blue)] uppercase mb-1">AI tahlil natijasi</div>
            <p>{scenarioResult}</p>
          </div>
        )}
      </Card>

      {/* Investitsiya tavsiyalari */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-[var(--ep-yellow)]" />
          <h3 className="font-bold text-sm">Investitsiya tavsiyalari (prioritet bo'yicha)</h3>
        </div>
        {investment.isLoading ? <EPLoader /> : (
          <div className="space-y-2">
            {investment.data?.recommendations.map((rec, i) => (
              <div key={i} className={`p-3 rounded-lg border flex items-center justify-between ${
                rec.priority === 'high' ? 'border-red-300 bg-red-50/60' :
                rec.priority === 'medium' ? 'border-amber-300 bg-amber-50/60' :
                'border-slate-300 bg-slate-50/60'
              }`}>
                <div>
                  <div className="font-semibold">{rec.item}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t("xarajat")}<span className="font-bold tabular-nums">{rec.cost.toLocaleString()} so'm</span> · ROI: <span className="font-bold">{rec.roi}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                    rec.priority === 'medium' ? 'bg-amber-200 text-amber-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>{rec.priority}</span>
                  <TrendingUp className="h-4 w-4 text-[var(--ep-green)]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
