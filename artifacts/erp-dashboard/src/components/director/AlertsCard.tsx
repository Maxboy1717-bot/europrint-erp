/**
 * @module AlertsCard
 * @description React UI component.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/director/helpers";
import type { AlertItem } from "@/components/director/types";
import { useTranslation } from '@/lib/i18n';

interface AlertsCardProps {
  alerts: AlertItem[] | undefined;
  alertCount: number;
}

export function AlertsCard({ alerts, alertCount }: AlertsCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card data-testid="card-alerts">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <SectionTitle icon={Bell} title={t("ogohlantirishlar")} sub={`${alertCount} ta faol`} accent="text-[var(--ep-red)]" />
          {alertCount > 0 && (
            <Badge className="bg-red-100 text-[var(--ep-red)] border-none">{alertCount}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(alerts?.length ?? 0) === 0 ? (
          <div className="text-center py-5">
            <CheckCircle className="w-8 h-8 text-[var(--ep-green)] mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("hammaYaxshi")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts?.slice(0, 6).map(alert => (
              <div key={alert.id} className={cn("p-3 rounded-lg flex gap-2", alert.severity === "critical" ? "bg-red-50 border border-red-100" : alert.severity === "high" ? "bg-amber-50 border border-amber-100" : "bg-muted/30")} data-testid={`alert-item-${alert.id}`}>
                <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", alert.severity === "critical" ? "text-[var(--ep-red)]" : alert.severity === "high" ? "text-[var(--ep-yellow)]" : "text-muted-foreground")} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{alert.title}</p>
                  <p className="text-[10px] text-muted-foreground">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{alert.module}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
