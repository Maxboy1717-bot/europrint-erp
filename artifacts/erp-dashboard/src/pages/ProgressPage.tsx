/**
 * @module ProgressPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Activity } from "lucide-react";
import { EPPageHeader } from "@/components/ep";

interface ProgressStage {
  stage: string;
  label: string;
  current: number;
  target: number;
  percent: number;
  trend: "up" | "down" | "flat";
}

interface ProgressSummary {
  overallPercent: number;
  activeOrders: number;
  completedToday: number;
  blockedCount: number;
  stages: ProgressStage[];
}

const PROGRESS_THRESHOLD_GREEN = 80;
const PROGRESS_THRESHOLD_YELLOW = 50;

export default function ProgressPage() {
  const { t } = useTranslation('common');

  const { data, isLoading } = useQuery<ProgressSummary>({
    queryKey: ["/api/progress/summary"],
    queryFn: () => apiRequest("GET", "/api/progress/summary"),
  });

  const stages = selectArray<ProgressStage>(data?.stages, "stages");

  const renderStageColor = (percent: number): string => {
    if (percent >= PROGRESS_THRESHOLD_GREEN) return "bg-emerald-500";
    if (percent >= PROGRESS_THRESHOLD_YELLOW) return "bg-yellow-500";
    return "bg-rose-500";
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">{t('progress.title', 'Jarayon holati')}</b></>}
        title={t('progress.title', 'Jarayon holati')}
        subtitle={t('progress.description', 'O2C tsikl bosqichlari real-time progress')}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('progress.overall', 'Umumiy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data?.overallPercent ?? 0}%</p>
              <Progress value={data?.overallPercent ?? 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('progress.active', 'Faol buyurtmalar')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[var(--ep-blue)]">{data?.activeOrders ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('progress.completed', "Bugun tugatildi")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[var(--ep-green)]">{data?.completedToday ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('progress.blocked', 'Bloklangan')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[var(--ep-red)]">{data?.blockedCount ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('progress.stages', 'Bosqichlar bo\'yicha')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('progress.noStages', 'Ma\'lumot yo\'q')}
            </p>
          ) : stages.map((s) => (
            <div key={s.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.label}</span>
                <Badge variant="outline">
                  {s.current} / {s.target}
                </Badge>
              </div>
              <Progress value={s.percent} className={renderStageColor(s.percent)} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{s.percent}%</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {s.trend}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
