import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Droplet, Flame, TrendingUp } from "lucide-react";

interface UtilityReading {
  id: number;
  utilityType: "electricity" | "water" | "gas" | "steam";
  meterCode: string;
  facilityName: string | null;
  currentReading: number;
  previousReading: number;
  consumption: number;
  unit: string;
  unitCostUzs: number;
  totalCostUzs: number;
  readingDate: string;
}

const UTILITY_CONFIG: Record<UtilityReading["utilityType"], { label: string; icon: typeof Zap; color: string }> = {
  electricity: { label: "Elektr",  icon: Zap,    color: "text-yellow-600" },
  water:       { label: "Suv",     icon: Droplet, color: "text-blue-600" },
  gas:         { label: "Gaz",     icon: Flame,   color: "text-orange-600" },
  steam:       { label: "Bug'",    icon: Flame,   color: "text-rose-600" },
};

export default function UtilityReadingsPage() {
  const { t } = useTranslation('mro' as 'admin');

  const { data, isLoading } = useQuery<{ items: UtilityReading[] }>({
    queryKey: ["/api/mro/utility/readings"],
    queryFn: () => apiRequest("GET", "/api/mro/utility/readings"),
  });

  const items = selectArray<UtilityReading>(data, "items");
  const totalCost = items.reduce((s, r) => s + r.totalCostUzs, 0);
  const byType = items.reduce<Record<string, number>>((acc, r) => {
    acc[r.utilityType] = (acc[r.utilityType] ?? 0) + r.totalCostUzs;
    return acc;
  }, {});

  return (
    <DedicatedPageShell
      title={t('utility.title', "Elektr / Gaz / Suv hisobi")}
      description={t('utility.description', "Kommunal hisoblagichlar va xarajatlar oylik kuzatuv")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('utility.totalCost', "Jami xarajat")} value={`${totalCost.toLocaleString()} UZS`} icon={<TrendingUp className="h-4 w-4" />} variant="default" />
        <KpiCard label={t('utility.electricity', "Elektr")} value={`${(byType.electricity ?? 0).toLocaleString()}`} icon={<Zap className="h-4 w-4" />} variant="warning" />
        <KpiCard label={t('utility.water', "Suv")} value={`${(byType.water ?? 0).toLocaleString()}`} icon={<Droplet className="h-4 w-4" />} variant="default" />
        <KpiCard label={t('utility.gas', "Gaz")} value={`${(byType.gas ?? 0).toLocaleString()}`} icon={<Flame className="h-4 w-4" />} variant="warning" />
      </div>

      <Section title={t('utility.readings', "Hisoblagichlar")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('utility.empty', "Hisoblagich yo'q")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">{t('utility.type', "Tur")}</th>
                  <th className="text-left p-2">{t('utility.meter', "Hisoblagich")}</th>
                  <th className="text-left p-2">{t('utility.facility', "Bino")}</th>
                  <th className="text-right p-2">{t('utility.previous', "Oldingi")}</th>
                  <th className="text-right p-2">{t('utility.current', "Joriy")}</th>
                  <th className="text-right p-2">{t('utility.consumption', "Sarf")}</th>
                  <th className="text-right p-2">{t('utility.cost', "Xarajat")}</th>
                  <th className="text-left p-2">{t('utility.date', "Sana")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const cfg = UTILITY_CONFIG[r.utilityType];
                  const Icon = cfg.icon;
                  return (
                    <tr key={r.id} className="border-b">
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                          <span>{cfg.label}</span>
                        </div>
                      </td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">{r.meterCode}</Badge></td>
                      <td className="p-2 text-muted-foreground">{r.facilityName ?? '—'}</td>
                      <td className="text-right p-2 text-muted-foreground">{r.previousReading.toLocaleString()}</td>
                      <td className="text-right p-2">{r.currentReading.toLocaleString()}</td>
                      <td className="text-right p-2 font-medium">{r.consumption.toLocaleString()} {r.unit}</td>
                      <td className="text-right p-2 font-medium">{r.totalCostUzs.toLocaleString()}</td>
                      <td className="p-2 text-muted-foreground">{r.readingDate}</td>
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
