/**
 * @module ReportsHub
 * @description React page component. Route-level UI.
 * State management, hooks, and orchestration only — rendering delegated to
 * ReportsHubSections.tsx. Types live in ReportsHubTypes.ts.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import type { AiReportDefinition, AiReportRun, AiReportSubscription } from "@shared/schema";
import { t, type DashboardData, type Translations } from "./ReportsHubTypes";
import {
  StatsGrid,
  CategoryGrid,
  DefinitionsTable,
  RunsTable,
  SubscriptionsTable,
} from "./ReportsHubSections";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function ReportsHub() {
  const { t } = useTranslation("common");
  const { language } = useLanguage();
  const { toast } = useToast();
  const lang = language === "ru" ? "ru" : "uz";
  const tr = (t as unknown as Record<string, Translations>)[lang];

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("categories");

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError, error,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: ["/api/reports-hub/dashboard"],
  });

  const { data: definitions, isLoading: definitionsLoading } = useQuery<AiReportDefinition[]>({
    queryKey: ["/api/reports-hub/definitions", { categoryId: selectedCategoryId }],
    queryFn: async () => {
      return await apiRequest('GET', `/api/reports-hub/definitions?categoryId=${selectedCategoryId}`);
    },
    enabled: selectedCategoryId !== null,
  });

  const { data: runs, isLoading: runsLoading } = useQuery<AiReportRun[]>({
    queryKey: ["/api/reports-hub/runs"],
    enabled: activeTab === "runs",
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery<AiReportSubscription[]>({
    queryKey: ["/api/reports-hub/subscriptions"],
    enabled: activeTab === "subscriptions",
  });

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reports-hub/seed-categories"),
    onSuccess: () => {
      toast({ title: tr.seedSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-hub"] });
    },
    onError: () => {
      toast({ title: tr.error, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: (definitionId: number) =>
      apiRequest("POST", `/api/reports-hub/generate/${definitionId}`),
    onSuccess: () => {
      toast({ title: tr.generateSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-hub"] });
    },
    onError: () => {
      toast({ title: tr.error, variant: "destructive" });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: (reportId: number) =>
      apiRequest("POST", "/api/reports-hub/subscriptions", { reportId }),
    onSuccess: () => {
      toast({ title: tr.subscribeSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-hub/subscriptions"] });
    },
    onError: () => {
      toast({ title: tr.error, variant: "destructive" });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/reports-hub/subscriptions/${id}`),
    onSuccess: () => {
      toast({ title: tr.unsubscribeSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/reports-hub/subscriptions"] });
    },
    onError: () => {
      toast({ title: tr.error, variant: "destructive" });
    },
  });

  // -------------------------------------------------------------------------
  // Early returns
  // -------------------------------------------------------------------------

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <EPLoader size={32} tone="muted" />
      </div>
    );
  }

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const categories = Array.isArray(dashboard?.categories) ? dashboard.categories : [];
  const safeRuns = Array.isArray(runs) ? runs : [];
  const safeSubs = Array.isArray(subscriptions) ? subscriptions : [];
  const safeDefs = Array.isArray(definitions) ? definitions : [];

  return (
    <div className="space-y-6" data-testid="reports-hub-page">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("hisobotlarMarkazi")}</b></>}
        title={t("hisobotlarMarkazi")}
        subtitle={tr.subtitle}
      />
        </div>
        <Button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          variant="outline"
          data-testid="button-seed-reports"
        >
          {seedMutation.isPending ? (
            <EPLoader className="mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          {seedMutation.isPending ? tr.seeding : tr.seedButton}
        </Button>
      </div>

      {/* KPI stats */}
      <StatsGrid
        totalReports={dashboard?.totalReports ?? 0}
        runsToday={dashboard?.runsToday ?? 0}
        insightsGenerated={dashboard?.insightsGenerated ?? 0}
        activeSubscriptions={dashboard?.activeSubscriptions ?? 0}
        tr={tr}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          if (v === "categories") setSelectedCategoryId(null);
        }}
      >
        <TabsList data-testid="tabs-reports-hub">
          <TabsTrigger value="categories" data-testid="tab-categories">
            {tr.categories}
          </TabsTrigger>
          <TabsTrigger value="runs" data-testid="tab-runs">
            {tr.recentRuns}
          </TabsTrigger>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
            {tr.subscriptions}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          {selectedCategoryId !== null ? (
            <DefinitionsTable
              definitions={safeDefs}
              isLoading={definitionsLoading}
              lang={lang}
              tr={tr}
              isGenerating={generateMutation.isPending}
              isSubscribing={subscribeMutation.isPending}
              onBack={() => setSelectedCategoryId(null)}
              onGenerate={(id) => generateMutation.mutate(id)}
              onSubscribe={(id) => subscribeMutation.mutate(id)}
            />
          ) : (
            <CategoryGrid
              categories={categories}
              lang={lang}
              tr={tr}
              onSelect={(id) => setSelectedCategoryId(id)}
            />
          )}
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <RunsTable runs={safeRuns} isLoading={runsLoading} lang={lang} tr={tr} />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsTable
            subscriptions={safeSubs}
            isLoading={subsLoading}
            tr={tr}
            isUnsubscribing={unsubscribeMutation.isPending}
            onUnsubscribe={(id) => unsubscribeMutation.mutate(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
