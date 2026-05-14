/**
 * @module RaciCrisisPageSections
 * @description Major section components for RaciCrisisPage: task list, crisis list,
 * tab/filter bars, and skeleton loading state.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, AlertTriangle } from "lucide-react";
import { RaciTask, Crisis, TASK_STATUS, RISK_COLORS, TabType } from "./RaciCrisisPageTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// LoadingSkeleton
// ---------------------------------------------------------------------------

export function LoadingSkeleton() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={`k-${i}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-24 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TabBar
// ---------------------------------------------------------------------------

interface TabBarProps {
  tab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabBar({ tab, onTabChange }: TabBarProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex gap-2">
      <Button
        variant={tab === "tasks" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("tasks")}
        data-testid="tab-tasks"
      >
        {t("raciVazifalar")}
      </Button>
      <Button
        variant={tab === "crises" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("crises")}
        data-testid="tab-crises"
      >
        {t("inqirozlar")}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusFilterBar
// ---------------------------------------------------------------------------

interface StatusFilterBarProps {
  statusFilter: string;
  onFilterChange: (status: string) => void;
}

export function StatusFilterBar({ statusFilter, onFilterChange }: StatusFilterBarProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {["all", "open", "in_progress", "completed", "cancelled"].map(s => (
        <Button
          key={s}
          variant={statusFilter === s ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onFilterChange(s)}
        >
          {s === "all" ? "Barchasi" : (TASK_STATUS[s]?.label ?? s)}
        </Button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskList
// ---------------------------------------------------------------------------

interface TaskListProps {
  tasks: RaciTask[];
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">RACI vazifalar topilmadi</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(t => {
        const status = t.status ?? "open";
        const sc = TASK_STATUS[status] ?? TASK_STATUS.open;
        return (
          <Card
            key={t.id}
            className="hover:shadow-md transition-shadow"
            data-testid={`card-task-${t.id}`}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{t.title ?? "—"}</p>
                  <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                  {t.responsible_id && <span>Javobgar: {t.responsible_id}</span>}
                  {t.accountable_id && <span>Mas'ul: {t.accountable_id}</span>}
                  {t.deadline && (
                    <span>Muddat: {new Date(t.deadline).toLocaleDateString("uz-UZ")}</span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {t.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CrisisList
// ---------------------------------------------------------------------------

interface CrisisListProps {
  crises: Crisis[];
}

export function CrisisList({ crises }: CrisisListProps) {
  const { t } = useTranslation("common");
  if (crises.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("inqirozlarTopilmadi")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {(Array.isArray(crises) ? crises : []).map(c => {
        const risk = c.risk_level ?? c.riskLevel ?? "medium";
        const date = c.created_at ?? c.createdAt;
        return (
          <Card key={c.id} data-testid={`card-crisis-${c.id}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle
                className={`h-5 w-5 shrink-0 mt-0.5 ${RISK_COLORS[risk] ?? RISK_COLORS.medium}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{c.title ?? "—"}</p>
                  <Badge variant="outline" className="text-xs capitalize">
                    {c.status ?? "open"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 mt-0.5 text-xs text-muted-foreground">
                  <span className={`font-medium ${RISK_COLORS[risk] ?? ""}`}>
                    Xavf: {risk}
                  </span>
                  {date && <span>{new Date(date).toLocaleDateString("uz-UZ")}</span>}
                </div>
                {c.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {c.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
