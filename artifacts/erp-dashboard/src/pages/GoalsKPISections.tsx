/**
 * @module GoalsKPISections
 * @description Section and panel components for GoalsKPI.
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import type { Goal } from "@shared/schema";
import { useTranslation } from '@/lib/i18n';
import {
  CATEGORIES,
  STATUS_OPTIONS,
  PRIORITIES,
  getProgressPercentage,
  getPriorityColor,
  getStatusColor,
} from "./GoalsKPITypes";

// ─── Summary Stats Row ──────────────────────────────────────────────────────

interface SummaryCardsProps {
  goals: Goal[];
  activeCount: number;
  completedCount: number;
}

export function GoalsSummaryCards({goals, activeCount, completedCount }: SummaryCardsProps) {
  const { t } = useTranslation('common');
  const avgProgress = goals.length > 0
    ? Math.round(
        (Array.isArray(goals) ? goals : []).reduce(
          (acc, g) => acc + getProgressPercentage(g.currentValue, g.targetValue), 0,
        ) / goals.length,
      )
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("jamiMaqsadlar1")}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{goals.length}</p>
      </div>
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("active")}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{activeCount}</p>
      </div>
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("bajarilgan")}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{completedCount}</p>
      </div>
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("ortachaProgress")}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{avgProgress}%</p>
      </div>
    </div>
  );
}

// ─── Goal Card ──────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}

export function GoalCard({ goal, onEdit, onDelete, isDeletePending }: GoalCardProps) {
  const { t } = useTranslation("common");
  const progress = getProgressPercentage(goal.currentValue, goal.targetValue);

  return (
    <div className="bg-card rounded-xl p-6" data-testid={`card-goal-${goal.id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label={t("edit")}
                onClick={() => onEdit(goal)}
                data-testid={`button-edit-goal-${goal.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("edit")}</TooltipContent>
          </Tooltip>
          <DeleteConfirmDialog
            title={t("maqsadniOchirishniTasdiqlaysizmi")}
            description={t("maqsadVaUngaBogliqBarcha")}
            onConfirm={() => onDelete(goal.id)}
            isPending={isDeletePending}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Badge className={getStatusColor(goal.status)}>
          {(Array.isArray(STATUS_OPTIONS) ? STATUS_OPTIONS : []).find(s => s.value === goal.status)?.label}
        </Badge>
        <Badge className={getPriorityColor(goal.priority)}>
          {(Array.isArray(PRIORITIES) ? PRIORITIES : []).find(p => p.value === goal.priority)?.label}
        </Badge>
        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
          {(Array.isArray(CATEGORIES) ? CATEGORIES : []).find(c => c.value === goal.category)?.label}
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2 text-foreground">
            <span>{"Bajarilish"}</span>
            <span className="font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progress < 50 ? "bg-red-500" : progress < 80 ? "bg-amber-500" : "bg-green-500",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Hozirgi: {goal.currentValue}</span>
            <span>Maqsad: {goal.targetValue}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">{t("metrika1")}</span>
            <p className="font-medium text-foreground">{goal.metric}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t("muddat1")}</span>
            <p className="font-medium text-foreground">{goal.startDate} - {goal.endDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Goals List ─────────────────────────────────────────────────────────────

interface GoalsListProps {
  goals: Goal[];
  isLoading: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}

export function GoalsList({ goals, isLoading, onEdit, onDelete, isDeletePending }: GoalsListProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {isLoading ? (
        <p className="text-muted-foreground col-span-2">{t("Yuklanmoqda...")}</p>
      ) : goals.length === 0 ? (
        <p className="text-muted-foreground col-span-2">{t("hozirchaMaqsadlarYoq")}</p>
      ) : (
        (Array.isArray(goals) ? goals : []).map(goal => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeletePending={isDeletePending}
          />
        ))
      )}
    </div>
  );
}
