import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/components/director/helpers";
import type { AlertItem } from "@/components/director/types";

interface AlertsCardProps {
  alerts: AlertItem[] | undefined;
  alertCount: number;
}

export function AlertsCard({ alerts, alertCount }: AlertsCardProps) {
  return (
    <Card data-testid="card-alerts">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <SectionTitle icon={Bell} title="Ogohlantirishlar" sub={`${alertCount} ta faol`} accent="text-red-500" />
          {alertCount > 0 && (
            <Badge className="bg-red-100 text-red-700 border-none">{alertCount}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(alerts?.length ?? 0) === 0 ? (
          <div className="text-center py-5">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Hamma yaxshi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts?.slice(0, 6).map(alert => (
              <div key={alert.id} className={cn("p-3 rounded-lg flex gap-2", alert.severity === "critical" ? "bg-red-50 border border-red-100" : alert.severity === "high" ? "bg-amber-50 border border-amber-100" : "bg-muted/30")} data-testid={`alert-item-${alert.id}`}>
                <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", alert.severity === "critical" ? "text-red-500" : alert.severity === "high" ? "text-amber-500" : "text-muted-foreground")} />
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
