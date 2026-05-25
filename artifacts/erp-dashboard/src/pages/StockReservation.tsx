/**
 * @module StockReservation
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Package, Brain, History } from "lucide-react";

import { StatusCards } from "@/components/wms/reservation/StatusCards";
import { AIReservationTab } from "@/components/wms/reservation/AIReservationTab";
import { BatchesTab } from "@/components/wms/reservation/BatchesTab";
import { HistoryTab } from "@/components/wms/reservation/HistoryTab";
import { AddBatchDialog } from "@/components/wms/reservation/AddBatchDialog";
import { translations, STATUS_COLORS, GRADE_COLORS } from "@/components/wms/reservation/translations";
import { useReservationMutations } from "@/components/wms/reservation/useReservationMutations";
import {
  DashboardData,
  MaterialBatchData,
  OptimizationResult,
  ReservationRequestData,
} from "@/components/wms/reservation/types";
import { EPErrorState } from "@/components/ep";

export default function StockReservation() {
  const { toast } = useToast();
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState("ai-reservation");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [aiForm, setAiForm] = useState({
    materialType: "",
    requiredQuantity: "",
    unit: "kg",
    requiredByDate: "",
    priority: "normal",
    notes: "",
  });

  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    batchNumber: "",
    materialName: "",
    materialType: "",
    quantity: "",
    availableQuantity: "",
    unit: "kg",
    expiryDate: "",
    receivedDate: "",
    location: "",
    costPerUnit: "",
    qualityGrade: "A",
  });

  const { data: dashboard, isLoading: dashboardLoading, isError, error: dashboardError, refetch: refetchDashboard } = useQuery<DashboardData>({
    queryKey: ["/api/ai-reservation/dashboard"],
  });

  const { data: batches = [], isLoading: batchesLoading } = useQuery<MaterialBatchData[]>({
    queryKey: ["/api/ai-reservation/batches", { materialType: typeFilter, status: statusFilter }],
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<ReservationRequestData[]>({
    queryKey: ["/api/ai-reservation/requests"],
  });

  const {
    optimizeMutation,
    createRequestMutation,
    confirmMutation,
    cancelRequestMutation,
    addBatchMutation,
  } = useReservationMutations({
    lang,
    setOptimizationResult,
    setIsAddBatchOpen,
    setBatchForm,
  });

  const handleOptimize = () => {
    if (!aiForm.materialType || !aiForm.requiredQuantity) {
      toast({
        title: lang === "uz" ? "Material turi va miqdorni kiriting" : "Укажите тип материала и количество",
        variant: "destructive",
      });
      return;
    }
    optimizeMutation.mutate({
      materialType: aiForm.materialType,
      quantity: parseFloat(aiForm.requiredQuantity),
    });
  };

  const handleCreateRequest = () => {
    if (!aiForm.materialType || !aiForm.requiredQuantity) return;
    createRequestMutation.mutate({
      materialType: aiForm.materialType,
      requiredQuantity: parseFloat(aiForm.requiredQuantity),
      unit: aiForm.unit,
      requiredByDate: aiForm.requiredByDate || null,
      priority: aiForm.priority,
      notes: aiForm.notes || null,
    });
  };

  const handleAddBatch = () => {
    if (!batchForm.batchNumber || !batchForm.materialName || !batchForm.quantity) {
      toast({ title: lang === "uz" ? "Ma'lumotlarni to'ldiring" : "Заполните данные", variant: "destructive" });
      return;
    }
    const qty = parseFloat(batchForm.quantity);
    addBatchMutation.mutate({
      batchNumber: batchForm.batchNumber,
      materialName: batchForm.materialName,
      materialType: batchForm.materialType || null,
      quantity: qty,
      availableQuantity: parseFloat(batchForm.availableQuantity) || qty,
      unit: batchForm.unit,
      expiryDate: batchForm.expiryDate || null,
      receivedDate: batchForm.receivedDate || null,
      location: batchForm.location || null,
      costPerUnit: parseFloat(batchForm.costPerUnit) || 0,
      qualityGrade: batchForm.qualityGrade,
    });
  };

  const materialTypes = useMemo(() => {
    return dashboard?.materialTypes || [];
  }, [dashboard]);

  const filteredBatches = useMemo(() => {
    return (Array.isArray(batches) ? batches : []).filter((b) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !b.batchNumber.toLowerCase().includes(q) &&
          !b.materialName.toLowerCase().includes(q) &&
          !(b.materialType || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [batches, searchQuery]);

  if (dashboardError) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <EPErrorState onRetry={refetchDashboard} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={lang === "uz" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("uz")}
            data-testid="button-lang-uz"
          >
            UZ
          </Button>
          <Button
            variant={lang === "ru" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("ru")}
            data-testid="button-lang-ru"
          >
            RU
          </Button>
        </div>
      </div>

      <StatusCards dashboard={dashboard} isLoading={dashboardLoading} t={t} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ai-reservation" data-testid="tab-ai-reservation">
            <Brain className="w-4 h-4 mr-2" />
            {t.tabs.aiReservation}
          </TabsTrigger>
          <TabsTrigger value="batches" data-testid="tab-batches">
            <Package className="w-4 h-4 mr-2" />
            {t.tabs.batches}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="w-4 h-4 mr-2" />
            {t.tabs.history}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-reservation" className="space-y-6 mt-4">
          <AIReservationTab
            t={t}
            aiForm={aiForm}
            setAiForm={setAiForm}
            materialTypes={materialTypes}
            handleOptimize={handleOptimize}
            optimizePending={optimizeMutation.isPending}
            optimizationResult={optimizationResult}
            handleCreateRequest={handleCreateRequest}
            createRequestPending={createRequestMutation.isPending}
            GRADE_COLORS={GRADE_COLORS}
            onClearRecommendation={() => setOptimizationResult(null)}
          />
        </TabsContent>

        <TabsContent value="batches" className="mt-4">
          <BatchesTab
            t={t}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            materialTypes={materialTypes}
            setIsAddBatchOpen={setIsAddBatchOpen}
            filteredBatches={filteredBatches}
            isLoading={batchesLoading}
            STATUS_COLORS={STATUS_COLORS}
            GRADE_COLORS={GRADE_COLORS}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab
            t={t}
            requests={requests}
            isLoading={requestsLoading}
            STATUS_COLORS={STATUS_COLORS}
            confirmMutation={(id) => confirmMutation.mutate(id)}
            confirmPending={confirmMutation.isPending}
            cancelMutation={(id) => cancelRequestMutation.mutate(id)}
            cancelPending={cancelRequestMutation.isPending}
            onViewRequest={(id) => {
              const req = (Array.isArray(requests) ? requests : []).find((r) => r.id === id);
              if (req) toast({ title: t.history.title, description: `#${req.id} — ${req.materialType}` });
            }}
          />
        </TabsContent>
      </Tabs>

      <AddBatchDialog
        t={t}
        lang={lang}
        isOpen={isAddBatchOpen}
        onOpenChange={setIsAddBatchOpen}
        batchForm={batchForm}
        setBatchForm={setBatchForm}
        handleAddBatch={handleAddBatch}
        isPending={addBatchMutation.isPending}
      />
    </div>
  );
}
