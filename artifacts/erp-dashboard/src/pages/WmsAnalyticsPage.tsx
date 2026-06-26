/**
 * @module WmsAnalyticsPage
 * @description Ombor tahlili (WMS Analytics) — read-only BI dashboard.
 *   Consumes the existing real backend endpoints:
 *     GET /api/wms/inventory-turnover  → aylanma (turnover) per material
 *     GET /api/wms/dead-stock          → harakatsiz (dead) stock > 180 kun
 *     GET /api/wms/rop-alerts          → qayta-buyurtma nuqtasi (ROP) ogohlantirishlari
 *
 *   Each section has its own query so a single failing endpoint does not blank
 *   the whole page (e.g. rop-alerts depends on a requisitions table that may
 *   not exist yet on an empty build DB). Empty / not-yet-ready data shows an
 *   EP empty state — no fabricated rows.
 */

import { useQuery } from "@tanstack/react-query";
import { Warehouse, RefreshCw, PackageX, AlertTriangle, TrendingUp } from "lucide-react";
import { ModulePage } from "@/components/ui/module-page";
import { Card, CardContent } from "@/components/ui/card";
import {
  EPKpiCard,
  EPEmptyState,
  EPErrorState,
  EPSkeletonTable,
} from "@/components/ep";
import { apiRequest } from "@/lib/queryClient";

interface TurnoverItem {
  materialId: number;
  materialName: string;
  unitOfMeasure: string;
  cogs: number;
  avgInventory: number;
  inventoryTurnover: number;
  daysInventoryOutstanding: number;
  category: string;
  abcClass: string;
}

interface DeadStockItem {
  materialId: number;
  materialName: string;
  unitOfMeasure: string;
  currentStock: number;
  unitCost: number;
  totalValue: number;
  lastMovementDate: string | null;
  daysSinceMovement: number;
}

interface RopAlert {
  materialId: number;
  materialCode: string;
  materialName: string;
  unitOfMeasure: string;
  currentStock: number;
  reorderPoint: number;
  deficit: number;
  hasOpenRequisition: boolean;
  requisitionId: number | null;
  requisitionStatus: string | null;
}

function asArray<T>(raw: T[] | { data?: T[] } | undefined): T[] {
  if (Array.isArray(raw)) return raw;
  const inner = (raw as { data?: T[] } | undefined)?.data;
  return Array.isArray(inner) ? inner : [];
}

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("uz-UZ", { maximumFractionDigits: 2 }) : "0";

export default function WmsAnalyticsPage() {
  const turnoverQ = useQuery<TurnoverItem[] | { data?: TurnoverItem[] }>({
    queryKey: ["/api/wms/inventory-turnover"],
    queryFn: () => apiRequest("GET", "/api/wms/inventory-turnover"),
  });

  const deadStockQ = useQuery<DeadStockItem[] | { data?: DeadStockItem[] }>({
    queryKey: ["/api/wms/dead-stock"],
    queryFn: () => apiRequest("GET", "/api/wms/dead-stock"),
  });

  const ropQ = useQuery<RopAlert[] | { data?: RopAlert[] }>({
    queryKey: ["/api/wms/rop-alerts"],
    queryFn: () => apiRequest("GET", "/api/wms/rop-alerts"),
    // ROP source (requisitions) may be absent on a fresh DB — don't spam retries.
    retry: false,
  });

  const turnover = asArray<TurnoverItem>(turnoverQ.data);
  const deadStock = asArray<DeadStockItem>(deadStockQ.data);
  const rop = asArray<RopAlert>(ropQ.data);

  const anyLoading = turnoverQ.isLoading || deadStockQ.isLoading || ropQ.isLoading;
  const deadStockValue = deadStock.reduce((s, d) => s + (d.totalValue || 0), 0);

  return (
    <ModulePage
      module="mm"
      title="Ombor tahlili"
      subtitle="Aylanma, harakatsiz zaxira va qayta-buyurtma ogohlantirishlari"
      icon={<Warehouse className="h-5 w-5" />}
    >
      <div className="space-y-5">
        {/* KPI row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <EPKpiCard
            label="AYLANMADAGI MATERIAL"
            value={turnover.length}
            icon={TrendingUp}
            iconBg="warehouse"
          />
          <EPKpiCard
            label="HARAKATSIZ ZAXIRA (>180 KUN)"
            value={deadStock.length}
            icon={PackageX}
            iconBg="warehouse"
            staticValue={`${deadStock.length} · ${fmt(deadStockValue)}`}
          />
          <EPKpiCard
            label="QAYTA-BUYURTMA OGOHI"
            value={rop.length}
            icon={AlertTriangle}
            iconBg="warehouse"
          />
        </div>

        {/* Inventory turnover */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-module-warehouse" />
            Zaxira aylanmasi
          </h3>
          {turnoverQ.isLoading ? (
            <EPSkeletonTable rows={5} />
          ) : turnoverQ.isError ? (
            <EPErrorState error={turnoverQ.error} onRetry={() => turnoverQ.refetch()} />
          ) : turnover.length === 0 ? (
            <EPEmptyState
              icon={TrendingUp}
              title="Aylanma ma'lumoti yo'q"
              description="Material harakatlari (kirim/chiqim) qayd etilgach, aylanma ko'rsatkichlari shu yerda ko'rinadi."
            />
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground text-left">
                      <th className="px-3 py-2 font-medium">Material</th>
                      <th className="px-3 py-2 font-medium">ABC</th>
                      <th className="px-3 py-2 font-medium text-right">Aylanma</th>
                      <th className="px-3 py-2 font-medium text-right">DIO (kun)</th>
                      <th className="px-3 py-2 font-medium text-right">O'rt. zaxira</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnover.map((t) => (
                      <tr key={t.materialId} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-3 py-2">
                          <span className="font-medium">{t.materialName}</span>
                          <span className="text-xs text-muted-foreground ml-1">{t.unitOfMeasure}</span>
                        </td>
                        <td className="px-3 py-2">{t.abcClass}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(t.inventoryTurnover)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(t.daysInventoryOutstanding)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(t.avgInventory)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Dead stock */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <PackageX className="h-4 w-4 text-destructive" />
            Harakatsiz zaxira
          </h3>
          {deadStockQ.isLoading ? (
            <EPSkeletonTable rows={4} />
          ) : deadStockQ.isError ? (
            <EPErrorState error={deadStockQ.error} onRetry={() => deadStockQ.refetch()} />
          ) : deadStock.length === 0 ? (
            <EPEmptyState
              icon={PackageX}
              title="Harakatsiz zaxira yo'q"
              description="180 kundan ortiq harakatsiz turgan materiallar mavjud emas."
            />
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground text-left">
                      <th className="px-3 py-2 font-medium">Material</th>
                      <th className="px-3 py-2 font-medium text-right">Zaxira</th>
                      <th className="px-3 py-2 font-medium text-right">Qiymat</th>
                      <th className="px-3 py-2 font-medium text-right">Harakatsiz (kun)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deadStock.map((d) => (
                      <tr key={d.materialId} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-3 py-2">
                          <span className="font-medium">{d.materialName}</span>
                          <span className="text-xs text-muted-foreground ml-1">{d.unitOfMeasure}</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(d.currentStock)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(d.totalValue)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{d.daysSinceMovement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ROP alerts */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-module-warehouse" />
            Qayta-buyurtma ogohlantirishlari
          </h3>
          {ropQ.isLoading ? (
            <EPSkeletonTable rows={4} />
          ) : ropQ.isError ? (
            <EPEmptyState
              icon={AlertTriangle}
              title="Ogohlantirishlar hozircha mavjud emas"
              description="Qayta-buyurtma manbasi (ta'minot so'rovlari) hali sozlanmagan."
            />
          ) : rop.length === 0 ? (
            <EPEmptyState
              icon={AlertTriangle}
              title="Qayta-buyurtma ogohi yo'q"
              description="Barcha materiallar qayta-buyurtma nuqtasidan yuqorida."
            />
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground text-left">
                      <th className="px-3 py-2 font-medium">Kod</th>
                      <th className="px-3 py-2 font-medium">Material</th>
                      <th className="px-3 py-2 font-medium text-right">Zaxira</th>
                      <th className="px-3 py-2 font-medium text-right">ROP</th>
                      <th className="px-3 py-2 font-medium text-right">Kamomad</th>
                      <th className="px-3 py-2 font-medium">So'rov</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rop.map((r) => (
                      <tr key={r.materialId} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-3 py-2 text-xs text-muted-foreground">{r.materialCode}</td>
                        <td className="px-3 py-2">
                          <span className="font-medium">{r.materialName}</span>
                          <span className="text-xs text-muted-foreground ml-1">{r.unitOfMeasure}</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(r.currentStock)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(r.reorderPoint)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-destructive">{fmt(r.deficit)}</td>
                        <td className="px-3 py-2 text-xs">
                          {r.hasOpenRequisition ? (
                            <span className="text-[var(--ep-green)]">{r.requisitionStatus ?? "ochiq"}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </section>

        {anyLoading && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Yuklanmoqda…
          </p>
        )}
      </div>
    </ModulePage>
  );
}
