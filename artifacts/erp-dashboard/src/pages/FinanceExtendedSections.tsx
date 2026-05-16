/**
 * @module FinanceExtendedSections
 * @description Tab section UI components for FinanceExtended page (cost/profit/payments/GL).
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, CreditCard, Receipt, RefreshCw, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { CostCenter, ProfitCenter, FinPayment, GLDocument } from "./FinanceExtendedTypes";
import { fmtMoney } from "./FinanceExtendedTypes";
import { useTranslation } from '@/lib/i18n';

interface CostCentersTabProps {
  costCenters: CostCenter[];
  profitCenters: ProfitCenter[];
  glDocuments: GLDocument[];
  ccLoading: boolean;
  totalBudget: number;
  onRefetch: () => void;
  onAddClick: () => void;
}

export function CostCentersTab({ costCenters, profitCenters, glDocuments, ccLoading, totalBudget, onRefetch, onAddClick }: CostCentersTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="costcenters" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("xarajatMarkazlari")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefetch}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
          </Button>
          <Button size="sm" onClick={onAddClick} data-testid="button-add-cc">
            <Plus className="h-3.5 w-3.5 mr-1.5" />{t("markazQoshish")}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Xarajat markazlari", v: costCenters.length, c: "text-primary" },
          { l: "Jami byudjet", v: fmtMoney(totalBudget), c: "text-[var(--ep-blue)]" },
          { l: "Foyda markazlari", v: profitCenters.length, c: "text-[var(--ep-green)]" },
          { l: "GL hujjatlar", v: glDocuments.length, c: "text-[var(--ep-primary)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("code")}</TableHead><TableHead>{t("name")}</TableHead>
              <TableHead>{t("byudjet")}</TableHead><TableHead>{t("progress.description")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {ccLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : costCenters.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-[13px] text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("xarajatMarkazlariYoq")}
                </TableCell></TableRow>
              ) : (Array.isArray(costCenters) ? costCenters : []).slice(0, 15).map((cc: CostCenter) => (
                <TableRow key={cc.id} data-testid={`row-cc-${cc.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-sm">{cc.code}</TableCell>
                  <TableCell className="font-medium">{cc.name}</TableCell>
                  <TableCell className="font-medium text-[var(--ep-blue)]">{fmtMoney(cc.budget)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{cc.description || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

interface ProfitCentersTabProps {
  profitCenters: ProfitCenter[];
  pcLoading: boolean;
}

export function ProfitCentersTab({ profitCenters, pcLoading }: ProfitCentersTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="profitcenters" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("foydaMarkazlari")}</h2>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("code")}</TableHead><TableHead>{t("name")}</TableHead>
              <TableHead>{t("daromad")}</TableHead><TableHead>{t("xarajat1")}</TableHead><TableHead>{t("foyda")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {pcLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : profitCenters.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("foydaMarkazlariYoq")}
                </TableCell></TableRow>
              ) : (Array.isArray(profitCenters) ? profitCenters : []).slice(0, 15).map((pc: ProfitCenter) => {
                const profit = Number(pc.revenue || 0) - Number(pc.expenses || 0);
                return (
                  <TableRow key={pc.id} data-testid={`row-pc-${pc.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm">{pc.code}</TableCell>
                    <TableCell className="font-medium">{pc.name}</TableCell>
                    <TableCell className="text-[var(--ep-green)]">{fmtMoney(pc.revenue)}</TableCell>
                    <TableCell className="text-[var(--ep-red)]">{fmtMoney(pc.expenses)}</TableCell>
                    <TableCell className={profit >= 0 ? "text-[var(--ep-green)] font-bold" : "text-[var(--ep-red)] font-bold"}>
                      {fmtMoney(profit)}
                    </TableCell>
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

interface PaymentsTabProps {
  payments: FinPayment[];
  paymentsLoading: boolean;
}

export function PaymentsTab({ payments, paymentsLoading }: PaymentsTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="payments" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("tolovlarJurnali")}</h2>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/fi/payments"] })}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("date")}</TableHead><TableHead>{t("tur")}</TableHead>
              <TableHead>{t("summa")}</TableHead><TableHead>{t("holati")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paymentsLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : !Array.isArray(payments) || payments.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-[13px] text-muted-foreground">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("tolovlarYoq")}
                </TableCell></TableRow>
              ) : payments.slice(0, 15).map((p: FinPayment) => (
                <TableRow key={p.id} data-testid={`row-payment-${p.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-muted-foreground text-sm">
                    {p.documentDate ? new Date(p.documentDate).toLocaleDateString("uz-UZ") : p.createdAt ? new Date(p.createdAt).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.type || "To'lov"}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{fmtMoney(p.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "posted" ? "default" : p.status === "cancelled" ? "destructive" : "secondary"}>
                      {p.status === "posted" ? "Joylashtirildi" : p.status === "cancelled" ? "Bekor" : "Jarayonda"}
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

interface GLDocumentsTabProps {
  glDocuments: GLDocument[];
  glLoading: boolean;
  onRefetch: () => void;
}

export function GLDocumentsTab({ glDocuments, glLoading, onRefetch }: GLDocumentsTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="gldocs" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("glHujjatlarAuditLog")}</h2>
        <Button variant="outline" size="sm" onClick={onRefetch}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Jami GL hujjatlar", v: glDocuments.length, c: "text-primary" },
          { l: "Joylashtirilgan", v: (Array.isArray(glDocuments) ? glDocuments : []).filter((d: GLDocument) => d.status === "posted").length, c: "text-[var(--ep-green)]" },
          { l: "Qoralama", v: (Array.isArray(glDocuments) ? glDocuments : []).filter((d: GLDocument) => d.status === "draft").length, c: "text-[var(--ep-primary)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("hujjat1")}</TableHead><TableHead>{t("date")}</TableHead>
              <TableHead>{t("progress.description")}</TableHead><TableHead>{t("debet")}</TableHead><TableHead>{t("loan")}</TableHead><TableHead>{t("holati")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {glLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
              ) : glDocuments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("glHujjatlarYoq")}
                </TableCell></TableRow>
              ) : (Array.isArray(glDocuments) ? glDocuments : []).slice(0, 15).map((doc: GLDocument) => (
                <TableRow key={doc.id} data-testid={`row-gl-${doc.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-sm">GL-{doc.id}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {doc.documentDate ? new Date(doc.documentDate).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{doc.description || "—"}</TableCell>
                  <TableCell className="text-[var(--ep-blue)]">{fmtMoney(doc.debitAmount)}</TableCell>
                  <TableCell className="text-[var(--ep-red)]">{fmtMoney(doc.creditAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={doc.status === "posted" ? "default" : "secondary"}>
                      {doc.status === "posted" ? "Joylashtirildi" : "Qoralama"}
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

