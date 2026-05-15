/** @module QCModule @description React page component for Quality Control. Manages state, queries, mutations, and top-level layout. Delegates UI to QCModuleSections, QCModuleDialogs, and the existing qc/* sub-tabs. */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlaskConical, RefreshCw } from "lucide-react";
import { apiRequest, queryClient, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/lib/i18n";
import { QCCertificateGenerator } from "./qc/QCCertificateGenerator";
import { QCStandardsTab } from "./qc/QCStandardsTab";
import { QCReclamationsTab } from "./qc/QCReclamationsTab";
import { QCBraksTab } from "./qc/QCBraksTab";
import { QCSupplierQualityTab } from "./qc/QCSupplierQualityTab";
import { QCAITrendTab } from "./qc/QCAITrendTab";
import { QCSPCTab } from "./qc/QCSPCTab";
import { QCAIAnalysisTab } from "./qc/QCAIAnalysisTab";
import { QCParameterDialog } from "./qc/QCParameterDialog";

import { ParameterTableSection, RecentTestsSection, ControlChartCard } from "./QCModuleSections";
import { NewTestDialog } from "./QCModuleDialogs";
import {
  CATEGORY_TABS,
  PARAMETER_TABS,
  type QcParameter,
  type QcMaterialTest,
  type PapkaOrder,
  type MaterialCard,
  type GroupedParametersData,
  type CreateTestPayload,
} from "./QCModuleTypes";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";

// ─── Route → initial tab ──────────────────────────────────────────────────────

function getInitialTab(location: string): string {
  if (location.includes("/qc/standards")) return "standards";
  if (location.includes("/qc/ai-analysis")) return "ai_analysis";
  return "physical";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QCModule() {
  const { toast } = useToast();
  const { t } = useTranslation("production");
  const { t: tCommon } = useTranslation('common');
  const [location] = useLocation();

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState(() => getInitialTab(location));
  useEffect(() => { setActiveTab(getInitialTab(location)); }, [location]);

  // ── Dialog / selection state ──
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testValues, setTestValues] = useState<Record<string, number>>({});
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedParameterId, setSelectedParameterId] = useState<string | null>(null);
  const [parameterDialogOpen, setParameterDialogOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<QcParameter | null>(null);
  const [confirmDeleteParamId, setConfirmDeleteParamId] = useState<string | null>(null);
  const [parameterCategory, setParameterCategory] = useState<string>("physical");

  // ── Queries ──
  const { data: parametersData, isLoading: parametersLoading, isError, error, refetch } =
    useQuery<GroupedParametersData>({ queryKey: ["/api/qc/parameters/grouped"] });

  const { data: ordersData } = useQuery<PapkaOrder[]>({
    queryKey: ["/api/papka-orders"],
    queryFn: async () => {
      const res = (await apiRequest('GET', "/api/papka-orders?limit=50")) as unknown as Response;
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : (d.items ?? d.data ?? d.orders ?? []);
    },
  });

  const { data: materialsData } = useQuery<MaterialCard[]>({
    queryKey: ["/api/materials/cards"],
    queryFn: async () => {
      const res = (await apiRequest('GET', "/api/materials/cards")) as unknown as Response;
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: testsData, isLoading: testsLoading } = useQuery<QcMaterialTest[]>({
    queryKey: ["/api/qc/tests/recent"],
    queryFn: async () => {
      const res = (await apiRequest('GET', "/api/qc/tests/recent?limit=20")) as unknown as Response;
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: controlChartsData } = useQuery<unknown[]>({
    queryKey: ["/api/qc/control-charts", selectedParameterId],
    queryFn: () => apiRequest("GET", `/api/qc/control-charts/${selectedParameterId}`),
    enabled: !!selectedParameterId,
    staleTime: 5 * 60_000,
  });

  // ── Mutations ──
  const createTestMutation = useMutation({
    mutationFn: (data: CreateTestPayload) => apiRequest<QcMaterialTest>("POST", "/api/qc/tests", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/tests"] });
      setTestDialogOpen(false); setTestValues({}); setSelectedTestId(data.id);
      toast({ title: tCommon("success"), description: tCommon("createdSuccessfully") });
    },
    onError: (error: Error) => toast({ title: tCommon("error"), description: error.message, variant: "destructive" }),
  });
  const aiAnalyzeMutation = useMutation({
    mutationFn: (testId: string) =>
      apiRequest<{ test: QcMaterialTest; analysis: Record<string, unknown> | null; confidenceScore: number }>(
        "POST", `/api/qc/tests/${testId}/ai-analyze`, {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/tests"] });
      toast({ title: tCommon("success"), description: `${data.analysis?.riskLevel ?? tCommon("unknown")}` });
    },
    onError: (error: Error) => toast({ title: tCommon("error"), description: error.message, variant: "destructive" }),
  });
  const seedParametersMutation = useMutation({
    mutationFn: () => apiRequest<{ success: boolean }>("POST", "/api/qc/seed-parameters", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/parameters/grouped"] });
      toast({ title: tCommon("success"), description: tCommon("savedSuccessfully") });
    },
    onError: (error: Error) => toast({ title: tCommon("error"), description: error.message, variant: "destructive" }),
  });
  const deleteParameterMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/qc/parameters/${id}`); return id; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/parameters/grouped"] });
      toast({ title: tCommon("success"), description: tCommon("deletedSuccessfully") });
    },
    onError: (error: Error) => toast({ title: tCommon("error"), description: error.message, variant: "destructive" }),
  });

  const parameters = parametersData?.grouped ?? {};
  const orders = (Array.isArray(ordersData) ? ordersData : []) as PapkaOrder[];
  const materials = (Array.isArray(materialsData) ? materialsData : []) as MaterialCard[];
  const tests = (Array.isArray(testsData) ? testsData : []) as QcMaterialTest[];
  const openParameterDialog = (category: string, parameter?: QcParameter) => {
    setParameterCategory(category); setEditingParameter(parameter ?? null); setParameterDialogOpen(true);
  };

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("sifatNazorati")}</b></>}
        title={t("sifatNazorati")}
        subtitle={t("qualityRate")}
      />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => seedParametersMutation.mutate()}
            disabled={seedParametersMutation.isPending}
            data-testid="button-seed-parameters"
          >
            {seedParametersMutation.isPending ? (
              <EPLoader className="w-4 h-4 mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {tCommon("upload")}
          </Button>
          <Button size="sm" onClick={() => setTestDialogOpen(true)} data-testid="button-new-test">
            <FlaskConical className="w-4 h-4 mr-2" />
            {tCommon("create")}
          </Button>
        </div>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="inline-flex h-auto p-1 gap-1">
            {CATEGORY_TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 px-3 py-2"
                data-testid={`tab-${tab.value}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {/* Parameter tabs (physical / mechanical / …) */}
        {PARAMETER_TABS.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ParameterTableSection
                  tab={tab}
                  parameters={parameters[tab.value] ?? []}
                  isLoading={parametersLoading}
                  selectedParameterId={selectedParameterId}
                  onAddParameter={() => openParameterDialog(tab.value)}
                  onEditParameter={param => openParameterDialog(tab.value, param)}
                  onDeleteParameter={id => setConfirmDeleteParamId(id)}
                  onToggleControlChart={id =>
                    setSelectedParameterId(prev => (prev === id ? null : id))
                  }
                />
              </div>
              <div className="space-y-4">
                {selectedParameterId && (
                  <ControlChartCard dataPoints={controlChartsData} />
                )}
                <RecentTestsSection
                  tests={tests}
                  isLoading={testsLoading}
                  tabValue={tab.value}
                  selectedTestId={selectedTestId}
                  isAiAnalyzing={aiAnalyzeMutation.isPending}
                  onSelectTest={setSelectedTestId}
                  onAiAnalyze={id => aiAnalyzeMutation.mutate(id)}
                  titleLabel={t("qualityControl")}
                />
              </div>
            </div>
          </TabsContent>
        ))}

        {/* Delegated special tabs */}
        <TabsContent value="standards" className="space-y-4"><QCStandardsTab /></TabsContent>
        <TabsContent value="ai_analysis" className="space-y-4"><QCAIAnalysisTab /></TabsContent>
        <TabsContent value="reclamations" className="space-y-4"><QCReclamationsTab /></TabsContent>
        <TabsContent value="braks" className="space-y-4"><QCBraksTab /></TabsContent>
        <TabsContent value="supplier_quality" className="space-y-4"><QCSupplierQualityTab /></TabsContent>
        <TabsContent value="certificate" className="space-y-4"><QCCertificateGenerator /></TabsContent>
        <TabsContent value="ai_trend" className="space-y-4"><QCAITrendTab /></TabsContent>
        <TabsContent value="spc" className="space-y-4"><QCSPCTab /></TabsContent>
      </Tabs>

      {/* New test dialog */}
      <NewTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        parameters={parameters}
        orders={orders}
        materials={materials}
        testValues={testValues}
        isPending={createTestMutation.isPending}
        initialCategory={
          activeTab !== "standards" && activeTab !== "ai_analysis" ? activeTab : "physical"
        }
        onTestValuesChange={setTestValues}
        onSubmit={payload => createTestMutation.mutate(payload)}
      />

      {/* Parameter create/edit dialog */}
      <QCParameterDialog
        open={parameterDialogOpen}
        onClose={() => {
          setParameterDialogOpen(false);
          setEditingParameter(null);
        }}
        category={parameterCategory}
        editingParameter={editingParameter}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDeleteParamId !== null}
        onOpenChange={open => { if (!open) setConfirmDeleteParamId(null); }}
        title={t("parametrniOchirish")}
        description={t("ushbuSifatParametriniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteParamId !== null) deleteParameterMutation.mutate(confirmDeleteParamId);
        }}
      />
    </div>
  );
}
