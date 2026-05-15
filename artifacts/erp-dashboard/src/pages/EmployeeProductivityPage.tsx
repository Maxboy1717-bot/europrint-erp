/**
 * @module EmployeeProductivityPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { EPErrorState, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface EmployeeProductivity {
  id?: string | number;
  employee_id?: number;
  employeeId?: number;
  employee_name?: string;
  employeeName?: string;
  department?: string;
  productivity_score?: number;
  productivityScore?: number;
  tasks_completed?: number;
  tasksCompleted?: number;
  tasks_total?: number;
  tasksTotal?: number;
  attendance_rate?: number;
  attendanceRate?: number;
  period?: string;
  trend?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-[var(--ep-green)]";
  if (score >= 75) return "text-[var(--ep-blue)]";
  if (score >= 60) return "text-[var(--ep-yellow)]";
  return "text-destructive";
};

const getTrendBadge = (trend?: string) => {
  if (!trend) return null;
  if (trend === "up")   return <EPStatusPill tone="success"      className="text-xs">{t("osmoqda")}</EPStatusPill>;
  if (trend === "down") return <EPStatusPill tone="danger"  className="text-xs">{t("pasaymoqda1")}</EPStatusPill>;
  return <Badge variant="outline" className="text-xs">{t("barqaror1")}</Badge>;
};

export default function EmployeeProductivityPage() {
  const { t } = useTranslation("common");
  const { data: rawData, isLoading, isError, error, refetch } = useQuery<
    EmployeeProductivity[] | { data?: EmployeeProductivity[] }
  >({
    queryKey: ["/api/employee-productivity"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/employee-productivity");
    },
  });

  const employees: EmployeeProductivity[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: EmployeeProductivity[] })?.data ?? [];

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <ModulePage
      module="hr"
      title={t("xodimUnumdorligi")}
      icon={<TrendingUp className="h-5 w-5" />}
    >
      <div className="space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={`k-${i}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 rounded-lg" />
                  <Skeleton className="h-2 w-full rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-12 rounded-lg" />
              </CardContent>
            </Card>
          ))
        ) : employees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("unumdorlikMalumotlariYoq")}</p>
            </CardContent>
          </Card>
        ) : (
          employees.map((e, idx) => {
            const name  = e.employee_name ?? e.employeeName ?? `Xodim ${idx + 1}`;
            const score = e.productivity_score ?? e.productivityScore ?? 0;
            const done  = e.tasks_completed ?? e.tasksCompleted ?? 0;
            const total = e.tasks_total ?? e.tasksTotal;
            const att   = e.attendance_rate ?? e.attendanceRate;
            return (
              <Card key={e.id ?? idx} className="hover:shadow-md transition-shadow" data-testid={`card-productivity-${e.id ?? idx}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{name}</p>
                      {e.department && (
                        <span className="text-xs text-muted-foreground">{e.department}</span>
                      )}
                      {getTrendBadge(e.trend)}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Progress value={score} className="h-1.5 flex-1" />
                        <span className={`text-xs font-semibold w-8 text-right ${getScoreColor(score)}`}>
                          {score}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                        {total !== undefined && (
                          <span>Vazifalar: {done}/{total}</span>
                        )}
                        {att !== undefined && (
                          <span>Davomat: {att}%</span>
                        )}
                        {e.period && <span>{e.period}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </ModulePage>
  );
}
