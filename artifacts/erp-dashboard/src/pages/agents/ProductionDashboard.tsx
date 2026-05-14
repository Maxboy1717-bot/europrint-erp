/**
 * Production AI Dashboard — /agents/production
 * Buyurtmalar Kanban + OEE + bottleneck + kechikish ogohlantirishlari
 */
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Factory, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface MonitorRes { delayed: number; atRisk: number }
interface OeeRes { availability: number; performance: number; quality: number; oee: number }
interface BottleneckRes { machineId: string; queueSize: number }

export default function ProductionDashboard() {
  const { t } = useTranslation("common");
  const monitor = useQuery<MonitorRes>({
    queryKey: ['/api/agents/production/monitor'],
    queryFn: () => apiRequest<MonitorRes>('GET', '/api/agents/production/monitor'),
    refetchInterval: 60_000,
  });

  const oee = useQuery<OeeRes>({
    queryKey: ['/api/agents/production/oee'],
    queryFn: () => apiRequest<OeeRes>('GET', '/api/agents/production/oee?machineId=ALL&date=today'),
  });

  const bottleneck = useQuery<BottleneckRes | null>({
    queryKey: ['/api/agents/production/bottleneck'],
    queryFn: () => apiRequest<BottleneckRes | null>('GET', '/api/agents/production/bottleneck'),
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="h-7 w-7 text-[var(--ep-yellow)]" />
          <div>
            <h1 className="text-2xl font-bold">{t("ishlabChiqarishAi")}</h1>
            <p className="text-sm text-muted-foreground">{t("buyurtmalarRealTimeOeeBottleneck")}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { monitor.refetch(); oee.refetch(); bottleneck.refetch(); }}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> {t("refresh")}
        </Button>
      </header>

      {/* Asosiy KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiBox label={t("kechikkanBuyurtmalar")} value={monitor.data?.delayed ?? 0} tone={monitor.data && monitor.data.delayed > 0 ? 'red' : 'green'} icon={<AlertTriangle className="h-4 w-4" />} loading={monitor.isLoading} />
        <KpiBox label="Xavf ostidagi (2 kun)"  value={monitor.data?.atRisk ?? 0}  tone={monitor.data && monitor.data.atRisk > 0 ? 'amber' : 'green'} icon={<Activity className="h-5 w-5" />}      loading={monitor.isLoading} />
        <KpiBox label="OEE (%)"                value={`${Math.round((oee.data?.oee ?? 0) * 100)}%`} tone={(oee.data?.oee ?? 0) >= 0.65 ? 'green' : 'amber'} icon={<Factory className="h-5 w-5" />} loading={oee.isLoading} />
      </div>

      {/* OEE breakdown */}
      <Card className="p-5">
        <h3 className="font-bold text-sm mb-3">OEE breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OeeBar label="Mavjudlik (Availability)" value={oee.data?.availability ?? 0} />
          <OeeBar label="Unumdorlik (Performance)" value={oee.data?.performance  ?? 0} />
          <OeeBar label="Sifat (Quality)"          value={oee.data?.quality      ?? 0} />
        </div>
      </Card>

      {/* Buyurtmalar Kanban placeholder */}
      <Card className="p-5">
        <h3 className="font-bold text-sm mb-3">Buyurtmalar — Kanban (rejada → jarayon → tekshir → tayyor)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {['Rejada', 'Jarayonda', 'Tekshirilmoqda', 'Tayyor'].map(col => (
            <div key={col} className="border rounded-lg p-3 bg-slate-50 min-h-[200px]">
              <div className="font-semibold text-xs uppercase tracking-wider mb-2">{col}</div>
              <div className="text-xs text-muted-foreground italic text-center mt-8">
                {t("mesIntegratsiyaKelgachBuyurtmalarShu")}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottleneck */}
      <Card className="p-5">
        <h3 className="font-bold text-sm mb-2">Bottleneck (eng sekin ish markazi)</h3>
        {bottleneck.isLoading ? (
          <EPLoader />
        ) : bottleneck.data ? (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-[var(--ep-yellow)]" />
            <div>
              <div className="font-semibold">{bottleneck.data.machineId}</div>
              <div className="text-xs text-muted-foreground">{bottleneck.data.queueSize} ta operatsiya navbat</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{t("hozirgiBottleneckYoq")}</div>
        )}
      </Card>
    </div>
  );
}

function KpiBox({ label, value, tone, icon, loading }: { label: string; value: string | number; tone: 'green'|'amber'|'red'; icon: React.ReactNode; loading?: boolean }) {
  const cls = tone === 'red'   ? 'bg-red-50 border-red-200 text-red-800'
            : tone === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-800'
                               : 'bg-emerald-50 border-emerald-200 text-emerald-800';
  return (
    <Card className={`p-4 border-2 ${cls}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold tabular-nums">
        {loading ? <EPLoader size={24} className="inline" /> : value}
      </div>
    </Card>
  );
}

function OeeBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const tone = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
