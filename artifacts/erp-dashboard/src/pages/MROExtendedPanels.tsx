/** @module MROExtendedPanels @description Standalone inner panel components for the MROExtended page (PMUpcomingPanel). */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { EPStatusPill } from "@/components/ep";

interface PMScheduleItem {
  id: number | string;
  taskName?: string;
  equipmentName?: string;
  equipmentCode?: string;
  nextDueDate?: string;
  priority?: string;
}

interface PMUpcomingData {
  upcoming?: PMScheduleItem[];
  overdue?: PMScheduleItem[];
}

export function PMUpcomingPanel() {
  const { data, isLoading } = useQuery<PMUpcomingData>({
    queryKey: ["/api/integration/mro/pm-upcoming"],
  });

  const upcoming = data?.upcoming ?? [];
  const overdue  = data?.overdue  ?? [];

  if (isLoading) return null;
  if (upcoming.length === 0 && overdue.length === 0) return null;

  return (
    <div className="space-y-3">
      {overdue.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[var(--ep-red)]">
              <AlertTriangle className="h-4 w-4" />
              Kechiktirilgan PM vazifalari ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {(Array.isArray(overdue) ? overdue : []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-950/30 text-sm"
                data-testid={`row-pm-overdue-${s.id}`}
              >
                <div>
                  <span className="font-medium">{s.taskName}</span>
                  <span className="text-muted-foreground ml-2">
                    — {s.equipmentName || s.equipmentCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <EPStatusPill tone="danger" className="text-xs">
                    {s.nextDueDate}
                  </EPStatusPill>
                  <Badge
                    variant={s.priority === "critical" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {s.priority === "critical"
                      ? "Kritik"
                      : s.priority === "high"
                      ? "Yuqori"
                      : "O'rta"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-blue)]" />
              Yaqin 7 kunda rejalashtirilgan PM ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {(Array.isArray(upcoming) ? upcoming : []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/40 text-sm"
                data-testid={`row-pm-upcoming-${s.id}`}
              >
                <div>
                  <span className="font-medium">{s.taskName}</span>
                  <span className="text-muted-foreground ml-2">
                    — {s.equipmentName || s.equipmentCode}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {s.nextDueDate}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
