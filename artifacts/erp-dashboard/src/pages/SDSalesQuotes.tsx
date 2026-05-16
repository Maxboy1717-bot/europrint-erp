/**
 * @module SDSalesQuotes
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";
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
import { QuotationList } from "./SDSalesQuotesSections";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function SDSalesQuotes() {
  const { t } = useTranslation("common");
  const [isNew, setIsNew] = useState(false);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [calcForm, setCalcForm] = useState<CalcForm>({ ...defaultCalcForm });
  const [form, setForm] = useState<QuotationForm>({ ...defaultQuotationForm });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: quotations = [], isLoading, isError, refetch } = useQuery<SdQuotationItem[]>({
    queryKey: ["/api/sd/quotations"],
  });

  const { data: customersData } = useQuery<{ data: SdCustomerItem[] }>({
    queryKey: ["/api/sd/customers"],
    queryFn: () => apiRequest("GET", "/api/sd/customers?limit=200"),
  });

  const customers = customersData?.data || [];

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
      items: [{
        ...calcForm,
        printColors: Number(calcForm.printColors),
        quantity: Number(calcForm.quantity),
      }],
      markupPercent: priceResult.markupPercent,
      vatRate: 12,
    });
  }

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

      <QuotationList
        quotations={quotations as SdQuotationItem[]}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onSend={(id) => sendMut.mutate(id)}
        onApprove={(id) => approveMut.mutate(id)}
        isSendPending={sendMut.isPending}
        isApprovePending={approveMut.isPending}
      />
    </div>
  );
}
