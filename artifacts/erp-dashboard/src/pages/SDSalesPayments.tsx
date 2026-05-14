/**
 * @module SDSalesPayments
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { CreditCard, Plus, CheckCircle } from "lucide-react";
import { fmt, PAYMENT_STATUS_COLORS } from "@/lib/sd-helpers";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface SalesPayment {
  id: string;
  orderId: string;
  type: string;
  dueDate: string | null;
  overdueDays: number;
  amount: number;
  status: string;
}

interface DebitEntry {
  customerId: string;
  "0-30": number;
  "31-60": number;
  "61-90": number;
  "90+": number;
  total: number;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
}

interface OrdersResponse {
  data: SalesOrder[];
}

type PaymentFormBody = {
  orderId: string;
  customerId: string;
  amount: number;
  type: string;
  dueDate: string;
  notes: string;
};

const PaymentSchema = z.object({
  orderId: z.string().min(1),
  customerId: z.string().optional(),
  amount: z.number().positive(),
  type: z.string().min(1),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export default function SDSalesPayments() {
  const { t } = useTranslation("common");
  const [view, setView] = useState<"all" | "overdue" | "debitors">("all");
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ orderId: "", customerId: "", amount: "", type: "advance", dueDate: "", notes: "" });
  useForm({ resolver: zodResolver(PaymentSchema), defaultValues: { orderId: "", amount: 0, type: "advance" } });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<(SalesPayment | DebitEntry)[]>({
    queryKey: ["/api/sd/payments", view],
    queryFn: () => {
      if (view === "debitors") return apiRequest("GET", "/api/sd/payments/debitors");
      const p = new URLSearchParams({ limit: "50" });
      if (view === "overdue") p.append("status", "overdue");
      return apiRequest("GET", `/api/sd/payments?${p}`);
    },
  });

  const { data: orders } = useQuery<OrdersResponse>({
    queryKey: ["/api/sd/orders"],
    queryFn: () => apiRequest("GET", "/api/sd/orders?limit=100"),
  });

  const createMut = useMutation({
    mutationFn: (body: PaymentFormBody) => apiRequest("POST", "/api/sd/payments", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/payments"] });
      setIsNew(false);
      setForm({ orderId: "", customerId: "", amount: "", type: "advance", dueDate: "", notes: "" });
      toast({ title: "To'lov kiritildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const markPaidMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/sd/payments/${id}/mark-paid`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/sd/payments"] }); toast({ title: "To'landi deb belgilandi" }); },
  });

  const advancePaymentMut = useMutation({
    mutationFn: (orderId: string) => apiRequest("POST", `/api/sd/orders/${orderId}/advance-payment`, { amount: 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/sd/payments"] }); toast({ title: "Avans to'lovi qayd etildi" }); },
  });

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 pb-6 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("tolovlarNazorati")}</b></>}
        title={t("tolovlarNazorati")}
        subtitle={t("avansQoldiqDebitorlikVaAging")}
      />
        </div>
        <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-card">
          {(["all", "overdue", "debitors"] as const).map(v => (
            <button key={v}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${view === v ? "bg-primary text-white font-medium" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setView(v)}>
              {v === "all" ? "Barchasi" : v === "overdue" ? "Muddati o'tganlar" : "Debitorlar"}
            </button>
          ))}
        </div>
        <Dialog open={isNew} onOpenChange={setIsNew}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-payment" className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold">
              <Plus className="w-4 h-4 mr-1" />{t("tolovKiritish")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiTolov")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("Buyurtma")}</Label>
                <Select value={form.orderId} onValueChange={v => setForm({ ...form, orderId: v })}>
                  <SelectTrigger data-testid="select-payment-order" className="h-9"><SelectValue placeholder={t("tanlang")} /></SelectTrigger>
                  <SelectContent>
                    {orders?.data?.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.orderNumber} — {fmt(o.totalAmount)} so'm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("tolovTuri")}</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger data-testid="select-payment-type" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advance">{t("avans")}</SelectItem>
                    <SelectItem value="balance">{t("qoldiq")}</SelectItem>
                    <SelectItem value="partial">{t("qisman")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Summa (so'm) *</Label>
                <Input data-testid="input-payment-amount" type="number" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>{t("tolovMuddati")}</Label>
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

      <div className="space-y-2">
        {isLoading && <div className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</div>}

        {view === "debitors" ? (
          (payments as DebitEntry[]).map((d, i) => (
            <Card key={`k-${i}`} data-testid={`card-debitor-${d.customerId}`}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm font-medium">Mijoz ID: {d.customerId}</div>
                <div className="flex gap-4 text-sm flex-wrap">
                  <div><span className="text-muted-foreground">0-30 kun:</span> <strong>{fmt(d["0-30"])} so'm</strong></div>
                  <div><span className="text-muted-foreground">31-60:</span> <strong>{fmt(d["31-60"])} so'm</strong></div>
                  <div><span className="text-muted-foreground">61-90:</span> <strong>{fmt(d["61-90"])} so'm</strong></div>
                  <div><span className="text-muted-foreground">90+:</span> <strong>{fmt(d["90+"])} so'm</strong></div>
                </div>
                <div className="font-bold text-[var(--ep-red)]">{fmt(d.total)} so'm</div>
              </CardContent>
            </Card>
          ))
        ) : (
          (payments as SalesPayment[]).map((p) => (
            <Card key={p.id} data-testid={`card-payment-${p.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-medium">
                    {p.type === "advance" ? "Avans" : p.type === "balance" ? "Qoldiq" : "Qisman"} to'lov
                  </div>
                  {p.dueDate && <div className="text-xs text-muted-foreground">Muddat: {p.dueDate}</div>}
                  {p.overdueDays > 0 && (
                    <div className="text-xs text-[var(--ep-red)] font-medium">{p.overdueDays} kun kechikdi</div>
                  )}
                </div>
                <div className="font-bold text-lg">{fmt(p.amount)} so'm</div>
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${PAYMENT_STATUS_COLORS[p.status] || ""}`}>
                  {p.status === "pending" ? "Kutilmoqda" : p.status === "paid" ? "To'landi" : p.status === "overdue" ? "Muddati o'tdi" : "Qaytarildi"}
                </span>
                {p.status === "pending" && p.type !== "advance" && (
                  <Button size="sm" variant="outline" data-testid={`button-advance-payment-${p.id}`}
                    onClick={() => advancePaymentMut.mutate(p.orderId)} disabled={advancePaymentMut.isPending}>
                    {t("avans")}
                  </Button>
                )}
                {p.status === "pending" && (
                  <Button size="sm" data-testid={`button-mark-paid-${p.id}`}
                    onClick={() => markPaidMut.mutate(p.id)} disabled={markPaidMut.isPending}>
                    <CheckCircle className="w-3 h-3 mr-1" />{t("tolandi1")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}

        {!isLoading && payments.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            {view === "debitors" ? "Debitorlar yo'q" : "To'lovlar yo'q"}
          </div>
        )}
      </div>
    </div>
  );
}
