/**
 * @module CameraLiveMonitoringDialogs
 * @description Header controls and stats for CameraLiveMonitoring.
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface HeaderControlsProps {
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
}

export function HeaderControls({ autoRefresh, onToggleAutoRefresh, onRefresh }: HeaderControlsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center gap-3">
      <Button
        variant={autoRefresh ? "default" : "outline"}
        size="sm"
        onClick={onToggleAutoRefresh}
        className={`rounded-lg ${autoRefresh ? 'bg-primary text-white' : 'border-border text-muted-foreground hover:bg-muted/40'}`}
        data-testid="button-toggle-refresh"
      >
        <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
        {autoRefresh ? "Auto-yangilash (ON)" : "Auto-yangilash (OFF)"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="rounded-lg border-border text-muted-foreground hover:bg-muted/40 gap-2"
        data-testid="button-manual-refresh"
      >
        <RefreshCw className="h-4 w-4" />
        {t("refresh")}
      </Button>
    </div>
  );
}

interface StatsCardsProps {
  activeCamerasCount: number;
  todayDetectionsCount: number;
  totalDetectionsCount: number;
  avgConfidence: string;
}

export function StatsCards({
  activeCamerasCount,
  todayDetectionsCount,
  totalDetectionsCount,
  avgConfidence,
}: StatsCardsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-card border-none rounded-lg p-5">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("faolKameralar")}</span>
          <span className="text-4xl font-bold tracking-tight text-foreground" data-testid="stat-active-cameras">
            {activeCamerasCount}
          </span>
        </div>
      </Card>
      <Card className="bg-card border-none rounded-lg p-5">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("bugungiAniqlashlar")}</span>
          <span className="text-4xl font-bold tracking-tight text-foreground" data-testid="stat-today-detections">
            {todayDetectionsCount}
          </span>
        </div>
      </Card>
      <Card className="bg-card border-none rounded-lg p-5">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("jamiAniqlashlar")}</span>
          <span className="text-4xl font-bold tracking-tight text-foreground" data-testid="stat-total-detections">
            {totalDetectionsCount}
          </span>
        </div>
      </Card>
      <Card className="bg-card border-none rounded-lg p-5">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("ortachaIshonch")}</span>
          <span className="text-4xl font-bold tracking-tight text-primary" data-testid="stat-avg-confidence">
            {avgConfidence}%
          </span>
        </div>
      </Card>
    </div>
  );
}
