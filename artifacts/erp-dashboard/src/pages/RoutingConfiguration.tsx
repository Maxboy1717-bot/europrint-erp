/**
 * @module RoutingConfiguration
 * @description Route-level orchestrator for the Routing Configuration page.
 * Owns all React Query hooks, mutations, and local UI state; delegates
 * rendering to section and dialog sub-modules.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings } from "lucide-react";

import {
  type RoutingWithProduct,
  type OperationWithWorkCenter,
  type Product,
  type WorkCenter,
  type RoutingFormState,
  type OperationFormState,
  routingFormSchema,
  operationFormSchema,
  defaultRoutingForm,
  defaultOperationForm,
} from "./RoutingConfigurationTypes";

import {
  RoutingLoadingState,
  RoutingErrorState,
  RoutingEmptyState,
  RoutingSearchBar,
  RoutingList,
} from "./RoutingConfigurationSections";

import {
  CreateRoutingDialog,
  ManageOperationsDialog,
  AddOperationDialog,
} from "./RoutingConfigurationDialogs";

import { buildRoutingLabels } from "./RoutingConfigurationLabels";
import { EPPageHeader } from "@/components/ep";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function RoutingConfiguration() {
  const { t } = useTranslation("production");
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // ---- local state --------------------------------------------------------
  const [showRoutingDialog, setShowRoutingDialog] = useState(false);
  const [showOperationDialog, setShowOperationDialog] = useState(false);
  const [selectedRouting, setSelectedRouting] = useState<RoutingWithProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [routingForm, setRoutingForm] = useState<RoutingFormState>(defaultRoutingForm);
  const [operationForm, setOperationForm] = useState<OperationFormState>(defaultOperationForm);

  // ---- queries ------------------------------------------------------------
  const {
    data: routings = [],
    isLoading: routingsLoading,
    isError,
    refetch,
  } = useQuery<RoutingWithProduct[]>({
    queryKey: ["/api/erp/routings"],
    enabled: !!isAuthenticated,
  });

  const { data: operations = [] } = useQuery<OperationWithWorkCenter[]>({
    queryKey: ["/api/erp/routing-operations"],
    enabled: !!isAuthenticated,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/erp/products"],
    enabled: !!isAuthenticated,
  });

  const { data: workCenters = [] } = useQuery<WorkCenter[]>({
    queryKey: ["/api/erp/work-centers"],
    enabled: !!isAuthenticated,
  });

  // ---- mutations ----------------------------------------------------------
  const createRoutingMutation = useMutation({
    mutationFn: (data: RoutingFormState) => apiRequest("POST", "/api/erp/routings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/routings"] });
      setShowRoutingDialog(false);
      setRoutingForm(defaultRoutingForm());
      toast({ title: t("routingCreated") });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon("error"), description: t("routingCreateError") });
    },
  });

  const createOperationMutation = useMutation({
    mutationFn: (data: OperationFormState & { routingId: string }) =>
      apiRequest("POST", "/api/erp/routing-operations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/routing-operations"] });
      setShowOperationDialog(false);
      setOperationForm(defaultOperationForm());
      toast({ title: t("operationAdded") });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon("error"), description: t("operationAddError") });
    },
  });

  const deleteRoutingMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/erp/routings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/routings"] });
      toast({ title: t("routingDeleted") });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon("error"), description: t("routingDeleteError") });
    },
  });

  const deleteOperationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/erp/routing-operations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/routing-operations"] });
      toast({ title: t("operationDeleted") });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon("error"), description: t("operationDeleteError") });
    },
  });

  // ---- handlers -----------------------------------------------------------
  const handleCreateRouting = () => {
    const result = routingFormSchema.safeParse(routingForm);
    if (!result.success) {
      toast({ variant: "destructive", title: tCommon("error"), description: result.error.errors[0].message });
      return;
    }
    createRoutingMutation.mutate(routingForm);
  };

  const handleCreateOperation = () => {
    if (!selectedRouting) {
      toast({ variant: "destructive", title: tCommon("error"), description: t("fillAllFields") });
      return;
    }
    const result = operationFormSchema.safeParse(operationForm);
    if (!result.success) {
      toast({ variant: "destructive", title: tCommon("error"), description: result.error.errors[0].message });
      return;
    }
    createOperationMutation.mutate({ ...operationForm, routingId: selectedRouting.routing.id });
  };

  // ---- derived state ------------------------------------------------------
  const filteredRoutings = (Array.isArray(routings) ? routings : []).filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.routing.routingNumber.toLowerCase().includes(q) ||
      item.product?.name?.toLowerCase().includes(q) ||
      item.product?.code?.toLowerCase().includes(q)
    );
  });

  const labels = buildRoutingLabels(t, tCommon);

  // ---- early returns ------------------------------------------------------
  if (routingsLoading) return <RoutingLoadingState />;
  if (isError) return <RoutingErrorState onRetry={refetch} />;
  if (!routings || routings.length === 0) {
    return <RoutingEmptyState noDataLabel={t("noDataYet")} hintLabel={t("addNewRecordHint")} />;
  }

  // ---- render -------------------------------------------------------------
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("routingKonfiguratsiyasi")}</b></>}
        title={t("routingKonfiguratsiyasi")}
        subtitle={t("routingConfigDesc")}
      />
          </div>
        </div>
        <Button
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
          onClick={() => setShowRoutingDialog(true)}
          data-testid="button-create-routing"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("newRouting")}
        </Button>
      </div>

      <RoutingSearchBar value={searchTerm} onChange={setSearchTerm} placeholder={t("searchRouting")} />

      <RoutingList
        routings={filteredRoutings}
        operations={operations}
        isLoading={false}
        notFoundLabel={t("routingNotFound")}
        cardLabels={labels.cardLabels}
        onManage={setSelectedRouting}
        onDelete={(id) => deleteRoutingMutation.mutate(id)}
        deletingMutationPending={deleteRoutingMutation.isPending}
      />

      <CreateRoutingDialog
        open={showRoutingDialog}
        onOpenChange={setShowRoutingDialog}
        form={routingForm}
        onFormChange={setRoutingForm}
        products={products}
        isPending={createRoutingMutation.isPending}
        onSubmit={handleCreateRouting}
        labels={labels.createRoutingLabels}
      />

      <ManageOperationsDialog
        selectedRouting={selectedRouting}
        onClose={() => setSelectedRouting(null)}
        operations={operations}
        onAddOperation={() => setShowOperationDialog(true)}
        onDeleteOperation={(id) => deleteOperationMutation.mutate(id)}
        isDeletingOperation={deleteOperationMutation.isPending}
        labels={labels.manageOpsLabels}
      />

      <AddOperationDialog
        open={showOperationDialog}
        onOpenChange={setShowOperationDialog}
        form={operationForm}
        onFormChange={setOperationForm}
        workCenters={workCenters}
        isPending={createOperationMutation.isPending}
        onSubmit={handleCreateOperation}
        labels={labels.addOpLabels}
      />
    </div>
  );
}
