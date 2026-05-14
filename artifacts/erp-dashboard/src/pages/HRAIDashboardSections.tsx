/**
 * @module HRAIDashboardSections
 * @description Section and chart components for HRAIDashboard.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain } from "lucide-react";
import type { DashboardData, BudgetItem, ProviderConfig } from "./HRAIDashboardTypes";
import { taskTypes, providerColors, providerList } from "./HRAIDashboardTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Skeleton Helpers ────────────────────────────────────────────────────────

export const StatCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ProviderCardSkeleton = () => (
  <Card>
    <CardContent className="p-6 space-y-4">
      <Skeleton className="h-6 w-32 rounded-lg" />
      <Skeleton className="h-2 w-full rounded-lg" />
      <Skeleton className="h-4 w-24 rounded-lg" />
      <Skeleton className="h-4 w-20 rounded-lg" />
    </CardContent>
  </Card>
);

// ─── Stat Cards Row ──────────────────────────────────────────────────────────

interface StatCardsRowProps {
  items: Array<{ icon: React.ReactNode; label: string; value: string | number }>;
}

export function StatCardsRow({ items }: StatCardsRowProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {(Array.isArray(items) ? items : []).map((stat, idx) => (
        <div key={idx} className="bg-card rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-4xl font-bold tracking-tight text-foreground" data-testid={`text-stat-${idx}`}>
              {stat.value}
            </p>
            <div className="opacity-20">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Providers Budget Section ────────────────────────────────────────────────

interface ProvidersBudgetSectionProps {
  budgetItems: BudgetItem[];
  providers: ProviderConfig[];
}

export function ProvidersBudgetSection({ budgetItems, providers }: ProvidersBudgetSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-card rounded-xl p-6 mb-8 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t("provayderlarVaByudjet")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Array.isArray(providerList) ? providerList : []).map((providerKey) => {
          const pBudget = (Array.isArray(budgetItems) ? budgetItems : []).find(b => b.provider === providerKey);
          const pConfig = (Array.isArray(providers) ? providers : []).find(p => p.providerName === providerKey);
          const isActive = pBudget?.isActive ?? pConfig?.isActive ?? false;
          const monthlyBudget = pBudget?.monthlyBudget ?? pConfig?.monthlyBudget ?? 0;
          const monthlySpent = pBudget?.monthlySpent ?? pConfig?.monthlySpent ?? 0;
          const dailyUsed = pBudget?.dailyRequestsUsed ?? pConfig?.dailyRequestsUsed ?? 0;
          const dailyLimit = pBudget?.dailyRequestLimit ?? pConfig?.dailyRequestLimit ?? 0;
          const spentPercent = monthlyBudget > 0 ? Math.min((monthlySpent / monthlyBudget) * 100, 100) : 0;

          return (
            <div
              key={providerKey}
              className="bg-muted/60 rounded-lg p-4"
              data-testid={`card-provider-${providerKey}`}
            >
              <div className="flex items-center justify-between mb-4">
                <Badge className={`${providerColors[providerKey]} text-white no-default-hover-elevate no-default-active-elevate`}>
                  {providerKey.charAt(0).toUpperCase() + providerKey.slice(1)}
                </Badge>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={isActive ? "bg-green-100 text-green-800" : ""}
                  data-testid={`badge-provider-status-${providerKey}`}
                >
                  {isActive ? "Faol" : "Nofaol"}
                </Badge>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground font-medium">{t("oylikByudjet")}</span>
                    <span className="text-foreground font-semibold">
                      ${monthlySpent.toFixed(2)} / ${monthlyBudget.toFixed(2)}
                    </span>
                  </div>
                  <Progress
                    value={spentPercent}
                    className="h-1.5 bg-muted"
                    data-testid={`progress-budget-${providerKey}`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{t("kunlikSorovlar")}</span>
                  <span className="text-foreground font-semibold" data-testid={`text-daily-requests-${providerKey}`}>
                    {dailyUsed} / {dailyLimit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Task Type Grid ──────────────────────────────────────────────────────────

interface TaskTypeGridProps {
  onSelectTask: (key: string) => void;
}

export function TaskTypeGrid({ onSelectTask }: TaskTypeGridProps) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t("aiVazifalar")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Array.isArray(taskTypes) ? taskTypes : []).map((task) => {
          const IconComp = task.icon;
          return (
            <Button
              key={task.key}
              variant="outline"
              className="justify-start gap-2 h-auto py-3 px-4 border-border hover:bg-muted/40"
              data-testid={`button-task-${task.key}`}
              onClick={() => onSelectTask(task.key)}
            >
              <IconComp className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">{task.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recent Tasks Panel ──────────────────────────────────────────────────────

interface RecentTasksPanelProps {
  dashboard: DashboardData | undefined;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function RecentTasksPanel({ dashboard, getStatusBadge }: RecentTasksPanelProps) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t("songgiNatijalar")}</h2>
      {dashboard?.recentTasks && dashboard.recentTasks.length > 0 ? (
        <div className="space-y-3">
          {(Array.isArray(dashboard.recentTasks) ? dashboard.recentTasks : []).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
              data-testid={`recent-task-${task.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{task.taskType}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(task.createdAt).toLocaleString()}
                </p>
              </div>
              {getStatusBadge(task.status)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-outline-variant mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">{t("hozirchaNatijalarYoq")}</p>
        </div>
      )}
    </div>
  );
}
