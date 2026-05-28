/**
 * @module SDSalesOrders
 * @description React page component. Route-level UI.
 */

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart, ArrowRight, Clock, MapPin, Plus } from "lucide-react";
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

interface CustomerItem {
  id: number;
  name?: string;
  title?: string;
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
  sales: "Sotuv",
  design: "Dizayn",
  tech: "Texnolog",
  pp: "Rejalashtirish",
  production: "Ishlab chiqarish",
  qc: "Sifat nazorati",
  warehouse: "Tayyor mahsulot",
  delivery: "Yetkazib berish",
  finance: "To'lov/Yopish",
  closed: "Yopilgan",
  cancelled: "Bekor qilingan"
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
      toast({ title: "Holat yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest("PATCH", `/api/sd/orders/${id}/cancel`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/sd/orders"] }); toast({ title: "Bekor qilindi" }); },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: (body: typeof EMPTY_ORDER_FORM) =>
      apiRequest("POST", "/api/sd/orders", {
        company_id: Number(body.companyId),
        total_amount: Number(body.totalAmount),
        currency: body.currency,
        design_flag: body.designFlag,
        sample_flag: body.sampleFlag,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      setCreateDialog(false);
      setOrderForm({ ...EMPTY_ORDER_FORM });
      toast({ title: "Buyurtma yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const orders = Array.isArray(data?.data) ? data.data : [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

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

      <div className="flex gap-6 h-[calc(100vh-260px)]">
        {/* Order list */}
        <div className="w-80 flex flex-col gap-2 shrink-0 overflow-y-auto">
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
                        const reason = prompt("Bekor qilish sababi:");
                        if (reason && detail) cancelMut.mutate({ id: detail.id, reason });
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
                            {p.type === "advance" ? "Avans" : p.type === "balance" ? "Qoldiq" : "Qisman"}
                          </span>
                          {p.dueDate && <span className="text-muted-foreground text-xs">Muddat: {p.dueDate}</span>}
                        </div>
                        <div className="font-semibold">{fmt(p.amount)} so'm</div>
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
                {createMut.isPending ? "Saqlanmoqda..." : tLabel("sd.orders.saqlash", "Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
