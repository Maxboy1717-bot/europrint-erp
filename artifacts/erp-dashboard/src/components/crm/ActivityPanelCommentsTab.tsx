// i18next — toast messages are translation data resolved at runtime
/**
 * @module ActivityPanelCommentsTab
 * @description Comments tab content for ActivityPanel.
 * Split from ActivityPanel.tsx (Rule 16).
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

interface Comment {
  id: number; content: string; authorId: string; createdAt: string;
  author?: { id: string; firstName: string; lastName: string };
}

interface Props {
  entityType: string;
  entityId: number;
  t: (key: string) => string;
}

export function ActivityPanelCommentsTab({ entityType, entityId, t }: Props) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/crm/comments", { entityType, entityId }],
  });

  const addMutation = useMutation({
    mutationFn: (content: string) => apiRequest("POST", "/api/crm/comments", { entityType, entityId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/comments", { entityType, entityId }] });
      setNewComment("");
      toast({ title: "Izoh qo'shildi", description: "Yangi izoh muvaffaqiyatli qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", description: "Izoh qo'shishda xatolik yuz berdi", variant: "destructive" }),
  });

  const fmtRelative = (d: string) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: uz }); }
    catch { return d; }
  };

  return (
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
          onClick={() => { if (newComment.trim()) addMutation.mutate(newComment.trim()); }}
          disabled={!newComment.trim() || addMutation.isPending}
          data-testid="button-send-comment"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pb-4">
          {isLoading ? (
            <div className="text-center py-4 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : !comments?.length ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("izohlarYoq")}</p>
            </div>
          ) : (
            (Array.isArray(comments) ? comments : []).map((comment) => (
              <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {comment.author?.firstName?.[0] || "U"}{comment.author?.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.author?.firstName || "Foydalanuvchi"} {comment.author?.lastName || ""}
                    </span>
                    <span className="text-xs text-muted-foreground">{fmtRelative(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
