/**
 * Facilities AI Dashboard — /agents/facilities
 */
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Wrench, Zap, Droplet, Flame, Calendar, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface UtilityRes { electricity: number; gas: number; water: number; deltaPct: number }
interface MaintenanceItem { machineId: string; nextMaintenanceAt: string; daysLeft: number }
interface SuppliesRes { low: number; out: number }

export default function FacilitiesDashboard() {
  const { t } = useTranslation("common");
  const utility = useQuery<UtilityRes>({
    queryKey: ['/api/agents/facilities/utility'],
    queryFn: () => apiRequest<UtilityRes>('GET', '/api/agents/facilities/utility?month=current'),
  });

  const maintenance = useQuery<MaintenanceItem[]>({
    queryKey: ['/api/agents/facilities/maintenance'],
    queryFn: () => apiRequest<MaintenanceItem[]>('GET', '/api/agents/facilities/maintenance'),
  });

  const supplies = useQuery<SuppliesRes>({
    queryKey: ['/api/agents/facilities/supplies'],
    queryFn: () => apiRequest<SuppliesRes>('GET', '/api/agents/facilities/supplies'),
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <header className="flex items-center gap-3">
        <Wrench className="h-7 w-7 text-[var(--ep-green)]" />
        <div>
          <h1 className="text-2xl font-bold">{t("xojalikAi")}</h1>
          <p className="text-sm text-muted-foreground">{t("kommunalTexnikXizmatOfisMateriallar")}</p>
        </div>
      </header>

      {/* Kommunal */}
      <div>
        <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Kommunal to'lovlar (joriy oy)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UtilityCard label={t("elektr")} amount={utility.data?.electricity ?? 0} icon={<Zap className="h-5 w-5 text-[var(--ep-yellow)]" />} loading={utility.isLoading} />
          <UtilityCard label={t("gaz")}    amount={utility.data?.gas ?? 0}         icon={<Flame className="h-5 w-5 text-[var(--ep-primary)]" />} loading={utility.isLoading} />
          <UtilityCard label={t("suv")}    amount={utility.data?.water ?? 0}       icon={<Droplet className="h-5 w-5 text-[var(--ep-blue)]" />} loading={utility.isLoading} />
        </div>
        {utility.data && (
          <div className={`mt-2 text-xs ${utility.data.deltaPct > 20 ? 'text-[var(--ep-red)] font-bold' : 'text-muted-foreground'}`}>
            {t("otganOygaNisbatan1")}<span className="tabular-nums">{utility.data.deltaPct > 0 ? '+' : ''}{utility.data.deltaPct}%</span>
            {utility.data.deltaPct > 20 && ' — ⚠️ Tekshiruv kerak'}
          </div>
        )}
      </div>

      {/* Texnik xizmat */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-[var(--ep-blue)]" />
          <h3 className="font-bold text-sm">{t("texnikXizmatYaqin14Kun")}</h3>
        </div>
        {maintenance.isLoading ? <EPLoader /> :
         (maintenance.data?.length ?? 0) === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">{t("yaqindaXizmatKerakBolganMashina")}</div>
        ) : (
          <div className="space-y-2">
            {maintenance.data?.map(m => (
              <div key={m.machineId} className={`flex items-center justify-between p-3 rounded-lg ${m.daysLeft <= 3 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div>
                  <div className="font-semibold">Mashina #{m.machineId}</div>
                  <div className="text-xs text-muted-foreground">{new Date(m.nextMaintenanceAt).toLocaleDateString('uz-UZ')}</div>
                </div>
                <div className={`text-lg font-bold tabular-nums ${m.daysLeft <= 3 ? 'text-[var(--ep-red)]' : 'text-[var(--ep-yellow)]'}`}>
                  {m.daysLeft} kun
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ofis materiallar */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-[var(--ep-blue)]" />
          <h3 className="font-bold text-sm">{t("ofisMateriallarHolati")}</h3>
        </div>
        {supplies.isLoading ? <EPLoader /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs uppercase font-semibold text-[var(--ep-yellow)]">{t("kamQoldi")}</div>
              <div className="text-3xl font-bold text-amber-800">{supplies.data?.low ?? 0}</div>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-xs uppercase font-semibold text-[var(--ep-red)]">{t("tugadi")}</div>
              <div className="text-3xl font-bold text-red-800">{supplies.data?.out ?? 0}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function UtilityCard({ label, amount, icon, loading }: { label: string; amount: number; icon: React.ReactNode; loading?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase font-semibold text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-bold tabular-nums">
        {loading ? <EPLoader size={20} className="inline" /> : `${amount.toLocaleString()} so'm`}
      </div>
    </Card>
  );
}
