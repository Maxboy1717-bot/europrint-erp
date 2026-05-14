/**
 * @module MaterialBalance
 * @description Route-level orchestrator for the Material Balance page.
 * Owns all data-fetching (useQuery), mutations, and top-level UI state.
 * Delegates rendering to MaterialBalanceSections and MaterialBalanceDialogs.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Package,
  TrendingDown,
  RefreshCw,
  Warehouse,
  PlusCircle,
} from "lucide-react";

import {
  StatCard,
  type Overview,
  type StockAlert,
  type AlertsResponse,
  type InternalRequestsResponse,
  type ProductionStock,
  type MovementForm,
} from "./MaterialBalanceTypes";
import { AddMovementDialog } from "./MaterialBalanceDialogs";
import {
  OverviewSection,
  AlertsSection,
} from "./MaterialBalanceSections";
import {
  RequestsSection,
  ProductionSection,
} from "./MaterialBalanceTables";
import { EPStatusPill } from "@/components/ep";

const INITIAL_MOVEMENT_FORM: MovementForm = {
  material: "",
  quantity: "",
  type: "kirim",
};

export default function MaterialBalance() {
  const { t } = useTranslation("wms");
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementForm, setMovementForm] =
    useState<MovementForm>(INITIAL_MOVEMENT_FORM);

  const { data: overview, isLoading: overviewLoading } = useQuery<{
    success: boolean;
    data: Overview;
  }>({
    queryKey: ["/api/material-balance/overview"],
  });

  const { data: alerts, isLoading: alertsLoading } =
    useQuery<AlertsResponse>({
      queryKey: ["/api/material-balance/alerts"],
      enabled: activeTab === "alerts" || activeTab === "overview",
    });

  const { data: requests, isLoading: requestsLoading } =
    useQuery<InternalRequestsResponse>({
      queryKey: ["/api/material-balance/internal-requests"],
      enabled: activeTab === "requests",
    });

  const { data: production, isLoading: productionLoading } = useQuery<{
    success: boolean;
    data: ProductionStock[];
  }>({
    queryKey: ["/api/material-balance/production"],
    enabled: activeTab === "production",
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const addMovementMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/material-balance/movements", {
        material: movementForm.material,
        quantity: Number(movementForm.quantity),
        type: movementForm.type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/material-balance/overview"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/material-balance/alerts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/material-balance/production"],
      });
      toast({
        title: "Harakat qo'shildi",
        description: "Material harakati muvaffaqiyatli saqlandi.",
      });
      setMovementDialogOpen(false);
      setMovementForm(INITIAL_MOVEMENT_FORM);
    },
    onError: () =>
      toast({
        title: "Xatolik",
        description: "Harakat qo'shishda xatolik yuz berdi.",
        variant: "destructive",
      }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(
        "PATCH",
        `/api/material-balance/internal-requests/${id}/approve`,
        { note: "Tasdiqlandi" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/material-balance/internal-requests"],
      });
      toast({ title: "So'rov tasdiqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const issueMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(
        "PATCH",
        `/api/material-balance/internal-requests/${id}/issue`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/material-balance/internal-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/material-balance/overview"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/material-balance/alerts"],
      });
      toast({ title: "Material berildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const ov = overview?.data;
  const allAlerts = safeArray<StockAlert>(alerts, "data");
  const criticalAlerts = (Array.isArray(allAlerts) ? allAlerts : []).filter(
    (a) => a.severity === "critical"
  );
  const warningAlerts = (Array.isArray(allAlerts) ? allAlerts : []).filter(
    (a) => a.severity === "warning"
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1
            className="text-2xl font-bold"
            data-testid="text-page-title"
          >
            {t("materialBalans1")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("xomAshyoZaxirasiVaIchki")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="default"
            data-testid="button-add-movement"
            onClick={() => setMovementDialogOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {t("harakatQoshish")}
          </Button>
          <Button
            variant="outline"
            size="default"
            data-testid="button-refresh"
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: ["/api/material-balance/overview"],
              });
              queryClient.invalidateQueries({
                queryKey: ["/api/material-balance/alerts"],
              });
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {/* Movement dialog */}
      <AddMovementDialog
        open={movementDialogOpen}
        onOpenChange={setMovementDialogOpen}
        form={movementForm}
        onChange={(patch) => setMovementForm((f) => ({ ...f, ...patch }))}
        onSubmit={() => addMovementMutation.mutate()}
        isPending={addMovementMutation.isPending}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title={t("jamiMateriallar")}
          value={ov?.totalMaterials ?? 0}
          icon={Package}
          loading={overviewLoading}
        />
        <StatCard
          title={t("umumiyQiymat")}
          value={ov ? formatCurrency(ov.totalStockValue) : "0"}
          icon={Warehouse}
          loading={overviewLoading}
        />
        <StatCard
          title={t("kamQolganlar")}
          value={ov?.lowStockAlerts ?? 0}
          icon={TrendingDown}
          loading={overviewLoading}
          variant="warning"
        />
        <StatCard
          title={t("tuganganlar")}
          value={ov?.criticalStockCount ?? 0}
          icon={AlertTriangle}
          loading={overviewLoading}
          variant="critical"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            {t("umumiy")}
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            Ogohlantirishlar
            {(alerts?.total ?? 0) > 0 && (
              <EPStatusPill tone="danger" className="ml-2">
                {alerts?.total}
              </EPStatusPill>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">
            {t("ichkiSorovlar")}
          </TabsTrigger>
          <TabsTrigger value="production" data-testid="tab-production">
            {t("ishlabChiqarish1")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewSection
            criticalAlerts={criticalAlerts}
            warningAlerts={warningAlerts}
            overviewLoading={overviewLoading}
          />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsSection
            alerts={alerts}
            allAlerts={allAlerts}
            alertsLoading={alertsLoading}
          />
        </TabsContent>

        <TabsContent value="requests">
          <RequestsSection
            requests={requests}
            requestsLoading={requestsLoading}
            onApprove={(id) => approveMutation.mutate(id)}
            onIssue={(id) => issueMutation.mutate(id)}
            approvePending={approveMutation.isPending}
            issuePending={issueMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="production">
          <ProductionSection
            production={production}
            productionLoading={productionLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
