/**
 * @module PaymentsTab
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import { 
  SdPayment, SdOrder, 
  fmt, PAYMENT_STATUS_COLORS 
} from "./types";

import { tLabel } from '@/lib/i18n/tLabel';
export function PaymentsTab() {
  const { t } = useTranslation("common");
  const [tab, setTab] = useState<"all" | "overdue" | "debitors">("all");
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ orderId: "", customerId: "", amount: "", type: "advance", dueDate: "", notes: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<SdPayment[]>({
    queryKey: ["/api/sd/payments", tab],
    queryFn: () => {
      if (tab === "overdue") return apiRequest("GET", "/api/sd/payments/overdue");
      if (tab === "debitors") return apiRequest("GET", "/api/sd/payments/debitors");
      return apiRequest("GET", "/api/sd/payments");
    },
  });

  const { data: orders } = useQuery<{ data: SdOrder[] }>({
    queryKey: ["/api/sd/orders"],
    queryFn: () => apiRequest("GET", "/api/sd/orders?limit=100"),
  });

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/sd/payments", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/payments"] });
      setIsNew(false);
      toast({ title: "To'lov kiritildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const markPaidMut = useMutation({
    mutationFn: (id: string | number) => apiRequest("PUT", `/api/sd/payments/${id}`, { status: "paid", paidDate: new Date().toISOString().split("T")[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ title: "To'lov tasdiqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {(["all", "overdue", "debitors"] as const).map(t => (
            <Button key={t} size="sm" variant={tab === t ? "default" : "outline"}
              data-testid={`button-payments-tab-${t}`}
              onClick={() => setTab(t)}>
              {t === "all" ? "Barchasi" : t === "overdue" ? "Muddati o'tgan" : "Debitorlar"}
            </Button>
          ))}
        </div>
        <Dialog open={isNew} onOpenChange={setIsNew}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-payment"><Plus className="w-4 h-4 mr-1" />{t("tolovKiritish")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("tolovKiritish")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("Buyurtma")}</Label>
                <Select value={form.orderId} onValueChange={v => {
                  const o = orders?.data?.find((o: SdOrder) => String(o.id) === v);
                  setForm({ ...form, orderId: v, customerId: String(o?.customerId || "") });
                }}>
                  <SelectTrigger data-testid="select-payment-order" className="h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    {orders?.data?.map((o: SdOrder) => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.orderNumber} — {fmt(o.totalAmount)} so'm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{tLabel('common.PaymentsTab.summaSom', "Summa (so'm)")}</Label>
                <Input data-testid="input-payment-amount" type="number" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>{t("tur")}</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger data-testid="select-payment-type" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advance">{t("avans")}</SelectItem>
                    <SelectItem value="balance">{t("qoldiq")}</SelectItem>
                    <SelectItem value="partial">{t("qisman")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("muddat")}</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
              <div><Label>{t("Izoh")}</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button data-testid="button-save-payment" className="w-full"
                onClick={() => createMut.mutate({ ...form, amount: parseFloat(form.amount) || 0 })}
                disabled={!form.orderId || !form.amount || createMut.isPending}>
                {createMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tab === "debitors" ? (
        <div className="space-y-2">
          {isLoading && <div className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</div>}
          {(Array.isArray(payments) ? payments : []).map((d: SdPayment, i: number) => (
            <Card key={`k-${i}`} data-testid={`card-debitor-${d.customerId}`}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm font-medium">Mijoz ID: {d.customerId}</div>
                <div className="flex gap-4 text-sm">
                  <div><span className="text-muted-foreground">0-30 kun:</span> <strong>{fmt(d["0-30"] ?? 0)} so'm</strong></div>
                  <div><span className="text-muted-foreground">31-60:</span> <strong>{fmt(d["31-60"] ?? 0)} so'm</strong></div>
                  <div><span className="text-muted-foreground">61-90:</span> <strong>{fmt(d["61-90"] ?? 0)} so'm</strong></div>
                  <div><span className="text-muted-foreground">90+:</span> <strong>{fmt(d["90+"] ?? 0)} so'm</strong></div>
                </div>
                <div className="font-bold text-[var(--ep-red)]">{fmt(d.total ?? 0)} so'm</div>
              </CardContent>
            </Card>
          ))}
          {!isLoading && payments.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">{t("debitorlarYoq")}</div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {isLoading && <div className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</div>}
          {(Array.isArray(payments) ? payments : []).map((p: SdPayment) => (
            <Card key={p.id} data-testid={`card-payment-${p.id}`}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-sm font-medium">
                    {p.type === "advance" ? "Avans" : p.type === "balance" ? "Qoldiq" : "Qisman"} to'lov
                  </div>
                  {p.dueDate && <div className="text-xs text-muted-foreground">Muddat: {p.dueDate}</div>}
                  {p.overdueDays && p.overdueDays > 0 && (
                    <div className="text-xs text-[var(--ep-red)] font-medium">{p.overdueDays} kun kechikdi</div>
                  )}
                </div>
                <div className="font-bold text-lg">{fmt(p.amount || 0)} so'm</div>
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${PAYMENT_STATUS_COLORS[p.status || ""] || ""}`}>
                  {p.status === "pending" ? "Kutilmoqda" : p.status === "paid" ? "To'landi" : p.status === "overdue" ? "Muddati o'tdi" : "Qaytarildi"}
                </span>
                {p.status === "pending" && (
                  <Button size="sm" data-testid={`button-mark-paid-${p.id}`}
                    onClick={() => markPaidMut.mutate(p.id)} disabled={markPaidMut.isPending}>
                    <CheckCircle className="w-3 h-3 mr-1" />{t("tolandi1")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {!isLoading && payments.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">{t("tolovlarYoq")}</div>
          )}
        </div>
      )}
    </div>
  );
}
