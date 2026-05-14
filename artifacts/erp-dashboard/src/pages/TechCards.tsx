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
import { FileText } from "lucide-react";

import {
  mapBackendCard,
  buildPdfHtml,
  type TechCard,
  type OptimizeResult,
  type PapkaOrder,
} from "./TechCardsTypes";
import { StatsBar, PendingOrdersPanel, CardsGrid } from "./TechCardsSections";
import {
  ViewCardDialog,
  GenerateCardDialog,
  OptimizeResultPanel,
} from "./TechCardsDialogs";
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

  // Data fetching
  const { data: cards = [], isLoading } = useQuery<TechCard[]>({
    queryKey: ["/api/technology/cards"],
    queryFn: async () => {
      const res = await apiRequest('GET', "/api/technology/cards");
      if (!res.ok) throw new Error("Kartalarni yuklashda xatolik");
      const raw: Record<string, unknown>[] = await res.json();
      return (Array.isArray(raw) ? raw : []).map(mapBackendCard);
    },
  });

  const { data: orders = [] } = useQuery<PapkaOrder[]>({
    queryKey: ["/api/papka-orders", "pending_tech"],
    queryFn: async () => {
      const res = await apiRequest('GET', "/api/papka-orders?status=pending_tech");
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : (d.items ?? d.data ?? d.orders ?? []);
    },
  });

  // Mutations
  const optimizeMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const res = await apiRequest('GET', `/api/technology/cards/${cardId}/optimize`);
      if (!res.ok) throw new Error("Optimizatsiya xatoligi");
      return res.json() as Promise<OptimizeResult>;
    },
    onSuccess: (data) => setOptimizeResult(data),
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

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
      const res = await apiRequest('GET', `/api/technology/cards/${card.id}`);
      setSelectedCard(res.ok ? mapBackendCard(await res.json()) : card);
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
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="page-tech-cards">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("texnologikKartalar")}</b></>}
        title={t("texnologikKartalar")}
        subtitle={t("ishlabChiqarishTexnologikKartalariVa")}
      />
        </div>
      </div>

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
      />

      <GenerateCardDialog
        open={genDialog}
        onOpenChange={setGenDialog}
        order={genOrder}
        isLoading={genLoading}
        onConfirm={handleGenerateCard}
      />
    </div>
  );
}
