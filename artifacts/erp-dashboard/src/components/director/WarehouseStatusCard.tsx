/**
 * @module WarehouseStatusCard
 * @description React UI component.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Layers, Zap, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle, formatMoney } from "@/components/director/helpers";
import type { DirDashboard, WMSRentalData } from "@/components/director/types";
import { useTranslation } from '@/lib/i18n';

interface WarehouseStatusCardProps {
  dash: DirDashboard | undefined;
  wmsRental: WMSRentalData | undefined;
  wmsRentalLoad: boolean;
  validationIssueCount?: number;
  totalRules?: number;
}

export function WarehouseStatusCard({ dash, wmsRental, wmsRentalLoad, validationIssueCount = 0, totalRules = 0 }: WarehouseStatusCardProps) {
  const { t } = useTranslation("common");
  // `dash?.alerts` may be undefined when the dashboard query hasn't resolved
  // (or returned an empty payload). Optional-chain the inner access too.
  const stats = [
    { label: "Kritik materiallar", value: dash?.alerts?.minStock ?? 0, ok: (dash?.alerts?.minStock ?? 0) === 0, icon: AlertTriangle, desc: "min-stock ogohlantirishlari" },
    { label: "IoT ogohlantirishlari", value: dash?.alerts?.iot ?? 0, ok: (dash?.alerts?.iot ?? 0) === 0, icon: Zap, desc: "so'nggi 8 soatda" },
    { label: "Tizim qoidalari", value: totalRules, ok: true, icon: CheckCircle, desc: `${validationIssueCount} ta muammo` },
  ];

  return (
    <Card data-testid="card-warehouse-status">
      <CardHeader className="pb-3">
        <SectionTitle icon={Layers} title={t("omborVaTaminot")} sub="Stok va ogohlantirishlar" accent="text-[var(--ep-yellow)]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(Array.isArray(stats) ? stats : []).map((item, i) => (
            <div key={`k-${i}`} className={cn("flex items-center justify-between p-3 rounded-lg", item.ok ? "bg-muted/30" : "bg-red-50 border border-red-100")} data-testid={`warehouse-stat-${i}`}>
              <div className="flex items-center gap-2">
                <item.icon className={cn("w-4 h-4", item.ok ? "text-muted-foreground" : "text-[var(--ep-red)]")} />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <span className={cn("text-xl font-bold", item.ok ? "text-foreground" : "text-[var(--ep-red)]")}>{item.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ombor Ichki Ijara (0.15%/oy)</p>
          {wmsRentalLoad ? (
            <Skeleton className="h-20 rounded-lg" />
          ) : wmsRental && wmsRental.rentalData.length > 0 ? (
            <div className="space-y-2">
              {wmsRental.rentalData.slice(0, 3).map((row, i) => (
                <div key={`k-${i}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/20" data-testid={`wms-rental-row-${i}`}>
                  <div>
                    <p className="text-xs font-medium text-foreground">{row.warehouseName}</p>
                    <p className="text-[10px] text-muted-foreground">{row.itemCount} ta karti · {row.totalQty.toLocaleString()} dona</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{formatMoney(row.rentalCostMonthly)} so'm/oy</p>
                    <p className="text-[10px] text-muted-foreground">bugun: {formatMoney(row.rentalCostToDate)}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-800/30" data-testid="wms-rental-total">
                <p className="text-xs font-bold text-foreground">Jami ijara ({wmsRental.month})</p>
                <p className="text-sm font-bold text-[var(--ep-yellow)]">{formatMoney(wmsRental.grandTotal)} so'm</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">{t("omborMalumotiYoq")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
