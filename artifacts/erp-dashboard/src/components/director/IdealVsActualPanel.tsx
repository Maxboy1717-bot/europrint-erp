/**
 * @module IdealVsActualPanel
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/queryClient";
import type { IdealVsActual } from "./types";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

const FE_PROFIT_TARGET = 100_000_000;
const FE_REVENUE_TARGET = 800_000_000;

export function IdealVsActualPanel() {
  const { t } = useTranslation("common");
  const { data, isLoading } = useQuery<IdealVsActual>({
    queryKey: ["/api/director/ideal-vs-actual"],
    queryFn: async () => {
      const res = await apiRequest('GET', "/api/director/ideal-vs-actual") as unknown as Response;
      if (!res.ok) throw new Error("ideal-vs-actual failed");
      return res.json() as Promise<IdealVsActual>;
    },
    refetchInterval: 120_000,
  });

  const items = [
    {
      label: "Haftalik Foyda",
      actual: data?.profit?.formatted_actual ?? "0",
      target: data?.profit?.formatted_target ?? `${FE_PROFIT_TARGET / 1_000_000}M`,
      pct: data?.profit?.pct ?? 0,
      deviation: data?.profit?.deviation_pct ?? 0,
      color: (data?.profit?.pct ?? 0) >= 80 ? "bg-emerald-500" : (data?.profit?.pct ?? 0) >= 60 ? "bg-amber-500" : "bg-red-500",
    },
    {
      label: "Haftalik Daromad",
      actual: data?.revenue?.formatted_actual ?? "0",
      target: data?.revenue?.formatted_target ?? `${FE_REVENUE_TARGET / 1_000_000}M`,
      pct: data?.revenue?.pct ?? 0,
      deviation: data?.revenue?.deviation_pct ?? 0,
      color: (data?.revenue?.pct ?? 0) >= 80 ? "bg-emerald-500" : (data?.revenue?.pct ?? 0) >= 60 ? "bg-amber-500" : "bg-red-500",
    },
  ];

  return (
    <Card data-testid="card-ideal-vs-actual">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <CardTitle className="text-base font-semibold">{t("idealVsHaqiqat")}</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{t("weekly")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        ) : (
          <>
            {(Array.isArray(items) ? items : []).map((item, i) => (
              <div key={`k-${i}`} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.actual} / {item.target} so'm</span>
                    <span className={cn(
                      "text-xs font-bold px-1.5 py-0.5 rounded",
                      item.deviation >= 0 ? "bg-emerald-50 text-[var(--ep-green)]" : "bg-red-50 text-[var(--ep-red)]"
                    )}>
                      {item.deviation >= 0 ? "+" : ""}{item.deviation}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", item.color)}
                      style={{ width: `${Math.min(item.pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right">{item.pct}%</span>
                </div>
              </div>
            ))}
            {data && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("buyurtmalarBajarilishi")}</span>
                  <span className="font-semibold text-foreground">
                    {data.orders.completed}/{data.orders.total} ({data.orders.completion_pct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${data.orders.completion_pct}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
