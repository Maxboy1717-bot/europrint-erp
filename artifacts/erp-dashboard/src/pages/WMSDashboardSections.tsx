/**
 * @module WMSDashboardSections
 * @description KPI and Movement section UI components for WMSDashboard page.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle,
  BarChart3, Truck, Clock, TrendingUp, Layers,
  RefreshCw,
} from "lucide-react";
import type { WMSKPIs, MovementSummary, AlertData } from "./WMSDashboardTypes";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill } from "@/components/ep";
function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={`k-${i}`}><CardContent className="pt-6">
          <Skeleton className="h-4 w-24 mb-2 rounded-lg" />
          <Skeleton className="h-8 w-16 mb-1 rounded-lg" />
          <Skeleton className="h-3 w-20 rounded-lg" />
        </CardContent></Card>
      ))}
    </div>
  );
}

interface KPISectionProps {
  kpis: WMSKPIs | undefined;
  isLoading: boolean;
}

export function KPISection({kpis, isLoading }: KPISectionProps) {
  const { t } = useTranslation('common');
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Joriy holat</h2>
      {isLoading ? <KPISkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jami materiallar</p>
                  <p className="text-3xl font-bold mt-1">{kpis?.totalMaterials || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">nomenklatura pozitsiya</p>
                </div>
                <Package className="h-8 w-8 text-[var(--ep-blue)] opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ombor qiymati</p>
                  <p className="text-2xl font-bold mt-1">
                    {(kpis?.totalValue || 0) >= 1_000_000
                      ? `${((kpis?.totalValue || 0) / 1_000_000).toFixed(1)}M`
                      : (kpis?.totalValue || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">so'm</p>
                </div>
                <TrendingUp className="h-8 w-8 text-[var(--ep-green)] opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kam qoldiq</p>
                  <p className="text-3xl font-bold mt-1 text-[var(--ep-red)]">{kpis?.lowStockCount || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">minimal ostida</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400 opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kutilayotgan qabul</p>
                  <p className="text-3xl font-bold mt-1">{kpis?.pendingReceipts || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('goodsReceipt')}</p>
                </div>
                <ArrowDownCircle className="h-8 w-8 text-[var(--ep-green)] opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktiv transferlar</p>
                  <p className="text-3xl font-bold mt-1">{kpis?.pendingTransfers || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">harakatda</p>
                </div>
                <Truck className="h-8 w-8 text-[var(--ep-purple)] opacity-70" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Muddati o'tgan</p>
                  <p className="text-3xl font-bold mt-1 text-[var(--ep-primary)]">{kpis?.overdueReservations || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">rezervatsiya</p>
                </div>
                <Clock className="h-8 w-8 text-orange-400 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface MovementCardProps {
  todayMovement: MovementSummary | undefined;
  weekMovement: MovementSummary | undefined;
  isLoading: boolean;
  onReserveStock: (data: Record<string, unknown>) => void;
  isReserving: boolean;
}

export function MovementCard({ todayMovement, weekMovement, isLoading, onReserveStock, isReserving }: MovementCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[var(--ep-blue)]" />
          Bugungi harakat
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3"><Skeleton className="h-14 w-full rounded-lg" /><Skeleton className="h-14 w-full rounded-lg" /></div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-green-50">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-[var(--ep-green)]" />
                <span className="text-sm font-medium">Kirim</span>
              </div>
              <span className="text-lg font-bold text-[var(--ep-green)]">{(todayMovement?.totalIn || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-red-50">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-[var(--ep-red)]" />
                <span className="text-sm font-medium">Chiqim</span>
              </div>
              <span className="text-lg font-bold text-[var(--ep-red)]">{(todayMovement?.totalOut || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Sof o'zgarish</span>
              </div>
              <span className={`text-lg font-bold ${(todayMovement?.netChange || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                {(todayMovement?.netChange || 0) >= 0 ? "+" : ""}{(todayMovement?.netChange || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Jami {todayMovement?.transactionCount || 0} ta tranzaksiya | Hafta: {weekMovement?.transactionCount || 0} ta
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onReserveStock({ auto: true })}
              disabled={isReserving}
            >
              <Package className="h-4 w-4 mr-2" />
              Avtomatik zaxira tekshirish
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertsCardProps {
  alerts: AlertData | undefined;
  isLoading: boolean;
  totalAlerts: number;
  onCheckAlerts: () => void;
  isChecking: boolean;
  onReserveStock: (data: Record<string, unknown>) => void;
}

export function AlertsCard({ alerts, isLoading, totalAlerts, onCheckAlerts, isChecking, onReserveStock }: AlertsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />
            Diqqat talab qiluvchi
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
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
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
                <span className="text-sm">Muddati o'tgan rezervatsiyalar</span>
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
                    So'rov
                  </Button>
                </div>
              </div>
            ))}
            {totalAlerts === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Hozircha muammolar yo'q</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

