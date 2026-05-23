/**
 * @module DesignOrderChat
 * @description Chat panel (messages + send box) for DesignOrderDetail.
 * Extracted from DesignOrderDetail.tsx (Rule 16).
 */

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DesignOrderMessage {
  id: number;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'sales' | 'design' | 'system';
  message: string;
  attachments: string[] | null;
  createdAt: Date;
}

interface DesignOrderChatProps {
  orderId: string;
  t: (key: string) => string;
}

export function DesignOrderChat({ orderId, t }: DesignOrderChatProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<DesignOrderMessage[]>({
    queryKey: ["/api/design/orders", orderId, "messages"],
    refetchInterval: 5000,
    enabled: !!orderId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) =>
      apiRequest('POST', `/api/design/orders/${orderId}/messages`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders", orderId, "messages"] });
      setNewMessage("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Xabar yuborishda xatolik yuz berdi", variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader>
        <CardTitle>{t("chatSavdoDizayn")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
          {messagesLoading ? (
            <div className="text-center text-muted-foreground">
              <p>{t("xabarlarYuklanmoqda")}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>{t("hozirchaXabarlarYoq")}</p>
              <p className="text-sm">{t("birinchiXabarniYuboring")}</p>
            </div>
          ) : (
            (Array.isArray(messages) ? messages : []).map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderRole === 'sales' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${msg.id}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.senderRole === 'sales'
                      ? 'bg-[var(--ep-primary)] text-white'
                      : msg.senderRole === 'design'
                      ? 'bg-[var(--ep-blue)] text-white'
                      : 'bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm">{msg.senderName}</span>
                    <span className="text-xs opacity-75">
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t("xabarYozing")}
              className="resize-none"
              rows={2}
              data-testid="input-message"
            />
            <div className="flex flex-col gap-2">
              <Button size="icon" variant="outline" disabled data-testid="button-attach">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                data-testid="button-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("enterYuborishShiftEnterYangi1")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
