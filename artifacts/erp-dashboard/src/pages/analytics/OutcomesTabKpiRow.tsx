/**
 * @module OutcomesTabKpiRow
 * @description KPI metric cards row for OutcomesTab.
 * Split from OutcomesTab.tsx (Rule 16).
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Award, TrendingUp } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import type { LearningOutcomes } from "./analytics-types";

interface Props {
  learningOutcomes: LearningOutcomes | undefined;
  outcomesLoading: boolean;
}

export function OutcomesTabKpiRow({ learningOutcomes, outcomesLoading }: Props) {
  const { t } = useTranslation("common");
  if (outcomesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={`k-${i}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2 rounded-lg" />
              <Skeleton className="h-4 w-40 mb-2 rounded-lg" />
              <Skeleton className="h-2 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("kursTugatishFoizi")}</CardTitle>
          <Target className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{learningOutcomes?.completionRate ?? 0}%</div>
          <p className="text-xs text-muted-foreground">
            {learningOutcomes?.completedAssignments ?? 0} / {learningOutcomes?.totalAssignments ?? 0} tayinlangan
          </p>
          <Progress value={learningOutcomes?.completionRate ?? 0} className="h-2 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("otishFoizi1")}</CardTitle>
          <Award className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{learningOutcomes?.passRate ?? 0}%</div>
          <p className="text-xs text-muted-foreground">
            {learningOutcomes?.passedAttempts ?? 0} / {learningOutcomes?.totalAttempts ?? 0} urinish
          </p>
          <Progress value={learningOutcomes?.passRate ?? 0} className="h-2 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("ortachaBall")}</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{learningOutcomes?.averageScore ?? 0}</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>Median: {learningOutcomes?.medianScore ?? 0}</span>
            <span>•</span>
            <span>SD: ±{learningOutcomes?.standardDeviation ?? 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
