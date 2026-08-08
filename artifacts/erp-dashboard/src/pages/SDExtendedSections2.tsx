/**
 * @module SDExtendedSections2
 * @description RentalPanel and AdvancePanel section components for SDExtended.
 * ManagerPanel and QuotaPanel live in SDExtendedSections.tsx.
 */

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import type { RentalRecord, PapkaOrder } from "./SDExtendedTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ── Rental Panel ─────────────────────────────────────────────────────────────

interface RentalPanelProps {
  rentalData: RentalRecord[];
  rentalLoading: boolean;
}

export function RentalPanel({ rentalData, rentalLoading }: RentalPanelProps) {
  const { t } = useTranslation("common");
  const safeRentals = Array.isArray(rentalData) ? rentalData : [];

  const totalArea = safeRentals.reduce((s, r) => s + Number(r.areaM2 || 0), 0);
  const totalMonthly = safeRentals.reduce((s, r) => {
    const amount = r.totalAmount
      ? Number(r.totalAmount)
      : (Number(r.areaM2 || 0) * Number(r.dailyRate || 0) * 30);
    return s + amount;
  }, 0);

  return (
    <TabsContent value="rental" className="space-y-4 mt-0">
      <Card className="bg-card border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-4 bg-muted/40/50">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />{t("faolIjaraShartnomalari")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("mijoz1")}</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("maydonM")}</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("boshlanish")}</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("tugash")}</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("oylikSoM")}</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("tolov1")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentalLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell colSpan={6}><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : safeRentals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12 italic">
                    {t("faolIjaraShartnomalariMavjudEmas")}
                  </TableCell>
                </TableRow>
              ) : safeRentals.map((r, i) => (
                <TableRow key={`k-${i}`} className="border-border hover:bg-muted/40/50">
                  <TableCell className="font-bold text-foreground py-4">
                    {r.clientName || r.orderNumber || r.orderId || "Mijoz nomi yo'q"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground py-4">{r.areaM2}</TableCell>
                  <TableCell className="text-sm text-muted-foreground py-4">{r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground py-4">{r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right font-bold text-primary py-4">
                    {r.totalAmount
                      ? `${(Number(r.totalAmount) / 1000).toFixed(0)}K`
                      : `${((Number(r.areaM2 || 0) * Number(r.dailyRate || 0) * 30) / 1000).toFixed(0)}K`}
                  </TableCell>
                  <TableCell className="py-4">
                    <EPStatusPill tone="neutral" className={`rounded-full px-3 border-none text-[10px] font-bold ${
                      r.billed ? "bg-primary text-white" : "bg-orange-500/10 text-[var(--ep-primary)]"
                    }`}>
                      {r.billed ? "To'langan" : "Kutilmoqda"}
                    </EPStatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
          <div className="p-6 bg-muted/40/30 border-t border-border/30">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("jamiMaydon")}</span>
                <span className="text-lg font-bold text-foreground">{totalArea} m²</span>
              </div>
              <div className="w-px h-8 bg-outline-variant" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("jamiTushum")}</span>
                <span className="text-lg font-bold text-primary">
                  {(totalMonthly / 1_000_000).toFixed(1)}M so'm/oy
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ── Advance Panel ────────────────────────────────────────────────────────────

interface AdvancePanelProps {
  advanceOrders: PapkaOrder[];
  criticalOverdueCount: number;
  completedAdvancesCount: number;
}

export function AdvancePanel({ advanceOrders, criticalOverdueCount, completedAdvancesCount }: AdvancePanelProps) {
  const { t } = useTranslation("common");
  const safeOrders = Array.isArray(advanceOrders) ? advanceOrders : [];

  return (
    <TabsContent value="advance" className="space-y-6 mt-0">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-[var(--ep-primary)]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("avansKutilayotgan")}</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">{safeOrders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-[var(--ep-red)]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("kritikMuddatiOTgan")}</p>
              <p className="text-3xl font-bold tracking-tight text-[var(--ep-red)]">{criticalOverdueCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("bajarilganAvanslar")}</p>
              <p className="text-3xl font-bold tracking-tight text-primary">{completedAdvancesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-4 bg-muted/40/50">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("k70AvansKutilayotganBuyurtmalar")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("papka2")}</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("mijoz1")}</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("Mahsulot")}</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("status28")}</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12 italic">
                    {t("avansKutilayotganBuyurtmalarYoq")}
                  </TableCell>
                </TableRow>
              ) : safeOrders.slice(0, 20).map((o: PapkaOrder) => (
                <TableRow key={o.id} className="border-border hover:bg-muted/40/50">
                  <TableCell className="font-mono text-xs font-bold text-primary py-4">{o.papkaNo}</TableCell>
                  <TableCell className="font-bold text-foreground py-4">{o.mijozNomi}</TableCell>
                  <TableCell className="text-sm text-foreground py-4">{o.mahsulotNomi}</TableCell>
                  <TableCell className="py-4">
                    <EPStatusPill tone="neutral" className="bg-muted text-muted-foreground border-none text-[10px] font-bold rounded-full">
                      {o.status}
                    </EPStatusPill>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground py-4">{o.sana || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
