/**
 * @module CommentForm
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AtSign, Paperclip } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommentFormProps {
  entityType: string;
  entityId: number;
}

export function CommentForm({ entityType, entityId }: CommentFormProps) {
  const { toast } = useToast();
  const [commentForm, setCommentForm] = useState({
    content: "",
    mentions: [] as string[],
    attachments: [] as File[],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      // Backend expects: { text, lead_id?, deal_id? }
      const payload: Record<string, unknown> = { text: content };
      if (entityType === "leads") payload.lead_id = entityId;
      else if (entityType === "deals") payload.deal_id = entityId;
      return apiRequest("POST", "/api/crm/comments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/comments", entityType, entityId] });
      toast({ title: "Izoh qo'shildi" });
      setCommentForm({ content: "", mentions: [], attachments: [] });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Izoh qo'shishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-3 p-4">
      <Textarea
        placeholder="Izoh yozing..."
        value={commentForm.content}
        onChange={(e) => setCommentForm((prev) => ({ ...prev, content: e.target.value }))}
        className="min-h-[100px] resize-none"
        data-testid="input-comment-content"
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" data-testid="button-mention-user">
          <AtSign className="h-3.5 w-3.5 mr-1.5" />
          Eslatma
        </Button>
        <Button variant="outline" size="sm" data-testid="button-attach-file">
          <Paperclip className="h-3.5 w-3.5 mr-1.5" />
          Fayl
        </Button>
      </div>
      <Button
        className="w-full bg-blue-500 hover:bg-[var(--ep-blue)]/90"
        onClick={() => addCommentMutation.mutate(commentForm.content)}
        disabled={!commentForm.content.trim() || addCommentMutation.isPending}
        data-testid="button-save-comment"
      >
        <Send className="h-4 w-4 mr-2" />
        Saqlash
      </Button>
    </div>
  );
}
