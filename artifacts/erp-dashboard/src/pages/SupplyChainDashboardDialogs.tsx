/**
 * @module SupplyChainDashboardDialogs
 * @description Match result helper and alerts panel components for SupplyChainDashboard.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { AlertTriangle, CheckCircle, Clock, Info, RefreshCw, TrendingUp, XCircle } from "lucide-react";
import type { ThreeWayMatchResult, VendorInvoice } from "./SupplyChainDashboardTypes";
import { STATUS_COLORS, STATUS_LABELS } from "./SupplyChainDashboardTypes";
import { useTranslation } from '@/lib/i18n';

export function MatchStatusIcon({ status }: { status: string }) {
  const { t } = useTranslation("common");
  if (status === "full_match") return <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />;
  if (status === "partial_match") return <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />;
  if (status === "unmatched") return <Clock className="h-4 w-4 text-gray-400" />;
  return <XCircle className="h-4 w-4 text-[var(--ep-red)]" />;
}

export function MatchResultPanel({ result }: { result: ThreeWayMatchResult }) {
  const { t } = useTranslation("common");
  return (
    <div className="mt-3 p-3 rounded-lg border bg-gray-50 text-sm space-y-2">
      <div className="flex items-center gap-2 font-semibold">
        <MatchStatusIcon status={result.matchStatus} />
        <span>
          {result.matchStatus === "full_match"
            ? "3-Way Match muvaffaqiyatli"
            : result.matchStatus === "partial_match"
            ? "Qisman mos keldi"
            : "3-Way Match muvaffaqiyatsiz"}
        </span>
        <Badge className={`ml-auto ${STATUS_COLORS[result.matchStatus] || "bg-gray-100 text-gray-700"}`}>
          {STATUS_LABELS[result.matchStatus] || result.matchStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div className="bg-white rounded p-2 border text-center">
          <div className="text-gray-500">{t("poJami")}</div>
          <div className="font-medium">{formatCurrency(result.poTotal, "UZS")}</div>
        </div>
        <div className="bg-white rounded p-2 border text-center">
          <div className="text-gray-500">{t("grnJami")}</div>
          <div className="font-medium">{formatCurrency(result.grTotal, "UZS")}</div>
        </div>
        <div className="bg-white rounded p-2 border text-center">
          <div className="text-gray-500">{t("fakturaJami")}</div>
          <div className="font-medium">{formatCurrency(result.invoiceTotal, "UZS")}</div>
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <span>{t("narxFarqi1")}<strong className={result.priceVariance > 2 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}>{result.priceVariance.toFixed(2)}%</strong></span>
        <span>{t("tolerans")}<strong>±{result.tolerance}%</strong></span>
      </div>

      <div className="flex gap-4 text-xs">
        <span>{t("miqdor")}<strong className={result.quantityMatch ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}>{result.quantityMatch ? "Mos" : "Mos emas"}</strong></span>
        <span>{t("miqdorFarqi")}<strong className={result.quantityVariance > 2 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}>{result.quantityVariance.toFixed(2)}%</strong></span>
      </div>

      {result.deviations.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-[var(--ep-red)] flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {t("headerFarqlar")}
          </div>
          {(Array.isArray(result.deviations) ? result.deviations : [])
            .filter(d => d.field.includes("header") || d.field.includes("summa"))
            .map((d, i) => (
              <div key={`k-${i}`} className="text-xs bg-red-50 border border-red-100 rounded px-2 py-1">
                <span className="font-medium">{d.field}:</span>{" "}
                Kutilgan: {formatCurrency(d.expected, "UZS")} → Haqiqiy: {formatCurrency(d.actual, "UZS")}{" "}
                <span className="text-[var(--ep-red)]">({d.deviation.toFixed(2)}%)</span>
              </div>
            ))}
        </div>
      )}

      {result.lineDeviations && result.lineDeviations.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-[var(--ep-primary)] flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Qator darajasidagi farqlar (miqdor/narx):
          </div>
          {(Array.isArray(result.lineDeviations) ? result.lineDeviations : []).map((d, i) => (
            <div key={`k-${i}`} className="text-xs bg-orange-50 border border-orange-100 rounded px-2 py-1">
              <span className="font-semibold text-[var(--ep-primary)]">{d.lineRef}</span>{" "}
              <span className="text-gray-500">— {d.field}:</span>{" "}
              Kutilgan: <strong>{d.expected.toFixed(2)}</strong> {t("haqiqiy")}<strong>{d.actual.toFixed(2)}</strong>{" "}
              <span className="text-[var(--ep-primary)]">({d.deviation.toFixed(2)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AlertsSection({
  pendingMatchInvoices, matchingId, onMatch,
}: {
  pendingMatchInvoices: VendorInvoice[];
  matchingId: string | number | null;
  onMatch: (id: string) => void;
}) {
  if (pendingMatchInvoices.length === 0) return null;
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-[var(--ep-primary)]">
          <AlertTriangle className="h-5 w-5" />
          3-Way Match Ogohlantirishlari ({pendingMatchInvoices.length} ta)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(Array.isArray(pendingMatchInvoices) ? pendingMatchInvoices : []).slice(0, 5).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between bg-white border border-orange-100 rounded px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{inv.invoiceNumber}</span>
                <span className="text-muted-foreground ml-2">— {inv.vendorName}</span>
                <span className="ml-2 text-[var(--ep-primary)]">{formatCurrency(Number(inv.totalAmount), inv.currency || "UZS")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${STATUS_COLORS[inv.matchStatus] || ""}`}>
                  {STATUS_LABELS[inv.matchStatus] || inv.matchStatus}
                </Badge>
                {inv.purchaseOrderId && inv.goodsReceiptId && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={matchingId === inv.id} onClick={() => onMatch(String(inv.id))}>
                    {matchingId === inv.id ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                    Match bajarish
                  </Button>
                )}
                {inv.purchaseOrderId && !inv.goodsReceiptId && (
                  <span className="text-xs text-[var(--ep-primary)] flex items-center gap-1"><Info className="h-3 w-3" /> GRN kerak</span>
                )}
              </div>
            </div>
          ))}
          {pendingMatchInvoices.length > 5 && (
            <div className="text-xs text-center text-muted-foreground">
              + {pendingMatchInvoices.length - 5} ta boshqa faktura
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
