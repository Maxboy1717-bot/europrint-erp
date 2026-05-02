import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Truck,
  RefreshCw,
  Info,
} from "lucide-react";

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_name: string;
  order_date: string;
  delivery_date: string;
  status: string;
  total_amount: string;
  currency: string;
  received_amount: string;
  pending_amount: string;
  receipt_count: number;
}

interface GoodsReceipt {
  id: string;
  grNumber: string;
  poId: string;
  vendorName: string;
  receiptDate: string;
  status: string;
  warehouseName: string;
  receivedBy: string;
}

interface VendorInvoice {
  id: number;
  invoiceNumber: string;
  vendorId: string;
  purchaseOrderId: string | null;
  goodsReceiptId: string | null;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: string;
  currency: string;
  status: string;
  matchStatus: string;
  matchScore: string | null;
  priceVariance: string | null;
  vendorName: string | null;
}

interface LineDeviation {
  lineRef: string;
  field: string;
  expected: number;
  actual: number;
  deviation: number;
}

interface ThreeWayMatchResult {
  isMatched: boolean;
  matchStatus: "full_match" | "partial_match" | "mismatch" | "unmatched";
  poTotal: number;
  grTotal: number;
  invoiceTotal: number;
  quantityMatch: boolean;
  amountMatch: boolean;
  tolerance: number;
  priceVariance: number;
  quantityVariance: number;
  deviations: Array<{ field: string; expected: number; actual: number; deviation: number }>;
  lineDeviations?: LineDeviation[];
  poNumber?: string;
  grNumber?: string;
  invoiceNumber?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  sent: "bg-purple-100 text-purple-700",
  partial: "bg-orange-100 text-orange-700",
  received: "bg-green-100 text-green-700",
  verified: "bg-teal-100 text-teal-700",
  posted: "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
  full_match: "bg-green-100 text-green-700",
  partial_match: "bg-orange-100 text-orange-700",
  unmatched: "bg-gray-100 text-gray-600",
  mismatch: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  sent: "Yuborilgan",
  partial: "Qisman",
  received: "Qabul qilindi",
  verified: "Tekshirildi",
  posted: "Kiritildi",
  rejected: "Rad etildi",
  paid: "To'landi",
  cancelled: "Bekor qilindi",
  full_match: "To'liq mos",
  partial_match: "Qisman mos",
  unmatched: "Tekshirilmagan",
  mismatch: "Farq bor",
};

function MatchStatusIcon({ status }: { status: string }) {
  if (status === "full_match") return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === "partial_match") return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  if (status === "unmatched") return <Clock className="h-4 w-4 text-gray-400" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function MatchResultPanel({ result }: { result: ThreeWayMatchResult }) {
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

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white rounded p-2 border text-center">
          <div className="text-gray-500">PO Jami</div>
          <div className="font-medium">{formatCurrency(result.poTotal, "UZS")}</div>
        </div>
        <div className="bg-white rounded p-2 border text-center">
          <div className="text-gray-500">GRN Jami</div>
          <div className="font-medium">{formatCurrency(result.grTotal, "UZS")}</div>
        </div>
        <div className="bg-white rounded p-2 border text-center">
          <div className="text-gray-500">Faktura Jami</div>
          <div className="font-medium">{formatCurrency(result.invoiceTotal, "UZS")}</div>
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <span>Narx farqi: <strong className={result.priceVariance > 2 ? "text-red-600" : "text-green-600"}>{result.priceVariance.toFixed(2)}%</strong></span>
        <span>Tolerans: <strong>±{result.tolerance}%</strong></span>
      </div>

      <div className="flex gap-4 text-xs">
        <span>Miqdor: <strong className={result.quantityMatch ? "text-green-600" : "text-red-600"}>{result.quantityMatch ? "Mos" : "Mos emas"}</strong></span>
        <span>Miqdor farqi: <strong className={result.quantityVariance > 2 ? "text-red-600" : "text-green-600"}>{result.quantityVariance.toFixed(2)}%</strong></span>
      </div>

      {result.deviations.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Header farqlar:
          </div>
          {(Array.isArray(result.deviations) ? result.deviations : []).filter(d => d.field.includes("header") || d.field.includes("summa")).map((d, i) => (
            <div key={`k-${i}`} className="text-xs bg-red-50 border border-red-100 rounded px-2 py-1">
              <span className="font-medium">{d.field}:</span>{" "}
              Kutilgan: {formatCurrency(d.expected, "UZS")} → Haqiqiy: {formatCurrency(d.actual, "UZS")}{" "}
              <span className="text-red-600">({d.deviation.toFixed(2)}%)</span>
            </div>
          ))}
        </div>
      )}

      {result.lineDeviations && result.lineDeviations.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-orange-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Qator darajasidagi farqlar (miqdor/narx):
          </div>
          {(Array.isArray(result.lineDeviations) ? result.lineDeviations : []).map((d, i) => (
            <div key={`k-${i}`} className="text-xs bg-orange-50 border border-orange-100 rounded px-2 py-1">
              <span className="font-semibold text-orange-700">{d.lineRef}</span>{" "}
              <span className="text-gray-500">— {d.field}:</span>{" "}
              Kutilgan: <strong>{d.expected.toFixed(2)}</strong> → Haqiqiy: <strong>{d.actual.toFixed(2)}</strong>{" "}
              <span className="text-orange-600">({d.deviation.toFixed(2)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SupplyChainDashboard() {
  const { toast } = useToast();
  const [matchResults, setMatchResults] = useState<Record<string | number, ThreeWayMatchResult>>({});
  const [matchingId, setMatchingId] = useState<string | number | null>(null);
  const [payingId, setPayingId] = useState<string | number | null>(null);

  const { data: pendingPOs = [], isLoading: loadingPOs } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/mm/purchase-orders/pending-receipt"],
  });

  const { data: goodsReceipts = [], isLoading: loadingGRs } = useQuery<GoodsReceipt[]>({
    queryKey: ["/api/mm/goods-receipts"],
  });

  const { data: vendorInvoices = [], isLoading: loadingInvoices } = useQuery<VendorInvoice[]>({
    queryKey: ["/api/mm/vendor-invoices"],
  });

  const matchMutation = useMutation({
    mutationFn: async (invoiceId: string | number) => {
      setMatchingId(invoiceId);
      return await apiRequest("POST", `/api/mm/3way-match/${invoiceId}`, { tolerance: 2 });
    },
    onSuccess: (data: ThreeWayMatchResult, invoiceId) => {
      setMatchResults((prev) => ({ ...prev, [invoiceId]: data }));
      setMatchingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendor-invoices"] });
      toast({
        title: data.isMatched ? "3-Way Match muvaffaqiyatli" : "3-Way Match farqlari aniqlandi",
        description: data.isMatched
          ? "Barcha hujjatlar mos keldi"
          : `${data.deviations.length} ta farq aniqlandi`,
        variant: data.isMatched ? "default" : "destructive",
      });
    },
    onError: (err) => {
      setMatchingId(null);
      toast({ title: "Xatolik", description: String(err), variant: "destructive" });
    },
  });

  const INVOICE_NEXT_STATUS: Record<string, string | undefined> = {
    pending: "verified",
    verified: "approved",
    approved: "posted",
    posted: "paid",
  };

  const paymentMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string | number; status: string }) => {
      setPayingId(invoiceId);
      return await apiRequest("PATCH", `/api/mm/vendor-invoices/${invoiceId}/payment`, { status });
    },
    onSuccess: (_data, { invoiceId }) => {
      setPayingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendor-invoices"] });
      toast({ title: "Holat yangilandi", description: "Faktura holati muvaffaqiyatli o'zgartirildi" });
    },
    onError: (err) => {
      setPayingId(null);
      toast({ title: "Xatolik", description: String(err), variant: "destructive" });
    },
  });

  const pendingMatchInvoices = (Array.isArray(vendorInvoices) ? vendorInvoices : []).filter(
    (inv) => inv.matchStatus === "unmatched" || inv.matchStatus === "mismatch" || inv.matchStatus === "partial_match"
  );

  return (
    <div className="space-y-4 p-4">
      <PageHeader
        title="Ta'minot Zanjiri"
        description="Xarid tsikli: PO → Qabul (GRN) → Faktura (3-Way Match)"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
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
              <Package className="h-5 w-5 text-green-500" />
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
              <FileText className="h-5 w-5 text-purple-500" />
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
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{pendingMatchInvoices.length}</div>
                <div className="text-xs text-muted-foreground">Match kutmoqda</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3-Column Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Purchase Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              Xarid Buyurtmalari (Kutilayotgan Qabul)
              <Badge className="ml-auto bg-blue-100 text-blue-700">{pendingPOs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
            {loadingPOs ? (
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
                    <span className="font-semibold text-blue-700">{po.po_number}</span>
                    <Badge className={`text-xs ${STATUS_COLORS[po.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[po.status] || po.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">{po.vendor_name}</div>
                  <div className="flex justify-between text-xs">
                    <span>Jami: <strong>{formatCurrency(Number(po.total_amount), po.currency || "UZS")}</strong></span>
                    <span className="text-orange-600">Qoldi: {formatCurrency(Number(po.pending_amount), po.currency || "UZS")}</span>
                  </div>
                  {po.delivery_date && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Muddati: {po.delivery_date}
                    </div>
                  )}
                  {Number(po.receipt_count) > 0 && (
                    <div className="text-xs text-green-600">{po.receipt_count} ta qabul akti mavjud</div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 2: Goods Receipts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-green-500" />
              Qabul Aktlari (GRN)
              <Badge className="ml-auto bg-green-100 text-green-700">{goodsReceipts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
            {loadingGRs ? (
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
                    <span className="font-semibold text-green-700">{gr.grNumber}</span>
                    <Badge className={`text-xs ${STATUS_COLORS[gr.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[gr.status] || gr.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">{gr.vendorName}</div>
                  {gr.warehouseName && (
                    <div className="text-xs text-muted-foreground">Ombor: {gr.warehouseName}</div>
                  )}
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {gr.receiptDate}
                  </div>
                  {gr.poId && (
                    <div className="text-xs text-blue-600">PO: {gr.poId.slice(0, 8)}...</div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 3: Vendor Invoices with 3-Way Match */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              Fakturalar &amp; 3-Way Match
              <Badge className="ml-auto bg-purple-100 text-purple-700">{vendorInvoices.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
            {loadingInvoices ? (
              <div className="text-center text-muted-foreground text-sm py-6">Yuklanmoqda...</div>
            ) : vendorInvoices.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-6">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Fakturalar yo'q
              </div>
            ) : (
              (Array.isArray(vendorInvoices) ? vendorInvoices : []).map((inv) => {
                const localResult = matchResults[inv.id];
                return (
                  <div key={inv.id} className="border rounded-lg p-3 text-sm space-y-1 bg-white hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-purple-700">{inv.invoiceNumber}</span>
                      <Badge className={`text-xs ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">{inv.vendorName}</div>
                    <div className="flex justify-between text-xs">
                      <span>Jami: <strong>{formatCurrency(Number(inv.totalAmount), inv.currency || "UZS")}</strong></span>
                      {inv.dueDate && (
                        <span className="text-orange-600">Muddat: {inv.dueDate}</span>
                      )}
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            disabled={matchingId === inv.id}
                            onClick={() => matchMutation.mutate(String(inv.id))}
                          >
                            {matchingId === inv.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            )}
                            Match
                          </Button>
                        )}
                        {INVOICE_NEXT_STATUS[inv.status] && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2 border-green-300 text-green-700 hover:bg-green-50"
                            disabled={payingId === inv.id}
                            onClick={() => paymentMutation.mutate({ invoiceId: String(inv.id), status: INVOICE_NEXT_STATUS[inv.status]! })}
                          >
                            {payingId === inv.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {STATUS_LABELS[INVOICE_NEXT_STATUS[inv.status]!] || INVOICE_NEXT_STATUS[inv.status]}
                          </Button>
                        )}
                      </div>
                    </div>

                    {(inv.matchStatus === "unmatched" || inv.matchStatus === "mismatch") && !inv.purchaseOrderId && (
                      <div className="text-xs text-orange-600 flex items-center gap-1">
                        <Info className="h-3 w-3" /> PO ulangan emas
                      </div>
                    )}
                    {inv.purchaseOrderId && !inv.goodsReceiptId && (
                      <div className="text-xs text-orange-600 flex items-center gap-1">
                        <Info className="h-3 w-3" /> GRN (Qabul akti) ulangan emas — Match uchun zarur
                      </div>
                    )}

                    {Number(inv.priceVariance) > 2 && (
                      <div className="text-xs text-red-600 flex items-center gap-1">
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
      </div>

      {/* Alerts section */}
      {pendingMatchInvoices.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
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
                    <span className="ml-2 text-orange-600">{formatCurrency(Number(inv.totalAmount), inv.currency || "UZS")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${STATUS_COLORS[inv.matchStatus] || ""}`}>
                      {STATUS_LABELS[inv.matchStatus] || inv.matchStatus}
                    </Badge>
                    {inv.purchaseOrderId && inv.goodsReceiptId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={matchingId === inv.id}
                        onClick={() => matchMutation.mutate(String(inv.id))}
                      >
                        {matchingId === inv.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        )}
                        Match bajarish
                      </Button>
                    )}
                    {inv.purchaseOrderId && !inv.goodsReceiptId && (
                      <span className="text-xs text-orange-600 flex items-center gap-1">
                        <Info className="h-3 w-3" /> GRN kerak
                      </span>
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
      )}
    </div>
  );
}
