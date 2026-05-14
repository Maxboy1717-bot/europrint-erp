/** @module AIProductionPlanningSections @description Section/card components for the AI Production Planning page: stats grid, plan cards grid, and recommendations tab. */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Cpu, ShieldCheck, AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";
import { AiPlan, DashboardData, getConfidenceColor, STATUS_MAP } from "./AIProductionPlanningTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ─── StatusBadge ──────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation("common");
  const s = STATUS_MAP[status] ?? { label: status, cls: "bg-muted/60 text-foreground" };
  return (
    <Badge
      className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate", s.cls)}
      data-testid={`badge-status-${status}`}
    >
      {s.label}
    </Badge>
  );
}

// ─── StatsGrid ────────────────────────────────────────────────────────────────
interface StatItem {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}

interface StatsGridProps {
  stats: StatItem[];
  isLoading: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {(Array.isArray(stats) ? stats : []).map((stat, i) => (
        <div key={`k-${i}`} className="bg-card rounded-lg p-5">
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
          </div>
          <p
            className="text-3xl font-bold tracking-tight text-foreground"
            data-testid={`text-stat-value-${i}`}
          >
            {isLoading ? "..." : stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── PlansGrid ────────────────────────────────────────────────────────────────
interface PlansGridProps {
  plans: AiPlan[] | undefined;
  isLoading: boolean;
  isGenerating: boolean;
  onPlanClick: (plan: AiPlan) => void;
  onGenerate: () => void;
}

export function PlansGrid({ plans, isLoading, isGenerating, onPlanClick, onGenerate }: PlansGridProps) {
  const { t } = useTranslation("common");
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={`k-${i}`} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="bg-card rounded-lg p-12 text-center">
        <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-4" data-testid="text-no-plans">
          {t("haliRejaYaratilmagan")}
        </p>
        <Button onClick={onGenerate} disabled={isGenerating} data-testid="button-generate-first">
          {isGenerating ? (
            <EPLoader className="mr-2" />
          ) : (
            <Cpu className="h-4 w-4 mr-2" />
          )}
          Birinchi rejani yaratish
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {(Array.isArray(plans) ? plans : []).map((plan) => (
        <div
          key={plan.id}
          className="bg-card rounded-lg p-5 cursor-pointer hover-elevate"
          onClick={() => onPlanClick(plan)}
          data-testid={`card-plan-${plan.id}`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-base font-bold text-foreground">{plan.planNumber}</h4>
            <StatusBadge status={plan.status} />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("date")}</span>
              <span className="font-medium">{plan.planDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("buyurtmalar")}</span>
              <span className="font-medium" data-testid={`text-orders-${plan.id}`}>
                {plan.totalOrders ?? 0}
              </span>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">{t("ishonch")}</span>
                <span
                  className={cn("font-bold", getConfidenceColor(plan.confidenceScore))}
                  data-testid={`text-confidence-${plan.id}`}
                >
                  {plan.confidenceScore}%
                </span>
              </div>
              <Progress value={plan.confidenceScore} className="h-1.5" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              {plan.autoApproved ? (
                <div className="flex items-center gap-1 text-[var(--ep-green)] text-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t("avtoTasdiqlangan")}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[var(--ep-yellow)] text-xs">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t("qoldaTasdiqKerak")}
                </div>
              )}
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RecommendationsTab ───────────────────────────────────────────────────────
interface RecommendationsTabProps {
  plans: AiPlan[] | undefined;
}

export function RecommendationsTab({ plans }: RecommendationsTabProps) {
  const { t } = useTranslation("common");
  const plansWithRecs = plans?.filter((p) => p.aiRecommendations?.length > 0).slice(0, 5);

  if (!plansWithRecs || plansWithRecs.length === 0) {
    return (
      <div
        className="text-center py-12 text-[13px] text-muted-foreground"
        data-testid="text-no-recommendations"
      >
        {t("tavsiyalarMavjudEmas")}
      </div>
    );
  }

  return (
    <>
      {plansWithRecs.map((plan) => (
        <div key={plan.id} className="bg-card rounded-lg p-5 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{plan.planNumber}</span>
            <Badge className="text-[10px] no-default-hover-elevate">{plan.planDate}</Badge>
          </div>
          <div className="space-y-2">
            {(Array.isArray(plan.aiRecommendations) ? plan.aiRecommendations : []).map((rec, i) => (
              <div
                key={`k-${i}`}
                className="flex items-start gap-2 text-sm"
                data-testid={`text-recommendation-${plan.id}-${i}`}
              >
                {rec.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] shrink-0 mt-0.5" />
                ) : rec.type === "optimization" ? (
                  <TrendingUp className="h-4 w-4 text-[var(--ep-green)] shrink-0 mt-0.5" />
                ) : (
                  <Cpu className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                )}
                <span className="text-muted-foreground">{rec.message}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
