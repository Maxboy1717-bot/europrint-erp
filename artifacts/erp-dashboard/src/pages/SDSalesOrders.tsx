/**
 * @module SDSalesOrders
 * @description React page component. Route-level UI.
 */

import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart, ArrowRight, Clock, MapPin, Plus, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import {
  fmt, PAYMENT_STATUS_COLORS,
} from "@/lib/sd-helpers";
import { EPPageHeader } from "@/components/ep";
import { Pagination } from "@/components/Pagination";
import { SearchBar } from "@/components/SearchBar";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from "@/lib/i18n/tLabel";

interface OrderTimelineItem {
  id: string;
  status: string;
  note: string | null;
  createdAt: string | null;
}

interface OrderPaymentItem {
  id: string;
  type: string;
  amount: number;
  status: string;
  dueDate: string | null;
}

interface SalesOrderDetail {
  id: string;
  documentNumber: string;
  moduleStatus: string;
  overallStatus: string;
  totalValue: number;
  advancePaidAmount: number;
  balanceDueAmount: number;
  requestedDeliveryDate: string | null;
  deliveryAddress: string | null;
  customer: { title: string } | null;
  timeline: OrderTimelineItem[];
  payments: OrderPaymentItem[];
}

interface SalesOrderListItem {
  id: string;
  documentNumber: string;
  moduleStatus: string;
  totalValue: number;
  requestedDeliveryDate: string | null;
  status?: string;
  createdAt?: string;
}

interface OrdersListResponse {
  data: SalesOrderListItem[];
  total: number;
}

/** 360° order header (GET /api/sd/orders/:id) — the fields the clone reuses. */
interface SalesOrderHeader {
  id: number;
  orderNumber: string;
  companyId: number;
  totalAmount: number;
}

/** One persisted line read from GET /api/sd/orders/:id/items (VISION-3340 #53 clone). */
interface SalesOrderItemRow {
  id: number;
  itemNumber: string;
  productId: number | null;
  materialId: number | null;
  materialNumber: string | null;
  description: string;
  orderQuantity: number;
  unit: string;
  netPrice: number;
  totalPrice: number;
}

interface CustomerItem {
  id: number;
  name?: string;
  title?: string;
}

/** EP-PP-066 ATP check — see apps/api/src/modules/sd/application/queries/atp-check.handler.ts */
type AtpLineStatus = "in_stock" | "short" | "unknown_product";

interface AtpLineResult {
  productId: number;
  productName: string | null;
  unit: string | null;
  demand: number;
  available: number;
  shortage: number;
  leadTimeDays: number;
  leadTimeIsDefault: boolean;
  status: AtpLineStatus;
  availableOn: string;
}

interface AtpCheckResult {
  orderId: number | null;
  overallStatus: AtpLineStatus;
  estimatedReadyDate: string;
  estimatedReadyInDays: number;
  allInStock: boolean;
  lines: AtpLineResult[];
}

const ATP_STATUS_LABELS: Record<AtpLineStatus, string> = {
  in_stock: tLabel("sd.orders.atpInStock", "Omborda bor"),
  short: tLabel("sd.orders.atpShort", "Yetishmaydi"),
  unknown_product: tLabel("sd.orders.atpUnknown", "Mahsulot topilmadi"),
};

const ATP_STATUS_CLASSES: Record<AtpLineStatus, string> = {
  in_stock: "bg-green-100 text-green-800",
  short: "bg-amber-100 text-amber-800",
  unknown_product: "bg-red-100 text-red-800",
};

function AtpStatusIcon({ status }: { status: AtpLineStatus }) {
  if (status === "in_stock") return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (status === "short") return <Clock className="w-3.5 h-3.5" />;
  return <AlertTriangle className="w-3.5 h-3.5" />;
}

const NEXT_STATUS: Record<string, string> = {
  sales: "design",
  design: "tech",
  tech: "pp",
  pp: "production",
  production: "qc",
  qc: "warehouse",
  warehouse: "delivery",
  delivery: "finance",
  finance: "closed",
};

const STATUS_LABELS: Record<string, string> = {
  sales: tLabel("sd.orders.statusSales", "Sotuv"),
  design: tLabel("sd.orders.statusDesign", "Dizayn"),
  tech: tLabel("sd.orders.statusTech", "Texnolog"),
  pp: tLabel("sd.orders.statusPp", "Rejalashtirish"),
  production: tLabel("sd.orders.statusProduction", "Ishlab chiqarish"),
  qc: tLabel("sd.orders.statusQc", "Sifat nazorati"),
  warehouse: tLabel("sd.orders.statusWarehouse", "Tayyor mahsulot"),
  delivery: tLabel("sd.orders.statusDelivery", "Yetkazib berish"),
  finance: tLabel("sd.orders.statusFinance", "To'lov/Yopish"),
  closed: tLabel("sd.orders.statusClosed", "Yopilgan"),
  cancelled: tLabel("sd.orders.statusCancelled", "Bekor qilingan")
};

const STATUS_COLORS: Record<string, string> = {
  sales: "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold",
  design: "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold",
  tech: "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold",
  pp: "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  production: "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  qc: "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold",
  warehouse: "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  delivery: "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  finance: "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  closed: "bg-muted/40 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold",
  cancelled: "bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold",
};

const CURRENCIES = ["UZS", "USD", "EUR"] as const;

const EMPTY_ORDER_FORM = {
  companyId: "",
  totalAmount: "",
  currency: "UZS" as string,
  designFlag: false,
  sampleFlag: false,
  items: [] as Array<{ productId: string; description: string; orderQuantity: string; unit: string; netPrice: string }>,
};

export default function SDSalesOrders() {
  const { t } = useTranslation("common");
  const { isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<SalesOrderListItem | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({ ...EMPTY_ORDER_FORM });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  // VISION-3340 #53 "Takrorlash": clone an existing order into a new one.
  const [repeatSourceId, setRepeatSourceId] = useState<string | null>(null);
  const [repeatDialog, setRepeatDialog] = useState(false);
  const [repeatForm, setRepeatForm] = useState<typeof EMPTY_ORDER_FORM | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<OrdersListResponse>({
    queryKey: ["/api/sd/orders", statusFilter, search, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("limit", String(pageSize));
      params.set("offset", String((page - 1) * pageSize));
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.set("search", search);
      return apiRequest("GET", `/api/sd/orders?${params}`);
    },
  });

  const { data: detail } = useQuery<SalesOrderDetail>({
    queryKey: ["/api/sd/orders", selected?.id],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${selected?.id}`),
    enabled: !!selected?.id,
  });

  // Clone source: the header (companyId) + the REAL line-items of the order being repeated.
  const { data: repeatSrc, isLoading: repeatSrcLoading } = useQuery<SalesOrderHeader>({
    queryKey: ["/api/sd/orders", repeatSourceId, "repeat-src"],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${repeatSourceId}`),
    enabled: repeatDialog && !!repeatSourceId,
  });
  const { data: repeatItems, isLoading: repeatItemsLoading } = useQuery<SalesOrderItemRow[]>({
    queryKey: ["/api/sd/orders", repeatSourceId, "items"],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${repeatSourceId}/items`),
    enabled: repeatDialog && !!repeatSourceId,
  });

  const { data: customersData } = useQuery<unknown>({
    queryKey: ["/api/sd/customers", "dropdown"],
    queryFn: () => apiRequest("GET", "/api/sd/customers?limit=200"),
    enabled: isAuthenticated === true,
  });
  const _cd = customersData as Record<string, unknown> | CustomerItem[] | null | undefined;
  const customers: CustomerItem[] = Array.isArray(_cd)
    ? (_cd as CustomerItem[])
    : Array.isArray((_cd as Record<string, unknown>)?.["items"])
    ? ((_cd as Record<string, unknown>)["items"] as CustomerItem[])
    : Array.isArray((_cd as Record<string, unknown>)?.["data"])
    ? ((_cd as Record<string, unknown>)["data"] as CustomerItem[])
    : [];

  const statusMut = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      apiRequest("PATCH", `/api/sd/orders/${id}/status`, { status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      if (selected?.id) qc.invalidateQueries({ queryKey: ["/api/sd/orders", selected.id] });
      toast({ title: tLabel("sd.orders.statusUpdated", "Holat yangilandi") });
    },
    onError: () => toast({ title: tLabel("sd.orders.error", "Xatolik"), variant: "destructive" }),
  });

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest("PATCH", `/api/sd/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ title: tLabel("sd.orders.cancelled", "Bekor qilindi") });
      setCancelDialogOpen(false);
      setCancelReason("");
    },
    onError: () => toast({ title: tLabel("sd.orders.error", "Xatolik"), variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: (body: typeof EMPTY_ORDER_FORM) => {
      // camelCase to match the BE Zod DTO (companyId/items). When lines exist the order total
      // is derived from them; otherwise the manual total is used.
      const lines = body.items.filter(it => it.productId);
      const linesSum = lines.reduce((s, it) => s + (Number(it.orderQuantity) || 0) * (Number(it.netPrice) || 0), 0);
      return apiRequest("POST", "/api/sd/orders", {
        companyId: Number(body.companyId),
        totalAmount: lines.length > 0 ? linesSum : Number(body.totalAmount),
        currency: body.currency,
        designFlag: body.designFlag,
        sampleFlag: body.sampleFlag,
        items: lines.map(it => ({
          productId: Number(it.productId),
          description: it.description || "Mahsulot",
          orderQuantity: Number(it.orderQuantity) || 0,
          unit: it.unit || "PC",
          netPrice: Number(it.netPrice) || 0,
        })),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      setCreateDialog(false);
      setOrderForm({ ...EMPTY_ORDER_FORM });
      // Shared by the "Takrorlash"/clone flow — close its dialog + clear its prefill too.
      setRepeatDialog(false);
      setRepeatSourceId(null);
      setRepeatForm(null);
      toast({ title: tLabel("sd.orders.created", "Buyurtma yaratildi") });
    },
    onError: () => toast({ title: tLabel("sd.orders.error", "Xatolik"), variant: "destructive" }),
  });

  const orders = Array.isArray(data?.data) ? data.data : [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // STEP 4 — finished-goods catalog for the line-item picker. Empty until the owner adds products.
  const { data: productsData } = useQuery<{ data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>({
    queryKey: ["/api/erp/products"],
    enabled: createDialog,
  });
  const products: Array<Record<string, unknown>> = Array.isArray((productsData as { data?: unknown[] })?.data)
    ? (productsData as { data: Array<Record<string, unknown>> }).data
    : (Array.isArray(productsData) ? (productsData as Array<Record<string, unknown>>) : []);
  const orderLines = orderForm.items;
  const linesTotal = orderLines.reduce((s, it) => s + (Number(it.orderQuantity) || 0) * (Number(it.netPrice) || 0), 0);

  // EP-PP-066 — ATP (Available-To-Promise) preview: as soon as the line-items have a product +
  // quantity, ask the backend for real stock/estimated-ready-date before the order is saved.
  const atpItems = (Array.isArray(orderLines) ? orderLines : [])
    .filter(it => it.productId && Number(it.orderQuantity) > 0)
    .map(it => ({ productId: Number(it.productId), quantity: Number(it.orderQuantity) }));
  const atpKey = atpItems.map(it => `${it.productId}:${it.quantity}`).join(",");

  const { data: atpResult, isFetching: atpLoading } = useQuery<AtpCheckResult>({
    queryKey: ["/api/sd/orders/atp-check", atpKey],
    queryFn: () => apiRequest("POST", "/api/sd/orders/atp-check", { items: atpItems }),
    enabled: createDialog && atpItems.length > 0,
    staleTime: 0,
  });
  const atpLineByProduct = new Map<number, AtpLineResult>(
    (Array.isArray(atpResult?.lines) ? atpResult.lines : []).map(l => [l.productId, l]),
  );

  // Clone prefill: once both the source header + its REAL items are loaded, map each
  // sales_order_items row into the create-order form shape (product_id → productId,
  // net_price → netPrice, ...). Only product-bound lines are kept — the create flow
  // (and its Zod DTO) require a positive productId per line.
  const repeatLinesTotal = (Array.isArray(repeatForm?.items) ? repeatForm!.items : [])
    .reduce((s, it) => s + (Number(it.orderQuantity) || 0) * (Number(it.netPrice) || 0), 0);

  useEffect(() => {
    if (!repeatDialog || repeatForm) return;
    if (!repeatSrc || !Array.isArray(repeatItems)) return;
    const lines = (Array.isArray(repeatItems) ? repeatItems : [])
      .map(it => ({
        productId: it.productId != null ? String(it.productId) : (it.materialId != null ? String(it.materialId) : ""),
        description: it.description || "",
        orderQuantity: String(it.orderQuantity ?? ""),
        unit: it.unit || "dona",
        netPrice: String(it.netPrice ?? ""),
      }))
      .filter(l => l.productId);
    setRepeatForm({
      companyId: repeatSrc.companyId != null ? String(repeatSrc.companyId) : "",
      totalAmount: "",
      currency: "UZS", // source order currency is not exposed by the 360° header — user confirms
      designFlag: false,
      sampleFlag: false,
      items: lines,
    });
  }, [repeatDialog, repeatForm, repeatSrc, repeatItems]);

  function openRepeat(id: string) {
    setRepeatForm(null); // clear any prior prefill so the effect rebuilds for this order
    setRepeatSourceId(id);
    setRepeatDialog(true);
  }
  function closeRepeat() {
    setRepeatDialog(false);
    setRepeatSourceId(null);
    setRepeatForm(null);
  }
  function updateRepeatLine(idx: number, patch: Partial<(typeof EMPTY_ORDER_FORM)["items"][number]>) {
    setRepeatForm(f => (f ? { ...f, items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) } : f));
  }
  function removeRepeatLine(idx: number) {
    setRepeatForm(f => (f ? { ...f, items: f.items.filter((_, i) => i !== idx) } : f));
  }

  function addLine() {
    setOrderForm(f => ({ ...f, items: [...f.items, { productId: "", description: "", orderQuantity: "1", unit: "PC", netPrice: "0" }] }));
  }
  function removeLine(idx: number) {
    setOrderForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }
  function updateLine(idx: number, patch: Partial<(typeof EMPTY_ORDER_FORM)["items"][number]>) {
    setOrderForm(f => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("savdoBuyurtmalari")}</b></>}
        title={t("savdoBuyurtmalari")}
        subtitle="13 bosqichli buyurtma zanjiri boshqaruvi"
      />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder={tLabel("sd.orders.buyurtmaQidirish", "Buyurtma qidirish...")}
          />
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-48 bg-card border-border h-9" data-testid="select-order-status-filter">
              <SelectValue placeholder={t("barchaHolat")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Barchasi")}</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialog(true)} className="gap-1.5" data-testid="btn-new-order">
            <Plus className="h-4 w-4" />
            {tLabel("sd.orders.yangiBuyurtma", "Yangi buyurtma")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-260px)]">
        {/* Order list */}
        <div className="w-full lg:w-80 flex flex-col gap-2 shrink-0 overflow-y-auto">
          {isLoading && <div className="text-sm text-muted-foreground p-2">{t("Yuklanmoqda...")}</div>}
          {(Array.isArray(orders) ? orders : []).map((o) => (
              <div key={o.id} data-testid={`card-order-${o.id}`}
                className={`p-3 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors ${selected?.id === o.id ? "bg-muted/40 border-primary" : ""}`}
                onClick={() => setSelected(o)}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-bold text-foreground">{o.documentNumber}</span>
                  <span className={STATUS_COLORS[o.moduleStatus] || STATUS_COLORS[o.status || ""] || ""}>
                    {STATUS_LABELS[o.moduleStatus] || STATUS_LABELS[o.status || ""] || o.moduleStatus}
                  </span>
                </div>
                <div className="text-sm font-bold text-foreground">{fmt(o.totalValue)} so'm</div>
                <div className="text-xs text-muted-foreground font-medium">
                  {o.requestedDeliveryDate || (o.createdAt ? new Date(o.createdAt).toLocaleDateString("uz-UZ") : "Sana belgilanmagan")}
                </div>
              </div>
          ))}
          {!isLoading && orders.length === 0 && (
            <div className="text-sm text-center text-muted-foreground py-4">{t("buyurtmalarYoq")}</div>
          )}
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              {t("buyurtmaniTanlang")}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-card rounded-xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div>
                    <h2 className="text-lg font-bold font-mono">{detail?.documentNumber || selected.documentNumber}</h2>
                    <div className="text-sm text-muted-foreground">{detail?.customer?.title || "Mijoz ma'lumoti yo'q"}</div>
                  </div>
                  <span className={STATUS_COLORS[detail?.moduleStatus || selected.moduleStatus]}>
                    {STATUS_LABELS[detail?.moduleStatus || selected.moduleStatus]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <div><div className="text-xs text-muted-foreground uppercase">{t("total")}</div>
                    <div className="font-bold text-lg">{fmt(detail?.totalValue || selected.totalValue)} so'm</div></div>
                  <div><div className="text-xs text-muted-foreground uppercase">{t("toLandiAvans")}</div>
                    <div className="font-bold text-lg text-[var(--ep-green)]">{fmt(detail?.advancePaidAmount || 0)} so'm</div></div>
                  <div><div className="text-xs text-muted-foreground uppercase">{t("qoldiq")}</div>
                    <div className="font-bold text-lg text-[var(--ep-red)]">{fmt(detail?.balanceDueAmount || 0)} so'm</div></div>
                </div>
                <div className="mt-4 space-y-2">
                  {detail?.requestedDeliveryDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />Yetkazish: {detail.requestedDeliveryDate}
                    </div>
                  )}
                  {detail?.deliveryAddress && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />{detail.deliveryAddress}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap pt-4 mt-4 border-t">
                  <Link href={`/sd/orders/${selected.id}`}>
                    <Button size="sm" variant="outline" data-testid={`button-open-order-${selected.id}`}>
                      <ArrowRight className="w-3 h-3 mr-1" />
                      {tLabel("sd.orders.fullPage", "Alohida sahifada")}
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" data-testid={`button-repeat-order-${selected.id}`}
                    onClick={() => openRepeat(selected.id)}>
                    <Copy className="w-3 h-3 mr-1" />
                    {tLabel("sd.orders.takrorlash", "Takrorlash")}
                  </Button>
                  {detail?.moduleStatus && NEXT_STATUS[detail.moduleStatus] && (
                    <Button size="sm" data-testid={`button-next-status-${detail.id}`}
                      onClick={() => statusMut.mutate({ id: detail.id, status: NEXT_STATUS[detail.moduleStatus] })}
                      disabled={statusMut.isPending}>
                      <ArrowRight className="w-3 h-3 mr-1" />
                      {STATUS_LABELS[NEXT_STATUS[detail.moduleStatus]]}
                    </Button>
                  )}
                  {detail?.overallStatus !== "CANCELLED" && detail?.overallStatus !== "COMPLETED" && (
                    <Button size="sm" variant="outline" className="text-[var(--ep-red)]"
                      data-testid={`button-cancel-order-${detail?.id}`}
                      onClick={() => {
                        setCancelReason("");
                        setCancelDialogOpen(true);
                      }}>
                      {t("cancel")}
                    </Button>
                  )}
                </div>
              </div>

              {(detail?.timeline?.length ?? 0) > 0 && (
                <div className="bg-card rounded-xl p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t("holatTarixi")}</h3>
                  <div className="space-y-4">
                    {detail?.timeline?.map((tl) => (
                      <div key={tl.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          <div className="flex-1">
                            <span className={STATUS_COLORS[tl.status] || "bg-muted/40 rounded-full px-2.5 py-0.5 text-xs font-semibold"}>
                              {STATUS_LABELS[tl.status] || tl.status}
                            </span>
                            {tl.note && <div className="text-xs text-muted-foreground mt-1">{tl.note}</div>}
                          </div>
                        <div className="text-xs text-muted-foreground shrink-0">{tl.createdAt?.slice(0, 16).replace("T", " ")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(detail?.payments?.length ?? 0) > 0 && (
                <div className="bg-card rounded-xl p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t("tolovlar")}</h3>
                  <div className="space-y-2">
                    {detail?.payments?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div>
                          <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold mr-2",
                            p.status === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {p.type === "advance" ? tLabel("sd.orders.payAdvance", "Avans") : p.type === "balance" ? tLabel("sd.orders.payBalance", "Qoldiq") : tLabel("sd.orders.payPartial", "Qisman")}
                          </span>
                          {p.dueDate && <span className="text-muted-foreground text-xs">{tLabel("sd.orders.dueLabel", "Muddat")}: {p.dueDate}</span>}
                        </div>
                        <div className="font-semibold">{fmt(p.amount)} {tLabel("sd.orders.currencySom", "so'm")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
        />
      )}

      {/* Create order dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{tLabel("sd.orders.yangiBuyurtma", "Yangi buyurtma")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{tLabel("sd.orders.mijozKompaniya", "Mijoz (kompaniya)")}</Label>
              <Select value={orderForm.companyId} onValueChange={v => setOrderForm(f => ({ ...f, companyId: v }))}>
                <SelectTrigger className="h-9" data-testid="select-order-company">
                  <SelectValue placeholder={tLabel("sd.orders.mijozniTanlang", "Mijozni tanlang")} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(customers) ? customers : []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name || c.title || `Mijoz #${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{tLabel("sd.orders.umumiySumma", "Umumiy summa")}</Label>
              <Input
                type="number"
                value={orderForm.totalAmount}
                onChange={e => setOrderForm(f => ({ ...f, totalAmount: e.target.value }))}
                placeholder="0"
                data-testid="input-order-amount"
              />
            </div>
            <div>
              <Label>{tLabel("sd.orders.valyuta", "Valyuta")}</Label>
              <Select value={orderForm.currency} onValueChange={v => setOrderForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger className="h-9" data-testid="select-order-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* STEP 4 — Buyurtma qatorlari (tayyor mahsulotlar) */}
            <div className="space-y-2 pt-2 border-t border-border mt-1">
              <div className="flex items-center justify-between">
                <Label>{tLabel("sd.orders.qatorlar", "Buyurtma qatorlari (mahsulotlar)")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}
                  disabled={products.length === 0} data-testid="btn-add-line">
                  + {tLabel("sd.orders.qator", "Qator")}
                </Button>
              </div>
              {products.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {tLabel("sd.orders.mahsulotYoq", "Mahsulot katalogi bo'sh — avval mahsulot qo'shing.")}
                </p>
              )}
              {(Array.isArray(orderLines) ? orderLines : []).map((line, idx) => {
                const lineTotal = (Number(line.orderQuantity) || 0) * (Number(line.netPrice) || 0);
                const atpLine = line.productId ? atpLineByProduct.get(Number(line.productId)) : undefined;
                return (
                  <div key={idx} className="space-y-1" data-testid={`order-line-${idx}`}>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Select value={line.productId} onValueChange={v => {
                          const p = products.find(pr => String(pr.id) === v);
                          updateLine(idx, { productId: v, description: String(p?.name ?? p?.description ?? "") });
                        }}>
                          <SelectTrigger className="h-9"><SelectValue placeholder={tLabel("sd.orders.mahsulot", "Mahsulot")} /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={String(p.id)} value={String(p.id)}>{String(p.name ?? p.code ?? p.id)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input className="w-20" type="number" value={line.orderQuantity}
                        onChange={e => updateLine(idx, { orderQuantity: e.target.value })} placeholder={tLabel("sd.orders.soni", "Soni")} data-testid={`line-qty-${idx}`} />
                      <Input className="w-16" value={line.unit}
                        onChange={e => updateLine(idx, { unit: e.target.value })} placeholder={tLabel("sd.orders.birlik", "Birlik")} />
                      <Input className="w-24" type="number" value={line.netPrice}
                        onChange={e => updateLine(idx, { netPrice: e.target.value })} placeholder={tLabel("sd.orders.narx", "Narx")} data-testid={`line-price-${idx}`} />
                      <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">{lineTotal.toLocaleString()}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)} data-testid={`btn-remove-line-${idx}`}>✕</Button>
                    </div>
                    {line.productId && Number(line.orderQuantity) > 0 && (
                      <div className="pl-1" data-testid={`atp-line-${idx}`}>
                        {atpLoading && !atpLine ? (
                          <span className="text-xs text-muted-foreground">{tLabel("sd.orders.atpTekshirilmoqda", "Mavjudlik tekshirilmoqda...")}</span>
                        ) : atpLine ? (
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", ATP_STATUS_CLASSES[atpLine.status])}>
                            <AtpStatusIcon status={atpLine.status} />
                            {ATP_STATUS_LABELS[atpLine.status]}
                            {atpLine.status === "short" && (
                              <span>
                                {" "}({tLabel("sd.orders.atpYetmaydi", "yetmaydi")}: {atpLine.shortage} {atpLine.unit || ""} —{" "}
                                {tLabel("sd.orders.atpTayyor", "tayyor")}: {atpLine.availableOn})
                              </span>
                            )}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
              {atpResult && (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 mt-1" data-testid="atp-order-summary">
                  <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", ATP_STATUS_CLASSES[atpResult.overallStatus].replace("bg-", "text-").split(" ")[0])}>
                    <AtpStatusIcon status={atpResult.overallStatus} />
                    {ATP_STATUS_LABELS[atpResult.overallStatus]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {atpResult.allInStock
                      ? tLabel("sd.orders.atpBugun", "Bugun tayyor")
                      : `${tLabel("sd.orders.atpTaxminiySana", "Taxminiy tayyor sana")}: ${atpResult.estimatedReadyDate} (${atpResult.estimatedReadyInDays} ${tLabel("sd.orders.kun", "kun")})`}
                  </span>
                </div>
              )}
              {orderLines.length > 0 && (
                <div className="flex justify-end text-sm font-medium pt-1">
                  {tLabel("sd.orders.qatorlarJami", "Qatorlar jami")}: {linesTotal.toLocaleString()} {orderForm.currency}
                </div>
              )}
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="design-flag"
                  checked={orderForm.designFlag}
                  onCheckedChange={v => setOrderForm(f => ({ ...f, designFlag: !!v }))}
                  data-testid="check-design-flag"
                />
                <Label htmlFor="design-flag" className="font-normal cursor-pointer">
                  {tLabel("sd.orders.dizaynKerak", "Dizayn kerak")}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sample-flag"
                  checked={orderForm.sampleFlag}
                  onCheckedChange={v => setOrderForm(f => ({ ...f, sampleFlag: !!v }))}
                  data-testid="check-sample-flag"
                />
                <Label htmlFor="sample-flag" className="font-normal cursor-pointer">
                  {tLabel("sd.orders.namunaKerak", "Namuna kerak")}
                </Label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setCreateDialog(false)}>
                {t("cancel")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => createMut.mutate(orderForm)}
                disabled={!orderForm.companyId || createMut.isPending}
                data-testid="btn-save-order"
              >
                {createMut.isPending ? tLabel("sd.orders.saving", "Saqlanmoqda...") : tLabel("sd.orders.saqlash", "Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={(open) => { setCancelDialogOpen(open); if (!open) setCancelReason(""); }}>
        <DialogContent data-testid="dialog-cancel-order">
          <DialogHeader>
            <DialogTitle>{tLabel("sd.orders.cancelReasonPrompt", "Bekor qilish sababi")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">{tLabel("sd.orders.cancelReasonPrompt", "Bekor qilish sababi:")}</Label>
              <Textarea
                id="cancel-reason"
                data-testid="input-cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCancelDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                data-testid="button-confirm-cancel-order"
                disabled={!cancelReason.trim() || cancelMut.isPending || !detail}
                onClick={() => { if (detail && cancelReason.trim()) cancelMut.mutate({ id: detail.id, reason: cancelReason.trim() }); }}
              >
                {cancelMut.isPending ? tLabel("sd.orders.saving", "Saqlanmoqda...") : tLabel("sd.orders.confirm", "Tasdiqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Takrorlash / clone order dialog (VISION-3340 #53) */}
      <Dialog open={repeatDialog} onOpenChange={(open) => { if (!open) closeRepeat(); else setRepeatDialog(true); }}>
        <DialogContent data-testid="dialog-repeat-order">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {tLabel("sd.orders.takrorlashSarlavha", "Buyurtmani takrorlash")}
            </DialogTitle>
          </DialogHeader>
          {(repeatSrcLoading || repeatItemsLoading) && !repeatForm ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {tLabel("sd.orders.takrorlashYuklanmoqda", "Manba buyurtma yuklanmoqda...")}
            </div>
          ) : repeatForm ? (
            <div className="space-y-3">
              {repeatSrc?.orderNumber && (
                <p className="text-xs text-muted-foreground">
                  {tLabel("sd.orders.takrorlashManba", "Manba buyurtma")}:{" "}
                  <span className="font-mono text-foreground">{repeatSrc.orderNumber}</span>
                </p>
              )}
              <div>
                <Label>{tLabel("sd.orders.mijozKompaniya", "Mijoz (kompaniya)")}</Label>
                <Select value={repeatForm.companyId} onValueChange={v => setRepeatForm(f => (f ? { ...f, companyId: v } : f))}>
                  <SelectTrigger className="h-9" data-testid="select-repeat-company">
                    <SelectValue placeholder={tLabel("sd.orders.mijozniTanlang", "Mijozni tanlang")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(customers) ? customers : []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name || c.title || `Mijoz #${c.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{tLabel("sd.orders.valyuta", "Valyuta")}</Label>
                <Select value={repeatForm.currency} onValueChange={v => setRepeatForm(f => (f ? { ...f, currency: v } : f))}>
                  <SelectTrigger className="h-9" data-testid="select-repeat-currency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 pt-2 border-t border-border mt-1">
                <Label>{tLabel("sd.orders.qatorlar", "Buyurtma qatorlari (mahsulotlar)")}</Label>
                {repeatForm.items.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {tLabel("sd.orders.takrorlashQatorYoq", "Manba buyurtmada nusxalanadigan mahsulot qatori yo'q.")}
                  </p>
                )}
                {(Array.isArray(repeatForm.items) ? repeatForm.items : []).map((line, idx) => {
                  const lineTotal = (Number(line.orderQuantity) || 0) * (Number(line.netPrice) || 0);
                  return (
                    <div key={idx} className="flex items-end gap-2" data-testid={`repeat-line-${idx}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{line.description || `#${line.productId}`}</div>
                      </div>
                      <Input className="w-20" type="number" value={line.orderQuantity}
                        onChange={e => updateRepeatLine(idx, { orderQuantity: e.target.value })}
                        placeholder={tLabel("sd.orders.soni", "Soni")} data-testid={`repeat-qty-${idx}`} />
                      <Input className="w-16" value={line.unit}
                        onChange={e => updateRepeatLine(idx, { unit: e.target.value })}
                        placeholder={tLabel("sd.orders.birlik", "Birlik")} />
                      <Input className="w-24" type="number" value={line.netPrice}
                        onChange={e => updateRepeatLine(idx, { netPrice: e.target.value })}
                        placeholder={tLabel("sd.orders.narx", "Narx")} data-testid={`repeat-price-${idx}`} />
                      <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">{lineTotal.toLocaleString()}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeRepeatLine(idx)} data-testid={`repeat-remove-${idx}`}>✕</Button>
                    </div>
                  );
                })}
                {repeatForm.items.length > 0 && (
                  <div className="flex justify-end text-sm font-medium pt-1">
                    {tLabel("sd.orders.qatorlarJami", "Qatorlar jami")}: {repeatLinesTotal.toLocaleString()} {repeatForm.currency}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={closeRepeat}>
                  {t("cancel")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => { if (repeatForm) createMut.mutate(repeatForm); }}
                  disabled={!repeatForm.companyId || repeatForm.items.length === 0 || createMut.isPending}
                  data-testid="btn-save-repeat-order"
                >
                  {createMut.isPending ? tLabel("sd.orders.saving", "Saqlanmoqda...") : tLabel("sd.orders.takrorlashYaratish", "Nusxa yaratish")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {tLabel("sd.orders.takrorlashYuklanmoqda", "Manba buyurtma yuklanmoqda...")}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
