/**
 * @module WMSExtendedSections
 * @description Re-export barrel for all WMSExtended section components.
 * Balance + Transfer sections live here; Lot/Requests/KPI/Rental in WMSExtendedSections2.tsx.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus } from "lucide-react";
import type { StockItem, WarehouseTransfer } from "./WMSExtendedTypes";
import { STATUS_CLASS_MAP, STATUS_LABEL_MAP } from "./WMSExtendedTypes";

import { useTranslation } from '@/lib/i18n';
// Re-exports from the second section file
export { LotSection, RequestsSection, KpiSection, RentalSection } from "./WMSExtendedSections2";

// ─── Helper ───────────────────────────────────────────────────────────────────

export function statusBadge(status?: string) {
  const { t } = useTranslation('common');
  const key = status || "pending";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_CLASS_MAP[key] || "bg-muted/40 text-muted-foreground"}`}>
      {STATUS_LABEL_MAP[key] || status || "Kutilmoqda"}
    </span>
  );
}

// ─── Balance Tab ──────────────────────────────────────────────────────────────

interface BalanceSectionProps {
  stock: StockItem[];
  stockLoading: boolean;
}

export function BalanceSection({ stock, stockLoading }: BalanceSectionProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{"Material"}</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("quantity")}</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("unit")}</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("ombor")}</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("holati")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">{t("Yuklanmoqda...")}</TableCell>
              </TableRow>
            ) : stock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  {t("materiallarYoq")}
                </TableCell>
              </TableRow>
            ) : (Array.isArray(stock) ? stock : []).slice(0, 12).map((item) => {
              const qty = Number(item.quantity || item.currentStock || 0);
              const minQty = Number(item.minQuantity || item.minStock || 10);
              const statusKey = qty <= 0 ? "out" : qty < minQty ? "low" : "ok";
              return (
                <TableRow key={item.id} data-testid={`row-balance-${item.id}`} className="hover:bg-background dark:hover:bg-slate-800/50">
                  <TableCell className="text-sm font-medium">{item.materialName || item.name || `Material #${item.id}`}</TableCell>
                  <TableCell className={`text-sm font-semibold ${qty <= 0 ? "text-[var(--ep-red)]" : qty < minQty ? "text-[var(--ep-primary)]" : "text-foreground dark:text-slate-100"}`}>
                    {qty.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.unit || item.unitOfMeasure || "kg"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.warehouseName || item.location || "—"}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      statusKey === "out" ? "bg-red-100 text-[var(--ep-red)] dark:bg-red-950 dark:text-red-400" :
                      statusKey === "low" ? "bg-yellow-100 text-[var(--ep-yellow)] dark:bg-yellow-950 dark:text-yellow-400" :
                      "bg-green-100 text-[var(--ep-green)] dark:bg-green-950 dark:text-green-400"
                    }`}>
                      {statusKey === "out" ? "Tugagan" : statusKey === "low" ? "Kam" : "Normal"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}

// ─── Transfer Tab ─────────────────────────────────────────────────────────────

interface TransferSectionProps {
  transfers: WarehouseTransfer[];
  onCreateClick: () => void;
}

export function TransferSection({ transfers, onCreateClick }: TransferSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("jami")}<span className="font-semibold text-foreground dark:text-slate-100">{transfers.length} ta</span>
        </p>
        <Button onClick={onCreateClick} data-testid="button-create-transfer">
          <Plus className="h-4 w-4 mr-1.5" />{t("kochirishYaratish")}
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("hujjat1")}</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("qayerdan")}</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("qayerga")}</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{"Material"}</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("quantity")}</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("holati")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">{t("kochirishHujjatlariYoq")}</TableCell>
                </TableRow>
              ) : (Array.isArray(transfers) ? transfers : []).slice(0, 10).map((t) => (
                <TableRow key={t.id} data-testid={`row-transfer-${t.id}`} className="hover:bg-background dark:hover:bg-slate-800/50">
                  <TableCell className="text-sm font-semibold text-[var(--ep-blue)]">TR-{t.id}</TableCell>
                  <TableCell className="text-sm">{t.fromWarehouse}</TableCell>
                  <TableCell className="text-sm">{t.toWarehouse}</TableCell>
                  <TableCell className="text-sm font-medium">{t.materialName}</TableCell>
                  <TableCell className="text-sm">{t.quantity}</TableCell>
                  <TableCell>{statusBadge(t.status || "active")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
