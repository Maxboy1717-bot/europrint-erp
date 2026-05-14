/**
 * @module ThreadPanel
 * @description React UI component.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore, ChatMessage } from "@/store/chatStore";
import { ChatAvatar } from "./ChatAvatar";
import { formatMsgTime } from "./ChatUtils";
import { useAuth } from "@/hooks/useAuth";
import { getChatApiBase } from "@/lib/apiBase";
import { safeStorage } from '@/lib/safeStorage';
import { useTranslation } from '@/lib/i18n';

interface Props {
  rootMessage: ChatMessage;
  onClose: () => void;
}

export function ThreadPanel({ rootMessage, onClose }: Props) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const threadMessages = useChatStore((s) => s.threadMessages[rootMessage.id] ?? []);
  const setThreadMessages = useChatStore((s) => s.setThreadMessages);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load thread messages
  useEffect(() => {
    const load = async () => {
      const token = safeStorage.getItem("access_token");
      const res = await fetch(`${getChatApiBase()}/messages/${rootMessage.id}/thread`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const msgs = await res.json() as ChatMessage[];
        setThreadMessages(rootMessage.id, msgs);
      }
    };
    load();
  }, [rootMessage.id, setThreadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [threadMessages.length]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content) return;
    setLoading(true);
    try {
      const token = safeStorage.getItem("access_token");
      await fetch(`${getChatApiBase()}/messages/${rootMessage.id}/thread`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      setText("");
    } finally {
      setLoading(false);
    }
  }, [rootMessage.id, text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 flex-shrink-0">
        <div>
          <h3 className="text-sm font-semibold">{t("thread")}</h3>
          <p className="text-xs text-muted-foreground">{threadMessages.length} javob</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Root message */}
      <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex-shrink-0">
        <div className="flex gap-2 items-start">
          <ChatAvatar name={rootMessage.senderName} url={rootMessage.senderAvatar} size={28} />
          <div className="min-w-0">
            <span className="text-xs font-medium">{rootMessage.senderName}</span>
            <p className="text-xs text-muted-foreground mt-0.5 break-words">{rootMessage.content}</p>
          </div>
        </div>
      </div>

      {/* Thread messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {(Array.isArray(threadMessages) ? threadMessages : []).map((msg) => {
          const isMe = String(msg.senderId) === String(user?.id);
          return (
            <div key={msg.id} className={cn("flex gap-2", isMe && "flex-row-reverse")}>
              <ChatAvatar name={msg.senderName} url={msg.senderAvatar} size={26} />
              <div className={cn("max-w-[80%]", isMe && "items-end flex flex-col")}>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {msg.senderName}
                </span>
                <div className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs mt-0.5",
                  isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/60"
                )}>
                  {msg.content}
                </div>
                <span className="text-[9px] text-muted-foreground mt-0.5">
                  {formatMsgTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border/60 px-3 py-2">
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("threadJavob")}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 max-h-[80px] overflow-y-auto"
            style={{ minHeight: "34px" }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || loading}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
