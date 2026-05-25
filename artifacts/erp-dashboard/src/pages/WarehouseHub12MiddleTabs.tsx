/**
 * WarehouseHub12MiddleTabs — operational tabs:
 *  movements · employees · reservations · inventory · barcodes
 */
import {
  ArrowRightLeft, Lock, ClipboardList, ScanBarcode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AsyncBoundary } from "@/components/AsyncBoundary";
import { WarehouseEmployeesTab } from "@/components/warehouse/WarehouseEmployeesTab";
import type { WarehouseRow } from "@/hooks/useWarehousePosSync";
import type { MovementRow } from "./WarehouseHub12Helpers";
import type { UseQueryResult } from "@tanstack/react-query";

import { useTranslation } from '@/lib/i18n';
interface MiddleTabsProps {
  activeWarehouse: WarehouseRow;
  movementsQuery: Pick<UseQueryResult<MovementRow[], Error>, "isLoading" | "isError" | "refetch" | "data">;
  barcodesQuery: Pick<UseQueryResult<Record<string, unknown>[], Error>, "isLoading" | "isError" | "refetch" | "data">;
}

export function WarehouseHub12MiddleTabs({activeWarehouse,
  movementsQuery,
  barcodesQuery,
}: MiddleTabsProps) {
  const { t } = useTranslation('common');
  return (
    <>
      {/* ═══════ 5. MOVEMENTS ═══════ */}
      <TabsContent value="movements">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-[var(--ep-blue)]" />
              <CardTitle className="text-base">Harakatlar — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeWarehouse.code === "WIP-MAIN"
                ? "Sexlar o'rtasidagi material harakatlari va ishlab chiqarish bosqichlari"
                : `${activeWarehouse.name}dagi barcha kirim/chiqim harakatlari (real-time)`}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <AsyncBoundary
              isLoading={movementsQuery.isLoading}
              isError={movementsQuery.isError}
              isEmpty={(movementsQuery.data?.length ?? 0) === 0}
              onRetry={movementsQuery.refetch}
              emptyText={`Hozircha harakatlar yo'q — ${activeWarehouse.name}`}
            >
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tur")}</TableHead>
                    <TableHead>{t('Material')}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                    <TableHead>{t("foydalanuvchi")}</TableHead>
                    <TableHead>{t("sabab")}</TableHead>
                    <TableHead className="text-right">{t("date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(movementsQuery.data) ? movementsQuery.data : []).map(m => (
                    <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell><Badge variant="outline" className="text-xs">{m.movementType}</Badge></TableCell>
                      <TableCell className="text-sm">{m.materialName}</TableCell>
                      <TableCell className="text-right font-mono">{Number(m.quantity).toFixed(2)} {m.unit}</TableCell>
                      <TableCell className="text-xs">{m.performedByName ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.reason ?? '—'}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString('uz-UZ', { timeStyle: 'short', dateStyle: 'short' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </AsyncBoundary>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════ 5b. EMPLOYEES ═══════ */}
      <TabsContent value="employees">
        <WarehouseEmployeesTab warehouseId={activeWarehouse.id} warehouseName={activeWarehouse.name} />
      </TabsContent>

      {/* ═══════ 6. RESERVATIONS ═══════ */}
      <TabsContent value="reservations">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[var(--ep-blue)]" />
              <CardTitle className="text-base">Bron qilingan zaxiralar — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeWarehouse.code === "FG-MAIN"
                ? "Buyurtmachilar uchun ajratilgan tayyor mahsulotlar. Jo'natish kuniga qadar bron saqlanadi."
                : activeWarehouse.code === "RM-MAIN"
                ? "Ishlab chiqarish buyurtmalari uchun ajratilgan xom ashyo. Production Order asosida bronlanadi."
                : "Buyurtmalar uchun ajratilgan miqdorlar."}
            </p>
          </CardHeader>
          <CardContent className="py-6 text-center text-muted-foreground">
            <Lock className="h-10 w-10 mx-auto mb-2" />
            <p className="text-xs mt-2">{t("bronQilinganZaxiralarUchunApi")}</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════ 7. INVENTORY ═══════ */}
      <TabsContent value="inventory">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[var(--ep-blue)]" />
              <CardTitle className="text-base">Inventarizatsiya — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeWarehouse.code === "TOOL-MAIN"
                ? "Asbob-uskunalar inventarizatsiyasi. Har bir uskuna joyida borligini va holatini tekshirish."
                : activeWarehouse.code === "RM-ROLLS"
                ? "Rulon inventarizatsiyasi. Har bir rulonning qoldig'i va jismoniy holati tekshiriladi."
                : `${activeWarehouse.name} — cycle count va to'liq inventarizatsiya.`}
            </p>
          </CardHeader>
          <CardContent className="py-6 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-2" />
            <p className="font-medium">{t("inventarizatsiyaHisobi")}</p>
            <p className="text-xs mt-2">
              {activeWarehouse.code === "SCRAP-MAIN"
                ? "Brak materiallar inventarizatsiyasi — utilizatsiya uchun tayyor miqdorni aniqlash."
                : "Jismoniy va sistemaviy zaxira farqini aniqlash."}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════ 8. BARCODES ═══════ */}
      <TabsContent value="barcodes">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ScanBarcode className="h-5 w-5 text-[var(--ep-purple)]" />
              <CardTitle className="text-base">Shtrix-kodlar — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeWarehouse.code === "RM-ROLLS"
                ? "Har bir rulonga yagona barcode biriktiriladi. Skanerlash orqali rulon ma'lumotlari ko'rinadi."
                : activeWarehouse.code === "TOOL-MAIN"
                ? "Har bir asbob-uskunaga barcode biriktirilgan. Checkout/return jarayonida skanerlanadi."
                : `${activeWarehouse.name} materiallaridagi barcode'lar.`}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <AsyncBoundary
              isLoading={barcodesQuery.isLoading}
              isError={barcodesQuery.isError}
              isEmpty={(barcodesQuery.data?.length ?? 0) === 0}
              onRetry={barcodesQuery.refetch}
              emptyText={`Shtrix-kodlar topilmadi — ${activeWarehouse.name}`}
            >
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("barcode2")}</TableHead>
                    <TableHead>{t('Material')}</TableHead>
                    <TableHead>{t("status28")}</TableHead>
                    <TableHead>{t("location")}</TableHead>
                    <TableHead className="text-right">{t("quantity")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(barcodesQuery.data ?? []).slice(0, 20).map((b, i) => (
                    <TableRow key={String(b.id ?? i)} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs">{String(b.barcodeId ?? b.barcode ?? '—')}</TableCell>
                      <TableCell className="text-sm">{String(b.materialName ?? '—')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{String(b.status ?? '—')}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{String(b.currentLocation ?? b.location ?? '—')}</TableCell>
                      <TableCell className="text-right font-mono">{String(b.remainingQuantity ?? b.quantity ?? '—')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </AsyncBoundary>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
