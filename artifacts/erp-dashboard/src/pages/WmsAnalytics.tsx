import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { queryClient } from "@/lib/queryClient";
import { RefreshCw, TrendingUp, AlertTriangle, PackageX, Bell, BarChart3 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface TurnoverItem {
  materialId: number | string;
  materialName: string;
  unitOfMeasure?: string;
  inventoryTurnover: number;
  daysInventoryOutstanding: number;
  avgInventory: number;
  cogs: number;
  category?: string;
}

interface DeadStockItem {
  materialId: number | string;
  materialName: string;
  currentStock: number;
  unitOfMeasure?: string;
  lastMovementDate?: string;
  daysSinceMovement: number;
  estimatedValue?: number;
}

interface RopAlert {
  materialId: number | string;
  materialName: string;
  currentStock: number;
  reorderPoint: number;
  deficit: number;
  unitOfMeasure?: string;
  leadTimeDays?: number;
  hasOpenRequisition?: boolean;
}

function useTurnover() {
  return useQuery<TurnoverItem[]>({
    queryKey: ["/api/wms/inventory-turnover"],
    queryFn: () => apiRequest<TurnoverItem[]>("GET", "/api/wms/inventory-turnover"),
    staleTime: 60_000,
  });
}

function useDeadStock() {
  return useQuery<DeadStockItem[]>({
    queryKey: ["/api/wms/dead-stock"],
    queryFn: () => apiRequest<DeadStockItem[]>("GET", "/api/wms/dead-stock"),
    staleTime: 60_000,
  });
}

function useRopAlerts() {
  return useQuery<RopAlert[]>({
    queryKey: ["/api/wms/rop-alerts"],
    queryFn: () => apiRequest<RopAlert[]>("GET", "/api/wms/rop-alerts"),
    staleTime: 60_000,
  });
}

function TurnoverBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color =
    value >= 8
      ? "bg-green-500"
      : value >= 4
      ? "bg-blue-500"
      : value >= 2
      ? "bg-amber-500"
      : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium tabular-nums">{value.toFixed(1)}x</span>
    </div>
  );
}

export default function WmsAnalytics() {
  const { t } = useTranslation('wms');
  const turnover = useTurnover();
  const deadStock = useDeadStock();
  const ropAlerts = useRopAlerts();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/wms/inventory-turnover"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wms/dead-stock"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wms/rop-alerts"] });
  };

  const maxTurnover = Math.max(...(turnover.data ?? []).map((item) => item.inventoryTurnover), 1);
  const avgTurnover = turnover.data?.length
    ? turnover.data.reduce((s, item) => s + item.inventoryTurnover, 0) / turnover.data.length
    : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('inventory_intelligence_title')}
        description={t('inventory_intelligence_desc')}
        icon={<BarChart3 className="w-6 h-6" />}
        actions={
          <Button variant="outline" size="sm" onClick={refreshAll} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('refresh')}
          </Button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                {turnover.isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{avgTurnover.toFixed(1)}x</p>
                )}
                <p className="text-sm text-muted-foreground">{t('avg_turnover')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <PackageX className="w-8 h-8 text-amber-500" />
              <div>
                {deadStock.isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{deadStock.data?.length ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('dead_stock_count')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-destructive" />
              <div>
                {ropAlerts.isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{ropAlerts.data?.length ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('rop_alerts_count')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROP Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-destructive" />
            {t('rop_alerts_title')}
            {(ropAlerts.data?.length ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-1">{ropAlerts.data?.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ropAlerts.isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          )}
          {!ropAlerts.isLoading && (ropAlerts.data?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('all_above_rop')}
            </p>
          )}
          {(ropAlerts.data?.length ?? 0) > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('col_material')}</TableHead>
                  <TableHead className="text-right">{t('col_current')}</TableHead>
                  <TableHead className="text-right">{t('col_rop')}</TableHead>
                  <TableHead className="text-right">{t('col_deficit')}</TableHead>
                  <TableHead>{t('col_status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ropAlerts.data ?? []).map((alert) => (
                  <TableRow key={alert.materialId}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{alert.materialName}</p>
                        {alert.leadTimeDays && (
                          <p className="text-xs text-muted-foreground">LT: {alert.leadTimeDays} kun</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="text-destructive font-semibold">
                        {Number(alert.currentStock).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">{alert.unitOfMeasure}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(alert.reorderPoint).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Badge variant="destructive" className="text-xs">
                        -{Math.abs(Number(alert.deficit)).toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {alert.hasOpenRequisition ? (
                        <Badge variant="secondary" className="text-xs">{t('status_ordered')}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {t('status_requisition_creating')}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inventory Turnover */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            {t('turnover_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {turnover.isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          )}
          {!turnover.isLoading && (turnover.data?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('no_data')}
            </p>
          )}
          {(turnover.data?.length ?? 0) > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('col_material')}</TableHead>
                  <TableHead>{t('col_category')}</TableHead>
                  <TableHead>{t('col_turnover')}</TableHead>
                  <TableHead className="text-right">{t('col_dio')}</TableHead>
                  <TableHead className="text-right">{t('col_avg_balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(turnover.data ?? [])
                  .sort((a, b) => b.inventoryTurnover - a.inventoryTurnover)
                  .slice(0, 20)
                  .map((item) => (
                    <TableRow key={item.materialId}>
                      <TableCell>
                        <p className="font-medium text-sm">{item.materialName}</p>
                      </TableCell>
                      <TableCell>
                        {item.category && (
                          <Badge
                            variant="outline"
                            className={
                              item.category === "A"
                                ? "border-green-400 text-green-700"
                                : item.category === "B"
                                ? "border-blue-400 text-blue-700"
                                : "border-muted-foreground/40"
                            }
                          >
                            {item.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <TurnoverBar value={item.inventoryTurnover} max={maxTurnover} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={item.daysInventoryOutstanding > 90 ? "text-amber-600 font-semibold" : ""}>
                          {Math.round(item.daysInventoryOutstanding)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                        {Number(item.avgInventory).toFixed(1)} {item.unitOfMeasure}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dead Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PackageX className="w-4 h-4 text-amber-500" />
            {t('dead_stock_title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deadStock.isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          )}
          {!deadStock.isLoading && (deadStock.data?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('no_dead_stock')}
            </p>
          )}
          {(deadStock.data?.length ?? 0) > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('col_material')}</TableHead>
                  <TableHead className="text-right">{t('col_current_stock')}</TableHead>
                  <TableHead className="text-right">{t('col_days_idle')}</TableHead>
                  <TableHead>{t('col_last_movement')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(deadStock.data ?? [])
                  .sort((a, b) => b.daysSinceMovement - a.daysSinceMovement)
                  .map((item) => (
                    <TableRow key={item.materialId}>
                      <TableCell>
                        <p className="font-medium text-sm">{item.materialName}</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(item.currentStock).toFixed(1)}
                        <span className="text-xs text-muted-foreground ml-1">{item.unitOfMeasure}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={item.daysSinceMovement > 180 ? "destructive" : "secondary"}
                          className="tabular-nums"
                        >
                          {item.daysSinceMovement}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.lastMovementDate
                          ? new Date(item.lastMovementDate).toLocaleDateString("uz-UZ")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
