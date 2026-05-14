/** @module BudgetManagement @description Route-level page component. Owns all state, React Query queries and mutations, and composes sub-components from BudgetManagementDialogs and BudgetManagementSections. */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, fetchWithAuth } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";

import {
  budgetFormSchema,
  budgetLineFormSchema,
  getStatusBadge,
  type Budget,
  type BudgetDetail,
  type VarianceData,
  type Account,
  type CostCenter,
  type BudgetFormData,
  type BudgetLineFormData,
} from "./BudgetManagementTypes";

import { CreateBudgetDialog, AddBudgetLineDialog } from "./BudgetManagementDialogs";

import {
  DetailStats,
  BudgetLinesTable,
  VarianceChart,
  ListStats,
  BudgetListTable,
} from "./BudgetManagementSections";
import { EPErrorState, EPPageHeader } from "@/components/ep";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function BudgetManagement() {
  const { t } = useTranslation("finance");
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addLineDialogOpen, setAddLineDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  const currentYear = new Date().getFullYear();

  // Forms
  const budgetForm = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      budgetName: "",
      fiscalYear: currentYear,
      periodType: "annual",
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      totalAmount: 0,
      status: "draft",
    },
  });

  const lineForm = useForm<BudgetLineFormData>({
    resolver: zodResolver(budgetLineFormSchema),
    defaultValues: { accountId: "", costCenterId: "", plannedAmount: 0, notes: "" },
  });

  // Queries
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filterStatus && filterStatus !== "all") params.append("status", filterStatus);
    if (filterYear && filterYear !== "all") params.append("fiscalYear", filterYear);
    return params.toString();
  };

  const {
    data: budgets = [],
    isLoading: budgetsLoading,
    isError: budgetsError,
    refetch: refetchBudgets,
  } = useQuery<Budget[]>({
    queryKey: ["/api/budgets", filterStatus, filterYear],
    enabled: isAuthenticated,
    queryFn: async () => {
      const qs = buildQueryParams();
      return (await fetchWithAuth(`/api/budgets${qs ? `?${qs}` : ""}`)) as Budget[];
    },
  });

  const { data: budgetDetail, isLoading: detailLoading } = useQuery<BudgetDetail>({
    queryKey: ["/api/budgets", selectedBudgetId],
    enabled: !!selectedBudgetId,
  });

  const { data: varianceData } = useQuery<VarianceData>({
    queryKey: ["/api/budgets", selectedBudgetId, "variance"],
    enabled: !!selectedBudgetId,
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/gl/accounts"],
  });

  const { data: costCenters = [] } = useQuery<CostCenter[]>({
    queryKey: ["/api/fi/cost-centers"],
  });

  // Derived stats
  const safeList = Array.isArray(budgets) ? budgets : [];
  const stats = {
    total: safeList.length,
    draft: safeList.filter((b) => b.status === "draft").length,
    approved: safeList.filter((b) => b.status === "approved").length,
    active: safeList.filter((b) => b.status === "active").length,
    closed: safeList.filter((b) => b.status === "closed").length,
  };

  // Mutations
  const createBudgetMutation = useMutation({
    mutationFn: (data: BudgetFormData) => apiRequest("POST", "/api/budgets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setCreateDialogOpen(false);
      budgetForm.reset();
      toast({ title: tCommon("success"), description: tCommon("operationSuccess") });
    },
    onError: () => {
      toast({ title: tCommon("error"), description: tCommon("operationFailed"), variant: "destructive" });
    },
  });

  const addLineMutation = useMutation({
    mutationFn: (data: BudgetLineFormData) =>
      apiRequest("POST", `/api/budgets/${selectedBudgetId}/lines`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets", selectedBudgetId] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets", selectedBudgetId, "variance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setAddLineDialogOpen(false);
      lineForm.reset();
      toast({ title: tCommon("success"), description: tCommon("operationSuccess") });
    },
    onError: () => {
      toast({ title: tCommon("error"), description: tCommon("operationFailed"), variant: "destructive" });
    },
  });

  const handleCreateBudget = (data: BudgetFormData) => createBudgetMutation.mutate(data);

  const handleAddLine = (data: BudgetLineFormData) =>
    addLineMutation.mutate({
      ...data,
      costCenterId: data.costCenterId === "__none__" ? undefined : data.costCenterId,
    });

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (budgetsError) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <EPErrorState onRetry={refetchBudgets} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Detail view
  // ---------------------------------------------------------------------------

  if (selectedBudgetId && budgetDetail) {
    return (
      <div className="space-y-6" data-testid="budget-detail-view">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedBudgetId(null)}
              className="text-foreground hover:bg-muted/60"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Byudjet Boshqaruvi</b></>}
        title="Byudjet Boshqaruvi"
      />
            <div className="ml-4">{getStatusBadge(budgetDetail.status)}</div>
          </div>
        </div>

        <div className="space-y-6">
          <DetailStats budgetDetail={budgetDetail} varianceData={varianceData} />

          <div className="bg-card rounded-xl p-6" data-testid="card-budget-lines">
            <div className="flex flex-row items-center justify-between gap-2 mb-6">
              <h2 className="text-xl font-semibold text-foreground">{t("budgetLines")}</h2>
              <AddBudgetLineDialog
                open={addLineDialogOpen}
                onOpenChange={setAddLineDialogOpen}
                form={lineForm}
                onSubmit={handleAddLine}
                isPending={addLineMutation.isPending}
                accounts={Array.isArray(accounts) ? accounts : []}
                costCenters={Array.isArray(costCenters) ? costCenters : []}
              />
            </div>
            <BudgetLinesTable budgetDetail={budgetDetail} detailLoading={detailLoading} />
          </div>

          {varianceData && <VarianceChart varianceData={varianceData} />}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // List view
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Byudjet Boshqaruvi</b></>}
        title="Byudjet Boshqaruvi"
      />
        <CreateBudgetDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          form={budgetForm}
          onSubmit={handleCreateBudget}
          isPending={createBudgetMutation.isPending}
        />
      </div>

      <ListStats stats={stats} />

      <BudgetListTable
        budgets={safeList}
        budgetsLoading={budgetsLoading}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        currentYear={currentYear}
        onSelectBudget={setSelectedBudgetId}
      />
    </div>
  );
}
