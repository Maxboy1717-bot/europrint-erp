/**
 * @module MaterialBalanceSections
 * @description Overview and Alerts tab-content sections for the Material
 * Balance page. Receives pre-filtered alert arrays and renders the stock
 * status tables.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
} from "lucide-react";
import type { StockAlert, AlertsResponse } from "./MaterialBalanceTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const SKELETON_KEYS = [1, 2, 3];

export function SkeletonRows() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-2">
      {SKELETON_KEYS.map((i) => (
        <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OverviewSection
// ---------------------------------------------------------------------------

interface OverviewSectionProps {
  criticalAlerts: StockAlert[];
  warningAlerts: StockAlert[];
  overviewLoading: boolean;
}

export function OverviewSection({
  criticalAlerts,
  warningAlerts,
  overviewLoading,
}: OverviewSectionProps) {
  return (
    <div className="space-y-4 mt-4">
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-[var(--ep-red)] dark:text-red-400 flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5" />
              Kritik — material tugagan ({criticalAlerts.length} ta)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("xomAshyo")}</TableHead>
                  <TableHead className="text-right">{t("qoldiq")}</TableHead>
                  <TableHead className="text-right">{t("minZaxira")}</TableHead>
                  <TableHead>{t("olchov1")}</TableHead>
                  <TableHead>{t("ombor")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(criticalAlerts) ? criticalAlerts : []).map(
                  (a) => (
                    <TableRow key={a.id} data-testid={`row-critical-${a.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-sm">{a.kod}</TableCell>
                      <TableCell className="font-medium">{a.xomAshyo}</TableCell>
                      <TableCell className="text-right text-[var(--ep-red)] dark:text-red-400 font-bold">
                        {a.currentStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {a.minStock}
                      </TableCell>
                      <TableCell>{a.unitOfMeasure}</TableCell>
                      <TableCell>{a.warehouseName || "—"}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}

      {warningAlerts.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-[var(--ep-yellow)] dark:text-yellow-400 flex items-center gap-2 text-base">
              <TrendingDown className="w-5 h-5" />
              Ogohlantirish — kam qolgan ({warningAlerts.length} ta)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("xomAshyo")}</TableHead>
                  <TableHead className="text-right">{t("qoldiq")}</TableHead>
                  <TableHead className="text-right">{t("min1")}</TableHead>
                  <TableHead className="text-right">{t("etishmovchilik")}</TableHead>
                  <TableHead>{t("olchov1")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(warningAlerts) ? warningAlerts : [])
                  .slice(0, 10)
                  .map((a) => (
                    <TableRow key={a.id} data-testid={`row-warning-${a.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-sm">{a.kod}</TableCell>
                      <TableCell className="font-medium">{a.xomAshyo}</TableCell>
                      <TableCell className="text-right text-[var(--ep-yellow)] dark:text-yellow-400 font-semibold">
                        {a.currentStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {a.minStock}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {a.deficit}
                      </TableCell>
                      <TableCell>{a.unitOfMeasure}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}

      {!overviewLoading &&
        criticalAlerts.length === 0 &&
        warningAlerts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <CheckCircle className="w-10 h-10 text-[var(--ep-green)]" />
              <p className="text-muted-foreground">
                {t("barchaMateriallarYetarliDarajada")}
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlertsSection
// ---------------------------------------------------------------------------

interface AlertsSectionProps {
  alerts: AlertsResponse | undefined;
  allAlerts: StockAlert[];
  alertsLoading: boolean;
}

export function AlertsSection({
  alerts,
  allAlerts,
  alertsLoading,
}: AlertsSectionProps) {
  return (
    <div className="mt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">{t("barchaOgohlantirishlar")}</CardTitle>
          <div className="flex gap-2">
            <EPStatusPill tone="danger" data-testid="badge-critical-count">
              {alerts?.criticalCount ?? 0} kritik
            </EPStatusPill>
            <EPStatusPill tone="neutral" data-testid="badge-warning-count">
              {alerts?.warningCount ?? 0} ogohlantirish
            </EPStatusPill>
          </div>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <SkeletonRows />
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("status28")}</TableHead>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("xomAshyo")}</TableHead>
                  <TableHead className="text-right">{t("qoldiq")}</TableHead>
                  <TableHead className="text-right">{t("min1")}</TableHead>
                  <TableHead className="text-right">{t("etishmovchilik")}</TableHead>
                  <TableHead>{t("olchov1")}</TableHead>
                  <TableHead>{t("ombor")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(allAlerts) ? allAlerts : []).map((a) => (
                  <TableRow key={a.id} data-testid={`row-alert-${a.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      {a.severity === "critical" ? (
                        <EPStatusPill tone="danger">{t("kritik")}</EPStatusPill>
                      ) : (
                        <EPStatusPill tone="neutral">{t("kam")}</EPStatusPill>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{a.kod}</TableCell>
                    <TableCell className="font-medium">{a.xomAshyo}</TableCell>
                    <TableCell className="text-right font-bold">
                      <span
                        className={
                          a.severity === "critical"
                            ? "text-[var(--ep-red)] dark:text-red-400"
                            : "text-[var(--ep-yellow)] dark:text-yellow-400"
                        }
                      >
                        {a.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {a.minStock}
                    </TableCell>
                    <TableCell className="text-right">{a.deficit}</TableCell>
                    <TableCell>{a.unitOfMeasure}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.warehouseName || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
