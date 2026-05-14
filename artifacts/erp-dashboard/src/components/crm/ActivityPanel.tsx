/**
 * @module ActivityPanel
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Send,
  Plus,
  FileText,
  Video
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { formatDateTime } from "@/lib/format";
import { useTranslation } from '@/lib/i18n';

interface Activity {
  id: number;
  typeId: number;
  subject: string;
  description: string;
  ownerTypeId: number;
  ownerId: number;
  responsibleId: string;
  deadline: string | null;
  completed: boolean;
  dateCreate: string;
}

interface Comment {
  id: number;
  content: string;
  authorId: string;
  createdAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface HistoryItem {
  id: number;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface ActivityPanelProps {
  entityType: "lead" | "deal" | "contact" | "company" | "proposal" | "invoice";
  entityId: number;
  ownerTypeId?: number;
}

const ACTIVITY_ICONS: Record<number, typeof Phone> = {
  1: Phone,
  2: Mail,
  3: Calendar,
  4: FileText,
  5: Video,
  6: MessageSquare,
};

const ACTIVITY_COLORS: Record<number, string> = {
  1: "text-[var(--ep-green)]",
  2: "text-[var(--ep-blue)]",
  3: "text-[var(--ep-purple)]",
  4: "text-[var(--ep-primary)]",
  5: "text-[var(--ep-red)]",
  6: "text-[var(--ep-yellow)]",
};

export function ActivityPanel({ entityType, entityId, ownerTypeId = 1 }: ActivityPanelProps) {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState("activities");
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/crm/activities", { ownerTypeId, ownerId: entityId }],
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/crm/comments", { entityType, entityId }],
  });

  const { data: history, isLoading: historyLoading } = useQuery<HistoryItem[]>({
    queryKey: ["/api/crm/history", { entityType, entityId }],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/crm/comments", {
        entityType,
        entityId,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/comments", { entityType, entityId }] });
      setNewComment("");
      toast({
        title: "Izoh qo'shildi",
        description: "Yangi izoh muvaffaqiyatli qo'shildi",
      });
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Izoh qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const completeActivityMutation = useMutation({
    mutationFn: async (activityId: number) => {
      return apiRequest("PATCH", `/api/crm/activities/${activityId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", { ownerTypeId, ownerId: entityId }] });
      toast({
        title: "Bajarildi",
        description: "Faoliyat tugallandi deb belgilandi",
      });
    },
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };


  const formatRelativeDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: uz });
    } catch {
      return dateStr;
    }
  };

  const pendingActivities = activities?.filter(a => !a.completed) || [];
  const completedActivities = activities?.filter(a => a.completed) || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-[14px] font-semibold flex items-center justify-between">
          <span>{t("faoliyatlar")}</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {pendingActivities.length} kutilmoqda
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
              <TabsTrigger value="activities" data-testid="tab-activities">
                {t("ishlar")}
              </TabsTrigger>
              <TabsTrigger value="comments" data-testid="tab-comments">
                {t("notes")}
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                {t("tarix")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="activities" className="flex-1 overflow-hidden m-0 mt-4">
            <ScrollArea className="h-full px-4">
              <div className="space-y-3 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button size="sm" variant="outline" data-testid="button-add-call">
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    {t("qongiroq")}
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-add-email">
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    {t("email1")}
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-add-meeting">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {t("uchrashuv")}
                  </Button>
                </div>

                {activitiesLoading ? (
                  <div className="text-center py-4 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>
                ) : pendingActivities.length === 0 ? (
                  <div className="text-center py-8 text-[13px] text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t("rejadagiIshlarYoq")}</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{t("rejadagi")}</h4>
                    {(Array.isArray(pendingActivities) ? pendingActivities : []).map((activity) => {
                      const Icon = ACTIVITY_ICONS[activity.typeId] || MessageSquare;
                      const colorClass = ACTIVITY_COLORS[activity.typeId] || "text-muted-foreground";
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover-elevate"
                          data-testid={`activity-${activity.id}`}
                        >
                          <div className={`mt-0.5 ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.subject}</p>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {activity.description}
                              </p>
                            )}
                            {activity.deadline && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDateTime(activity.deadline)}
                              </p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => completeActivityMutation.mutate(activity.id)}
                            data-testid={`button-complete-activity-${activity.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </>
                )}

                {completedActivities.length > 0 && (
                  <>
                    <h4 className="text-sm font-medium text-muted-foreground mt-4 mb-2">{t("bajarilgan")}</h4>
                    {(Array.isArray(completedActivities) ? completedActivities : []).slice(0, 5).map((activity) => {
                      const Icon = ACTIVITY_ICONS[activity.typeId] || MessageSquare;
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 border rounded-lg opacity-60"
                          data-testid={`activity-completed-${activity.id}`}
                        >
                          <div className="mt-0.5 text-[var(--ep-green)]">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate line-through">{activity.subject}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatRelativeDate(activity.dateCreate)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-hidden m-0 mt-4">
            <div className="h-full flex flex-col px-4">
              <div className="flex gap-2 mb-4">
                <Textarea
                  placeholder={t("izohYozing")}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none min-h-[60px]"
                  data-testid="input-new-comment"
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  data-testid="button-send-comment"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-3 pb-4">
                  {commentsLoading ? (
                    <div className="text-center py-4 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>
                  ) : !comments?.length ? (
                    <div className="text-center py-8 text-[13px] text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t("izohlarYoq")}</p>
                    </div>
                  ) : (
                    (Array.isArray(comments) ? comments : []).map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3"
                        data-testid={`comment-${comment.id}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {comment.author?.firstName?.[0] || "U"}
                            {comment.author?.lastName?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {comment.author?.firstName || "Foydalanuvchi"} {comment.author?.lastName || ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden m-0 mt-4">
            <ScrollArea className="h-full px-4">
              <div className="space-y-3 pb-4">
                {historyLoading ? (
                  <div className="text-center py-4 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>
                ) : !history?.length ? (
                  <div className="text-center py-8 text-[13px] text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t("tarixYoq")}</p>
                  </div>
                ) : (
                  (Array.isArray(history) ? history : []).map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 text-sm border-l-2 border-muted pl-3 py-1"
                      data-testid={`history-${item.id}`}
                    >
                      <div className="flex-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {item.user?.firstName || "Tizim"} {item.user?.lastName || ""}
                          </span>
                          {" "}
                          {item.action === "created" && "yaratdi"}
                          {item.action === "updated" && `${item.fieldName || "ma'lumotlarni"} yangiladi`}
                          {item.action === "stage_changed" && (
                            <>bosqichni <span className="line-through text-[var(--ep-red)]">{item.oldValue}</span> dan <span className="text-[var(--ep-green)]">{item.newValue}</span> {t("gaOzgartirdi")}</>
                          )}
                          {item.action === "deleted" && "o'chirdi"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
