/**
 * @module ActivityFeed
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Clock, Play, Pause } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { TimelineItem, Activity, Comment, PRIORITY_OPTIONS } from "./types";
import { getActivityIcon, getActivityColor } from "./utils";
import { useTranslation } from '@/lib/i18n';

interface ActivityFeedProps {
  entityType: string;
  entityId: number;
  timeline: TimelineItem[];
  isLoading: boolean;
}

export function ActivityFeed({
  entityType,
  entityId,
  timeline,
  isLoading,
}: ActivityFeedProps) {
  const { t } = useTranslation("common");
  const [playingRecording, setPlayingRecording] = useState<number | null>(null);
  const { toast } = useToast();

  const completeActivityMutation = useMutation({
    mutationFn: async (activityId: number) => {
      return apiRequest("PATCH", `/api/crm/activities/${activityId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", entityType, entityId] });
      toast({ title: "Faoliyat bajarildi" });
    },
  });

  const formatRelativeDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: uz });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} sek`;
    return `${mins} daq ${secs} sek`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        {t("Yuklanmoqda...")}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0 border-t border-border">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {timeline.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              <p className="text-sm">{t("hozirchaFaoliyatlarYoq")}</p>
            </div>
          ) : (
            (Array.isArray(timeline) ? timeline : []).map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="relative pl-8 before:absolute before:left-[15px] before:top-2 before:bottom-0 before:w-px before:bg-border last:before:bottom-2"
              >
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-background border flex items-center justify-center z-10">
                  {item.type === "comment" ? (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-blue-100 text-[var(--ep-blue)] text-[10px]">
                        {(item.data as Comment).authorName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    (() => {
                      const Icon = getActivityIcon((item.data as Activity).type, (item.data as Activity).direction);
                      return <Icon className={cn("h-4 w-4", getActivityColor((item.data as Activity).type, (item.data as Activity).completed))} />;
                    })()
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {item.type === "comment" ? (item.data as Comment).authorName : (item.data as Activity).responsibleName || "Tizim"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeDate(item.createdAt)}
                    </span>
                  </div>

                  {item.type === "comment" ? (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="whitespace-pre-wrap">{(item.data as Comment).content}</p>
                      {((item.data as Comment).attachments?.length ?? 0) > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(item.data as Comment).attachments?.map((file, i) => (
                            <a
                              key={`k-${i}`}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--ep-blue)] hover:underline flex items-center gap-1 bg-background px-2 py-1 rounded border"
                            >
                              {file.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-background border rounded-lg p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            (item.data as Activity).completed && "line-through opacity-60"
                          )}>
                            {(item.data as Activity).subject}
                          </p>
                          {(item.data as Activity).description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {(item.data as Activity).description}
                            </p>
                          )}
                        </div>
                        {!(item.data as Activity).completed && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-green-500 hover:bg-green-50"
                            onClick={() => completeActivityMutation.mutate((item.data as Activity).id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {(item.data as Activity).deadline && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime((item.data as Activity).deadline!)}
                          </span>
                        )}
                        {(item.data as Activity).duration && (
                          <span className="text-[11px] text-muted-foreground">
                            {formatDuration((item.data as Activity).duration!)}
                          </span>
                        )}
                        {(item.data as Activity).priority && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] h-4 px-1.5",
                              (item.data as Activity).priority === "high" && "bg-red-500/10 text-[var(--ep-red)] border-red-200",
                              (item.data as Activity).priority === "medium" && "bg-yellow-500/10 text-[var(--ep-yellow)] border-yellow-200",
                              (item.data as Activity).priority === "low" && "bg-green-500/10 text-[var(--ep-green)] border-green-200"
                            )}
                          >
                            {(Array.isArray(PRIORITY_OPTIONS) ? PRIORITY_OPTIONS : []).find((p) => p.value === (item.data as Activity).priority)?.label}
                          </Badge>
                        )}
                        {(item.data as Activity).completed && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-green-500/10 text-[var(--ep-green)] border-green-200">
                            {t("bajarilgan")}
                          </Badge>
                        )}
                      </div>

                      {(item.data as Activity).recording && (
                        <div className="mt-3 flex items-center gap-2 border-t pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => setPlayingRecording(playingRecording === item.id ? null : item.id)}
                          >
                            {playingRecording === item.id ? (
                              <Pause className="h-3 w-3 mr-1" />
                            ) : (
                              <Play className="h-3 w-3 mr-1" />
                            )}
                            Yozuvni eshitish
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
