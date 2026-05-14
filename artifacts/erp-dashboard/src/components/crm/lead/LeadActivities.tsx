/**
 * @module LeadActivities
 * @description React UI component.
 */

import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity as ActivityType, HistoryItem, Lead } from "./types";

interface LeadActivitiesProps {
  activities: ActivityType[];
  history: HistoryItem[];
  lead: Lead | null;
}

export function LeadActivities({ activities, history, lead }: LeadActivitiesProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Faoliyatlar
            {activities.length > 0 && <Badge variant="secondary" className="ml-auto">{activities.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Faoliyatlar yo'q</p>
              ) : (
                (Array.isArray(activities) ? activities : []).map((act) => (
                  <div key={act.id} className="flex items-start gap-2 text-sm border-l-2 border-blue-200 pl-3">
                    <div>
                      <p className="font-medium">{act.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {act.type} • {act.dueDate ? format(new Date(act.dueDate), "dd.MM.yyyy") : "Muddat yo'q"}
                        {act.isDone && <span className="ml-1 text-[var(--ep-green)]">✓</span>}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            O'zgarishlar tarixi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm border-l-2 border-green-200 pl-3">
                <div>
                  <p className="font-medium">Lead yaratildi</p>
                  <p className="text-xs text-muted-foreground">
                    {lead?.dateCreate && format(new Date(lead.dateCreate), "dd.MM.yyyy HH:mm")}
                  </p>
                </div>
              </div>
              {Array.isArray(history) && history.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm border-l-2 border-gray-200 pl-3">
                  <div>
                    <p className="font-medium">
                      {h.action === "stage_changed" ? `Bosqich: ${h.oldStageId} → ${h.newStageId}` :
                       h.action === "updated" ? "Yangilandi" :
                       h.action === "created" ? "Yaratildi" : h.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {h.user?.fullName || "Tizim"} • {format(new Date(h.createdAt), "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
