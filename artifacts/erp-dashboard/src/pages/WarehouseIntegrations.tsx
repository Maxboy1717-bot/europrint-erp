/**
 * @module WarehouseIntegrations
 * @description React page component. Route-level UI.
 * Orchestrates PP/MM/FI integration cards, reorder suggestions, and stock valuation.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Languages, Warehouse as WarehouseIcon } from "lucide-react";
import {
  translations,
  type Lang,
  type IntegrationSummary,
  type PendingDelivery,
  type ReorderSuggestion,
  type StockValuation,
} from "./WarehouseIntegrationsTypes";
import { PpCard, MmCard, FiCard, ReorderCard, ValuationCard } from "./WarehouseIntegrationsSections";
import { EPErrorState } from "@/components/ep";

export default function WarehouseIntegrations() {
  const [lang, setLang] = useState<Lang>("uz");
  const t = translations[lang];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary, isError } = useQuery<IntegrationSummary>({
    queryKey: ["/api/warehouse/integration/summary"],
  });

  const { data: pendingDeliveries, isLoading: pendingLoading } = useQuery<{ pendingDeliveries: PendingDelivery[] }>({
    queryKey: ["/api/warehouse/integration/mm/pending-deliveries"],
  });

  const { data: reorderData, isLoading: reorderLoading } = useQuery<{
    suggestions: ReorderSuggestion[];
    criticalCount: number;
    highCount: number;
  }>({
    queryKey: ["/api/warehouse/integration/mm/reorder-suggestions"],
  });

  const { data: valuationData, isLoading: valuationLoading } = useQuery<StockValuation>({
    queryKey: ["/api/warehouse/integration/fi/stock-valuation"],
  });

  const toggleLanguage = () => setLang(prev => prev === "uz" ? "ru" : "uz");

  const handleRefreshAll = () => {
    refetchSummary();
    queryClient.invalidateQueries({ queryKey: ["/api/warehouse/integration"] });
    toast({
      title: t.status.success,
      description: lang === "uz" ? "Ma'lumotlar yangilandi" : "Данные обновлены",
    });
  };

  if (isError) {
    return <EPErrorState onRetry={refetchSummary} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3" data-testid="text-page-title">
            <WarehouseIcon className="h-7 w-7 text-[var(--ep-yellow)]" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={toggleLanguage} data-testid="button-toggle-language">
            <Languages className="h-4 w-4 mr-2" />
            {lang === "uz" ? "RU" : "UZ"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshAll} data-testid="button-refresh-all">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.refresh}
          </Button>
        </div>
      </div>

      {/* PP / MM / FI module cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <PpCard t={t} lang={lang} summary={summary} summaryLoading={summaryLoading} />
        <MmCard
          t={t}
          summary={summary}
          summaryLoading={summaryLoading}
          pendingDeliveries={pendingDeliveries}
          pendingLoading={pendingLoading}
          reorderData={reorderData}
        />
        <FiCard
          t={t}
          lang={lang}
          summary={summary}
          summaryLoading={summaryLoading}
          valuationData={valuationData}
          valuationLoading={valuationLoading}
        />
      </div>

      {/* Reorder suggestions */}
      <ReorderCard t={t} lang={lang} reorderData={reorderData} reorderLoading={reorderLoading} />

      {/* Stock valuation breakdown */}
      {valuationData && <ValuationCard t={t} lang={lang} valuationData={valuationData} />}
    </div>
  );
}
