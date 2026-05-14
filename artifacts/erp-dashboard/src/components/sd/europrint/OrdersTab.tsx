/**
 * @module OrdersTab
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import { 
  SdOrder, SdOrderTimeline, SdPayment,
  fmt, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS 
} from "./types";

export function OrdersTab() {
  const { t } = useTranslation("common");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<SdOrder | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: SdOrder[] }>({
    queryKey: ["/api/sd/orders", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.append("status", statusFilter);
      return apiRequest("GET", `/api/sd/orders?${params}`);
    },
  });

  const { data: detail } = useQuery<SdOrder>({
    queryKey: ["/api/sd/orders", selected?.id],
    queryFn: () => apiRequest("GET", `/api/sd/orders/${selected?.id}`),
    enabled: !!selected?.id,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status, note }: { id: string | number; status: string; note?: string }) =>
      apiRequest("PATCH", `/api/sd/orders/${id}/status`, { status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      if (selected?.id) queryClient.invalidateQueries({ queryKey: ["/api/sd/orders", selected.id] });
      toast({ title: "Holat yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const orders = data?.data || [];

  const NEXT_STATUS: Record<string, string> = {
    new: "advance_pending",
    advance_pending: "advance_paid",
    advance_paid: "design",
    design: "technologist",
    technologist: "planned",
    planned: "production",
    production: "quality_check",
    quality_check: "in_warehouse",
    in_warehouse: "delivering",
    delivering: "delivered",
    delivered: "closed",
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      <div className="w-80 flex flex-col gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger data-testid="select-order-status-filter" className="h-9"><SelectValue placeholder={t("barchaHolat")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Barchasi")}</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading && <div className="text-sm text-muted-foreground p-2">{t("Yuklanmoqda...")}</div>}
          {(Array.isArray(orders) ? orders : []).map((o: SdOrder) => (
            <div key={o.id} data-testid={`card-order-${o.id}`}
              className={`p-3 rounded-md border cursor-pointer hover-elevate ${selected?.id === o.id ? "bg-primary/5 border-primary/30" : ""}`}
              onClick={() => setSelected(o)}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-mono text-xs font-bold">{o.orderNumber}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${ORDER_STATUS_COLORS[o.status] || ""}`}>
                  {ORDER_STATUS_LABELS[o.status] || o.status}
                </span>
              </div>
              <div className="text-sm font-semibold">{fmt(o.totalAmount)} so'm</div>
              <div className="text-xs text-muted-foreground">{o.deliveryDate || "Sana belgilanmagan"}</div>
            </div>
          ))}
          {!isLoading && orders.length === 0 && (
            <div className="text-sm text-center text-muted-foreground py-4">{t("buyurtmalarYoq")}</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            {t("buyurtmaniTanlang")}
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-bold font-mono">{detail?.orderNumber || selected.orderNumber}</h2>
                    <div className="text-sm text-muted-foreground">
                      {detail?.customer?.name || "Mijoz ma'lumoti yo'q"}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-md font-medium text-sm ${ORDER_STATUS_COLORS[detail?.status || selected.status]}`}>
                    {ORDER_STATUS_LABELS[detail?.status || selected.status]}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-3">
                  <div><div className="text-xs text-muted-foreground">{t("total")}</div>
                    <div className="font-bold">{fmt(detail?.totalAmount || selected.totalAmount)} so'm</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("tolandi1")}</div>
                    <div className="font-bold text-[var(--ep-green)]">{fmt(detail?.advancePaid || 0)} so'm</div></div>
                  <div><div className="text-xs text-muted-foreground">{t("qoldiq")}</div>
                    <div className="font-bold text-[var(--ep-red)]">{fmt(detail?.balanceDue || 0)} so'm</div></div>
                </div>

                {detail?.deliveryDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />Yetkazish: {detail.deliveryDate}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {NEXT_STATUS[detail?.status || selected.status] && (
                    <Button size="sm" data-testid="button-order-next-status"
                      onClick={() => statusMut.mutate({ id: selected.id, status: NEXT_STATUS[detail?.status || selected.status] })}
                      disabled={statusMut.isPending}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {ORDER_STATUS_LABELS[NEXT_STATUS[detail?.status || selected.status]]} ga o'tkazish
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {detail?.timeline && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">{t("tarix")}</h3>
                  <div className="space-y-3">
                    {(Array.isArray(detail.timeline) ? detail.timeline : []).map((t: SdOrderTimeline, i: number) => (
                      <div key={`k-${i}`} className="flex gap-3 text-sm">
                        <div className="w-24 shrink-0 text-xs text-muted-foreground">{t.createdAt?.slice(0, 16).replace("T", " ")}</div>
                        <div>
                          <span className={`text-xs px-1.5 py-0.5 rounded-md mr-2 ${ORDER_STATUS_COLORS[t.status] || ""}`}>
                            {ORDER_STATUS_LABELS[t.status] || t.status}
                          </span>
                          {t.note && <span className="text-muted-foreground">{t.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {detail?.payments && detail.payments.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">{t("tolovlar")}</h3>
                  {(Array.isArray(detail.payments) ? detail.payments : []).map((p: SdPayment) => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md mr-2 ${PAYMENT_STATUS_COLORS[p.status || ""] || ""}`}>
                          {p.type === "advance" ? "Avans" : p.type === "balance" ? "Qoldiq" : "Qisman"}
                        </span>
                        {p.dueDate && <span className="text-muted-foreground text-xs">Muddat: {p.dueDate}</span>}
                      </div>
                      <div className="font-semibold">{fmt(p.amount || 0)} so'm</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
