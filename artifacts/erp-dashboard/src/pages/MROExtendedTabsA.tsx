/** @module MROExtendedTabsA @description Maintenance-focused tab content components for MROExtended: PreventiveTab, SparePartsTab, UtilitiesTab. */

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCw, AlertTriangle, CheckCircle, Zap, Flame, Droplets, Wind, type LucideIcon } from "lucide-react";
import { PMUpcomingPanel } from "./MROExtendedPanels";
import type { MROEquipment, MRORequest, MROItem, MROStats, UtilityReading } from "./MROExtendedTypes";
import { useTranslation } from '@/lib/i18n';

// ---- PreventiveTab ----

interface PreventiveTabProps {
  requests: MRORequest[];
  equipment: MROEquipment[];
  stats: MROStats | undefined;
  reqLoading: boolean;
  pendingReqs: MRORequest[];
  onAddRequest: () => void;
  onAddEquip: () => void;
  onRefresh: () => void;
}

export function PreventiveTab({ requests, equipment, stats, reqLoading, pendingReqs, onAddRequest, onAddEquip, onRefresh }: PreventiveTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="preventive" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("profilaktikTexnikXizmat")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
          </Button>
          <Button size="sm" onClick={onAddRequest} data-testid="button-add-maintenance">
            <Plus className="h-3.5 w-3.5 mr-1.5" />{t("sorovYaratish")}
          </Button>
        </div>
      </div>
      <PMUpcomingPanel />
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { l: "Ushbu oy rejalashtirilgan", v: stats.plannedThisMonth ?? pendingReqs.length,   c: "text-primary" },
            { l: "Bajarilgan",                v: stats.completedThisMonth ?? (Array.isArray(requests) ? requests : []).filter((r) => r.status === "completed").length, c: "text-[var(--ep-green)]" },
            { l: "Kutilmoqda",                v: pendingReqs.length,                             c: "text-[var(--ep-primary)]" },
            { l: "Jihozlar soni",             v: equipment.length,                               c: "text-[var(--ep-blue)]" },
          ]).map((s) => (
            <Card key={s.l}><CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base">{t("texnikXizmatSorovlari")}</CardTitle>
          <Button variant="outline" size="sm" onClick={onAddEquip}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />{t("jihozQoshish")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("tur")}</TableHead><TableHead>{t("progress.description")}</TableHead>
              <TableHead>{t("ustuvorlik")}</TableHead><TableHead>{t("masul")}</TableHead><TableHead>{t("holati")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {reqLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : requests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-[var(--ep-green)]" />{t("sorovlarYoq")}
                </TableCell></TableRow>
              ) : (Array.isArray(requests) ? requests : []).slice(0, 10).map((r) => (
                <TableRow key={r.id} data-testid={`row-request-${r.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell><Badge variant="outline">{r.type === "preventive" ? "Profilaktik" : r.type === "corrective" ? "Ta'mirlash" : r.type}</Badge></TableCell>
                  <TableCell className="max-w-[200px] text-sm">{r.description}</TableCell>
                  <TableCell>
                    <Badge variant={r.priority === "critical" ? "destructive" : r.priority === "high" ? "secondary" : "outline"}>
                      {r.priority === "critical" ? "Kritik" : r.priority === "high" ? "Yuqori" : r.priority === "medium" ? "O'rta" : "Past"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{r.assignedTo || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "completed" ? "default" : r.status === "in_progress" ? "secondary" : "outline"}>
                      {r.status === "completed" ? "Bajarilgan" : r.status === "in_progress" ? "Jarayonda" : "Kutilmoqda"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ---- SparePartsTab ----

interface SparePartsTabProps {
  items: MROItem[];
  itemsLoading: boolean;
  lowStockItems: MROItem[];
  onAddItem: () => void;
}

export function SparePartsTab({ items, itemsLoading, lowStockItems, onAddItem }: SparePartsTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="spareparts" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("mroEhtiyotQismlar")}</h2>
        <Button size="sm" onClick={onAddItem} data-testid="button-add-spare">
          <Plus className="h-3.5 w-3.5 mr-1.5" />{t("kirimQilish")}
        </Button>
      </div>
      {lowStockItems.length > 0 && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--ep-red)] shrink-0" />
          <span className="text-sm text-[var(--ep-red)] dark:text-red-400">{lowStockItems.length} ta material minimal zaxira darajasidan past</span>
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("code")}</TableHead><TableHead>{t("name")}</TableHead>
              <TableHead>{t("toifa")}</TableHead><TableHead>{t("quantity")}</TableHead>
              <TableHead>{t("min1")}</TableHead><TableHead>{t("joylashuvi")}</TableHead><TableHead>{t("holati")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {itemsLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-[13px] text-muted-foreground">{t("materiallarYoq")}</TableCell></TableRow>
              ) : (Array.isArray(items) ? items : []).slice(0, 15).map((item) => {
                const isLow = Number(item.quantity) <= Number(item.minQty || 5);
                return (
                  <TableRow key={item.id} data-testid={`row-item-${item.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm">{item.itemCode}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                    <TableCell className={isLow ? "text-[var(--ep-red)] font-bold" : ""}>{item.quantity} {item.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{item.minQty || 5} {item.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{item.location || "—"}</TableCell>
                    <TableCell><Badge variant={isLow ? "destructive" : "default"}>{isLow ? "Kam zaxira" : "Normal"}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ---- UtilitiesTab ----

interface UtilitiesTabProps {
  stats: MROStats | undefined;
  utilityReadings: UtilityReading[];
  utilityReadingsLoading: boolean;
}

export function UtilitiesTab({ stats, utilityReadings, utilityReadingsLoading }: UtilitiesTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="utilities" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("kommunalXizmatlarMonitoring")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Elektr (bugungi)", v: stats?.electricityToday ?? "—", unit: "kWh", c: "text-[var(--ep-yellow)]" },
          { l: "Gaz (bugungi)",    v: stats?.gasToday          ?? "—", unit: "m³", c: "text-[var(--ep-blue)]"   },
          { l: "Suv (bugungi)",    v: stats?.waterToday        ?? "—", unit: "m³", c: "text-[var(--ep-cyan)]"   },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v} <span className="text-sm font-normal text-muted-foreground">{s.unit}</span></div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("kommunalXarajatlarOylik")}</CardTitle></CardHeader>
        <CardContent>
          {utilityReadingsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={`k-${i}`} className="flex items-center justify-between p-3 rounded-md bg-muted/50 animate-pulse" data-testid={`skeleton-utility-${i}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded bg-muted-foreground/20" />
                    <div className="space-y-1">
                      <div className="h-3 w-24 rounded bg-muted-foreground/20" />
                      <div className="h-2 w-12 rounded bg-muted-foreground/20" />
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-3 w-16 rounded bg-muted-foreground/20" />
                    <div className="h-2 w-8 rounded bg-muted-foreground/20" />
                  </div>
                </div>
              ))}
            </div>
          ) : !utilityReadings || utilityReadings.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-utility-readings">
              {t("kommunalOqishMalumotlariMavjudEmas")}
            </div>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(utilityReadings) ? utilityReadings : []).map((u, i) => {
                const typeLabel =
                  u.utilityType === "electricity"    ? "Elektr energiya" :
                  u.utilityType === "gas"            ? "Tabiiy gaz"      :
                  u.utilityType === "water"          ? "Suv ta'minoti"   :
                  u.utilityType === "compressed_air" ? "Siqilgan havo"   :
                  String(u.utilityType);
                const UtilityIcon: LucideIcon =
                  u.utilityType === "electricity"    ? Zap      :
                  u.utilityType === "gas"            ? Flame    :
                  u.utilityType === "water"          ? Droplets :
                  u.utilityType === "compressed_air" ? Wind     :
                  Zap;
                const rawTrend = Number(u.trendPercent);
                const trend    = Number.isFinite(rawTrend) ? rawTrend : 0;
                const trendUp  = trend > 0;
                return (
                  <div key={u.id as string} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`row-utility-${i}`}>
                    <div className="flex items-center gap-3">
                      <UtilityIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{typeLabel}</div>
                        <div className="text-xs text-muted-foreground">{u.unit} / Oy: {Number(u.monthBudget).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{Number(u.monthTotal).toLocaleString()}</div>
                      <div className={`text-xs ${trendUp ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}`}>
                        {trendUp ? "+" : ""}{trend.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

