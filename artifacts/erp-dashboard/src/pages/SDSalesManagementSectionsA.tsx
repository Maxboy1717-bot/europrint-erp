/**
 * @module SDSalesManagementSectionsA
 * @description Invoice and Forecast section components for SDSalesManagement.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, TrendingUp,
  RefreshCw, CheckCircle, Clock, AlertTriangle, DollarSign,
} from "lucide-react";
import { Invoice, ForecastHistory, statusVariant, statusLabel } from "./SDSalesManagementTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// InvoicesSection
// ---------------------------------------------------------------------------

interface InvoicesSectionProps {
  invoices: Invoice[];
  isLoading: boolean;
  totalRevenue: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export function InvoicesSection({
  invoices,
  isLoading,
  totalRevenue,
  paidInvoices,
  overdueInvoices,
}: InvoicesSectionProps) {
  const { t } = useTranslation("common");
  const kpis = [
    { label: "Jami hisob-faktura", value: invoices.length, icon: FileText, color: "text-primary" },
    { label: "To'liq to'langan", value: paidInvoices, icon: CheckCircle, color: "text-[var(--ep-green)]" },
    {
      label: "Muddati o'tgan",
      value: overdueInvoices,
      icon: AlertTriangle,
      color: overdueInvoices > 0 ? "text-[var(--ep-red)]" : "text-muted-foreground",
    },
    {
      label: "Jami summa",
      value: `${(totalRevenue / 1_000_000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-foreground",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {(Array.isArray(kpis) ? kpis : []).map((s, i) => (
          <div key={`k-${i}`} className="bg-card rounded-lg p-5" data-testid={`invoice-kpi-${i}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <Card className="bg-card border-none rounded-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">{t("hisobFakturalarMavjudEmas")}</p>
              <p className="text-sm mt-1 opacity-70">{t("buyurtmalarYetkazilgandaAvtomatikYaratiladi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("faktura2")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("mijoz1")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("date")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("muddat")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("summa")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("tolangan")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("status28")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(invoices) ? invoices : []).map(inv => (
                  <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-6 font-mono font-medium text-foreground">{inv.invoiceNumber || `INV-${inv.id.slice(-4)}`}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{inv.customerName || "—"}</TableCell>
                    <TableCell className="py-3 px-6 text-sm text-foreground">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="py-3 px-6 text-sm text-foreground">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="py-3 px-6 font-mono text-foreground">{inv.totalAmount ? `${Number(inv.totalAmount).toLocaleString()} so'm` : "—"}</TableCell>
                    <TableCell className="py-3 px-6 font-mono text-foreground">{inv.paidAmount ? `${Number(inv.paidAmount).toLocaleString()} so'm` : "0"}</TableCell>
                    <TableCell className="py-3 px-6">
                      <Badge className={`${statusVariant[inv.status || ""] || "bg-muted/60 text-foreground"} rounded-full px-2.5 py-0.5 text-xs font-semibold border-none`}>
                        {statusLabel[inv.status || ""] || inv.status || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ForecastSection
// ---------------------------------------------------------------------------

interface ForecastSectionProps {
  forecastHistory: ForecastHistory[];
  forecastAccuracy: { accuracy: number; totalForecasts: number } | null;
  isLoading: boolean;
  isPending: boolean;
  onGenerate: () => void;
}

export function ForecastSection({
  forecastHistory,
  forecastAccuracy,
  isLoading,
  isPending,
  onGenerate,
}: ForecastSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("aiSavdoPrognozi")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("mashinaliOrganishAsosidaKelajakdagiSavdo")}</p>
        </div>
        <Button
          onClick={onGenerate}
          disabled={isPending}
          data-testid="button-generate-forecast"
          className="bg-primary text-white rounded-lg px-5 font-semibold shadow-none"
        >
          {isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
          Prognoz Yaratish
        </Button>
      </div>

      {forecastAccuracy && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("modelAniqligi")}</p>
            <p className="text-4xl font-bold text-primary">{forecastAccuracy.accuracy?.toFixed(1) || "—"}%</p>
          </div>
          <div className="bg-card rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("jamiPrognozlar")}</p>
            <p className="text-4xl font-bold text-foreground">{forecastAccuracy.totalForecasts || 0}</p>
          </div>
        </div>
      )}

      <Card className="bg-card border-none rounded-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {t("prognozTarixi")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : forecastHistory.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">{t("prognozTarixiYoq")}</p>
              <p className="text-sm mt-1 opacity-70">{t("yuqoridagiTugmaniBosibAiPrognoz")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("period")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("tur")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("prognozDaromad")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("prognozBirliklar")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("aniqlik")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(forecastHistory) ? forecastHistory : []).map(f => (
                  <TableRow key={f.id} data-testid={`row-forecast-${f.id}`} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-6 font-medium text-foreground">{f.period || "—"}</TableCell>
                    <TableCell className="py-3 px-6">
                      <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
                        {f.forecastType || "monthly"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-6 font-mono text-foreground">{f.forecastedRevenue ? `${Number(f.forecastedRevenue).toLocaleString()} so'm` : "—"}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{f.forecastedUnits || "—"}</TableCell>
                    <TableCell className="py-3 px-6">
                      {f.accuracy != null ? (
                        <span className={`font-bold text-sm ${Number(f.accuracy) >= 80 ? "text-[var(--ep-green)]" : Number(f.accuracy) >= 60 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
                          {Number(f.accuracy).toFixed(1)}%
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
