/**
 * @module SupplyChainDashboardSections
 * @description Kanban column and alert section components for SupplyChainDashboard.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Info,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Truck,
} from "lucide-react";

import type { GoodsReceipt, PurchaseOrder, ThreeWayMatchResult, VendorInvoice } from "./SupplyChainDashboardTypes";
import { INVOICE_NEXT_STATUS, STATUS_COLORS, STATUS_LABELS } from "./SupplyChainDashboardTypes";
import { MatchResultPanel, MatchStatusIcon } from "./SupplyChainDashboardDialogs";

export { AlertsSection } from "./SupplyChainDashboardDialogs";

export function SummaryCards({
  pendingPOs,
  goodsReceipts,
  vendorInvoices,
  pendingMatchCount,
}: {
  pendingPOs: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  vendorInvoices: VendorInvoice[];
  pendingMatchCount: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[var(--ep-blue)]" />
            <div>
              <div className="text-2xl font-bold">{pendingPOs.length}</div>
              <div className="text-xs text-muted-foreground">Kutilayotgan PO</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--ep-green)]" />
            <div>
              <div className="text-2xl font-bold">{goodsReceipts.length}</div>
              <div className="text-xs text-muted-foreground">Jami GRN</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--ep-purple)]" />
            <div>
              <div className="text-2xl font-bold">{vendorInvoices.length}</div>
              <div className="text-xs text-muted-foreground">Jami Faktura</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[var(--ep-primary)]" />
            <div>
              <div className="text-2xl font-bold">{pendingMatchCount}</div>
              <div className="text-xs text-muted-foreground">Match kutmoqda</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function POColumn({ pendingPOs, loading }: { pendingPOs: PurchaseOrder[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-[var(--ep-blue)]" />
          Xarid Buyurtmalari (Kutilayotgan Qabul)
          <Badge className="ml-auto bg-blue-100 text-[var(--ep-blue)]">{pendingPOs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-6">Yuklanmoqda...</div>
        ) : pendingPOs.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-6">
            <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Kutilayotgan yetkazib berish yo'q
          </div>
        ) : (
          (Array.isArray(pendingPOs) ? pendingPOs : []).map((po) => (
            <div key={po.id} className="border rounded-lg p-3 text-sm space-y-1 bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--ep-blue)]">{po.po_number}</span>
                <Badge className={`text-xs ${STATUS_COLORS[po.status] || "bg-gray-100 text-gray-700"}`}>
                  {STATUS_LABELS[po.status] || po.status}
                </Badge>
              </div>
              <div className="text-muted-foreground">{po.vendor_name}</div>
              <div className="flex justify-between text-xs">
                <span>Jami: <strong>{formatCurrency(Number(po.total_amount), po.currency || "UZS")}</strong></span>
                <span className="text-[var(--ep-primary)]">Qoldi: {formatCurrency(Number(po.pending_amount), po.currency || "UZS")}</span>
              </div>
              {po.delivery_date && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Muddati: {po.delivery_date}
                </div>
              )}
              {Number(po.receipt_count) > 0 && (
                <div className="text-xs text-[var(--ep-green)]">{po.receipt_count} ta qabul akti mavjud</div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function GRNColumn({ goodsReceipts, loading }: { goodsReceipts: GoodsReceipt[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-[var(--ep-green)]" />
          Qabul Aktlari (GRN)
          <Badge className="ml-auto bg-green-100 text-[var(--ep-green)]">{goodsReceipts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-6">Yuklanmoqda...</div>
        ) : goodsReceipts.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-6">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Qabul aktlari yo'q
          </div>
        ) : (
          (Array.isArray(goodsReceipts) ? goodsReceipts : []).map((gr) => (
            <div key={gr.id} className="border rounded-lg p-3 text-sm space-y-1 bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--ep-green)]">{gr.grNumber}</span>
                <Badge className={`text-xs ${STATUS_COLORS[gr.status] || "bg-gray-100 text-gray-700"}`}>
                  {STATUS_LABELS[gr.status] || gr.status}
                </Badge>
              </div>
              <div className="text-muted-foreground">{gr.vendorName}</div>
              {gr.warehouseName && <div className="text-xs text-muted-foreground">Ombor: {gr.warehouseName}</div>}
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {gr.receiptDate}
              </div>
              {gr.poId && <div className="text-xs text-[var(--ep-blue)]">PO: {gr.poId.slice(0, 8)}...</div>}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function InvoiceColumn({
  vendorInvoices, loading, matchResults, matchingId, payingId, onMatch, onAdvanceStatus,
}: {
  vendorInvoices: VendorInvoice[];
  loading: boolean;
  matchResults: Record<string | number, ThreeWayMatchResult>;
  matchingId: string | number | null;
  payingId: string | number | null;
  onMatch: (id: string) => void;
  onAdvanceStatus: (invoiceId: string, status: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-[var(--ep-purple)]" />
          Fakturalar &amp; 3-Way Match
          <Badge className="ml-auto bg-purple-100 text-[var(--ep-purple)]">{vendorInvoices.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-6">Yuklanmoqda...</div>
        ) : vendorInvoices.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-6">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Fakturalar yo'q
          </div>
        ) : (
          (Array.isArray(vendorInvoices) ? vendorInvoices : []).map((inv) => {
            const localResult = matchResults[inv.id];
            const nextStatus = INVOICE_NEXT_STATUS[inv.status];
            return (
              <div key={inv.id} className="border rounded-lg p-3 text-sm space-y-1 bg-white hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--ep-purple)]">{inv.invoiceNumber}</span>
                  <Badge className={`text-xs ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-700"}`}>
                    {STATUS_LABELS[inv.status] || inv.status}
                  </Badge>
                </div>
                <div className="text-muted-foreground">{inv.vendorName}</div>
                <div className="flex justify-between text-xs">
                  <span>Jami: <strong>{formatCurrency(Number(inv.totalAmount), inv.currency || "UZS")}</strong></span>
                  {inv.dueDate && <span className="text-[var(--ep-primary)]">Muddat: {inv.dueDate}</span>}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    <MatchStatusIcon status={inv.matchStatus} />
                    <span className={`text-xs ${STATUS_COLORS[inv.matchStatus] || "bg-gray-100"} px-1 rounded`}>
                      {STATUS_LABELS[inv.matchStatus] || inv.matchStatus}
                    </span>
                    {Number(inv.matchScore) > 0 && (
                      <span className="text-xs text-muted-foreground">{Number(inv.matchScore).toFixed(0)}%</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {inv.purchaseOrderId && inv.goodsReceiptId && (
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2" disabled={matchingId === inv.id} onClick={() => onMatch(String(inv.id))}>
                        {matchingId === inv.id ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                        Match
                      </Button>
                    )}
                    {nextStatus && (
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2 border-green-300 text-[var(--ep-green)] hover:bg-green-50" disabled={payingId === inv.id} onClick={() => onAdvanceStatus(String(inv.id), nextStatus)}>
                        {payingId === inv.id ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                        {STATUS_LABELS[nextStatus] || nextStatus}
                      </Button>
                    )}
                  </div>
                </div>
                {(inv.matchStatus === "unmatched" || inv.matchStatus === "mismatch") && !inv.purchaseOrderId && (
                  <div className="text-xs text-[var(--ep-primary)] flex items-center gap-1"><Info className="h-3 w-3" /> PO ulangan emas</div>
                )}
                {inv.purchaseOrderId && !inv.goodsReceiptId && (
                  <div className="text-xs text-[var(--ep-primary)] flex items-center gap-1"><Info className="h-3 w-3" /> GRN (Qabul akti) ulangan emas — Match uchun zarur</div>
                )}
                {Number(inv.priceVariance) > 2 && (
                  <div className="text-xs text-[var(--ep-red)] flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Narx farqi: {Number(inv.priceVariance).toFixed(2)}% (±2% chegaradan oshdi)
                  </div>
                )}
                {localResult && <MatchResultPanel result={localResult} />}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

