/**
 * @module TechCards
 * @description Route-level orchestrator for the Texnologik Kartalar page.
 * Owns all state, React Query hooks, and event handlers; delegates rendering
 * to TechCardsSections and TechCardsDialogs.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { FileText, Plus } from "lucide-react";

import {
  mapBackendCard,
  buildPdfHtml,
  mapBomRow,
  mapRouteRow,
  mapVersionRow,
  EMPTY_CREATE_FORM,
  type TechCard,
  type OptimizeResult,
  type PapkaOrder,
  type BomRow,
  type RouteRow,
  type VersionRow,
  type CreateCardForm,
} from "./TechCardsTypes";
import { StatsBar, PendingOrdersPanel, CardsGrid } from "./TechCardsSections";
import {
  ViewCardDialog,
  GenerateCardDialog,
  OptimizeResultPanel,
} from "./TechCardsDialogs";
import { CreateCardDialog } from "./TechCardsMaster";
import { Button } from "@/components/ui/button";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function TechCards() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // UI state
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<TechCard | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null);
  const [genDialog, setGenDialog] = useState(false);
  const [genOrder, setGenOrder] = useState<PapkaOrder | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCardForm>(EMPTY_CREATE_FORM);

  // Data fetching
  const { data: cards = [], isLoading } = useQuery<TechCard[]>({
    queryKey: ["/api/technology/cards"],
    queryFn: async () => {
      const raw: Record<string, unknown>[] = await apiRequest('GET', "/api/technology/cards");
      return (Array.isArray(raw) ? raw : []).map(mapBackendCard);
    },
  });

  const { data: orders = [] } = useQuery<PapkaOrder[]>({
    queryKey: ["/api/papka-orders", "pending_tech"],
    queryFn: async () => {
      let d: unknown;
      try { d = await apiRequest<unknown>('GET', "/api/papka-orders?status=pending_tech"); }
      catch { return []; }
      if (Array.isArray(d)) return d as PapkaOrder[];
      const obj = d as { items?: PapkaOrder[]; data?: PapkaOrder[]; orders?: PapkaOrder[] };
      return obj.items ?? obj.data ?? obj.orders ?? [];
    },
  });

  // Child rows for the currently-open card (master detail)
  const selectedId = selectedCard?.id;
  const { data: bom = [] } = useQuery<BomRow[]>({
    queryKey: ["/api/technology/cards", selectedId, "bom"],
    enabled: !!selectedId && showViewModal,
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>[]>('GET', `/api/technology/cards/${selectedId}/bom`);
      return (Array.isArray(raw) ? raw : []).map(mapBomRow);
    },
  });
  const { data: routes = [] } = useQuery<RouteRow[]>({
    queryKey: ["/api/technology/cards", selectedId, "routes"],
    enabled: !!selectedId && showViewModal,
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>[]>('GET', `/api/technology/cards/${selectedId}/routes`);
      return (Array.isArray(raw) ? raw : []).map(mapRouteRow);
    },
  });
  const { data: versions = [] } = useQuery<VersionRow[]>({
    queryKey: ["/api/technology/cards", selectedId, "versions"],
    enabled: !!selectedId && showViewModal,
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>[]>('GET', `/api/technology/cards/${selectedId}/versions`);
      return (Array.isArray(raw) ? raw : []).map(mapVersionRow);
    },
  });

  const invalidateCard = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ["/api/technology/cards"] });
    if (id) ["bom", "routes", "versions"].forEach((k) => queryClient.invalidateQueries({ queryKey: ["/api/technology/cards", id, k] }));
  };

  // Mutations
  const optimizeMutation = useMutation({
    mutationFn: (cardId: string) => apiRequest<OptimizeResult>('GET', `/api/technology/cards/${cardId}/optimize`),
    onSuccess: (data) => setOptimizeResult(data),
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: CreateCardForm) => apiRequest('POST', "/api/technology/cards", {
      code: form.code.trim() || undefined,
      name: form.name.trim(),
      direction: form.direction || undefined,
      materialType: form.materialType.trim() || undefined,
      productType: form.productType.trim() || undefined,
      formatA: form.formatA ? Number(form.formatA) : undefined,
      formatB: form.formatB ? Number(form.formatB) : undefined,
      formatCode: form.formatCode.trim() || undefined,
      gofraProfile: form.gofraProfile.trim() || undefined,
      scrapPct: form.scrapPct ? Number(form.scrapPct) : undefined,
    }),
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Texkarta yaratildi" });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      invalidateCard();
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const gateMutation = useMutation({
    mutationFn: ({ id, gate }: { id: string; gate: "lab" | "maket" }) =>
      apiRequest('POST', `/api/technology/cards/${id}/${gate === "lab" ? "lab-approve" : "maket-approve"}`),
    onSuccess: (data, vars) => {
      const updated = mapBackendCard(data as Record<string, unknown>);
      setSelectedCard((prev) => (prev && prev.id === vars.id ? updated : prev));
      invalidateCard(vars.id);
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const addBomMutation = useMutation({
    mutationFn: ({ id, item }: { id: string; item: { materialCode: string; quantity: number; unit: string; layer?: string } }) =>
      apiRequest('POST', `/api/technology/cards/${id}/bom`, item),
    onSuccess: (_d, vars) => invalidateCard(vars.id),
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const addRouteMutation = useMutation({
    mutationFn: ({ id, route }: { id: string; route: { opSeq: number; operation: string; normPerHour?: number; minRazryad?: number } }) =>
      apiRequest('POST', `/api/technology/cards/${id}/routes`, route),
    onSuccess: (_d, vars) => invalidateCard(vars.id),
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const masterBusy = gateMutation.isPending || addBomMutation.isPending || addRouteMutation.isPending;

  // Handlers
  const handleGenerateCard = async (order: PapkaOrder) => {
    setGenLoading(true);
    try {
      await apiRequest("POST", "/api/technology/cards/generate", {
        formatA: order.formatA || 400,
        formatB: order.formatB || 300,
        productType: "3_layer",
        papkaOrderId: order.id,
      });
      toast({ title: "Muvaffaqiyat", description: "AI texnologik karta yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/technology/cards"] });
      setGenDialog(false);
    } catch (err: unknown) {
      const e = err as Error;
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    } finally {
      setGenLoading(false);
    }
  };

  const handleViewCard = async (card: TechCard) => {
    try {
      const res = await apiRequest<Record<string, unknown>>('GET', `/api/technology/cards/${card.id}`);
      setSelectedCard(mapBackendCard(res));
    } catch {
      setSelectedCard(card);
    }
    setShowViewModal(true);
  };

  const handleExportPDF = (card: TechCard) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(buildPdfHtml(card));
      printWindow.document.close();
      toast({
        title: "PDF chop etish",
        description: `${card.name} — chop etish oynasi ochildi`,
      });
    }
  };

  const handleOpenGenDialog = (order: PapkaOrder) => {
    setGenOrder(order);
    setGenDialog(true);
  };

  if (isLoading) return <div className="p-6">{t("Yuklanmoqda...")}</div>;

  const safeCards = Array.isArray(cards) ? cards : [];

  return (
    <div className="space-y-6" data-testid="page-tech-cards">
      <EPPageHeader
        icon={<FileText className="h-5 w-5" />}
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("texnologikKartalar")}</b></>}
        title={t("texnologikKartalar")}
        subtitle={t("ishlabChiqarishTexnologikKartalariVa")}
        actions={
          <Button onClick={() => setCreateOpen(true)} data-testid="btn-new-card">
            <Plus className="h-4 w-4 mr-1" />
            {t("yangiTexkarta", "Yangi texkarta")}
          </Button>
        }
      />

      {/* KPI chips */}
      <StatsBar
        totalCards={safeCards.length}
        activeCards={safeCards.filter((c) => c.isActive).length}
        pendingOrders={orders.length}
      />

      {/* Orders awaiting AI card generation */}
      <PendingOrdersPanel
        orders={Array.isArray(orders) ? orders : []}
        onGenerateClick={handleOpenGenDialog}
      />

      {/* Search + cards grid */}
      <CardsGrid
        cards={safeCards}
        search={search}
        onSearchChange={setSearch}
        isOptimizePending={optimizeMutation.isPending}
        onView={handleViewCard}
        onOptimize={(id) => optimizeMutation.mutate(id)}
        onExport={handleExportPDF}
      />

      {/* Optimization result panel */}
      {optimizeResult && <OptimizeResultPanel result={optimizeResult} />}

      {/* Dialogs */}
      <ViewCardDialog
        open={showViewModal}
        onOpenChange={setShowViewModal}
        card={selectedCard}
        isOptimizePending={optimizeMutation.isPending}
        onOptimize={(id) => optimizeMutation.mutate(id)}
        onExport={handleExportPDF}
        bom={bom}
        routes={routes}
        versions={versions}
        isMasterBusy={masterBusy}
        onLabApprove={(id) => gateMutation.mutate({ id, gate: "lab" })}
        onMaketApprove={(id) => gateMutation.mutate({ id, gate: "maket" })}
        onAddBom={(id, item) => addBomMutation.mutate({ id, item })}
        onAddRoute={(id, route) => addRouteMutation.mutate({ id, route })}
      />

      <GenerateCardDialog
        open={genDialog}
        onOpenChange={setGenDialog}
        order={genOrder}
        isLoading={genLoading}
        onConfirm={handleGenerateCard}
      />

      <CreateCardDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={createForm}
        setForm={setCreateForm}
        onSubmit={() => createMutation.mutate(createForm)}
        isPending={createMutation.isPending}
      />
    </div>
  );
}
