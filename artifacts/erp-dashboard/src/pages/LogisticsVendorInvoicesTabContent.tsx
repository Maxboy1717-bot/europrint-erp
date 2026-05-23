/**
 * @module LogisticsVendorInvoicesTabContent
 * @description Vendor invoices (3-way match) tab content for LogisticsDashboard.
 * Split from LogisticsDashboardLogisticsTab.tsx (Rule 16).
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from '@/lib/i18n';
import { FileText, CheckCircle } from "lucide-react";
import type { VendorInvoice } from "./LogisticsDashboardLogisticsTab";

const INV_STATUS_CLS: Record<string, string> = {
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none rounded-full text-xs px-2.5 py-0.5",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-none rounded-full text-xs px-2.5 py-0.5",
};
const INV_STATUS_LABEL: Record<string, string> = {
  approved: "Tasdiqlangan", rejected: "Rad etilgan",
};
const MATCH_STATUS_CLS: Record<string, string> = {
  matched: "bg-primary/10 text-primary border-none rounded-full text-xs px-2.5 py-0.5",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none rounded-full text-xs px-2.5 py-0.5",
};
const MATCH_STATUS_LABEL: Record<string, string> = {
  matched: "Mos", partial: "Qisman",
};
const DEFAULT_BADGE_CLS = "bg-muted/60 text-muted-foreground border-none rounded-full text-xs px-2.5 py-0.5";
const TH_CLS = "text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6";

interface Props {
  vendorInvoiceList: VendorInvoice[];
  viLoading: boolean;
  onApproveInvoice: (id: string) => void;
  onMatchInvoice: (id: string) => void;
  isApprovingInvoice: boolean;
  isMatchingInvoice: boolean;
}

export function LogisticsVendorInvoicesTabContent({
  vendorInvoiceList, viLoading, onApproveInvoice, onMatchInvoice,
  isApprovingInvoice, isMatchingInvoice,
}: Props) {
  const { t } = useTranslation('common');
  return (
    <TabsContent value="invoices">
      <Card className="bg-card border-none rounded-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t("vendorFakturalari3WayMatch")}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t("poGrFakturaMoslikTekshiruvi")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {viLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : vendorInvoiceList.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              {t("vendorFakturalarTopilmadi")}
            </div>
          ) : (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className={TH_CLS}>{t("faktura1")}</TableHead>
                    <TableHead className={TH_CLS}>{t("yetkazuvchi")}</TableHead>
                    <TableHead className={TH_CLS}>{t("date")}</TableHead>
                    <TableHead className={TH_CLS}>{t("summa")}</TableHead>
                    <TableHead className={TH_CLS}>{t('status13')}</TableHead>
                    <TableHead className={TH_CLS}>{t("match")}</TableHead>
                    <TableHead className={TH_CLS}>{t("Amallar")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(vendorInvoiceList) ? vendorInvoiceList : []).map(inv => (
                    <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`} className="hover:bg-muted/40 transition-colors border-none">
                      <TableCell className="py-3 px-6 font-mono font-medium text-foreground">{inv.invoiceNumber}</TableCell>
                      <TableCell className="py-3 px-6 text-foreground">{inv.vendorName ?? inv.vendorId}</TableCell>
                      <TableCell className="py-3 px-6 text-sm text-muted-foreground">{inv.invoiceDate}</TableCell>
                      <TableCell className="py-3 px-6 font-medium text-foreground">
                        {Number(inv.totalAmount).toLocaleString()} {inv.currency}
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <Badge className={INV_STATUS_CLS[inv.status] ?? DEFAULT_BADGE_CLS}>
                          {INV_STATUS_LABEL[inv.status] ?? "Kutilmoqda"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <Badge className={MATCH_STATUS_CLS[inv.matchStatus ?? ""] ?? DEFAULT_BADGE_CLS}>
                          {MATCH_STATUS_LABEL[inv.matchStatus ?? ""] ?? "Tekshirilmagan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          {inv.status === "pending" && (
                            <Button
                              size="sm" variant="outline"
                              onClick={() => onApproveInvoice(inv.id)}
                              disabled={isApprovingInvoice}
                              data-testid={`button-approve-invoice-${inv.id}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />{t("verify")}
                            </Button>
                          )}
                          {inv.purchaseOrderId && inv.matchStatus !== "matched" && (
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => onMatchInvoice(inv.id)}
                              disabled={isMatchingInvoice}
                              data-testid={`button-match-invoice-${inv.id}`}
                            >
                              {t("k3WayMatch")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
