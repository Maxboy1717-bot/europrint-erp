/**
 * @module WMSExtendedSections2
 * @description Lot, Requests, KPI, and Rental section components for WMSExtended.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Search, Plus, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { statusBadge } from "./WMSExtendedSections";
import type { LotRecord, InternalReq, OccupancyData, RentalRecord, WarehouseOccupancy } from "./WMSExtendedTypes";

import { useTranslation } from '@/lib/i18n';
// ─── Lot Traceability Tab ─────────────────────────────────────────────────────

interface LotSectionProps {
  lots: LotRecord[];
  lotsLoading: boolean;
  lotSearch: string;
  onSearchChange: (v: string) => void;
}

export function LotSection({lots, lotsLoading, lotSearch, onSearchChange }: LotSectionProps) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Lot raqami yoki material kiriting..."
            className="pl-8"
            data-testid="input-lot-search"
            value={lotSearch}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/warehouse/lots"] })}
          data-testid="button-scan-lot"
        >
          <QrCode className="h-4 w-4 mr-1.5" />Yangilash
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lot №</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('Material')}</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kirgan sana</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Yetkazuvchi</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qoldig'i</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Holati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lotsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Yuklanmoqda...</TableCell>
                </TableRow>
              ) : (() => {
                const filtered = (Array.isArray(lots) ? lots : []).filter((l) =>
                  !lotSearch ||
                  (l.batchNumber || l.lotNumber || "").toLowerCase().includes(lotSearch.toLowerCase()) ||
                  (l.materialName || "").toLowerCase().includes(lotSearch.toLowerCase())
                );
                return filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                      <QrCode className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Lot/partiyalar yo'q
                    </TableCell>
                  </TableRow>
                ) : (Array.isArray(filtered) ? filtered : []).slice(0, 12).map((r, i) => (
                  <TableRow key={r.id || i} data-testid={`row-lot-${r.id || i}`} className="hover:bg-background dark:hover:bg-slate-800/50">
                    <TableCell className="text-sm font-semibold text-[var(--ep-blue)]">{r.batchNumber || r.lotNumber || `LOT-${r.id}`}</TableCell>
                    <TableCell className="text-sm font-medium">{r.materialName || r.name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.receivedDate ? new Date(r.receivedDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm">{r.supplierName || r.supplier || "—"}</TableCell>
                    <TableCell className="text-sm font-semibold">{r.remainingQty != null ? `${Number(r.remainingQty).toLocaleString()} ${r.unit || ""}` : `${Number(r.quantity || 0).toLocaleString()} ${r.unit || ""}`}</TableCell>
                    <TableCell>{statusBadge(r.status || "active")}</TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Internal Requests Tab ────────────────────────────────────────────────────

interface RequestsSectionProps {
  internalReqs: InternalReq[];
  onCreateClick: () => void;
}

export function RequestsSection({ internalReqs, onCreateClick }: RequestsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Jami: <span className="font-semibold text-foreground dark:text-slate-100">{internalReqs.length} ta so'rov</span>
        </p>
        <Button onClick={onCreateClick} data-testid="button-create-request">
          <Plus className="h-4 w-4 mr-1.5" />So'rov Yuborish
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bo'lim</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{"Material"}</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Miqdor</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sabab</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Holati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {internalReqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">So'rovlar yo'q</TableCell>
                </TableRow>
              ) : (Array.isArray(internalReqs) ? internalReqs : []).slice(0, 10).map((r) => (
                <TableRow key={r.id} data-testid={`row-req-${r.id}`} className="hover:bg-background dark:hover:bg-slate-800/50">
                  <TableCell className="text-sm font-medium">{r.department}</TableCell>
                  <TableCell className="text-sm">{r.materialName}</TableCell>
                  <TableCell className="text-sm">{r.quantity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{r.reason}</TableCell>
                  <TableCell>{statusBadge(r.status || "pending")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── KPI Tab ──────────────────────────────────────────────────────────────────

interface KpiSectionProps {
  wmsKpis: Record<string, unknown> | undefined;
  occupancy: OccupancyData | undefined;
  onRefresh: () => void;
}

export function KpiSection({ wmsKpis, occupancy, onRefresh }: KpiSectionProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Ombor KPI Dashboard</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {([
          { l: "Ombor to'liqligi", v: occupancy ? `${Number(occupancy.occupancyRate || occupancy.averageOccupancy || 0).toFixed(0)}%` : wmsKpis?.occupancyRate ? `${wmsKpis.occupancyRate}%` : "—", target: "80%", colorClass: "text-[var(--ep-primary)]" },
          { l: "Material aylanmasi", v: wmsKpis?.turnoverRate ? `${wmsKpis.turnoverRate}x` : "—", target: "10x", colorClass: "text-[var(--ep-blue)]" },
          { l: "Inventar aniqligi", v: wmsKpis?.inventoryAccuracy ? `${wmsKpis.inventoryAccuracy}%` : "—", target: "99%", colorClass: "text-[var(--ep-green)]" },
          { l: "Bajarish vaqti", v: wmsKpis?.avgFulfillmentTime ? `${wmsKpis.avgFulfillmentTime}s` : "—", target: "4s", colorClass: "text-[var(--ep-primary)]" },
          { l: "Qaytarish darajasi", v: wmsKpis?.returnRate ? `${wmsKpis.returnRate}%` : "—", target: "<1%", colorClass: "text-[var(--ep-green)]" },
          { l: "Faol omborlar", v: "—", target: "—", colorClass: "text-[var(--ep-purple)]" },
        ]).map((s) => (
          <div key={s.l} className="rounded-xl bg-card dark:bg-slate-900 shadow-sm p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{s.l}</p>
            <p className={`text-2xl font-bold ${s.colorClass}`}>{s.v}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Maqsad: {s.target}</p>
          </div>
        ))}
      </div>

      {Array.isArray(occupancy?.warehouses) && (occupancy?.warehouses?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Omborlar To'liqligi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(occupancy?.warehouses ?? []).slice(0, 6).map((w: WarehouseOccupancy) => (
              <div key={w.id || w.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground dark:text-slate-300">{w.name}</span>
                  <span className="font-bold text-muted-foreground">{Number(w.occupancyRate || 0).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-muted/40 dark:bg-slate-800 rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${Number(w.occupancyRate || 0) > 85 ? "bg-red-500" : Number(w.occupancyRate || 0) > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${w.occupancyRate || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Rental Tab ───────────────────────────────────────────────────────────────

interface RentalSectionProps {
  rentalData: RentalRecord[];
  rentalLoading: boolean;
}

export function RentalSection({ rentalData, rentalLoading }: RentalSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Tayyor Mahsulot Saqlash Ijara</p>
        <Button data-testid="button-add-rental">
          <Plus className="h-4 w-4 mr-1.5" />Ijara Shartnomasi
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-card dark:bg-slate-900 shadow-sm p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Faol Shartnomalar</p>
          <p className="text-2xl font-bold text-foreground dark:text-slate-100">{rentalData.length}</p>
        </div>
        <div className="rounded-xl bg-card dark:bg-slate-900 shadow-sm p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Jami Maydon</p>
          <p className="text-2xl font-bold text-[var(--ep-blue)]">{(Array.isArray(rentalData) ? rentalData : []).reduce((s, r) => s + Number(r.areaM2 || 0), 0)} m²</p>
        </div>
        <div className="rounded-xl bg-card dark:bg-slate-900 shadow-sm p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">To'langan</p>
          <p className="text-2xl font-bold text-[var(--ep-green)]">{(Array.isArray(rentalData) ? rentalData : []).filter(r => r.billed).length} ta</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {rentalLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mijoz</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Maydon</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kunlik narx</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Muddat</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Holati</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentalData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      Faol ijara shartnomalari mavjud emas
                    </TableCell>
                  </TableRow>
                ) : (Array.isArray(rentalData) ? rentalData : []).map((r, i) => (
                  <TableRow key={r.id} data-testid={`row-rental-${i}`} className="hover:bg-background dark:hover:bg-slate-800/50">
                    <TableCell className="text-sm font-medium">{r.clientName || r.orderNumber || r.orderId || "—"}</TableCell>
                    <TableCell className="text-sm">{r.areaM2 ? `${r.areaM2} m²` : "—"}</TableCell>
                    <TableCell className="text-sm">{r.dailyRate ? `${Number(r.dailyRate).toLocaleString()} so'm` : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.startDate ? r.startDate.slice(0, 10) : "—"}
                      {r.endDate ? ` – ${r.endDate.slice(0, 10)}` : ""}
                    </TableCell>
                    <TableCell>{statusBadge(r.billed ? "active" : "pending")}</TableCell>
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
