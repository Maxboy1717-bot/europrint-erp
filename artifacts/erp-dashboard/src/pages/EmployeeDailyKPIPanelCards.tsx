/** @module EmployeeDailyKPIPanelCards @description Summary metric card components for EmployeeDailyKPIPanel: average score, total evaluations, top performer, and fairness index. */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, Scale, Target } from "lucide-react";
import { getScoreColor } from "./EmployeeDailyKPIPanelTypes";
import type { TopPerformer } from "./EmployeeDailyKPIPanelTypes";

interface AvgScoreCardProps {
  avgOverall: number;
  isLoading: boolean;
}

export function AvgScoreCard({ avgOverall, isLoading }: AvgScoreCardProps) {
  return (
    <Card data-testid="card-avg-score">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">O'rtacha Umumiy Ball</CardTitle>
        <Target className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24 rounded-lg" />
        ) : (
          <>
            <div
              className={`text-3xl font-bold ${getScoreColor(avgOverall)}`}
              data-testid="text-avg-score"
            >
              {avgOverall}
            </div>
            <Progress value={avgOverall} className="h-2 mt-2" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface TotalEvaluationsCardProps {
  total: number;
  isLoading: boolean;
}

export function TotalEvaluationsCard({ total, isLoading }: TotalEvaluationsCardProps) {
  return (
    <Card data-testid="card-total-evaluations">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Bugungi Baholashlar</CardTitle>
        <Users className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16 rounded-lg" />
        ) : (
          <div className="text-3xl font-bold" data-testid="text-total-evaluations">
            {total}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TopPerformerCardProps {
  topPerformer: TopPerformer | null;
  isLoading: boolean;
  isError: boolean;
}

export function TopPerformerCard({ topPerformer, isLoading, isError }: TopPerformerCardProps) {
  return (
    <Card data-testid="card-top-performer">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Eng Yaxshi Xodim</CardTitle>
        <Trophy className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-32 rounded-lg" />
        ) : isError ? (
          <p className="text-sm text-destructive">Xatolik yuz berdi</p>
        ) : topPerformer ? (
          <>
            <div className="text-lg font-bold truncate" data-testid="text-top-performer-name">
              {topPerformer.fullName}
            </div>
            <p
              className={`text-sm font-semibold ${getScoreColor(topPerformer.avgNetScore)}`}
              data-testid="text-top-performer-score"
            >
              {Math.round(topPerformer.avgNetScore * 100) / 100} ball
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>
        )}
      </CardContent>
    </Card>
  );
}

interface FairnessIndexCardProps {
  fairnessIndex: number;
  isLoading: boolean;
}

export function FairnessIndexCard({ fairnessIndex, isLoading }: FairnessIndexCardProps) {
  const isFair = fairnessIndex <= 15;
  return (
    <Card data-testid="card-fairness-index">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Adolatlilik Indeksi</CardTitle>
        <Scale className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16 rounded-lg" />
        ) : (
          <>
            <div
              className={`text-3xl font-bold ${isFair ? "text-[var(--ep-green)] dark:text-green-400" : "text-[var(--ep-red)] dark:text-red-400"}`}
              data-testid="text-fairness-index"
            >
              {fairnessIndex}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFair ? "Adolatli" : "Tekshirish kerak"}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
