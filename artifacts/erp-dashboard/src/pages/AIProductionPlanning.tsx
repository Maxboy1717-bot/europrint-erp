/** @module AIProductionPlanning @description Route-level page component for AI Production Planning. Owns all state, React Query hooks, and top-level layout. Delegates rendering to sub-modules. */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Brain, Cpu, Package, Settings, BarChart3, Target, ShieldCheck, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AiPlan, DashboardData, BatchGroup, DetailTab, RescheduleType,
} from "./AIProductionPlanningTypes";
import { StatsGrid, PlansGrid, RecommendationsTab } from "./AIProductionPlanningSections";
import {
  PlanDetailDialog, OverrideDialog, RescheduleDialog,
  BlockMaterialDialog, ConfigDialog,
} from "./AIProductionPlanningDialogs";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function AIProductionPlanning() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // ── Dialog visibility ──────────────────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<AiPlan | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showBlockMaterial, setShowBlockMaterial] = useState(false);

  // ── Detail tabs & form state ───────────────────────────────────────────────
  const [detailTab, setDetailTab] = useState<DetailTab>("schedule");
  const [threshold, setThreshold] = useState<number>(85);
  const [overrideReason, setOverrideReason] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleType, setRescheduleType] = useState<RescheduleType>("manual");
  const [blockMaterial, setBlockMaterial] = useState("");
  const [blockOrderId, setBlockOrderId] = useState("");
  const [blockReason, setBlockReason] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: dashboard, isLoading: dashLoading, isError, error, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/ai-planning/dashboard"],
  });
  const { data: plans, isLoading: plansLoading } = useQuery<AiPlan[]>({
    queryKey: ["/api/ai-planning/plans"],
  });
  const { data: config } = useQuery<Record<string, string>>({
    queryKey: ["/api/ai-planning/config"],
  });
  const { data: batchGroups } = useQuery<{ batchGroups: BatchGroup[]; totalMachines: number }>({
    queryKey: ["/api/ai-planning/plans", selectedPlan?.id, "batch-groups"],
    queryFn: async () => {
      if (!selectedPlan) return { batchGroups: [], totalMachines: 0 };
      return await apiRequest('GET', `/api/ai-planning/plans/${selectedPlan.id}/batch-groups`);
    },
    enabled: !!selectedPlan && detailTab === "batch",
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai-planning/generate", { planType: "daily" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/dashboard"] });
      toast({ title: "AI Reja yaratildi", description: "Yangi reja muvaffaqiyatli yaratildi" });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, isOverride, reason }: { id: string; isOverride?: boolean; reason?: string }) =>
      apiRequest("POST", `/api/ai-planning/plans/${id}/approve`, { isOverride, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/dashboard"] });
      setShowDetail(false); setShowOverride(false);
      toast({ title: "Tasdiqlandi", description: "Reja tasdiqlandi va Telegram yuborildi" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/ai-planning/plans/${id}/reject`, { reason: "Qo'lda rad etildi" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/dashboard"] });
      setShowDetail(false);
      toast({ title: "Rad etildi" });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/ai-planning/plans/${id}/execute`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/dashboard"] });
      setShowDetail(false);
      toast({ title: "Bajarilmoqda", description: "Machine tasks yaratildi va Telegram yuborildi" });
    },
  });

  const acceptDecisionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/ai-planning/decisions/${id}/accept`),
    onSuccess: () => {
      if (selectedPlan) queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans", selectedPlan.id] });
      toast({ title: "Qaror qabul qilindi" });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, reason, type }: { id: string; reason: string; type: string }) =>
      apiRequest("POST", `/api/ai-planning/plans/${id}/reschedule`, { reason, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      setShowReschedule(false); setRescheduleReason("");
      toast({ title: "Qayta rejalashtirildi", description: "Barcha buyurtmalar 2 soat kechiktirildi" });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const blockMaterialMutation = useMutation({
    mutationFn: ({ orderId, materialName, reason }: { orderId: string; materialName: string; reason: string }) =>
      apiRequest("POST", `/api/ai-planning/orders/${orderId}/block-material`, { materialName, reason, requiredQuantity: 1 }),
    onSuccess: (data: { purchaseRequisitionNumber?: string }) => {
      setShowBlockMaterial(false); setBlockMaterial(""); setBlockOrderId(""); setBlockReason("");
      toast({ title: "Bloklandi", description: data.purchaseRequisitionNumber ? `Xarid talabi: ${data.purchaseRequisitionNumber}` : "MM ga xabar yuborildi" });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const saveConfigMutation = useMutation({
    mutationFn: (data: Record<string, string>) => apiRequest("PUT", "/api/ai-planning/config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/config"] });
      setShowConfig(false);
      toast({ title: "Sozlamalar saqlandi" });
    },
  });

  // ── Derived state ──────────────────────────────────────────────────────────
  const openDetail = async (plan: AiPlan) => {
    try {
      const detail = await apiRequest<AiPlan>("GET", `/api/ai-planning/plans/${plan.id}`);
      setSelectedPlan(detail);
    } catch { setSelectedPlan(plan); }
    setDetailTab("schedule");
    setShowDetail(true);
  };

  const stats = [
    { label: "Faol rejalar",              value: dashboard?.activePlans ?? 0,           icon: Zap },
    { label: "O'rtacha ishonch",           value: `${dashboard?.avgConfidence ?? 0}%`,   icon: Target },
    { label: "Avto-tasdiqlangan",          value: `${dashboard?.autoApprovedPct ?? 0}%`, icon: ShieldCheck },
    { label: "Rejalashtirilgan buyurtmalar", value: dashboard?.totalOrdersScheduled ?? 0, icon: BarChart3 },
  ];

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="page-ai-planning">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("aiRejalashtirish")}</b></>}
        title={t("aiRejalashtirish")}
        subtitle={t("vipFirstFifoBatchGrouping")}
      />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowBlockMaterial(true)} data-testid="button-block-material">
            <Package className="h-4 w-4 mr-1" /> {t("materialBlok")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setThreshold(config?.auto_approval_threshold ? parseInt(config.auto_approval_threshold) : 85); setShowConfig(true); }} data-testid="button-open-config">
            <Settings className="h-4 w-4 mr-1" /> {t("settings")}
          </Button>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} data-testid="button-generate-plan">
            {generateMutation.isPending ? <EPLoader className="mr-2" /> : <Cpu className="h-4 w-4 mr-2" />}
            AI Reja yaratish
          </Button>
        </div>
      </div>

      <StatsGrid stats={stats} isLoading={dashLoading} />

      <Tabs defaultValue="plans">
        <TabsList className="mb-4">
          <TabsTrigger value="plans" data-testid="tab-plans">{t("rejalar")}</TabsTrigger>
          <TabsTrigger value="recommendations" data-testid="tab-recommendations">{t("aiTavsiyalar")}</TabsTrigger>
        </TabsList>
        <TabsContent value="plans">
          <PlansGrid plans={plans} isLoading={plansLoading} isGenerating={generateMutation.isPending} onPlanClick={openDetail} onGenerate={() => generateMutation.mutate()} />
        </TabsContent>
        <TabsContent value="recommendations">
          <RecommendationsTab plans={plans} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PlanDetailDialog
        open={showDetail} onOpenChange={setShowDetail}
        plan={selectedPlan} detailTab={detailTab} onDetailTabChange={setDetailTab}
        batchGroups={batchGroups}
        onApprove={() => { setOverrideReason(""); setShowOverride(true); }}
        onReject={() => selectedPlan && rejectMutation.mutate(selectedPlan.id)}
        onExecute={() => selectedPlan && executeMutation.mutate(selectedPlan.id)}
        onReschedule={() => { setShowReschedule(true); setRescheduleReason(""); }}
        onAcceptDecision={(id) => acceptDecisionMutation.mutate(id)}
        isRejectPending={rejectMutation.isPending}
        isExecutePending={executeMutation.isPending}
        isAcceptDecisionPending={acceptDecisionMutation.isPending}
      />
      <OverrideDialog
        open={showOverride} onOpenChange={setShowOverride}
        planNumber={selectedPlan?.planNumber}
        reason={overrideReason} onReasonChange={setOverrideReason}
        onConfirm={() => selectedPlan && approveMutation.mutate({ id: selectedPlan.id, isOverride: true, reason: overrideReason })}
        isPending={approveMutation.isPending}
      />
      <RescheduleDialog
        open={showReschedule} onOpenChange={setShowReschedule}
        reason={rescheduleReason} onReasonChange={setRescheduleReason}
        rescheduleType={rescheduleType} onTypeChange={setRescheduleType}
        onConfirm={() => selectedPlan && rescheduleMutation.mutate({ id: selectedPlan.id, reason: rescheduleReason, type: rescheduleType })}
        isPending={rescheduleMutation.isPending}
      />
      <BlockMaterialDialog
        open={showBlockMaterial} onOpenChange={setShowBlockMaterial}
        orderId={blockOrderId} material={blockMaterial} reason={blockReason}
        onOrderIdChange={setBlockOrderId} onMaterialChange={setBlockMaterial} onReasonChange={setBlockReason}
        onConfirm={() => blockMaterialMutation.mutate({ orderId: blockOrderId, materialName: blockMaterial, reason: blockReason })}
        isPending={blockMaterialMutation.isPending}
      />
      <ConfigDialog
        open={showConfig} onOpenChange={setShowConfig}
        threshold={threshold} onThresholdChange={setThreshold}
        onSave={() => saveConfigMutation.mutate({ auto_approval_threshold: String(threshold) })}
        isPending={saveConfigMutation.isPending}
      />
    </div>
  );
}
