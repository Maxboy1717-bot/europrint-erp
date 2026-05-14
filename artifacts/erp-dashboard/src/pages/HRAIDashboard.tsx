/**
 * @module HRAIDashboard
 * @description State, hooks, and orchestration for HR AI Dashboard.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ModulePage } from "@/components/ui/module-page";
import { Brain, Cpu, Users, DollarSign, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DashboardData, ProviderConfig, BudgetItem } from "./HRAIDashboardTypes";
import {
  StatCardSkeleton,
  ProviderCardSkeleton,
  StatCardsRow,
  ProvidersBudgetSection,
  TaskTypeGrid,
  RecentTasksPanel,
} from "./HRAIDashboardSections";
import { TaskExecutionPanel } from "./HRAIDashboardDialogs";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";

export default function HRAIDashboard() {
  const { t } = useTranslation("hr");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [taskLanguage, setTaskLanguage] = useState<string>("uz");
  const [taskResult, setTaskResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: dashboard, isLoading: isLoadingDashboard, isError, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/ai-hr/dashboard"],
  });

  const { data: providers = [], isLoading: isLoadingProviders } = useQuery<ProviderConfig[]>({
    queryKey: ["/api/ai-hr/providers"],
  });

  const { data: budgetItems = [], isLoading: isLoadingBudget } = useQuery<BudgetItem[]>({
    queryKey: ["/api/ai-hr/usage/budget"],
  });

  const isLoading = isLoadingDashboard || isLoadingProviders || isLoadingBudget;
  const activeProviderCount = (Array.isArray(providers) ? providers : []).filter(p => p.isActive).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <EPStatusPill tone="success">{t("Bajarildi")}</EPStatusPill>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{t("Kutilmoqda")}</Badge>;
      case "failed":
        return <EPStatusPill tone="danger">{t("Xatolik")}</EPStatusPill>;
      default:
        return <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">{status}</Badge>;
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask) return;
    setIsSubmitting(true);
    setTaskResult(null);
    try {
      const payload: Record<string, unknown> = { ...formData, language: taskLanguage };
      const result = await apiRequest<{ result?: string; message?: string }>(
        "POST",
        `/api/ai-hr/tasks/${selectedTask}`,
        payload,
      );
      setTaskResult(JSON.stringify(result, null, 2));
      queryClient.invalidateQueries({ queryKey: ["/api/ai-hr/dashboard"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Xatolik yuz berdi";
      setTaskResult(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTask = (taskKey: string) => {
    setSelectedTask(taskKey);
    setFormData({});
    setTaskResult(null);
  };

  const handleCloseTask = () => {
    setSelectedTask(null);
    setFormData({});
    setTaskResult(null);
  };

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <ModulePage
        module="ai"
        title={t("hrAiAvtomatizatsiya")}
        subtitle={t("suniyIntellektBilanHrJarayonlarini")}
        icon={<Brain className="h-5 w-5" />}
        actions={<Skeleton className="h-9 w-32 rounded-lg" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {([1, 2, 3, 4]).map(i => <StatCardSkeleton key={`k-${i}`} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {([1, 2, 3]).map(i => <ProviderCardSkeleton key={`k-${i}`} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 space-y-4">
            {([1, 2, 3, 4]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
          </div>
          <div className="bg-card rounded-xl p-6 space-y-4">
            {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}
          </div>
        </div>
      </ModulePage>
    );
  }

  const statCards = [
    { icon: <Cpu className="h-8 w-8 text-[var(--ep-blue)]" />, label: "Jami AI vazifalar", value: dashboard?.totalAiTasks || 0 },
    { icon: <Users className="h-8 w-8 text-[var(--ep-green)]" />, label: "Yakunlangan intervyular", value: dashboard?.completedInterviews || 0 },
    { icon: <DollarSign className="h-8 w-8 text-[var(--ep-primary)]" />, label: "Umumiy xarajat", value: `$${(dashboard?.totalCost || 0).toFixed(2)}` },
    { icon: <Zap className="h-8 w-8 text-[var(--ep-purple)]" />, label: "Faol provayderlar", value: activeProviderCount },
  ];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between mb-6">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">HR AI {t('dashboard')}</b></>}
        title="HR AI {t('dashboard')}"
      />
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary opacity-20" />
        </div>
      </div>

      <StatCardsRow items={statCards} />

      <ProvidersBudgetSection budgetItems={budgetItems} providers={providers} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskTypeGrid onSelectTask={handleSelectTask} />
        <RecentTasksPanel dashboard={dashboard} getStatusBadge={getStatusBadge} />
      </div>

      {selectedTask && (
        <TaskExecutionPanel
          selectedTask={selectedTask}
          formData={formData}
          taskLanguage={taskLanguage}
          taskResult={taskResult}
          isSubmitting={isSubmitting}
          onFormChange={setFormData}
          onLanguageChange={setTaskLanguage}
          onSubmit={handleSubmitTask}
          onClose={handleCloseTask}
        />
      )}
    </div>
  );
}
