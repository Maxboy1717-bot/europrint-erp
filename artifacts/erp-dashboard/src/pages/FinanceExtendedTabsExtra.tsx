/**
 * @module FinanceExtendedTabsExtra
 * @description Tax, TaxCalendar and RiskAI tab sections for FinanceExtended page.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, CheckCircle } from "lucide-react";
import type { TaxCalendarItem } from "./FinanceExtendedTypes";
import { useTranslation } from '@/lib/i18n';
import { EPComingSoon } from "@/components/ep";

interface TaxSummary {
  totalThisMonth: number;
  paid: number;
  pending: number;
  overdue: number;
}

interface TaxTabProps {
  taxItems: TaxCalendarItem[];
  taxLoading: boolean;
  taxSummary?: TaxSummary;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

export function TaxTab({ taxItems, taxLoading, taxSummary }: TaxTabProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="tax" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("ichkiSoliqlarBoshqaruvi")}</h2>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />Export
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Ushbu oy jami", v: formatCurrency(taxSummary?.totalThisMonth ?? 0), c: "text-[var(--ep-red)]" },
          { l: "To'langan", v: formatCurrency(taxSummary?.paid ?? 0), c: "text-[var(--ep-green)]" },
          { l: "Kutilayotgan", v: formatCurrency(taxSummary?.pending ?? 0), c: "text-[var(--ep-primary)]" },
          { l: "Muddati o'tgan", v: formatCurrency(taxSummary?.overdue ?? 0), c: "text-muted-foreground" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          {taxLoading ? (
            <div className="p-4 space-y-2">{([...Array(4)]).map((_,i)=><Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg"/>)}</div>
          ) : taxItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t("soliqQoidalariKiritilmaganAdministratorTomonidan")}
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>{t("soliqTuri")}</TableHead><TableHead>{t("period")}</TableHead>
                <TableHead>{t("muddat")}</TableHead><TableHead>{t("stavka")}</TableHead><TableHead>{t("holati")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(taxItems) ? taxItems : []).map((t, i) => (
                  <TableRow key={t.id || i} data-testid={`row-tax-${i}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.period}</TableCell>
                    <TableCell className="text-muted-foreground">{t.due}</TableCell>
                    <TableCell className="font-medium">{t.rate}%</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "To'langan" ? "default" : "secondary"}>
                        {t.status === "To'langan" ? (
                          <><CheckCircle className="h-3 w-3 mr-0.5" />{t.status}</>
                        ) : t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export function TaxCalendarTab() {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="taxcal" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("soliqMuddatlariKalendari")}</h2>
      <EPComingSoon variant="inline" />
    </TabsContent>
  );
}

export function RiskAITab() {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="risk" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">{t("aiMoliyaviyRiskTahlili")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Umumiy risk bali", v: "—", c: "text-[var(--ep-primary)]", note: "" },
          { l: "Likvidlik nisbati", v: "—", c: "text-[var(--ep-green)]", note: "" },
          { l: "Qarzdorlik nisbati", v: "—", c: "text-[var(--ep-green)]", note: "" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
            <div className="text-xs font-medium mt-1">{s.note}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("aiRiskBashoratlari")}</CardTitle></CardHeader>
        <CardContent>
          <EPComingSoon variant="inline" />
        </CardContent>
      </Card>
    </TabsContent>
  );
}
