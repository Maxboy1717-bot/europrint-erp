/**
 * @module FinanceExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";
import {
  URL_TAB_MAP,
  tabMeta,
  CostCenterSchema,
  ProfitCenterSchema,
  type CostCenter,
  type ProfitCenter,
  type FinPayment,
  type GLDocument,
  type TaxCalendarItem,
} from "./FinanceExtendedTypes";
import {
  CostCentersTab,
  ProfitCentersTab,
  PaymentsTab,
  GLDocumentsTab,
} from "./FinanceExtendedSections";
import { TaxTab, TaxCalendarTab, RiskAITab } from "./FinanceExtendedTabsExtra";
import { CostCenterDialog, ProfitCenterDialog } from "./FinanceExtendedDialogs";
import { EPStatusPill, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type CostCenterFormValues = z.infer<typeof CostCenterSchema>;
type ProfitCenterFormValues = z.infer<typeof ProfitCenterSchema>;

export default function FinanceExtended() {
  const { t } = useTranslation("common");
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "costcenters");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["costcenters"];
  const { toast } = useToast();
  const [showCCDialog, setShowCCDialog] = useState(false);
  const [showPCDialog, setShowPCDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");

  const ccForm = useForm<CostCenterFormValues>({
    resolver: zodResolver(CostCenterSchema),
    defaultValues: { code: "", name: "", description: "", budget: "" },
  });

  const pcForm = useForm<ProfitCenterFormValues>({
    resolver: zodResolver(ProfitCenterSchema),
    defaultValues: { code: "", name: "", description: "" },
  });

  const { data: costCenters = [], isLoading: ccLoading, refetch: refetchCC } = useQuery<CostCenter[]>({
    queryKey: ["/api/fi/cost-centers"],
    select: selectArray<CostCenter>,
  });

  const { data: profitCenters = [], isLoading: pcLoading } = useQuery<ProfitCenter[]>({
    queryKey: ["/api/fi/profit-centers"],
    select: selectArray<ProfitCenter>,
  });

  const { data: glDocuments = [], isLoading: glLoading, refetch: refetchGL } = useQuery<GLDocument[]>({
    queryKey: ["/api/fi/gl-documents"],
    select: selectArray<GLDocument>,
  });

  const { data: fiStats } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/fi/stats"],
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<FinPayment[]>({
    queryKey: ["/api/fi/payments"],
    select: selectArray<FinPayment>,
  });

  const { data: taxItems = [], isLoading: taxLoading } = useQuery<TaxCalendarItem[]>({
    queryKey: ["/api/finance-extended/tax-calendar"],
  });

  const { data: taxSummaryRaw } = useQuery<{ totalThisMonth: number; paid: number; pending: number; overdue: number }>({
    queryKey: ["/api/fi/tax-summary"],
  });
  const taxSummary = taxSummaryRaw ?? undefined;

  const createCC = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/fi/cost-centers", { ...data, budget: Number(data.budget) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/cost-centers"] });
      setShowCCDialog(false);
      ccForm.reset();
      toast({ title: "Xarajat markazi qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createPayment = useMutation({
    mutationFn: (data: { amount: number; paymentMethod: string; referenceNumber?: string }) =>
      apiRequest("POST", "/api/fi/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/payments"] });
      setShowPaymentDialog(false);
      setPayAmount(""); setPayMethod("cash"); setPayRef("");
      toast({ title: "To'lov qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const createPC = useMutation({
    mutationFn: (data: ProfitCenterFormValues) =>
      apiRequest("POST", "/api/fi/profit-centers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fi/profit-centers"] });
      setShowPCDialog(false);
      pcForm.reset();
      toast({ title: "Foyda markazi qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const totalBudget = (Array.isArray(costCenters) ? costCenters : []).reduce(
    (s: number, c: CostCenter) => s + Number(c.budget || 0),
    0
  );

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 space-y-6">
      <EPPageHeader
        icon={<DollarSign className="h-5 w-5 text-primary" />}
        title={t("moliyaKengaytirilgan")}
        status={fiStats ? <EPStatusPill tone="neutral">{t("active")}</EPStatusPill> : undefined}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 px-4 overflow-x-auto" />

        <div className="flex-1 overflow-auto p-6">
          <ModuleSectionHeader
            moduleName="Moliya"
            moduleColor="text-[var(--ep-green)]"
            sectionTitle={meta?.title || ""}
            icon={meta?.icon || (() => null)}
          />

          <CostCentersTab
            costCenters={Array.isArray(costCenters) ? costCenters : []}
            profitCenters={Array.isArray(profitCenters) ? profitCenters : []}
            glDocuments={Array.isArray(glDocuments) ? glDocuments : []}
            ccLoading={ccLoading}
            totalBudget={totalBudget}
            onRefetch={refetchCC}
            onAddClick={() => setShowCCDialog(true)}
          />

          <ProfitCentersTab
            profitCenters={Array.isArray(profitCenters) ? profitCenters : []}
            pcLoading={pcLoading}
            onAddClick={() => setShowPCDialog(true)}
          />

          <PaymentsTab
            payments={Array.isArray(payments) ? payments : []}
            paymentsLoading={paymentsLoading}
            onAddClick={() => setShowPaymentDialog(true)}
          />

          <GLDocumentsTab
            glDocuments={Array.isArray(glDocuments) ? glDocuments : []}
            glLoading={glLoading}
            onRefetch={refetchGL}
          />

          <TaxTab taxItems={Array.isArray(taxItems) ? taxItems : []} taxLoading={taxLoading} taxSummary={taxSummary} />

          <TaxCalendarTab />

          <RiskAITab />

          {/* Unused TabsContent placeholder kept for tab routing */}
          <TabsContent value="__placeholder__" className="hidden" />
        </div>
      </Tabs>

      <CostCenterDialog
        open={showCCDialog}
        onOpenChange={setShowCCDialog}
        form={ccForm}
        onSubmit={(d) => createCC.mutate(d)}
        isPending={createCC.isPending}
      />

      <ProfitCenterDialog
        open={showPCDialog}
        onOpenChange={setShowPCDialog}
        form={pcForm}
        onSubmit={(d) => createPC.mutate(d)}
        isPending={createPC.isPending}
      />

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {t("yangiTolov", "Yangi to'lov")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("summa", "Summa")} *</Label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                data-testid="input-pay-amount"
              />
            </div>
            <div>
              <Label>{t("tolovUsuli", "To'lov usuli")} *</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger data-testid="select-pay-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("naqd", "Naqd")}</SelectItem>
                  <SelectItem value="bank-transfer">{t("bankTransfer", "Bank o'tkazmasi")}</SelectItem>
                  <SelectItem value="card">{t("karta", "Karta")}</SelectItem>
                  <SelectItem value="other">{t("boshqa", "Boshqa")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("referensRaqam", "Referens raqam")}</Label>
              <Input
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="REF-001"
                data-testid="input-pay-ref"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                {t("cancel")}
              </Button>
              <Button
                onClick={() => {
                  const amount = Number(payAmount);
                  if (!payAmount || isNaN(amount) || amount <= 0) return;
                  createPayment.mutate({
                    amount,
                    paymentMethod: payMethod,
                    referenceNumber: payRef.trim() || undefined,
                  });
                }}
                disabled={createPayment.isPending || !payAmount || Number(payAmount) <= 0}
                data-testid="button-save-payment"
              >
                {t("Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
