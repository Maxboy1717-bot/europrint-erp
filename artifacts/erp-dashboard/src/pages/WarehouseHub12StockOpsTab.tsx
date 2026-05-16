/**
 * WarehouseHub12StockOpsTab — goods-flow tabs:
 *  stock · receiving · issuing · qc
 */
import { Truck, Send, ShieldCheck, Search, AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AsyncBoundary } from "@/components/AsyncBoundary";
import type { WarehouseRow, WarehouseStockRow } from "@/hooks/useWarehousePosSync";
import type { WarehouseTypeConfig } from "./WarehouseHub12Helpers";
import type { UseQueryResult } from "@tanstack/react-query";

import { useTranslation } from '@/lib/i18n';
interface StockOpsTabProps {
  activeWarehouse: WarehouseRow;
  cfg: WarehouseTypeConfig;
  /** Filtered stock rows (search applied in parent) */
  filtered: WarehouseStockRow[];
  search: string;
  onSearchChange: (v: string) => void;
  stockQuery: Pick<UseQueryResult, "isLoading" | "isError" | "refetch">;
  receiptsQuery: Pick<UseQueryResult<Record<string, unknown>[], Error>, "isLoading" | "isError" | "refetch" | "data">;
  pickingQuery: Pick<UseQueryResult<Record<string, unknown>[], Error>, "isLoading" | "isError" | "refetch" | "data">;
  kpisTotal: number;
  onNavigate: (path: string) => void;
}

export function WarehouseHub12StockOpsTab({activeWarehouse,
  cfg,
  filtered,
  search,
  onSearchChange,
  stockQuery,
  receiptsQuery,
  pickingQuery,
  kpisTotal,
  onNavigate,
}: StockOpsTabProps) {
  const { t } = useTranslation('common');
  return (
    <>
      {/* ═══════ 1. STOCK ═══════ */}
      <TabsContent value="stock" className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('materialQidirish')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Card>
          <CardContent className="p-0">
            <AsyncBoundary
              isLoading={stockQuery.isLoading}
              isError={stockQuery.isError}
              isEmpty={filtered.length === 0}
              onRetry={stockQuery.refetch}
              emptyText={search ? "Qidiruv natijasi yo'q" : cfg.emptyStockText}
            >
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Material')}</TableHead>
                    <TableHead>{t("code")}</TableHead>
                    <TableHead className="text-right">{t("mavjud")}</TableHead>
                    <TableHead className="text-right">{t("bron")}</TableHead>
                    <TableHead className="text-right">{t("total")}</TableHead>
                    <TableHead>{t("status28")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{s.materialName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.materialCode}</TableCell>
                      <TableCell className="text-right font-mono">{Number(s.available ?? 0).toLocaleString('uz-UZ')} {s.unit}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{Number(s.reserved ?? 0).toLocaleString('uz-UZ')}</TableCell>
                      <TableCell className="text-right font-mono">{Number(s.quantity ?? 0).toLocaleString('uz-UZ')}</TableCell>
                      <TableCell>
                        <Badge variant={s.stockStatus === 'OUT_OF_STOCK' ? 'destructive' : s.stockStatus === 'LOW_STOCK' ? 'outline' : 'secondary'}>
                          {s.stockStatus ?? 'OK'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </AsyncBoundary>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════ 2. RECEIVING ═══════ */}
      <TabsContent value="receiving">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className={`h-5 w-5 ${cfg.kpiColors[1]}`} />
                <CardTitle className="text-base">Qabul qilish — {activeWarehouse.name}</CardTitle>
              </div>
              <Button
                onClick={() => onNavigate(`/wms/kirim-new?warehouseId=${activeWarehouse.id}`)}
                size="sm"
                className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white shrink-0"
              >
                <Truck className="h-3.5 w-3.5 mr-1" />
                {t("yangiKirim")}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{cfg.receivingHint}</p>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={receiptsQuery.isLoading}
              isError={receiptsQuery.isError}
              isEmpty={(receiptsQuery.data?.length ?? 0) === 0}
              onRetry={receiptsQuery.refetch}
              emptyText={`Kutilayotgan qabul yo'q — ${activeWarehouse.name}`}
            >
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("grnRaqami")}</TableHead>
                    <TableHead>{t("yetkazuvchi")}</TableHead>
                    <TableHead>{t('Material')}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead>{t("status28")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(receiptsQuery.data) ? receiptsQuery.data : []).map((r, i) => (
                    <TableRow key={String(r.id ?? i)} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs">{String(r.grnNumber ?? r.receiptNumber ?? r.id ?? '—')}</TableCell>
                      <TableCell className="text-sm">{String(r.supplierName ?? r.vendorName ?? '—')}</TableCell>
                      <TableCell className="text-sm">{String(r.materialName ?? r.itemName ?? '—')}</TableCell>
                      <TableCell className="text-right font-mono">{String(r.quantity ?? r.receivedQty ?? '—')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{String(r.status ?? 'pending')}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString('uz-UZ') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </AsyncBoundary>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════ 3. ISSUING ═══════ */}
      <TabsContent value="issuing">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Send className={`h-5 w-5 ${cfg.kpiColors[0]}`} />
              <CardTitle className="text-base">Material berish — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{cfg.issuingHint}</p>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              isLoading={pickingQuery.isLoading}
              isError={pickingQuery.isError}
              isEmpty={(pickingQuery.data?.length ?? 0) === 0}
              onRetry={pickingQuery.refetch}
              emptyText={`Faol picking topshirig'i yo'q — ${activeWarehouse.name}`}
            >
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("topshiriq")}</TableHead>
                    <TableHead>{t('Material')}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead>{t("buyurtmachi")}</TableHead>
                    <TableHead>{t("status28")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(pickingQuery.data) ? pickingQuery.data : []).map((p, i) => (
                    <TableRow key={String(p.id ?? i)} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs">{String(p.taskId ?? p.pickingNumber ?? p.id ?? '—')}</TableCell>
                      <TableCell className="text-sm">{String(p.materialName ?? p.itemName ?? '—')}</TableCell>
                      <TableCell className="text-right font-mono">{String(p.quantity ?? p.requestedQty ?? '—')}</TableCell>
                      <TableCell className="text-xs">{String(p.requestedBy ?? p.department ?? '—')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{String(p.status ?? 'pending')}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </AsyncBoundary>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════ 4. QC ═══════ */}
      <TabsContent value="qc">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--ep-yellow)]" />
              <CardTitle className="text-base">Sifat nazorati — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{cfg.qcHint}</p>
          </CardHeader>
          <CardContent>
            {activeWarehouse.code === "QC-HOLD" ? (
              /* Karantin ombori uchun maxsus QC panel */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="border-amber-200">
                    <CardContent className="p-4 text-center">
                      <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-[var(--ep-yellow)]" />
                      <p className="text-sm font-bold">{t("tekshiruvKutmoqda")}</p>
                      <p className="text-2xl font-bold text-[var(--ep-yellow)]">{kpisTotal}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200">
                    <CardContent className="p-4 text-center">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[var(--ep-green)]" />
                      <p className="text-sm font-bold">{t("approved")}</p>
                      <p className="text-2xl font-bold text-[var(--ep-green)]">—</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200">
                    <CardContent className="p-4 text-center">
                      <Trash2 className="h-8 w-8 mx-auto mb-2 text-[var(--ep-red)]" />
                      <p className="text-sm font-bold">{t("rejected")}</p>
                      <p className="text-2xl font-bold text-[var(--ep-red)]">—</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    QC jarayoni
                  </h4>
                  <ol className="text-sm text-[var(--ep-yellow)] dark:text-amber-400 space-y-1 list-decimal list-inside">
                    <li>{t("materialKarantingaKiritiladiGrnYokiIchki")}</li>
                    <li>{t("qcXodimiNamunalarniOladiVa")}</li>
                    <li>{t("natijaKiritiladiApprovedTasdiqlanganYokiRejected")}</li>
                    <li>{t("approvedTegishliOmborgaChiqariladi")}</li>
                    <li>{t("rejectedScrapMainOmborigaOtkaziladi")}</li>
                  </ol>
                </div>
              </div>
            ) : (
              /* Boshqa omborlar uchun oddiy QC */
              <div className="text-center py-6 text-[13px] text-muted-foreground">
                <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-[var(--ep-yellow)]" />
                <p className="font-medium">{t("sifatNazoratiSahifasi")}</p>
                <p className="text-xs mt-2">{cfg.qcHint}</p>
                {activeWarehouse.code !== "SCRAP-MAIN" && (
                  <p className="text-xs mt-1">
                    {t("qcTekshiruvigaMuhtojMateriallarQc")}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
