/**
 * @module DetailSheet
 * @description Orchestrator component that owns data-fetching, stage-mutation,
 * layout, and tab navigation for the CRM detail slide-over panel.
 * Rendering is delegated to DetailSheetSections, DetailSheetCustomer360,
 * and DetailSheetTabs.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Package, History, Sparkles, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StageProgressBar } from "@/components/crm/StageProgressBar";
import { BitrixActivityPanel } from "@/components/crm/BitrixActivityPanel";
import type { DetailSheetProps, Deal, EntityData } from "./crm-types";
import type { CrmActivity, SdOrder } from "./DetailSheetTypes";
import {
  getEntityTitle, getCurrentStageId, getEntityPhone,
  getEntityEmail, resolveEndpoint,
} from "./DetailSheetTypes";
import { GeneralSection } from "./DetailSheetSections";
import { ProposalsInvoicesSection } from "./DetailSheetProposals";
import { Customer360Section } from "./DetailSheetCustomer360";
import { HistoryTab, AITab } from "./DetailSheetTabs";
import { EPStatusPill } from "@/components/ep";

export function DetailSheet({
  entityId,
  entityType,
  open,
  onClose,
  stages,
}: DetailSheetProps) {
  const [activeTab, setActiveTab] = useState("umumiy");
  const { toast } = useToast();

  const endpoint = resolveEndpoint(entityType);

  // ----- Queries -----

  const { data: entity, isLoading } = useQuery<EntityData>({
    queryKey: [endpoint, entityId],
    enabled: !!entityId && open,
  });

  const { data: historyData = [] } = useQuery({
    queryKey: ["/api/crm/history", entityId, entityType],
    queryFn: () => {
      const et =
        entityType === "leads" ? "lead" : entityType === "deals" ? "deal" : entityType;
      return apiRequest("GET", `/api/crm/history?entityType=${et}&entityId=${entityId}`);
    },
    enabled: !!entityId && open,
  });

  const { data: activities = [] } = useQuery<CrmActivity[]>({
    queryKey: ["/api/crm/followup-activities", entityId, entityType],
    queryFn: () => {
      const et =
        entityType === "leads" ? "lead" : entityType === "deals" ? "deal" : entityType;
      return apiRequest(
        "GET",
        `/api/crm/followup-activities?entityType=${et}&entityId=${entityId}`,
      );
    },
    enabled: !!entityId && open,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["/api/crm/proposals", entityId],
    queryFn: () => apiRequest("GET", `/api/crm/proposals?dealId=${entityId}`),
    enabled: !!entityId && open && entityType === "deals",
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/crm/invoices", entityId],
    queryFn: () => apiRequest("GET", `/api/crm/invoices?dealId=${entityId}`),
    enabled: !!entityId && open && entityType === "deals",
  });

  const { data: sdOrders = [] } = useQuery<SdOrder[]>({
    queryKey: ["/api/sd/orders", entityId, entityType],
    queryFn: () => apiRequest("GET", `/api/sd/orders?crmDealId=${entityId}`),
    enabled: !!entityId && open && entityType === "deals",
  });

  // ----- Mutation -----

  const updateStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const field = entityType === "leads" ? "statusId" : "stageId";
      return apiRequest("PATCH", `${endpoint}/${entityId}/stage`, { [field]: stageId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: [endpoint, entityId] });
      if (data?.autoOrder) {
        toast({
          title: "SD Buyurtma yaratildi!",
          description: `Buyurtma: ${data.autoOrder.documentNumber}`,
        });
      } else {
        toast({ title: "Bosqich yangilandi" });
      }
    },
  });

  // ----- Derived values -----

  const title = getEntityTitle(entity, entityType);
  const phone = getEntityPhone(entity);
  const email = getEntityEmail(entity);

  const stagesForProgressBar = (Array.isArray(stages) ? stages : []).map((s) => ({
    id: s.stageId,
    name: s.name,
    color: s.color || undefined,
    sort: s.sort,
  }));

  const showStages =
    entityType === "leads" ||
    entityType === "deals" ||
    entityType === "proposals" ||
    entityType === "invoices";

  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeHistoryData = Array.isArray(historyData) ? historyData : [];
  const safeProposals = Array.isArray(proposals) ? proposals : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeSdOrders = Array.isArray(sdOrders) ? sdOrders : [];

  const bitrixEntityType =
    entityType === "leads"
      ? "lead"
      : entityType === "deals"
      ? "deal"
      : entityType === "contacts"
      ? "contact"
      : "company";

  const stageEntityType =
    entityType === "leads"
      ? "lead"
      : entityType === "proposals"
      ? "proposal"
      : entityType === "invoices"
      ? "invoice"
      : "deal";

  // ----- Render -----

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl overflow-hidden p-0" side="right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b bg-card">
            <div className="flex items-center justify-between">
              <SheetTitle data-testid="text-detail-title" className="text-lg font-semibold">
                {title}
              </SheetTitle>
              <div className="flex items-center gap-2">
                {entityType === "deals" && entity && (
                  <EPStatusPill tone="success">
                    {formatCurrency(
                      (entity as Deal).opportunity,
                      (entity as Deal).currencyId,
                    )}
                  </EPStatusPill>
                )}
                <Badge variant="outline" className="text-xs">#{entityId}</Badge>
              </div>
            </div>

            {showStages && entity && (
              <div className="mt-4">
                <StageProgressBar
                  stages={stagesForProgressBar}
                  currentStageId={getCurrentStageId(entity, entityType)}
                  onChange={(stageId) => updateStageMutation.mutate(stageId)}
                  entityType={stageEntityType}
                />
              </div>
            )}
          </SheetHeader>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="border-b px-4">
              <TabsList className="h-10 bg-transparent gap-1">
                <TabsTrigger
                  value="umumiy"
                  className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  data-testid="tab-detail-general"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />Umumiy
                </TabsTrigger>
                {entityType === "deals" && (
                  <TabsTrigger
                    value="tovarlar"
                    className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                    data-testid="tab-detail-products"
                  >
                    <Package className="h-3.5 w-3.5 mr-1" />Takliflar
                  </TabsTrigger>
                )}
                {(entityType === "contacts" || entityType === "companies") && (
                  <TabsTrigger
                    value="360"
                    className="text-xs data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                    data-testid="tab-detail-360"
                  >
                    <TrendingUp className="h-3.5 w-3.5 mr-1" />Mijoz 360°
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="tarix"
                  className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  data-testid="tab-detail-history"
                >
                  <History className="h-3.5 w-3.5 mr-1" />Tarix
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="text-xs data-[state=active]:bg-violet-500 data-[state=active]:text-white"
                  data-testid="tab-detail-ai"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />AI Tahlil
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Content: left panel + right activity panel */}
            <div className="flex-1 overflow-hidden">
              <div className="flex h-full">
                <div className="flex-1 overflow-y-auto p-6 border-r" style={{ width: "55%" }}>
                  <GeneralSection
                    entity={entity}
                    entityType={entityType}
                    isLoading={isLoading}
                    sdOrders={safeSdOrders}
                    activities={safeActivities}
                  />
                  <ProposalsInvoicesSection
                    proposals={safeProposals}
                    invoices={safeInvoices}
                  />
                  <Customer360Section
                    entity={entity}
                    entityType={entityType}
                    sdOrders={safeSdOrders}
                    activities={safeActivities}
                    proposals={safeProposals}
                    historyData={safeHistoryData}
                  />
                  <HistoryTab activities={safeActivities} historyData={safeHistoryData} />
                  <AITab entityType={entityType} entityId={entityId || 0} />
                </div>

                <div className="overflow-y-auto" style={{ width: "45%" }}>
                  {entityId && (
                    <BitrixActivityPanel
                      entityType={bitrixEntityType}
                      entityId={entityId}
                      phone={phone}
                      email={email}
                    />
                  )}
                </div>
              </div>
            </div>
          </Tabs>

          <div className="border-t p-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Yopish</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
