/**
 * @module AIShiftManagementPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EPStatusPill } from "@/components/ep";

interface ShiftRecommendation {
  shiftId: number;
  shiftName: string;
  recommendedHeadcount: number;
  currentHeadcount: number;
  utilization: number;
  conflictsCount: number;
  aiReasoning: string;
}

const UTILIZATION_OPTIMAL_MIN = 75;
const UTILIZATION_OPTIMAL_MAX = 95;

export default function AIShiftManagementPage() {
  const { t } = useTranslation('ai');

  const { data, isLoading } = useQuery<{ items: ShiftRecommendation[] }>({
    queryKey: ["/api/ai/shift/recommendations"],
    queryFn: () => apiRequest("GET", "/api/ai/shift/recommendations"),
  });

  const items = selectArray<ShiftRecommendation>(data, "items");
  const conflicts = items.reduce((s, r) => s + r.conflictsCount, 0);
  const understaffed = items.filter((r) => r.utilization > UTILIZATION_OPTIMAL_MAX).length;
  const overstaffed = items.filter((r) => r.utilization < UTILIZATION_OPTIMAL_MIN).length;

  return (
    <DedicatedPageShell
      title={t('shiftMgmt.title', "Smena Boshqaruvi (AI)")}
      description={t('shiftMgmt.description', "AI tavsiyalari asosida smena yuklanishini optimallashtirish")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('shiftMgmt.shifts', "Smenalar")} value={items.length} icon={<Calendar className="h-4 w-4" />} />
        <KpiCard label={t('shiftMgmt.conflicts', "Konfliktlar")} value={conflicts} icon={<AlertTriangle className="h-4 w-4" />} variant={conflicts > 0 ? "danger" : "success"} />
        <KpiCard label={t('shiftMgmt.understaffed', "Yetishmasligi")} value={understaffed} icon={<Users className="h-4 w-4" />} variant={understaffed > 0 ? "warning" : "success"} />
        <KpiCard label={t('shiftMgmt.overstaffed', "Ortiqchasi")} value={overstaffed} icon={<Users className="h-4 w-4" />} variant={overstaffed > 0 ? "warning" : "default"} />
      </div>

      <Section title={t('shiftMgmt.recommendations', "AI tavsiyalari")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('shiftMgmt.empty', "Tavsiyalar yo'q")}</p>
        ) : (
          <div className="space-y-2">
            {items.map((r) => (
              <div key={r.shiftId} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{r.shiftName}</span>
                  <Badge variant={r.utilization > UTILIZATION_OPTIMAL_MAX ? "destructive" : r.utilization < UTILIZATION_OPTIMAL_MIN ? "outline" : "default"}>
                    {r.utilization}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('shiftMgmt.headcount', `Kerakli: ${r.recommendedHeadcount} · Hozirgi: ${r.currentHeadcount}`)}
                </p>
                <p className="text-xs italic">{r.aiReasoning}</p>
                {r.conflictsCount > 0 ? (
                  <EPStatusPill tone="danger" className="mt-2 text-xs">
                    {r.conflictsCount} ta konflikt
                  </EPStatusPill>
                ) : <CheckCircle2 className="h-3 w-3 inline-block text-[var(--ep-green)] mt-2" />}
              </div>
            ))}
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
