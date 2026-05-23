/**
 * @module ActivityPanelActivitiesTab
 * @description Activities tab content for ActivityPanel (pending + completed list).
 * Split from ActivityPanel.tsx (Rule 16).
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Mail, Calendar, MessageSquare, FileText, Video, CheckCircle2, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { formatDateTime } from "@/lib/format";

const ACTIVITY_ICONS: Record<number, typeof Phone> = {
  1: Phone, 2: Mail, 3: Calendar, 4: FileText, 5: Video, 6: MessageSquare,
};
const ACTIVITY_COLORS: Record<number, string> = {
  1: "text-[var(--ep-green)]", 2: "text-[var(--ep-blue)]", 3: "text-[var(--ep-purple)]",
  4: "text-[var(--ep-primary)]", 5: "text-[var(--ep-red)]", 6: "text-[var(--ep-yellow)]",
};

interface Activity {
  id: number; typeId: number; subject: string; description: string;
  ownerTypeId: number; ownerId: number; responsibleId: string;
  deadline: string | null; completed: boolean; dateCreate: string;
}

interface Props {
  entityType: string;
  entityId: number;
  ownerTypeId: number;
  t: (key: string) => string;
}

export function ActivityPanelActivitiesTab({ entityType, entityId, ownerTypeId, t }: Props) {
  void entityType;
  const { toast } = useToast();

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/crm/activities", { ownerTypeId, ownerId: entityId }],
  });

  const completeMutation = useMutation({
    mutationFn: (activityId: number) => apiRequest("PATCH", `/api/crm/activities/${activityId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", { ownerTypeId, ownerId: entityId }] });
      toast({ title: "Bajarildi", description: "Faoliyat tugallandi deb belgilandi" });
    },
  });

  const pending = (Array.isArray(activities) ? activities : []).filter(a => !a.completed);
  const completed = (Array.isArray(activities) ? activities : []).filter(a => a.completed);

  const fmtRelative = (d: string) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: uz }); }
    catch { return d; }
  };

  return (
    <ScrollArea className="h-full px-4">
      <div className="space-y-3 pb-4">
        {/* Quick-add buttons row */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="text-xs mr-auto">{pending.length} kutilmoqda</Badge>
          <Button size="sm" variant="outline" data-testid="button-add-call">
            <Phone className="h-3.5 w-3.5 mr-1.5" />{t("qongiroq")}
          </Button>
          <Button size="sm" variant="outline" data-testid="button-add-email">
            <Mail className="h-3.5 w-3.5 mr-1.5" />{t("email1")}
          </Button>
          <Button size="sm" variant="outline" data-testid="button-add-meeting">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />{t("uchrashuv")}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-4 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>
        ) : pending.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{t("rejadagiIshlarYoq")}</p>
          </div>
        ) : (
          <>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">{t("rejadagi")}</h4>
            {pending.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.typeId] || MessageSquare;
              const colorClass = ACTIVITY_COLORS[activity.typeId] || "text-muted-foreground";
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover-elevate" data-testid={`activity-${activity.id}`}>
                  <div className={`mt-0.5 ${colorClass}`}><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.subject}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.description}</p>
                    )}
                    {activity.deadline && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />{formatDateTime(activity.deadline)}
                      </p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => completeMutation.mutate(activity.id)}
                    data-testid={`button-complete-activity-${activity.id}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </>
        )}

        {completed.length > 0 && (
          <>
            <h4 className="text-sm font-medium text-muted-foreground mt-4 mb-2">{t("bajarilgan")}</h4>
            {completed.slice(0, 5).map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.typeId] || MessageSquare;
              void Icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg opacity-60" data-testid={`activity-completed-${activity.id}`}>
                  <div className="mt-0.5 text-[var(--ep-green)]"><CheckCircle2 className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate line-through">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtRelative(activity.dateCreate)}</p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
