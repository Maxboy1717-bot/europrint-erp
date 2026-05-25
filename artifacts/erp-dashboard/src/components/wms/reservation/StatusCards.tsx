/**
 * @module StatusCards
 * @description React UI component.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive, Layers, CalendarClock, Brain } from "lucide-react";
import { DashboardData, Translations } from "./types";

interface StatusCardsProps {
  dashboard: DashboardData | undefined;
  isLoading: boolean;
  t: Translations;
}

export function StatusCards({ dashboard, isLoading, t }: StatusCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.totalStock}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-total-stock">
                  {(dashboard?.totalBatches || 0).toLocaleString()}
                </p>
              )}
            </div>
            <Archive className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.reservedPct}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-reserved-pct">
                  {dashboard?.reservedPercent || 0}%
                </p>
              )}
            </div>
            <Layers className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.expiringSoon}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-expiring-soon">
                  {dashboard?.expiringSoon || 0}
                </p>
              )}
            </div>
            <CalendarClock className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.aiConfidence}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-1 rounded-lg" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-ai-confidence">
                  {dashboard?.avgConfidence || 0}%
                </p>
              )}
            </div>
            <Brain className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
