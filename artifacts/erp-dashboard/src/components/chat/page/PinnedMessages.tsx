/**
 * @module PinnedMessages
 * @description React UI component.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ChatAvatar } from "./ChatAvatar";
import { Pin, PinOff } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface PinnedMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  messageType: string;
  senderName: string;
  senderAvatar?: string;
}

interface Props {
  roomId: string;
  canPin: boolean;
}

export function PinnedMessages({ roomId, canPin }: Props) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: pinned = [], isLoading } = useQuery<PinnedMessage[]>({
    queryKey: ["chat-room-pinned-messages", roomId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/chat/rooms/${roomId}/pinned-messages`);
      if (!res.ok) throw new Error("Failed to load pinned messages");
      return res.json();
    },
    enabled: !!roomId,
    staleTime: 30_000,
  });

  const unpinMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiRequest('DELETE', `/api/chat/messages/${messageId}/pin`);
      if (!res.ok) throw new Error("Failed to unpin");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Pin olib tashlandi" });
      qc.invalidateQueries({ queryKey: ["chat-room-pinned-messages", roomId] });
    },
    onError: () => {
      toast({ title: "Xato", description: "Pin olib bo'lmadi", variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 flex-shrink-0">
        <Pin className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("pinlanganXabarlar")}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">{pinned.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <EPLoader tone="muted" className="w-5 h-5" />
          </div>
        ) : pinned.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-muted-foreground">
            <Pin className="w-8 h-8 opacity-30" />
            <p className="text-xs">{t("pinlanganXabarlarYoq")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(pinned) ? pinned : []).map((msg) => (
              <div
                key={msg.id}
                className="flex gap-2.5 p-2.5 rounded-xl border border-border/40 hover:border-border/60 transition-all group"
              >
                <ChatAvatar name={msg.senderName} url={msg.senderAvatar} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold truncate">{msg.senderName}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {format(new Date(msg.createdAt), "dd.MM HH:mm")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {msg.content || "[Fayl]"}
                  </p>
                </div>
                {canPin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-red-500"
                    onClick={() => unpinMutation.mutate(msg.id)}
                    disabled={unpinMutation.isPending}
                    title={t("pinOlibTashlash")}
                  >
                    <PinOff className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
