/**
 * @module SDSalesPayments
 * @description React page component. Route-level UI.
 * Added: Pagination, CSV Export button, Payment detail row-click dialog.
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
import { CreditCard, Plus, CheckCircle, Download } from "lucide-react";
import { fmt, PAYMENT_STATUS_COLORS } from "@/lib/sd-helpers";
import { tLabel } from "@/lib/i18n/tLabel";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";
import { Pagination } from "@/components/Pagination";
import { exportToCSV } from "@/lib/export-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesPayment {
  id: string;
  orderId: string;
  type: string;
  dueDate: string | null;
  paidDate?: string | null;
  overdueDays: number;
  amount: number;
  status: string;
  notes?: string;
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
  advancePaid?: number;
  advanceStatus?: string;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SDSalesPayments() {
  const { t } = useTranslation("common");
  const [view, setView] = useState<"all" | "overdue" | "debitors">("all");
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ orderId: "", customerId: "", amount: "", type: "advance", dueDate: "", notes: "" });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Detail dialog
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; payment?: SalesPayment }>({ open: false });

  // Advance payment dialog
  const [advanceDialog, setAdvanceDialog] = useState<{
    open: boolean;
    orderId: string;
    maxAmount: number;
    amount: string;
  }>({ open: false, orderId: "", maxAmount: 0, amount: "" });

  useForm({ resolver: zodResolver(PaymentSchema), defaultValues: { orderId: "", amount: 0, type: "advance" } });
  const { toast } = useToast();
  const qc = useQueryClient();

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data: paymentsRaw, isLoading } = useQuery({
    queryKey: ["/api/sd/payments", view, page, pageSize],
    queryFn: () => {
      if (view === "debitors") return apiRequest("GET", "/api/sd/payments/debitors");
      const p = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      });
      if (view === "overdue") p.append("status", "overdue");
      return apiRequest("GET", `/api/sd/payments?${p}`);
    },
  });

  const paymentsArr: (SalesPayment | DebitEntry)[] = (() => {
    if (!paymentsRaw) return [];
    if (Array.isArray(paymentsRaw)) return paymentsRaw as (SalesPayment | DebitEntry)[];
    const d = paymentsRaw as { items?: (SalesPayment | DebitEntry)[] };
    return Array.isArray(d.items) ? d.items : [];
  })();

  const paymentsTotal: number = (() => {
    const d = paymentsRaw as { total?: number } | null;
    return d?.total ?? paymentsArr.length;
  })();
  const totalPages = Math.ceil(paymentsTotal / pageSize) || 1;

  // Audit 2026-08-08: tugma avval `window.open("/api/sd/payments/export")` chaqirardi —
  // bunday BE marshrut umuman yo'q edi (404). Sahifa allaqachon `/api/sd/payments`dan
  // haqiqiy ma'lumot yuklaydi (paymentsArr) — shu jonli ro'yxatdan mavjud lib/export-utils.ts
  // (bu sessiyada boshqa 10+ sahifada ishlatilgan real naqsh, rol-darvoza bilan) orqali
  // client-side CSV yasaladi, yangi BE endpoint qurish shart emas.
  const handleExportCsv = () => {
    if (view === "debitors") return;
    exportToCSV(paymentsArr as unknown as Record<string, unknown>[], "sd_tolovlar", [
      { key: "id", label: "ID" },
      { key: "orderId", label: "Buyurtma" },
      { key: "type", label: "Turi" },
      { key: "amount", label: "Summa" },
      { key: "status", label: "Holat" },
      { key: "dueDate", label: "Muddat" },
      { key: "paidDate", label: "To'langan sana" },
      { key: "overdueDays", label: "Kechikkan kun" },
      { key: "notes", label: "Izoh" },
    ]);
  };

  const { data: orders } = useQuery<OrdersResponse>({
    queryKey: ["/api/sd/orders"],
    queryFn: () => apiRequest("GET", "/api/sd/orders?limit=100"),
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const createMut = useMutation({
    mutationFn: (body: PaymentFormBody) => apiRequest("POST", "/api/sd/payments", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/payments"] });
      setIsNew(false);
      setForm({ orderId: "", customerId: "", amount: "", type: "advance", dueDate: "", notes: "" });
      toast({ title: tLabel("sd.payments.created", "To'lov kiritildi") });
    },
    onError: () => toast({ title: tLabel("sd.error", "Xatolik"), variant: "destructive" }),
  });

  const markPaidMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/sd/payments/${id}/mark-paid`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/payments"] });
      toast({ title: tLabel("sd.payments.markedPaid", "To'landi deb belgilandi") });
    },
    onError: () => toast({ title: tLabel("sd.payments.markError", "To'lovni belgilashda xatolik"), variant: "destructive" }),
  });

  const advancePaymentMut = useMutation({
    mutationFn: ({ orderId, amount }: { orderId: string; amount: number }) => {
      const idempotencyKey = crypto.randomUUID();
      return apiRequest("POST", `/api/sd/orders/${orderId}/advance-payment`, { amount, idempotencyKey });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/payments"] });
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      setAdvanceDialog({ open: false, orderId: "", maxAmount: 0, amount: "" });
      toast({ title: tLabel("sd.payments.advance", "Avans to'lovi qayd etildi") });
    },
    onError: () => toast({ title: tLabel("sd.payments.advanceError", "Avans to'lovida xatolik"), variant: "destructive" }),
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 pb-6 mb-6 flex-wrap">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <EPPageHeader
            breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("tolovlarNazorati")}</b></>}
            title={t("tolovlarNazorati")}
            subtitle={t("avansQoldiqDebitorlikVaAging")}
          />
        </div>

        {/* Export CSV */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={view === "debitors" || paymentsArr.length === 0}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-1" />
          {tLabel("sd.export.csv", "CSV")}
        </Button>

        <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-card">
          {(["all", "overdue", "debitors"] as const).map(v => (
            <button key={v}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${view === v ? "bg-primary text-white font-medium" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => { setView(v); setPage(1); }}>
              {v === "all"
                ? tLabel("sd.view.all", "Barchasi")
                : v === "overdue"
                  ? tLabel("sd.view.overdue", "Muddati o'tganlar")
                  : tLabel("sd.view.debitors", "Debitorlar")}
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
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("yangiTolov")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("Buyurtma")}</Label>
                <Select value={form.orderId} onValueChange={v => setForm({ ...form, orderId: v })}>
                  <SelectTrigger data-testid="select-payment-order" className="h-9">
                    <SelectValue placeholder={t("tanlang")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(orders?.data) ? orders!.data : []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.orderNumber} — {fmt(o.totalAmount)} so'm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("tolovTuri")}</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger data-testid="select-payment-type" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advance">{t("avans")}</SelectItem>
                    <SelectItem value="balance">{t("qoldiq")}</SelectItem>
                    <SelectItem value="partial">{t("qisman")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("summaSoM")}</Label>
                <Input data-testid="input-payment-amount" type="number" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>{t("tolovMuddati")}</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <Label>{t("Izoh")}</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <Button data-testid="button-save-payment" className="w-full"
                onClick={() => createMut.mutate({ ...form, amount: parseFloat(form.amount) || 0 })}
                disabled={!form.orderId || !form.amount || createMut.isPending}>
                {createMut.isPending
                  ? tLabel("sd.saving", "Saqlanmoqda...")
                  : tLabel("sd.save", "Saqlash")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Payment list ────────────────────────────────────────────── */}
      <div className="space-y-2">
        {isLoading && <div className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</div>}

        {view === "debitors" ? (
          (Array.isArray(paymentsArr) ? paymentsArr : []).map((d, i) => {
            const deb = d as DebitEntry;
            return (
              <Card key={`k-${i}`} data-testid={`card-debitor-${deb.customerId}`}>
                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="text-sm font-medium">
                    {tLabel("sd.col.customerId", "Mijoz ID")}: {deb.customerId}
                  </div>
                  <div className="flex gap-4 text-sm flex-wrap">
                    <div><span className="text-muted-foreground">{t("k030Kun")}</span> <strong>{fmt(deb["0-30"])} so'm</strong></div>
                    <div><span className="text-muted-foreground">31-60:</span> <strong>{fmt(deb["31-60"])} so'm</strong></div>
                    <div><span className="text-muted-foreground">61-90:</span> <strong>{fmt(deb["61-90"])} so'm</strong></div>
                    <div><span className="text-muted-foreground">90+:</span> <strong>{fmt(deb["90+"])} so'm</strong></div>
                  </div>
                  <div className="font-bold text-[var(--ep-red)]">{fmt(deb.total)} so'm</div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          (Array.isArray(paymentsArr) ? paymentsArr : []).map((p) => {
            const pay = p as SalesPayment;
            return (
              <Card
                key={pay.id}
                data-testid={`card-payment-${pay.id}`}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => setDetailDialog({ open: true, payment: pay })}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-medium">
                      {pay.type === "advance"
                        ? tLabel("sd.payType.advance", "Avans")
                        : pay.type === "balance"
                          ? tLabel("sd.payType.balance", "Qoldiq")
                          : tLabel("sd.payType.partial", "Qisman")} {tLabel("sd.payType.suffix", "to'lov")}
                    </div>
                    {pay.dueDate && (
                      <div className="text-xs text-muted-foreground">
                        {tLabel("sd.col.dueDate", "Muddat")}: {pay.dueDate}
                      </div>
                    )}
                    {pay.overdueDays > 0 && (
                      <div className="text-xs text-[var(--ep-red)] font-medium">
                        {pay.overdueDays} {tLabel("sd.overdue.suffix", "kun kechikdi")}
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-lg">{fmt(pay.amount)} so'm</div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${PAYMENT_STATUS_COLORS[pay.status] || ""}`}>
                    {pay.status === "pending"
                      ? tLabel("sd.status.pending", "Kutilmoqda")
                      : pay.status === "paid"
                        ? tLabel("sd.status.paid", "To'landi")
                        : pay.status === "overdue"
                          ? tLabel("sd.status.overdue", "Muddati o'tdi")
                          : tLabel("sd.status.returned", "Qaytarildi")}
                  </span>
                  {pay.status === "pending" && pay.type !== "advance" && (
                    <Button size="sm" variant="outline" data-testid={`button-advance-payment-${pay.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const matchedOrder = Array.isArray(orders?.data)
                          ? orders!.data.find((o) => String(o.id) === String(pay.orderId))
                          : undefined;
                        const maxAmt = matchedOrder?.totalAmount ?? 0;
                        setAdvanceDialog({ open: true, orderId: pay.orderId, maxAmount: maxAmt, amount: String(maxAmt > 0 ? maxAmt : "") });
                      }}
                      disabled={advancePaymentMut.isPending}>
                      {t("avans")}
                    </Button>
                  )}
                  {pay.status === "pending" && (
                    <Button size="sm" data-testid={`button-mark-paid-${pay.id}`}
                      onClick={(e) => { e.stopPropagation(); markPaidMut.mutate(pay.id); }}
                      disabled={markPaidMut.isPending}>
                      <CheckCircle className="w-3 h-3 mr-1" />{t("tolandi1")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {!isLoading && paymentsArr.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            {view === "debitors"
              ? tLabel("sd.debitors.empty", "Debitorlar yo'q")
              : tLabel("sd.payments.empty", "To'lovlar yo'q")}
          </div>
        )}
      </div>

      {/* ── Pagination (only for all/overdue, not debitors) ─────────── */}
      {view !== "debitors" && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={paymentsTotal}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      )}

      {/* ── Payment Detail Dialog ────────────────────────────────────── */}
      <Dialog open={detailDialog.open} onOpenChange={(o) => setDetailDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLabel("sd.payments.detail", "To'lov tafsiloti")}</DialogTitle>
          </DialogHeader>
          {detailDialog.payment && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{tLabel("sd.col.amount", "Summa")}</p>
                  <p className="font-bold text-lg">{fmt(detailDialog.payment.amount)} so'm</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{tLabel("sd.col.type", "Tur")}</p>
                  <p className="font-semibold capitalize">{detailDialog.payment.type}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{tLabel("sd.col.status", "Holat")}</p>
                  <p className={`font-semibold ${PAYMENT_STATUS_COLORS[detailDialog.payment.status] || ""}`}>
                    {detailDialog.payment.status}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{tLabel("sd.col.dueDate", "Muddat")}</p>
                  <p className="font-semibold">{detailDialog.payment.dueDate || "—"}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{tLabel("sd.col.paidDate", "To'langan sana")}</p>
                  <p className="font-semibold">{detailDialog.payment.paidDate || "—"}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{tLabel("sd.col.orderId", "Buyurtma ID")}</p>
                  <p className="font-semibold font-mono">{detailDialog.payment.orderId}</p>
                </div>
              </div>
              {detailDialog.payment.notes && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">{tLabel("sd.col.notes", "Izoh")}</p>
                  <p className="text-foreground">{detailDialog.payment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Advance Payment Dialog ───────────────────────────────────── */}
      <Dialog
        open={advanceDialog.open}
        onOpenChange={(o) => {
          if (!o) setAdvanceDialog({ open: false, orderId: "", maxAmount: 0, amount: "" });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLabel("sd.payments.advanceTitle", "Avans to'lovini kiritish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {advanceDialog.maxAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                {tLabel("sd.payments.orderTotal", "Buyurtma summasi")}:{" "}
                <strong>{fmt(advanceDialog.maxAmount)} so'm</strong>
              </p>
            )}
            <div>
              <Label>{tLabel("sd.payments.advanceAmount", "Avans summasi (so'm)")}</Label>
              <Input
                data-testid="input-advance-amount"
                type="number"
                min={1}
                max={advanceDialog.maxAmount > 0 ? advanceDialog.maxAmount : undefined}
                value={advanceDialog.amount}
                onChange={(e) => setAdvanceDialog((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder={tLabel("sd.payments.advanceAmountPlaceholder", "Musbat son kiriting")}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setAdvanceDialog({ open: false, orderId: "", maxAmount: 0, amount: "" })}
                disabled={advancePaymentMut.isPending}
              >
                {tLabel("sd.cancel", "Bekor")}
              </Button>
              <Button
                data-testid="button-advance-submit"
                onClick={() => {
                  const parsedAmount = parseFloat(advanceDialog.amount);
                  if (!parsedAmount || parsedAmount <= 0) {
                    toast({ title: tLabel("sd.payments.amountRequired", "Summa musbat son bo'lishi kerak"), variant: "destructive" });
                    return;
                  }
                  advancePaymentMut.mutate({ orderId: advanceDialog.orderId, amount: parsedAmount });
                }}
                disabled={!advanceDialog.amount || advancePaymentMut.isPending}
              >
                {advancePaymentMut.isPending
                  ? tLabel("sd.saving", "Saqlanmoqda...")
                  : tLabel("sd.payments.advanceConfirm", "Tasdiqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
