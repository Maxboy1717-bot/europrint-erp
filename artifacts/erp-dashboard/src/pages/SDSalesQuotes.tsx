/**
 * @module SDSalesQuotes
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Send, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { fmt, QUOT_STATUS_LABELS, QUOT_STATUS_COLORS } from "@/lib/sd-helpers";
import {
  defaultCalcForm,
  defaultQuotationForm,
  type CalcForm,
  type QuotationForm,
  type PriceResult,
  type SdCustomerItem,
  type SdQuotationItem,
} from "./SDSalesQuotesTypes";
import { NewQuotationDialog } from "./SDSalesQuotesDialogs";
import { EPPageHeader, EPSkeletonTable, EPEmptyState, EPErrorState } from "@/components/ep";
import { Pagination } from "@/components/Pagination";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from "@/lib/i18n/tLabel";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditForm {
  validUntil: string;
  paymentTerms: string;
  notes: string;
}

const EMPTY_EDIT: EditForm = { validUntil: "", paymentTerms: "", notes: "" };

// ── Component ─────────────────────────────────────────────────────────────────

export default function SDSalesQuotes() {
  const { t } = useTranslation("common");
  const { isAuthenticated } = useAuth();
  const [isNew, setIsNew] = useState(false);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [calcForm, setCalcForm] = useState<CalcForm>({ ...defaultCalcForm });
  const [form, setForm] = useState<QuotationForm>({ ...defaultQuotationForm });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Edit dialog
  const [editDialog, setEditDialog] = useState<{ open: boolean; quotation?: SdQuotationItem }>({ open: false });
  const [editForm, setEditForm] = useState<EditForm>({ ...EMPTY_EDIT });

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: quotationsRaw, isLoading, isError, refetch } = useQuery<unknown>({
    queryKey: ["/api/sd/quotations", page, pageSize],
    queryFn: () => {
      const p = new URLSearchParams();
      p.set("limit", String(pageSize));
      p.set("offset", String((page - 1) * pageSize));
      return apiRequest("GET", `/api/sd/quotations?${p}`);
    },
    enabled: isAuthenticated === true,
  });

  // Support both paginated `{ data, total }` and plain array
  type QuotationPage = { data?: SdQuotationItem[]; items?: SdQuotationItem[]; total?: number };
  const _qr = quotationsRaw as QuotationPage | SdQuotationItem[] | null | undefined;
  const _quotationRows: SdQuotationItem[] = Array.isArray(_qr)
    ? (_qr as SdQuotationItem[])
    : Array.isArray((_qr as QuotationPage)?.data)
    ? (_qr as QuotationPage).data!
    : Array.isArray((_qr as QuotationPage)?.items)
    ? (_qr as QuotationPage).items!
    : [];
  // GET /sd/quotations returns raw sd_quotations columns (snake_case: quotation_number,
  // customer_name, total_value/total_amount) — the table below reads the camelCase
  // SdQuotationItem shape, so every row rendered "—"/"0 so'm" regardless of real data.
  const quotations: SdQuotationItem[] = _quotationRows.map((row) => {
    const r = row as unknown as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      quotationNumber: (r.quotation_number ?? r.quotationNumber) as string | undefined,
      status: r.status as string | undefined,
      customerName: (r.customer_name ?? r.customerName) as string | undefined,
      quantity: r.quantity != null ? Number(r.quantity) : undefined,
      validUntil: (r.valid_until ?? r.validUntil) as string | undefined,
      totalPrice: r.total_value != null ? Number(r.total_value)
        : r.total_amount != null ? Number(r.total_amount)
        : r.totalPrice != null ? Number(r.totalPrice) : undefined,
      unitPrice: r.unit_price != null ? Number(r.unit_price) : r.unitPrice != null ? Number(r.unitPrice) : undefined,
      notes: r.notes as string | undefined,
      customerId: (r.customer_id ?? r.customerId) != null ? String(r.customer_id ?? r.customerId) : undefined,
    };
  });
  const totalItems: number = (_qr as QuotationPage)?.total ?? quotations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const { data: customersData } = useQuery<{ data: SdCustomerItem[] }>({
    queryKey: ["/api/sd/customers"],
    queryFn: () => apiRequest("GET", "/api/sd/customers?limit=200"),
  });
  const customers = Array.isArray(customersData?.data)
    ? customersData.data
    : Array.isArray(customersData)
    ? (customersData as unknown as SdCustomerItem[])
    : [];

  // ── Mutations ──────────────────────────────────────────────────────────────

  const calcMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest<PriceResult>("POST", "/api/sd/calculate-price", body),
    onSuccess: (data) => setPriceResult(data),
    onError: () => toast({ title: "Hisoblashda xatolik", variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/sd/quotations", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      setIsNew(false);
      setPriceResult(null);
      setCalcForm({ ...defaultCalcForm });
      setForm({ ...defaultQuotationForm });
      toast({ title: "Taklifnoma yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const sendMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/sd/quotations/${id}/send`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      toast({ title: "Yuborildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/sd/quotations/${id}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      qc.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ title: "Tasdiqlandi — buyurtma va shartnoma yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const editMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditForm }) =>
      apiRequest("PATCH", `/api/sd/quotations/${id}`, {
        valid_until: data.validUntil,
        payment_terms: data.paymentTerms,
        notes: data.notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      setEditDialog({ open: false });
      toast({ title: "Taklifnoma yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sd/quotations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      setDeleteId(null);
      toast({ title: "Taklifnoma o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleCalc() {
    calcMut.mutate({
      ...calcForm,
      printColors: Number(calcForm.printColors),
      quantity: Number(calcForm.quantity),
      lengthMm: Number(calcForm.lengthMm),
      widthMm: Number(calcForm.widthMm),
      heightMm: Number(calcForm.heightMm),
      deliveryKm: Number(calcForm.deliveryKm),
    });
  }

  function handleCreate(): void {
    if (!form.customerId) { toast({ title: "Mijoz tanlanmagan", variant: "destructive" }); return; }
    if (!priceResult) { toast({ title: "Avval narx hisoblab oling", variant: "destructive" }); return; }
    if (!form.validUntil) { toast({ title: "Amal qilish muddati kiritilmagan", variant: "destructive" }); return; }
    createMut.mutate({
      customerId: form.customerId,
      customerName: (Array.isArray(customers) ? customers : []).find(
        (c: SdCustomerItem) => String(c.id) === String(form.customerId)
      )?.name,
      validUntil: form.validUntil,
      notes: form.notes,
      paymentTerms: form.paymentTerms,
      totalAmount: priceResult.totalPriceWithVat,
      items: [{
        ...calcForm,
        printColors: Number(calcForm.printColors),
        quantity: Number(calcForm.quantity),
        // Carry the just-calculated price breakdown onto the bespoke line item — this is a
        // custom-spec job (no product catalog binding, same convention as sales_order_items),
        // so the price has to travel with the calcForm params rather than being re-derived
        // from a product_id the line doesn't have.
        unitPrice: priceResult.unitPriceWithVat,
        costPrice: priceResult.totalCostPrice,
        paperCost: priceResult.paperCost,
        printCost: priceResult.printCost,
        dieCost: priceResult.dieCost,
        deliveryCost: priceResult.deliveryCost,
        productionCost: priceResult.productionCost,
      }],
      markupPercent: priceResult.markupPercent,
      vatRate: 12,
    });
  }

  function openEdit(q: SdQuotationItem) {
    setEditForm({
      validUntil: q.validUntil ?? "",
      paymentTerms: "",
      notes: q.notes ?? "",
    });
    setEditDialog({ open: true, quotation: q });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 pb-6 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("sotuvTakliflari")}</b></>}
        title={t("sotuvTakliflari")}
        subtitle={t("narxHisoblashTaklifnomaYaratishVa")}
      />
        </div>
        <NewQuotationDialog
          open={isNew}
          onOpenChange={setIsNew}
          calcForm={calcForm}
          onCalcFormChange={setCalcForm}
          form={form}
          onFormChange={setForm}
          priceResult={priceResult}
          isCalcPending={calcMut.isPending}
          isCreatePending={createMut.isPending}
          customers={Array.isArray(customers) ? customers : []}
          onCalculate={handleCalc}
          onCreate={handleCreate}
        />
      </div>

      {/* Table view */}
      {isLoading ? (
        <EPSkeletonTable rows={6} cols={6} />
      ) : isError ? (
        <EPErrorState onRetry={refetch} />
      ) : quotations.length === 0 ? (
        <EPEmptyState
          icon={FileText}
          title="Hozircha taklifnomalar yo'q"
          description="Yuqoridagi tugma orqali birinchi taklifnomani yarating."
        />
      ) : (
        <div className="bg-card rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                  {tLabel("sd.quotes.raqam", "Raqam")}
                </th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                  {tLabel("sd.quotes.mijoz", "Mijoz")}
                </th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                  {t("status28") || "Status"}
                </th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">
                  {tLabel("sd.quotes.summa", "Summa")}
                </th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                  {tLabel("sd.quotes.muddat", "Muddat")}
                </th>
                <th className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4 text-right">
                  {t("Amallar") || "Amallar"}
                </th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(quotations) ? quotations : []).map((q: SdQuotationItem) => (
                <tr key={q.id} className="hover:bg-muted/40 transition-colors border-b last:border-0" data-testid={`row-quotation-${q.id}`}>
                  <td className="py-3 px-4 font-mono text-sm font-semibold">
                    {q.quotationNumber || "—"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {q.customerName || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={`text-xs ${QUOT_STATUS_COLORS[q.status ?? ""] || ""}`}>
                      {QUOT_STATUS_LABELS[q.status ?? ""] || q.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-right">
                    {fmt(q.totalPrice ?? 0)} so'm
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {q.validUntil || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 justify-end">
                      {q.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendMut.mutate(q.id)}
                          disabled={sendMut.isPending}
                          data-testid={`btn-send-${q.id}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {(q.status === "sent" || q.status === "draft") && (
                        <Button
                          size="sm"
                          onClick={() => approveMut.mutate(q.id)}
                          disabled={approveMut.isPending}
                          data-testid={`btn-approve-${q.id}`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(q)}
                        data-testid={`btn-edit-${q.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[var(--ep-red)] hover:text-[var(--ep-red)] hover:bg-red-50"
                        onClick={() => setDeleteId(q.id)}
                        data-testid={`btn-delete-${q.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      {/* Edit dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog(d => ({ ...d, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {tLabel("sd.quotes.taklifnomaTahrirlash", "Taklifnomani tahrirlash")} — {editDialog.quotation?.quotationNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{tLabel("sd.quotes.amalMuddati", "Amal qilish muddati")}</Label>
              <Input
                type="date"
                value={editForm.validUntil}
                onChange={e => setEditForm(f => ({ ...f, validUntil: e.target.value }))}
                data-testid="input-edit-valid-until"
              />
            </div>
            <div>
              <Label>{tLabel("sd.quotes.tolovShartlari", "To'lov shartlari")}</Label>
              <Input
                value={editForm.paymentTerms}
                onChange={e => setEditForm(f => ({ ...f, paymentTerms: e.target.value }))}
                placeholder={tLabel("sd.quotes.masalan30Kun", "Masalan: 30 kun")}
                data-testid="input-edit-payment-terms"
              />
            </div>
            <div>
              <Label>{tLabel("sd.quotes.izoh", "Izoh")}</Label>
              <Textarea
                value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                data-testid="textarea-edit-notes"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialog({ open: false })}>
                {t("cancel")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => editDialog.quotation && editMut.mutate({ id: editDialog.quotation.id, data: editForm })}
                disabled={editMut.isPending}
                data-testid="btn-save-edit"
              >
                {editMut.isPending ? "Saqlanmoqda..." : tLabel("sd.quotes.saqlash", "Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {tLabel("sd.quotes.ochirishTasdiqlash", "O'chirishni tasdiqlaysizmi?")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {tLabel("sd.quotes.ochirishOgohlantirish", "Bu taklifnoma butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.")}
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              disabled={deleteMut.isPending}
              data-testid="btn-confirm-delete"
            >
              {deleteMut.isPending ? "O'chirilmoqda..." : tLabel("sd.quotes.ochirish", "O'chirish")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
