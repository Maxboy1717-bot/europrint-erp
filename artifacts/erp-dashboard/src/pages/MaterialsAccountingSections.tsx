/**
 * @module MaterialsAccountingSections
 * @description Stat cards and movements table for MaterialsAccounting page.
 */

import { EPStatusPill } from "@/components/ep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency, formatNumber } from "@/lib/format";
import {
  Package,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  BarChart3,
} from "lucide-react";
import type { MaterialMovement, InventoryValuationData } from "./MaterialsAccountingTypes";

import { useTranslation } from '@/lib/i18n';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getMoveTypeBadge(moveType: string, t: ReturnType<typeof useTranslation>["t"]) {
  switch (moveType?.toLowerCase()) {
    case "in":
    case "receipt":
    case "kirim":
      return <EPStatusPill tone="success">{t("kirim")}</EPStatusPill>;
    case "out":
    case "issue":
    case "chiqim":
      return <EPStatusPill tone="brand">{t("chiqim")}</EPStatusPill>;
    case "transfer":
      return <EPStatusPill tone="info">{t("otkazma")}</EPStatusPill>;
    case "adjustment":
      return <EPStatusPill tone="neutral">{t("tuzatish")}</EPStatusPill>;
    default:
      return <EPStatusPill tone="neutral">{moveType}</EPStatusPill>;
  }
}

// ---------------------------------------------------------------------------
// Stat Cards
// ---------------------------------------------------------------------------

interface StatCardsProps {
  totalInventoryValue: number;
  monthlyConsumed: number;
  monthlyReceived: number;
  turnoverRate: string;
  inventoryLoading: boolean;
  movementsLoading: boolean;
  inventoryData: InventoryValuationData | undefined;
}

export function StatCards({
  totalInventoryValue,
  monthlyConsumed,
  monthlyReceived,
  turnoverRate,
  inventoryLoading,
  movementsLoading,
  inventoryData,
}: StatCardsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card data-testid="card-total-inventory">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("jamiInventarQiymati")}</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-bold text-[var(--ep-yellow)]">
                {formatCurrency(totalInventoryValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(inventoryData?.summary?.totalItems || 0)} turdagi material
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-consumed">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("sarflanganBuOy")}</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-[var(--ep-primary)]" />
        </CardHeader>
        <CardContent>
          {movementsLoading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-bold text-[var(--ep-primary)]">
                {formatCurrency(monthlyConsumed)}
              </div>
              <p className="text-xs text-muted-foreground">{t("chiqimOperatsiyalari")}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-received">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("qabulQilinganBuOy")}</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-[var(--ep-green)]" />
        </CardHeader>
        <CardContent>
          {movementsLoading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-bold text-[var(--ep-green)]">
                {formatCurrency(monthlyReceived)}
              </div>
              <p className="text-xs text-muted-foreground">{t("kirimOperatsiyalari")}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-turnover">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("aylanmaTezligi")}</CardTitle>
          <TrendingUp className="h-4 w-4 text-[var(--ep-blue)]" />
        </CardHeader>
        <CardContent>
          {movementsLoading || inventoryLoading ? (
            <Skeleton className="h-8 w-20 rounded-lg" />
          ) : (
            <>
              <div className="text-2xl font-bold text-[var(--ep-blue)]">{turnoverRate}x</div>
              <p className="text-xs text-muted-foreground">{t("yillikAylanmaKoeffitsienti")}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Movements Table Card
// ---------------------------------------------------------------------------

interface MovementsCardProps {
  movements: MaterialMovement[];
  movementsLoading: boolean;
  startDate: string;
  endDate: string;
  moveTypeFilter: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onMoveTypeChange: (v: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

export function MovementsCard({ movements, movementsLoading, startDate, endDate, moveTypeFilter, onStartDateChange, onEndDateChange, onMoveTypeChange, onApplyFilters, onClearFilters, }: MovementsCardProps) {
  const { t } = useTranslation('common');
  return (
    <Card data-testid="card-movements">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("materialHarakatlari")}
            </CardTitle>
            <CardDescription>{t("kirimVaChiqimOperatsiyalari")}</CardDescription>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-36"
                data-testid="input-start-date"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("endDate")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-36"
                data-testid="input-end-date"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("harakatTuri1")}</Label>
              <Select value={moveTypeFilter} onValueChange={onMoveTypeChange}>
                <SelectTrigger className="w-32 h-9" data-testid="select-move-type">
                  <SelectValue placeholder={t("Barchasi")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Barchasi")}</SelectItem>
                  <SelectItem value="in">{t("kirim")}</SelectItem>
                  <SelectItem value="out">{t("chiqim")}</SelectItem>
                  <SelectItem value="transfer">{t("otkazma")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={onApplyFilters} data-testid="button-apply-filter">
              <Filter className="h-4 w-4 mr-1" />
              {t("qollash")}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClearFilters} data-testid="button-clear-filter">
              {t("tozalash")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {movementsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t("hozirchaMaterialHarakatlariYoq")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("hujjat1")}</TableHead>
                  <TableHead>{t('materialKodi2')}</TableHead>
                  <TableHead>{t("materialNomi1")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead className="text-right">{t("price")}</TableHead>
                  <TableHead className="text-right">{t("total")}</TableHead>
                  <TableHead>{t("partiya1")}</TableHead>
                  <TableHead>{t("referans")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(movements) ? movements : []).map((move) => (
                  <TableRow key={move.id} data-testid={`row-movement-${move.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>{formatDate(move.moveDate)}</TableCell>
                    <TableCell className="font-medium">{move.moveNumber}</TableCell>
                    <TableCell>{move.materialCode || "-"}</TableCell>
                    <TableCell>{move.materialName || "-"}</TableCell>
                    <TableCell>{getMoveTypeBadge(move.moveType, t)}</TableCell>
                    <TableCell className="text-right">{formatNumber(move.quantity)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(move.unitCost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(move.totalCost)}</TableCell>
                    <TableCell>{move.batchLot || "-"}</TableCell>
                    <TableCell>{move.reference || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
