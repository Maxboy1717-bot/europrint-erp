/**
 * @module WmsAnalyticsSections
 * @description Section components for WmsAnalytics page.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, AlertTriangle, PackageX, Bell } from "lucide-react";
import type { TurnoverItem, DeadStockItem, RopAlert } from "./WmsAnalyticsTypes";
import { EPStatusPill } from "@/components/ep";

// ─── TurnoverBar ─────────────────────────────────────────────────────────────

export function TurnoverBar({ value, max }: { value: number; max: number }) {
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

// ─── KPI Summary Cards ────────────────────────────────────────────────────────

interface KpiSummaryProps {
  avgTurnover: number;
  deadStockCount: number | undefined;
  ropCount: number | undefined;
  turnoverLoading: boolean;
  deadStockLoading: boolean;
  ropLoading: boolean;
  t: (key: string) => string;
}

export function WmsKpiSummary({
  avgTurnover, deadStockCount, ropCount,
  turnoverLoading, deadStockLoading, ropLoading, t,
}: KpiSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[var(--ep-blue)]" />
            <div>
              {turnoverLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg" />
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
            <PackageX className="w-8 h-8 text-[var(--ep-yellow)]" />
            <div>
              {deadStockLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold">{deadStockCount ?? 0}</p>
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
              {ropLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold">{ropCount ?? 0}</p>
              )}
              <p className="text-sm text-muted-foreground">{t('rop_alerts_count')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ROP Alerts Section ───────────────────────────────────────────────────────

interface RopAlertsSectionProps {
  data: RopAlert[] | undefined;
  isLoading: boolean;
  t: (key: string) => string;
}

export function RopAlertsSection({ data, isLoading, t }: RopAlertsSectionProps) {
  const count = data?.length ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-destructive" />
          {t('rop_alerts_title')}
          {count > 0 && (
            <EPStatusPill tone="danger" className="ml-1">{count}</EPStatusPill>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        )}
        {!isLoading && count === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t('all_above_rop')}
          </p>
        )}
        {count > 0 && (
          <div className="ep-table-scroll"><Table>
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
              {(Array.isArray(data) ? data : []).map((alert) => (
                <TableRow key={alert.materialId} className="hover:bg-muted/40 transition-colors">
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
                    <EPStatusPill tone="danger" className="text-xs">
                      -{Math.abs(Number(alert.deficit)).toFixed(1)}
                    </EPStatusPill>
                  </TableCell>
                  <TableCell>
                    {alert.hasOpenRequisition ? (
                      <EPStatusPill tone="neutral" className="text-xs">{t('status_ordered')}</EPStatusPill>
                    ) : (
                      <Badge variant="outline" className="text-xs text-[var(--ep-yellow)] border-amber-300">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t('status_requisition_creating')}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

// TurnoverSection and DeadStockSection are in WmsAnalyticsTableSections.tsx
export { TurnoverSection, DeadStockSection } from "./WmsAnalyticsTableSections";
