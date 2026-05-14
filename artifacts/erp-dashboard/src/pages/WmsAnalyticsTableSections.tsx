/**
 * @module WmsAnalyticsTableSections
 * @description Turnover and dead-stock table sections for WmsAnalytics.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, PackageX } from "lucide-react";
import type { TurnoverItem, DeadStockItem } from "./WmsAnalyticsTypes";
import { TurnoverBar } from "./WmsAnalyticsSections";

// ─── Inventory Turnover Section ───────────────────────────────────────────────

interface TurnoverSectionProps {
  data: TurnoverItem[] | undefined;
  isLoading: boolean;
  maxTurnover: number;
  t: (key: string) => string;
}

export function TurnoverSection({ data, isLoading, maxTurnover, t }: TurnoverSectionProps) {
  const count = data?.length ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--ep-blue)]" />
          {t('turnover_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
          </div>
        )}
        {!isLoading && count === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">{t('no_data')}</p>
        )}
        {count > 0 && (
          <div className="ep-table-scroll"><Table>
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
              {(Array.isArray(data) ? data : [])
                .sort((a, b) => b.inventoryTurnover - a.inventoryTurnover)
                .slice(0, 20)
                .map((item) => (
                  <TableRow key={item.materialId} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <p className="font-medium text-sm">{item.materialName}</p>
                    </TableCell>
                    <TableCell>
                      {item.category && (
                        <Badge
                          variant="outline"
                          className={
                            item.category === "A"
                              ? "border-green-400 text-[var(--ep-green)]"
                              : item.category === "B"
                              ? "border-blue-400 text-[var(--ep-blue)]"
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
                      <span className={item.daysInventoryOutstanding > 90 ? "text-[var(--ep-yellow)] font-semibold" : ""}>
                        {Math.round(item.daysInventoryOutstanding)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                      {Number(item.avgInventory).toFixed(1)} {item.unitOfMeasure}
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

// ─── Dead Stock Section ───────────────────────────────────────────────────────

interface DeadStockSectionProps {
  data: DeadStockItem[] | undefined;
  isLoading: boolean;
  t: (key: string) => string;
}

export function DeadStockSection({ data, isLoading, t }: DeadStockSectionProps) {
  const count = data?.length ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PackageX className="w-4 h-4 text-[var(--ep-yellow)]" />
          {t('dead_stock_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
          </div>
        )}
        {!isLoading && count === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">{t('no_dead_stock')}</p>
        )}
        {count > 0 && (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('col_material')}</TableHead>
                <TableHead className="text-right">{t('col_current_stock')}</TableHead>
                <TableHead className="text-right">{t('col_days_idle')}</TableHead>
                <TableHead>{t('col_last_movement')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(data) ? data : [])
                .sort((a, b) => b.daysSinceMovement - a.daysSinceMovement)
                .map((item) => (
                  <TableRow key={item.materialId} className="hover:bg-muted/40 transition-colors">
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
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}
