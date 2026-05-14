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
import { CostCenterDialog } from "./FinanceExtendedDialogs";
import { EPStatusPill } from "@/components/ep";

type CostCenterFormValues = z.infer<typeof CostCenterSchema>;

export default function FinanceExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "costcenters");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["costcenters"];
  const { toast } = useToast();
  const [showCCDialog, setShowCCDialog] = useState(false);

  const ccForm = useForm<CostCenterFormValues>({
    resolver: zodResolver(CostCenterSchema),
    defaultValues: { code: "", name: "", description: "", budget: "" },
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

  const totalBudget = (Array.isArray(costCenters) ? costCenters : []).reduce(
    (s: number, c: CostCenter) => s + Number(c.budget || 0),
    0
  );

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center gap-3">
        <DollarSign className="h-5 w-5 text-primary" />
        <h1 className="font-semibold text-base">Moliya — Kengaytirilgan</h1>
        {fiStats && <EPStatusPill tone="neutral" className="ml-2">Faol</EPStatusPill>}
      </div>

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
          />

          <PaymentsTab
            payments={Array.isArray(payments) ? payments : []}
            paymentsLoading={paymentsLoading}
          />

          <GLDocumentsTab
            glDocuments={Array.isArray(glDocuments) ? glDocuments : []}
            glLoading={glLoading}
            onRefetch={refetchGL}
          />

          <TaxTab taxItems={Array.isArray(taxItems) ? taxItems : []} taxLoading={taxLoading} />

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
    </div>
  );
}
