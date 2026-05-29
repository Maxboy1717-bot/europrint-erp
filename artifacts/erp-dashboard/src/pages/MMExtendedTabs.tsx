/**
 * @module MMExtendedTabs
 * @description Procurement tab components for MMExtended:
 * CheckBot, SupplierPortal, GoodsReceipts, and Creditor tabs.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { MessageSquare, Building2, PackageCheck, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GoodsReceipt, PurchaseOrder } from "./MMExtendedTypes";
import { fmtMoney } from "./MMExtendedTypes";

import { useTranslation } from '@/lib/i18n';
import { EPComingSoon } from "@/components/ep";
// ─── CheckBotTab ──────────────────────────────────────────────────────────────

export function CheckBotTab() {
  const { t } = useTranslation('common');
  return (
    <TabsContent value="checkbot" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("telegramChekBotOcr")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Bugun skanerlangan", v: "—", c: "text-[var(--ep-blue)]" },
          { l: "Umumiy xarajat",     v: "—", c: "text-[var(--ep-green)]" },
          { l: "OCR aniqligi",       v: "—", c: "text-primary" },
          { l: "Tekshiruv kutmoqda", v: "—", c: "text-[var(--ep-primary)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("oxirgiCheklar")}</CardTitle></CardHeader>
        <CardContent>
          <EPComingSoon variant="inline" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-10 w-10 text-[#229ED9]" />
            <div>
              <div className="font-semibold">{t("telegramBotUlangan")}</div>
              <div className="text-sm text-muted-foreground">{t("europrintCheckBot")}</div>
              <div className="text-xs text-[var(--ep-green)] mt-1">{t("faolXabarYuboringYokiChek")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── SupplierPortalTab ────────────────────────────────────────────────────────

interface SupplierPortalTabProps {
  vendorsCount: number;
  purchaseOrdersCount: number;
  requisitionsCount: number;
  metaTitle: string;
  MetaIcon: LucideIcon | React.ComponentType<{ className?: string }>;
  ModuleSectionHeaderComponent: React.ComponentType<{
    moduleName: string;
    moduleColor: string;
    sectionTitle: string;
    icon: LucideIcon;
  }>;
}

export function SupplierPortalTab({ vendorsCount, purchaseOrdersCount, requisitionsCount, metaTitle, MetaIcon, ModuleSectionHeaderComponent, }: SupplierPortalTabProps) {
  const { t } = useTranslation('common');
  return (
    <TabsContent value="portal" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t('supplierPortal')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("portalStatistikasi")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              { l: "Ro'yxatdan o'tgan yetkazuvchilar", v: vendorsCount },
              { l: "Faol sessiyalar (bugun)",            v: 8 },
              { l: "Yuborilgan buyurtmalar",              v: purchaseOrdersCount },
              { l: "Javob kutayotgan so'rovlar",          v: requisitionsCount },
            ]).map(s => (
              <div key={s.l} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground">{s.l}</span>
                <span className="font-bold">{s.v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("portalKirish")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <ModuleSectionHeaderComponent moduleName="MM" moduleColor="text-[var(--ep-cyan)]" sectionTitle={metaTitle} icon={MetaIcon as LucideIcon} />
              <div className="font-semibold">{t("suppliersEuroprintUz")}</div>
              <div className="text-sm text-muted-foreground mt-1">{t("yetkazuvchilarTashqiPortalManzili")}</div>
            </div>
            <Button className="w-full gap-2" data-testid="button-invite-supplier">
              <Building2 className="h-4 w-4" />{t("yetkazuvchiTaklifEtish")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

// ─── GoodsReceiptsTab ─────────────────────────────────────────────────────────

interface GoodsReceiptsTabProps {
  goodsReceipts: GoodsReceipt[];
  grLoading: boolean;
}

export function GoodsReceiptsTab({ goodsReceipts, grLoading }: GoodsReceiptsTabProps) {
  const { t } = useTranslation("common");
  const safe = Array.isArray(goodsReceipts) ? goodsReceipts : [];
  return (
    <TabsContent value="receipts" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("qabulAktlariGoodsReceipts")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Bugun qabul", v: safe.filter(r => { const d = new Date(r.receiptDate || r.createdAt || ""); return d.toDateString() === new Date().toDateString(); }).length, c: "text-[var(--ep-green)]" },
          { l: "Bu oy jami",  v: goodsReceipts.length, c: "text-primary" },
          { l: "QC kutmoqda", v: safe.filter(r => r.status === "pending_qc").length, c: "text-[var(--ep-primary)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader><TableRow>
            <TableHead>{t("akt")}</TableHead><TableHead>{t("yetkazuvchi")}</TableHead>
            <TableHead>{t("date")}</TableHead><TableHead>{t("summa")}</TableHead><TableHead>{t("holati")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {grLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
            ) : safe.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                <PackageCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("qabulAktlariYoq")}
              </TableCell></TableRow>
            ) : safe.slice(0, 15).map((gr: GoodsReceipt) => (
              <TableRow key={gr.id} data-testid={`row-gr-${gr.id}`} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-sm">GR-{gr.id}</TableCell>
                <TableCell className="font-medium">{gr.vendorName || gr.vendorId || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{gr.receiptDate ? new Date(gr.receiptDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                <TableCell>{fmtMoney(gr.totalAmount)}</TableCell>
                <TableCell>
                  <Badge variant={gr.status === "completed" ? "default" : gr.status === "pending_qc" ? "secondary" : "outline"}>
                    {gr.status === "pending_qc" ? "QC kutmoqda" : gr.status === "completed" ? "Qabul qilindi" : gr.status || "Jarayonda"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent></Card>
    </TabsContent>
  );
}

// ─── CreditorTab ──────────────────────────────────────────────────────────────

interface CreditorTabProps {
  purchaseOrders: PurchaseOrder[];
  totalPOValue: number;
  overduePOCount: number;
  pendingPOCount: number;
  vendorsCount: number;
}

export function CreditorTab({ purchaseOrders, totalPOValue, overduePOCount, pendingPOCount, vendorsCount }: CreditorTabProps) {
  const { t } = useTranslation("common");
  const openOrders = (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter(po => po.status !== "completed" && po.status !== "cancelled");
  return (
    <TabsContent value="creditor" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("kreditorQarzlar")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Jami qarz (PO)",      v: fmtMoney(totalPOValue), c: "text-[var(--ep-red)]" },
          { l: "Muddati o'tgan",      v: overduePOCount,         c: "text-[var(--ep-red)]" },
          { l: "Bu oyda kutilmoqda",  v: pendingPOCount,         c: "text-[var(--ep-primary)]" },
          { l: "Yetkazuvchilar soni", v: vendorsCount,           c: "text-[var(--ep-blue)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader><TableRow>
            <TableHead>{t("yetkazuvchi")}</TableHead><TableHead>{t("qarzPoSumma")}</TableHead>
            <TableHead>{t("yetkazishMuddati")}</TableHead><TableHead>{t("holati")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {openOrders.slice(0, 10).map((po: PurchaseOrder) => {
              const isOverdue = po.deliveryDate && new Date(po.deliveryDate) < new Date();
              return (
                <TableRow key={po.id} data-testid={`row-creditor-${po.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{po.vendorName || po.vendorId || `Vendor #${po.vendorId}`}</TableCell>
                  <TableCell className="text-[var(--ep-red)] font-medium">{fmtMoney(po.totalAmount)}</TableCell>
                  <TableCell className={isOverdue ? "text-[var(--ep-red)] font-medium" : "text-muted-foreground"}>
                    {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isOverdue ? "destructive" : po.status === "approved" ? "default" : "outline"}>
                      {isOverdue ? "Muddati o'tgan" : po.status === "approved" ? "Tasdiqlangan" : "Kutilmoqda"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {openOrders.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-[13px] text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-[var(--ep-green)] opacity-60" />
                {t("muddatiOtganQarzlarYoq")}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table></div>
      </CardContent></Card>
    </TabsContent>
  );
}
