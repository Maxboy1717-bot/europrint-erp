/**
 * Agents Hub — 14 ta AI agent uchun yagona dashboard
 * URL: /agents
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, AlertTriangle, Brain, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPPageHeader } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
interface ModuleHealth {
  code:      string;
  name:      string;
  health:    number;
  errors24h: number;
}

interface Briefing {
  date:    string;
  kpi:     {
    ordersDelayed: number;
    ordersDelayedAmount: number;
    ccInboxOverdue: number;
    criticalStockCount: number;
  };
  alerts:  Array<{ severity: string; title: string; message: string }>;
  summary: string;
}

const AGENT_CARDS = [
  { code: 'director',    name: 'Direktor',          icon: '👔', color: '#3B82F6', endpoint: '/api/agents/director/briefing' },
  { code: 'crm',         name: 'CRM Lead Scoring',  icon: '📊', color: '#8B5CF6', endpoint: '/api/agents/crm/score-leads' },
  { code: 'production',  name: 'Ishlab chiqarish',  icon: '🏭', color: '#F59E0B', endpoint: '/api/agents/production/monitor' },
  { code: 'inventory',   name: 'Ombor',             icon: '📦', color: '#10B981', endpoint: '/api/agents/inventory/critical' },
  { code: 'cashflow',    name: 'Cash-flow',         icon: '💰', color: '#EC4899', endpoint: '/api/agents/finance/cashflow' },
  { code: 'supplier',    name: 'Ta\'minot',         icon: '🛒', color: '#06B6D4', endpoint: '/api/agents/supplier/scores' },
  { code: 'hr',          name: 'HR Performance',    icon: '👥', color: '#EF4444', endpoint: '/api/agents/hr/performance' },
  { code: 'quality',     name: 'Sifat AI Vision',   icon: '✅', color: '#14B8A6', endpoint: '/api/agents/quality/trend' },
  { code: 'security',    name: 'Xavfsizlik',        icon: '🔒', color: '#DC2626', endpoint: '/api/agents/security/access-attempts' },
  { code: 'marketing',   name: 'Marketing',         icon: '📢', color: '#A855F7', endpoint: '/api/agents/marketing/segments' },
  { code: 'lms',         name: 'LMS',               icon: '📚', color: '#0EA5E9', endpoint: '/api/agents/lms/expiry' },
  { code: 'iot',         name: 'IoT/Kamera',        icon: '📡', color: '#22C55E', endpoint: '/api/agents/iot/sensor' },
  { code: 'facilities',  name: 'Xo\'jalik',         icon: '🔧', color: '#84CC16', endpoint: '/api/agents/facilities/maintenance' },
  { code: 'strategic',   name: 'Strategik',         icon: '🎯', color: '#F97316', endpoint: '/api/agents/strategic/forecast-revenue' },
];

export default function AgentsHub() {
  const { t } = useTranslation('common');
  const [, navigate] = useLocation();
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);

  const briefingQ = useQuery<Briefing>({
    queryKey: ['/api/agents/director/briefing'],
    queryFn: () => apiRequest<Briefing>('GET', '/api/agents/director/briefing'),
    refetchInterval: 60_000,
  });

  const healthQ = useQuery<ModuleHealth[]>({
    queryKey: ['/api/agents/director/module-health'],
    queryFn: () => apiRequest<ModuleHealth[]>('GET', '/api/agents/director/module-health'),
    refetchInterval: 60_000,
  });

  async function ask() {
    if (!question.trim()) return;
    setAskLoading(true); setAnswer(null);
    try {
      const r = await apiRequest<{ answer: string }>('POST', '/api/agents/director/ask', { question });
      setAnswer(r.answer);
    } catch (e) {
      setAnswer(`Xatolik: ${(e as Error).message}`);
    } finally {
      setAskLoading(false);
    }
  }

  const b = briefingQ.data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Sarlavha */}
      <EPPageHeader
        title={<span className="flex items-center gap-3"><Sparkles className="h-7 w-7 text-[var(--ep-blue)]" />{t("aiAgentlar")}</span>}
        subtitle={t("k14TaAvtonomAiAgent")}
        actions={
          <>
            <Button variant="outline" onClick={() => { briefingQ.refetch(); healthQ.refetch(); }}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> {t("refresh")}
            </Button>
            <Button onClick={() => setAskOpen(true)}>
              <Brain className="h-4 w-4 mr-1.5" /> AI ga savol
            </Button>
          </>
        }
      />

      {/* Direktor brifing kartasi */}
      <Card className="p-5 border-2 border-blue-200 from-blue-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👔</span>
            <h2 className="font-bold text-lg">{t("direktorBrifing")}</h2>
            <span className="text-xs text-muted-foreground">{b?.date}</span>
          </div>
          {(b?.alerts?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-[var(--ep-red)] text-xs font-bold">
              <AlertTriangle className="h-3 w-3" /> {b?.alerts?.length} ogohlantirish
            </span>
          )}
        </div>
        {briefingQ.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</p>
        ) : briefingQ.isError ? (
          <p className="text-sm text-[var(--ep-red)]">{t("aiBrifingYuklabBoLmadiBackend")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Stat label={t("kechikkanBuyurtmalar")} value={b?.kpi.ordersDelayed ?? 0} color="amber" />
              <Stat label="24h SLA buzilgan" value={b?.kpi.ccInboxOverdue ?? 0} color="red" />
              <Stat label={t("kritikQoldiqlar")} value={b?.kpi.criticalStockCount ?? 0} color="orange" />
              <Stat label={t("buyurtmaQiymati")} value={`${(b?.kpi.ordersDelayedAmount ?? 0).toLocaleString()} so'm`} color="blue" />
            </div>
            <div className="bg-white rounded-lg border p-3 text-sm leading-relaxed">
              <span className="text-xs font-bold text-[var(--ep-blue)] uppercase tracking-wider">{t("aiXulosa")}</span>
              <p className="mt-1">{b?.summary}</p>
            </div>
          </>
        )}
      </Card>

      {/* 20 modul holati */}
      <Card className="p-5">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>{t("k20ModulHolati")}</span>
          <span className="text-xs text-muted-foreground font-normal">{t('realTime1')}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {(Array.isArray(healthQ.data) ? healthQ.data : []).map(m => (
            <div key={m.code} className="border rounded-lg p-2 text-center">
              <div className="text-xs font-medium truncate" title={m.name}>{m.name}</div>
              <div className={`mt-1 text-lg font-bold ${m.health >= 80 ? 'text-[var(--ep-green)]' : m.health >= 50 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`}>
                {m.health}
              </div>
              {m.errors24h > 0 && <div className="text-[10px] text-[var(--ep-red)]">{m.errors24h} xato</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* 14 agent kartochka */}
      <div>
        <h2 className="font-bold text-lg mb-3">{t("k14TaAiAgent")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {AGENT_CARDS.map(a => (
            <Card key={a.code} className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/agents/${a.code}`)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl"
                     style={{ background: `${a.color}15` }}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground">Agent {a.code}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* AI savol modal */}
      {askOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAskOpen(false)}>
          <Card className="w-full max-w-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-4 w-4 text-[var(--ep-blue)]" />
              <h3 className="font-bold text-lg">{t("aiMaslahatchi")}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {t("direktorUchunStrategikSavolBering")}
            </p>
            <textarea
              className="w-full border rounded-md p-3 text-sm min-h-[100px]"
              placeholder={t("masalanBuHaftaQaysiMijozga")}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => setAskOpen(false)}>{t("close2")}</Button>
              <Button onClick={ask} disabled={!question.trim() || askLoading}>
                <Send className="h-4 w-4 mr-1.5" /> {askLoading ? 'AI fikrlamoqda...' : 'So\'rash'}
              </Button>
            </div>
            {answer && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="text-xs font-bold text-[var(--ep-blue)] uppercase mb-1">{t("aiJavob")}</div>
                <p className="whitespace-pre-wrap">{answer}</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  const tones: Record<string, string> = {
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    red:    'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[color] ?? tones.blue}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-80">{label}</div>
    </div>
  );
}
