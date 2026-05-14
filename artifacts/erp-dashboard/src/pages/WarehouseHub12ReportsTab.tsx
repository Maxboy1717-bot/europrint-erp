/**
 * WarehouseHub12ReportsTab — analytics/admin tabs:
 *  reports · suppliers · history · pos-sync
 */
import { BarChart3, Users, History, RefreshCw, Trash2, TrendingDown, Recycle, Wrench, Timer, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import type { WarehouseRow } from "@/hooks/useWarehousePosSync";
import type { WarehouseTypeConfig } from "./WarehouseHub12Helpers";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill, EPLoader } from "@/components/ep";
interface ReportsTabProps {
  activeWarehouse: WarehouseRow;
  cfg: WarehouseTypeConfig;
  alertsCount: number;
  isSyncing: boolean;
  onSyncToPos: (id: string) => void;
}

export function WarehouseHub12ReportsTab({activeWarehouse,
  cfg,
  alertsCount,
  isSyncing,
  onSyncToPos,
}: ReportsTabProps) {
  const { t } = useTranslation('common');
  return (
    <>
      {/* ═══════ 9. REPORTS ═══════ */}
      <TabsContent value="reports">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Hisobotlar — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeWarehouse.code === "SCRAP-MAIN"
                ? "Brak tahlili — nuqson turlari, yo'qotish summasi, sabab-oqibat statistikasi."
                : activeWarehouse.code === "FG-MAIN"
                ? "Tayyor mahsulot hisobotlari — jo'natish tayyor, kutilayotgan, oylik ishlab chiqarish."
                : `${activeWarehouse.name} — ABC tahlili, aging hisobi, aylanish tezligi.`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeWarehouse.code === "SCRAP-MAIN" ? (
                <>
                  <Card><CardContent className="p-4">
                    <Trash2 className="h-8 w-8 mb-2 text-[var(--ep-red)]" />
                    <h3 className="font-bold">{t("nuqsonTurlari1")}</h3>
                    <p className="text-xs text-muted-foreground">{t("brakSabablariKlassifikatsiyasi")}</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <TrendingDown className="h-8 w-8 mb-2 text-[var(--ep-red)]" />
                    <h3 className="font-bold">{t("yoqotishHisobi")}</h3>
                    <p className="text-xs text-muted-foreground">Oylik/yillik brak summasi (UZS)</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <Recycle className="h-8 w-8 mb-2 text-[var(--ep-green)]" />
                    <h3 className="font-bold">{t("process")}</h3>
                    <p className="text-xs text-muted-foreground">{t("recyclingVaUtilizatsiya")}</p>
                  </CardContent></Card>
                </>
              ) : activeWarehouse.code === "TOOL-MAIN" ? (
                <>
                  <Card><CardContent className="p-4">
                    <Wrench className="h-8 w-8 mb-2 text-[var(--ep-yellow)]" />
                    <h3 className="font-bold">{t("uskunaHolati")}</h3>
                    <p className="text-xs text-muted-foreground">Ishlamoqda / ta'mirda / yaroqsiz</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <Timer className="h-8 w-8 mb-2 text-[var(--ep-primary)]" />
                    <h3 className="font-bold">{t("kalibratsiya")}</h3>
                    <p className="text-xs text-muted-foreground">O'z vaqtida / muddati o'tgan</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <Users className="h-8 w-8 mb-2 text-[var(--ep-blue)]" />
                    <h3 className="font-bold">{t("operatorFoydalanish")}</h3>
                    <p className="text-xs text-muted-foreground">{t("kimQanchaVaqtIshlatgan")}</p>
                  </CardContent></Card>
                </>
              ) : (
                <>
                  <Card><CardContent className="p-4">
                    <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-bold">ABC tahlili</h3>
                    <p className="text-xs text-muted-foreground">A/B/C kategoriyalar bo'yicha</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-bold">{t("aging")}</h3>
                    <p className="text-xs text-muted-foreground">{t("eskirganZaxiralarTahlili")}</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-bold">{t("turnover")}</h3>
                    <p className="text-xs text-muted-foreground">{t("aylanishDarajasi")}</p>
                  </CardContent></Card>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════ 10. SUPPLIERS ═══════ */}
      <TabsContent value="suppliers">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--ep-blue)]" />
              <CardTitle className="text-base">Ta'minotchilar — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeWarehouse.code === "RM-MAIN"
                ? "Xom ashyo yetkazib beruvchilar ro'yxati. Narxlar, yetkazish muddatlari, sifat reytingi."
                : activeWarehouse.code === "MRO-STORE"
                ? "MRO ehtiyot qism yetkazuvchilari. Uskuna brendlari va OEM kataloglar."
                : `${activeWarehouse.name} uchun aktiv ta'minotchilar.`}
            </p>
          </CardHeader>
          <CardContent className="py-6 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2" />
            <p className="font-medium">{t("yetkazibBeruvchilar")}</p>
            <p className="text-xs mt-2">
              {activeWarehouse.code === "RM-MAIN" || activeWarehouse.code === "RM-ROLLS"
                ? "Xom ashyo/rulon yetkazib beruvchilarni MM modulida boshqaring."
                : "Ombor uchun aktiv ta'minotchilar."}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════ 11. HISTORY ═══════ */}
      <TabsContent value="history">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-base">Tarix — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeWarehouse.code === "QC-HOLD"
                ? "QC qarorlar tarixi — kim, qachon tasdiqladi yoki rad etdi. Audit trail."
                : activeWarehouse.code === "SCRAP-MAIN"
                ? "Brak kirim/chiqim tarixi — qachon, qancha, nimaga brak deb topildi."
                : `${activeWarehouse.name} — barcha o'zgarishlar tarixi (audit trail).`}
            </p>
          </CardHeader>
          <CardContent className="py-6 text-center text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-2" />
            <p className="font-medium">{t('auditTrail')}</p>
            <p className="text-xs mt-2">{t("kimQachonNimaniOzgartirdiBarcha")}</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════ 12. POS SYNC ═══════ */}
      <TabsContent value="pos-sync">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">POS Monitor sinxronizatsiyasi — {activeWarehouse.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {activeWarehouse.code === "FG-MAIN"
                ? "Tayyor mahsulot zaxirasi POS terminallarida ko'rinadi. Buyurtma qabul qilishda real-time holat."
                : `${activeWarehouse.name} stok ma'lumotlari POS Monitor'ga avtomatik uzatiladi.`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Stock alerts: {alertsCount} ta ogohlantirish
                </p>
              </div>
              <Button onClick={() => onSyncToPos(activeWarehouse.id)} disabled={isSyncing} data-testid="button-sync-now">
                {isSyncing ? <EPLoader className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Hozir sinxronlash
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">POS terminallar</p>
                <p className="text-2xl font-bold">—</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("oxirgiSync")}</p>
                <p className="text-sm font-bold">{new Date().toLocaleTimeString('uz-UZ')}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t('status22')}</p>
                <EPStatusPill tone="neutral">{t("avtomatik")}</EPStatusPill>
              </CardContent></Card>
            </div>
            <div className="mt-4 bg-muted/60 rounded-xl p-4">
              <h4 className="font-bold text-sm mb-2">{t("sinxronizatsiyaMexanizmi")}</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>{t("stockHarOzgarganda")}<code className="bg-background px-1 rounded">pos_sync_events</code> jadvaliga yoziladi</li>
                <li>{t("posMonitorBuEventlarniOqib")}</li>
                <li>"Hozir sinxronlash" tugmasi manual signal yuboradi</li>
                <li>{activeWarehouse.name} zaxirasi POS terminallarida real-time ko'rinadi</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
