/**
 * @module PlanningBoard
 * @description React page component. Route-level UI.
 * Orchestrates state, queries, and sub-components.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { format, addDays } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, Calendar as CalendarIcon, FileText, Layers, Package } from "lucide-react";

import {
  buildTranslations,
  type PlanningFilters,
  type PlanningRunForm,
  type PlanningOperation,
  type PapkaOrdersResponse,
  type Equipment,
  type WorkCenter,
  type ProductionPlanRow,
  type ProductionFactRow,
  type MRPRun,
  type MRPResult,
  type PurchaseRequisition,
  type Product,
} from "./PlanningBoardTypes";
import {
  PlanningBoardHeader,
  PlanningFiltersCard,
  OperationsTableTab,
} from "./PlanningBoardSections";
import {
  OperationFormDialog,
  PlanFormDialog,
  FactFormDialog,
  MRPRunDialog,
  MRPResultsDialog,
} from "./PlanningBoardDialogs";
import { PlanningTabPanels } from "./planning/PlanningTabPanels";
import { usePlanningBoardActions } from "./usePlanningBoardActions";
import { apiRequest } from '@/lib/queryClient';
import { EPErrorState } from "@/components/ep";
import type { ScheduleEntry } from "./planning/planning-types";

export default function PlanningBoard() {
  const { isAuthenticated } = useAuth();
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const [activeTab, setActiveTab] = useState("operations");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<PlanningOperation | null>(null);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [openFactDialog, setOpenFactDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlanRow | null>(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [selectedRun, setSelectedRun] = useState<MRPRun | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [filters, setFilters] = useState<PlanningFilters>({
    papkaNo: "",
    status: "all",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
  });

  const [runForm, setRunForm] = useState<PlanningRunForm>({
    runName: "",
    planningHorizon: 30,
    includeSafetyStock: true,
    description: "",
  });

  // buildTranslations returns a flat label object. A few descendant components
  // additionally invoke `t(...)` as a function for keys not present on the map.
  // Wrap the map in a callable carrier so both `t.foo` and `t("foo")` work.
  const tMap = buildTranslations(lang);
  const tFn = ((key: string, _params?: Record<string, string | number>): string => {
    const direct = (tMap as Record<string, unknown>)?.[key];
    return typeof direct === 'string' ? direct : key;
  });
  const t = Object.assign(tFn, tMap) as typeof tMap & typeof tFn;

  const {
    form,
    planForm,
    factForm,
    createMutation,
    updateMutation,
    savePlan,
    saveFact,
    createRunMutation,
    calculateMRPMutation,
    handleCreateRun,
  } = usePlanningBoardActions({
    lang,
    editingPlan,
    setIsDialogOpen,
    setOpenPlanDialog,
    setOpenFactDialog,
    setEditingPlan,
    setShowRunDialog,
    setRunForm,
    runForm,
  });

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  type OperationsResponse = { operations?: PlanningOperation[]; items?: PlanningOperation[] };
  const {
    data: operationsData,
    isLoading: isLoadingOps,
    isError: isOpsError,
    refetch: refetchOps,
  } = useQuery<OperationsResponse>({
    queryKey: ["/api/planning/operations", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.papkaNo) params.append("papkaNo", filters.papkaNo);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      return await apiRequest<OperationsResponse>('GET', `/api/planning/operations?${params.toString()}`);
    },
    enabled: !!isAuthenticated,
  });

  const { data: scheduleData, isLoading: isLoadingSchedule } = useQuery<ScheduleEntry[]>({
    queryKey: ["/api/planning/schedule", filters.startDate, filters.endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: filters.startDate, endDate: filters.endDate });
      return await apiRequest<ScheduleEntry[]>('GET', `/api/planning/schedule?${params.toString()}`);
    },
    enabled: !!isAuthenticated && activeTab === "schedule",
  });

  const { data: papkaOrdersResponse } = useQuery<PapkaOrdersResponse>({ queryKey: ["/api/papka-orders"], enabled: !!isAuthenticated });
  const papkaOrdersList = papkaOrdersResponse?.items || [];
  const { data: equipmentList = [] } = useQuery<Equipment[]>({ queryKey: ["/api/equipment"], enabled: !!isAuthenticated });
  const { data: workCenters = [] } = useQuery<WorkCenter[]>({
    queryKey: ["/api/pp/work-centers"],
    enabled: !!isAuthenticated,
    select: (raw: unknown): WorkCenter[] => {
      const items = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
      return items.map((item) => ({ id: String(item.id ?? ""), name: String(item.name ?? "") }));
    },
  });
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/material-cards"],
    enabled: !!isAuthenticated,
    select: (raw: unknown): Product[] => {
      const items = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
      return items.map((item) => ({
        id: String(item.id ?? ""),
        code: String(item.sku ?? item.kod ?? ""),
        name: String(item.name ?? item.xom_ashyo ?? ""),
        sku: String(item.sku ?? item.kod ?? ""),
      }));
    },
  });
  const { data: productionPlans = [], isLoading: loadingPlans } = useQuery<ProductionPlanRow[]>({ queryKey: ["/api/erp/production-plans"], enabled: !!isAuthenticated });
  const { data: productionFacts = [], isLoading: loadingFacts } = useQuery<ProductionFactRow[]>({ queryKey: ["/api/erp/production-facts"], enabled: !!isAuthenticated });
  const { data: mrpRuns = [], isLoading: runsLoading } = useQuery<MRPRun[]>({ queryKey: ["/api/erp/mrp-runs"], enabled: !!isAuthenticated });
  const { data: mrpResults = [] } = useQuery<Array<{ result: MRPResult; material: Product }>>({ queryKey: ["/api/erp/mrp-results"], enabled: !!isAuthenticated && showResults && selectedRun !== null });
  const { data: purchaseRequisitions = [] } = useQuery<PurchaseRequisition[]>({ queryKey: ["/api/erp/purchase-requisitions"], enabled: !!isAuthenticated });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const onSubmit = (data: Record<string, unknown>) => {
    if (editingOperation) updateMutation.mutate({ id: editingOperation.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (op: PlanningOperation) => {
    setEditingOperation(op);
    form.reset({
      papkaOrderId: op.papkaOrderId, operationCode: op.operationCode,
      operationName: op.operationName, sequence: op.sequence,
      equipmentId: op.equipmentId || "", plannedDate: op.plannedDate,
      plannedStartTime: op.plannedStartTime, plannedEndTime: op.plannedEndTime,
      plannedQuantity: op.plannedQuantity, status: op.status,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingOperation(null);
    form.reset({
      papkaOrderId: "", operationCode: "", operationName: "", sequence: 1,
      equipmentId: "", plannedDate: format(new Date(), "yyyy-MM-dd"),
      plannedStartTime: "08:00", plannedEndTime: "17:00", plannedQuantity: 0, status: "planned",
    });
    setIsDialogOpen(true);
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    planForm.reset({ planNumber: "", planDate: new Date().toISOString().split("T")[0], planType: "daily", status: "draft" });
    setOpenPlanDialog(true);
  };

  const handleEditPlan = (plan: ProductionPlanRow) => {
    setEditingPlan(plan);
    planForm.reset({ planNumber: plan.planNumber, planDate: plan.planDate, planType: plan.planType, workCenterId: plan.workCenterId, shift: plan.shift || "", status: plan.status, notes: plan.notes || "" });
    setOpenPlanDialog(true);
  };

  const handleAddFact = () => {
    factForm.reset({ factDate: new Date().toISOString().split("T")[0], factQuantity: 0, goodQuantity: 0, scrapQuantity: 0 });
    setOpenFactDialog(true);
  };

  const getRunResults = (runId: string) =>
    (Array.isArray(mrpResults) ? mrpResults : []).filter((item) => item.result.mrpRunId === runId);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isOpsError) {
    return <div className="container mx-auto p-4"><EPErrorState onRetry={refetchOps} /></div>;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <PlanningBoardHeader
        t={t} lang={lang} operationsData={operationsData}
        onToggleLang={() => setLang(lang === "uz" ? "ru" : "uz")}
        onExport={() => {}} onAddOperation={handleCreate}
      />

      <PlanningFiltersCard t={t} filters={filters} onFiltersChange={setFilters} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="bg-muted/40 p-1 rounded-xl inline-flex">
            <TabsTrigger value="operations" className="rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-operations"><Layers className="h-4 w-4 mr-1 hidden sm:block" />{t.operationsTab}</TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-schedule"><CalendarIcon className="h-4 w-4 mr-1 hidden sm:block" />{t.scheduleTab}</TabsTrigger>
            <TabsTrigger value="plans" className="rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-plans"><CalendarIcon className="h-4 w-4 mr-1 hidden sm:block" />{t.plansTab}</TabsTrigger>
            <TabsTrigger value="facts" className="rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-facts"><FileText className="h-4 w-4 mr-1 hidden sm:block" />{t.factsTab}</TabsTrigger>
            <TabsTrigger value="plan-vs-fact" className="rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-plan-vs-fact"><BarChart3 className="h-4 w-4 mr-1 hidden sm:block" />{t.planVsFactTab}</TabsTrigger>
            <TabsTrigger value="mrp" className="rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-mrp"><Package className="h-4 w-4 mr-1 hidden sm:block" />{t.mrpTab}</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <OperationsTableTab
          t={t} isLoadingOps={isLoadingOps} operationsData={operationsData}
          papkaOrdersList={papkaOrdersList} equipmentList={equipmentList} onEdit={handleEdit}
        />

        <PlanningTabPanels
          lang={lang} t={t} filters={filters}
          isLoadingSchedule={isLoadingSchedule} scheduleData={scheduleData}
          equipmentList={equipmentList} productionPlans={productionPlans} loadingPlans={loadingPlans}
          productionFacts={productionFacts} loadingFacts={loadingFacts}
          mrpRuns={mrpRuns} runsLoading={runsLoading}
          mrpResults={mrpResults} purchaseRequisitions={purchaseRequisitions} products={products}
          onAddPlan={handleAddPlan} onEditPlan={handleEditPlan} onAddFact={handleAddFact}
          onShowRunDialog={() => setShowRunDialog(true)}
          onCalculate={(runId) => calculateMRPMutation.mutate(runId)}
          isCalculating={calculateMRPMutation.isPending}
          onViewResults={(run) => { setSelectedRun(run); setShowResults(true); }}
        />
      </Tabs>

      <OperationFormDialog
        open={isDialogOpen} onOpenChange={setIsDialogOpen} editingOperation={!!editingOperation}
        form={form} onSubmit={onSubmit}
        isSaving={createMutation.isPending || updateMutation.isPending}
        papkaOrdersList={papkaOrdersList} equipmentList={equipmentList} lang={lang} t={t}
      />

      <PlanFormDialog
        open={openPlanDialog} onOpenChange={setOpenPlanDialog} editingPlan={!!editingPlan}
        planForm={planForm} onSubmit={(data) => savePlan.mutate(data)}
        isSaving={savePlan.isPending} workCenters={workCenters} lang={lang} t={t}
      />

      <FactFormDialog
        open={openFactDialog} onOpenChange={setOpenFactDialog}
        factForm={factForm} onSubmit={(data) => saveFact.mutate(data)}
        isSaving={saveFact.isPending} workCenters={workCenters} products={products} lang={lang} t={t}
      />

      <MRPRunDialog
        open={showRunDialog} onOpenChange={setShowRunDialog}
        runForm={runForm} onFormChange={(f) => setRunForm((prev) => ({ ...prev, ...f }))}
        onCreateRun={handleCreateRun} isCreating={createRunMutation.isPending} lang={lang} t={t}
      />

      <MRPResultsDialog
        open={showResults} onOpenChange={setShowResults} selectedRun={selectedRun}
        results={selectedRun ? getRunResults(selectedRun.id).map((r) => ({ result: r.result, material: r.material || undefined })) : []}
        t={t}
      />
    </div>
  );
}
