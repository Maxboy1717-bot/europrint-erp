/**
 * @module SDSalesOrders
 * @description React page component. Route-level UI.
 */

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, ArrowRight, Clock, MapPin } from "lucide-react";
import {
  fmt, PAYMENT_STATUS_COLORS,
} from "@/lib/sd-helpers";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

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
}

interface OrdersListResponse {
  data: SalesOrderListItem[];
  total: number;
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

export default function SDSalesOrders() {
  const { t } = useTranslation("common");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<SalesOrderListItem | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<OrdersListResponse>({
    queryKey: ["/api/sd/orders", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.append("status", statusFilter);
      return apiRequest("GET", `/api/sd/orders?${params}`);
    },
  });

  const { data: detail } = useQuery<SalesOrderDetail>({
    queryKey: ["/api/sd/orders", selected?.id],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${selected?.id}`),
    enabled: !!selected?.id,
  });

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
  });

  const orders = data?.data || [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("savdoBuyurtmalari")}</b></>}
        title={t("savdoBuyurtmalari")}
        subtitle="13 bosqichli buyurtma zanjiri boshqaruvi"
      />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-card border-border h-9" data-testid="select-order-status-filter">
            <SelectValue placeholder={t("barchaHolat")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Barchasi")}</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        <div className="w-80 flex flex-col gap-2 shrink-0 overflow-y-auto">
          {isLoading && <div className="text-sm text-muted-foreground p-2">{t("Yuklanmoqda...")}</div>}
          {(Array.isArray(orders) ? orders : []).map((o) => (
              <div key={o.id} data-testid={`card-order-${o.id}`}
                className={`p-3 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors ${selected?.id === o.id ? "bg-muted/40 border-primary" : ""}`}
                onClick={() => setSelected(o)}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-bold text-foreground">{o.documentNumber}</span>
                  <span className={STATUS_COLORS[o.moduleStatus] || ""}>
                    {STATUS_LABELS[o.moduleStatus] || o.moduleStatus}
                  </span>
                </div>
                <div className="text-sm font-bold text-foreground">{fmt(o.totalValue)} so'm</div>
                <div className="text-xs text-muted-foreground font-medium">{o.requestedDeliveryDate || "Sana belgilanmagan"}</div>
              </div>
          ))}
          {!isLoading && orders.length === 0 && (
            <div className="text-sm text-center text-muted-foreground py-4">{t("buyurtmalarYoq")}</div>
          )}
        </div>

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
                    {detail?.timeline?.map((t) => (
                      <div key={t.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          <div className="flex-1">
                            <span className={STATUS_COLORS[t.status] || "bg-muted/40 rounded-full px-2.5 py-0.5 text-xs font-semibold"}>
                              {STATUS_LABELS[t.status] || t.status}
                            </span>
                            {t.note && <div className="text-xs text-muted-foreground mt-1">{t.note}</div>}
                          </div>
                        <div className="text-xs text-muted-foreground shrink-0">{t.createdAt?.slice(0, 16).replace("T", " ")}</div>
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
    </div>
  );
}
