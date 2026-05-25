/**
 * @module WeeklyPlanPageSections
 * @description Section components for WeeklyPlanPage.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import type { WeeklyPlan } from "./WeeklyPlanPageTypes";
import { getWeekLabel, offsetWeek } from "./WeeklyPlanPageTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export function statusBadge(status: WeeklyPlan["status"]) {
  const { t } = useTranslation("common");
  if (status === "approved")
    return <Badge className="bg-emerald-100 text-[var(--ep-green)] border-0">{t("approved")}</Badge>;
  if (status === "submitted")
    return <EPStatusPill tone="info">{t("yuborilgan")}</EPStatusPill>;
  return <EPStatusPill tone="neutral">{t("draft")}</EPStatusPill>;
}

interface WeekNavigatorProps {
  week: string;
  onWeekChange: (week: string) => void;
}

export function WeekNavigator({ week, onWeekChange }: WeekNavigatorProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardContent className="py-3 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={() => onWeekChange(offsetWeek(week, -1))}>
          <ChevronLeft className="h-4 w-4 mr-1" /> {t("previous")}
        </Button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">{getWeekLabel(week)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Hafta boshlanishi: {week}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onWeekChange(offsetWeek(week, 1))}>
          {t("nextBtn")}<ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

interface PageHeaderProps {
  onRefresh: () => void;
}

export function WeeklyPlanHeader({ onRefresh }: PageHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          {t("haftalikReja1")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("gsdMaqsadTop5Vazifa")}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("refresh")}
      </Button>
    </div>
  );
}

interface ManagerViewProps {
  plans: WeeklyPlan[];
  isLoading: boolean;
  onApprove: (planId: number) => void;
  isApprovePending: boolean;
}

export function ManagerApprovalSection({ plans, isLoading, onApprove, isApprovePending }: ManagerViewProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          Xodimlar Rejalari — Tasdiqlash
          {plans.length > 0 && (
            <EPStatusPill tone="neutral" className="ml-2">{plans.length} ta</EPStatusPill>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {([0, 1, 2]).map((i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t("buHaftaUchunHechQanday")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(Array.isArray(plans) ? plans : []).map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "border rounded-xl p-4 space-y-3",
                  plan.status === "approved"
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-border bg-muted/20",
                )}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Xodim #{plan.employeeId}
                    </span>
                    {statusBadge(plan.status)}
                  </div>
                  {plan.status === "submitted" && (
                    <Button
                      size="sm"
                      onClick={() => onApprove(plan.id)}
                      disabled={isApprovePending}
                      className="bg-emerald-600 hover:bg-[var(--ep-green)]/90"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      {t("verify")}
                    </Button>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t("gsdMaqsad")}</p>
                  <p className="text-sm text-foreground">{plan.gsdTarget}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("top5Vazifalar")}</p>
                  <ol className="space-y-1">
                    {(Array.isArray(plan.top5Tasks) ? plan.top5Tasks as string[] : []).map((task, i) => (
                      <li key={`k-${i}`} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {task}
                      </li>
                    ))}
                  </ol>
                </div>
                {plan.status === "approved" && plan.approvedAt && (
                  <p className="text-xs text-[var(--ep-green)] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Tasdiqlangan: {new Date(plan.approvedAt).toLocaleDateString("uz-UZ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// MyPlanSection and its sub-components live in WeeklyPlanEmployeeSection.tsx
export { MyPlanSection } from "./WeeklyPlanEmployeeSection";
