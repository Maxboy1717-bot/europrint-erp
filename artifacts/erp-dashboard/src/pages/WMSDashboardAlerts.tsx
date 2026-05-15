/**
 * @module WMSDashboardAlerts
 * @description Alerts and TopMaterials card components for WMSDashboard page.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BoxesIcon, RefreshCw } from "lucide-react";
import type { AlertData, TopMaterial } from "./WMSDashboardTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface AlertsCardProps {
  alerts: AlertData | undefined;
  isLoading: boolean;
  totalAlerts: number;
  onCheckAlerts: () => void;
  isChecking: boolean;
  onReserveStock: (data: Record<string, unknown>) => void;
}

export function AlertsCard({ alerts, isLoading, totalAlerts, onCheckAlerts, isChecking, onReserveStock }: AlertsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />
            {t("diqqatTalabQiluvchi")}
          </span>
          <div className="flex items-center gap-2">
            {totalAlerts > 0 && <EPStatusPill tone="danger">{totalAlerts}</EPStatusPill>}
            <Button variant="ghost" size="sm" onClick={onCheckAlerts} disabled={isChecking}>
              <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(alerts?.pendingQC || 0) > 0 && (
              <div className="flex items-center justify-between p-2 rounded-md border border-yellow-200 bg-yellow-50">
                <span className="text-sm">QC nazoratida kutayotgan</span>
                <EPStatusPill tone="neutral">{alerts?.pendingQC}</EPStatusPill>
              </div>
            )}
            {(alerts?.expiringBatches || 0) > 0 && (
              <div className="flex items-center justify-between p-2 rounded-md border border-orange-200 bg-orange-50">
                <span className="text-sm">Muddati yaqin partiyalar (30 kun)</span>
                <EPStatusPill tone="neutral">{alerts?.expiringBatches}</EPStatusPill>
              </div>
            )}
            {(alerts?.overdueTasks || 0) > 0 && (
              <div className="flex items-center justify-between p-2 rounded-md border border-red-200 bg-red-50">
                <span className="text-sm">{t("muddatiOtganRezervatsiyalar")}</span>
                <EPStatusPill tone="danger">{alerts?.overdueTasks}</EPStatusPill>
              </div>
            )}
            {(alerts?.lowStock || []).slice(0, 4).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-md border border-red-100 bg-red-50/60">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.kod} · Min: {m.minStock}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <EPStatusPill tone="danger">{m.currentStock}</EPStatusPill>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => onReserveStock({ materialId: m.id, urgent: true })}
                  >
                    {t("sorov")}
                  </Button>
                </div>
              </div>
            ))}
            {totalAlerts === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("hozirchaMuammolarYoq")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TopMaterialsCardProps {
  topMaterials: TopMaterial[] | undefined;
  isLoading: boolean;
}

export function TopMaterialsCard({ topMaterials, isLoading }: TopMaterialsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BoxesIcon className="h-4 w-4 text-[var(--ep-blue)]" />
          Top materiallar (qiymat bo'yicha)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-1">
            {(topMaterials || []).map((m, idx) => {
              const maxVal = topMaterials?.[0]?.value || 1;
              const pct = Math.round((m.value / maxVal) * 100);
              return (
                <div key={m.materialId} className="flex items-center gap-3 py-2">
                  <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <span className="text-sm font-semibold shrink-0 ml-2">
                        {m.value >= 1_000_000
                          ? `${(m.value / 1_000_000).toFixed(1)}M`
                          : m.value.toLocaleString()} so'm
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {(!topMaterials || topMaterials.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("materialMalumotlariTopilmadi")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
