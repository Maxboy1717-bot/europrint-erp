/**
 * @module CanteenManagementPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils, Users, Package, DollarSign } from "lucide-react";

interface CanteenStats {
  totalMealsToday: number;
  totalEmployeesServed: number;
  costToday: number;
  costPerMeal: number;
  topMeals: Array<{ name: string; count: number }>;
  consumption: Array<{ ingredientName: string; quantity: number; unit: string; consumed: number }>;
}

export default function CanteenManagementPage() {
  const { t } = useTranslation('mro' as 'admin');

  const { data, isLoading } = useQuery<CanteenStats>({
    queryKey: ["/api/mro/canteen/stats"],
    queryFn: () => apiRequest("GET", "/api/mro/canteen/stats"),
  });

  const topMeals = selectArray<{ name: string; count: number }>(data?.topMeals);
  const consumption = selectArray<{ ingredientName: string; quantity: number; unit: string; consumed: number }>(data?.consumption);

  return (
    <DedicatedPageShell
      title={t('canteen.title', "Oshxona Boshqaruvi")}
      description={t('canteen.description', "Korxona oshxonasi — bugungi ovqatlar va xodimlar xizmati")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('canteen.mealsToday', "Bugungi ovqatlar")} value={data?.totalMealsToday ?? 0} icon={<Utensils className="h-4 w-4" />} />
        <KpiCard label={t('canteen.employeesServed', "Xizmat ko'rsatilgan")} value={data?.totalEmployeesServed ?? 0} icon={<Users className="h-4 w-4" />} />
        <KpiCard label={t('canteen.costToday', "Bugungi xarajat")} value={`${(data?.costToday ?? 0).toLocaleString()} UZS`} icon={<DollarSign className="h-4 w-4" />} variant="default" />
        <KpiCard label={t('canteen.costPerMeal', "Ovqat narxi")} value={`${(data?.costPerMeal ?? 0).toLocaleString()} UZS`} icon={<DollarSign className="h-4 w-4" />} variant="default" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title={t('canteen.topMeals', "Mashhur ovqatlar")}>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : topMeals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('canteen.noMeals', "Bugun ovqat yo'q")}</p>
          ) : (
            <div className="space-y-2">
              {topMeals.map((m) => (
                <div key={m.name} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{m.name}</span>
                  <Badge variant="outline">{m.count} porsiya</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={t('canteen.consumption', "Sarflangan masalliqlar")}>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : consumption.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('canteen.noConsumption', "Sarf yo'q")}</p>
          ) : (
            <div className="space-y-2">
              {consumption.map((c) => (
                <div key={c.ingredientName} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[var(--ep-primary)]" />
                    <span>{c.ingredientName}</span>
                  </div>
                  <span className="text-sm">
                    <strong>{c.consumed}</strong> / {c.quantity} {c.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </DedicatedPageShell>
  );
}
