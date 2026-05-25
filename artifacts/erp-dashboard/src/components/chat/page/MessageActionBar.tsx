/**
 * @module MessageActionBar
 * @description Hover action bar (react, reply, thread, pin, edit, star, delete) for MessageBubble.
 * Split from MessageBubble.tsx (Rule 16).
 */

import { useState, useCallback } from "react";
import {
  Pencil, Trash2, MessageSquare, CornerUpRight, Pin, Smile,
  CornerDownRight, CheckSquare, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/store/chatStore";
import { EmojiPicker } from "./MessageReactions";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

interface MessageActionBarProps {
  msg: ChatMessage;
  isMe: boolean;
  canPin?: boolean;
  onEdit?: (msg: ChatMessage) => void;
  onDelete?: (msg: ChatMessage) => void;
  onReply?: (msg: ChatMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onThread?: (msg: ChatMessage) => void;
  onForward?: (msg: ChatMessage) => void;
  onPin?: (msg: ChatMessage) => void;
  onCreateTask: () => void;
}

export function MessageActionBar({
  msg, isMe, canPin,
  onEdit, onDelete, onReply, onReact, onThread, onForward, onPin, onCreateTask,
}: MessageActionBarProps) {
  const { t } = useTranslation("common");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  const handleStar = useCallback(async () => {
    try {
      const res = await apiRequest('POST', `/api/chat/messages/${msg.id}/star`);
      const data = (res as { starred: boolean });
      setIsStarred(data.starred);
    } catch {
      // ignore
    }
  }, [msg.id]);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    onReact?.(messageId, emoji);
    setShowEmojiPicker(false);
  }, [onReact]);

  return (
    <div className={cn(
      "flex gap-0.5 mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
      "bg-[var(--tg-action-bar-bg)] rounded-lg shadow-md border border-[var(--tg-border)] p-0.5",
      isMe ? "order-first mr-0.5" : "order-last ml-0.5"
    )}>
      {msg.messageType === "text" && (
        <button
          onClick={onCreateTask}
          className="p-1.5 rounded-md hover:bg-[var(--tg-hover)] text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)] transition-colors"
          title={t("taskYaratish")}
        >
          <CheckSquare className="w-[15px] h-[15px]" />
        </button>
      )}

      {onReact && (
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker((p) => !p)}
            className="p-1.5 rounded-md hover:bg-[var(--tg-hover)] text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)] transition-colors"
            title={t("reaksiya")}
          >
            <Smile className="w-[15px] h-[15px]" />
          </button>
          {showEmojiPicker && (
            <div className={cn("absolute bottom-full mb-1", isMe ? "right-0" : "left-0")}>
              <EmojiPicker
                messageId={msg.id}
                onReact={handleReact}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>
      )}

      {onReply && (
        <button
          onClick={() => onReply(msg)}
          className="p-1.5 rounded-md hover:bg-[var(--tg-hover)] text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)] transition-colors"
          title={t("javob")}
        >
          <CornerUpRight className="w-[15px] h-[15px]" />
        </button>
      )}

      {onThread && (
        <button
          onClick={() => onThread(msg)}
          className="p-1.5 rounded-md hover:bg-[var(--tg-hover)] text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)] transition-colors"
          title={t("thread")}
        >
          <MessageSquare className="w-[15px] h-[15px]" />
        </button>
      )}

      {onForward && (
        <button
          onClick={() => onForward(msg)}
          className="p-1.5 rounded-md hover:bg-[var(--tg-hover)] text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)] transition-colors"
          title={t("submitBtn")}
        >
          <CornerDownRight className="w-[15px] h-[15px]" />
        </button>
      )}

      {canPin && onPin && (
        <button
          onClick={() => onPin(msg)}
          className={cn(
            "p-1.5 rounded-md hover:bg-[var(--tg-hover)] transition-colors",
            msg.isPinned ? "text-[var(--tg-sidebar-active)]" : "text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)]"
          )}
          title={msg.isPinned ? t("unpin") : t("pin")}
        >
          <Pin className="w-[15px] h-[15px]" />
        </button>
      )}

      {isMe && onEdit && msg.messageType === "text" && (
        <button
          onClick={() => onEdit(msg)}
          className="p-1.5 rounded-md hover:bg-[var(--tg-hover)] text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)] transition-colors"
          title={t("edit")}
        >
          <Pencil className="w-[14px] h-[14px]" />
        </button>
      )}

      <button
        onClick={handleStar}
        className={cn(
          "p-1.5 rounded-md hover:bg-[var(--tg-hover)] transition-colors",
          isStarred ? "text-[var(--ep-yellow)]" : "text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)]"
        )}
        title={isStarred ? t("unstar") : t("star")}
      >
        <Star className={cn("w-[15px] h-[15px]", isStarred && "fill-yellow-500")} />
      </button>

      {isMe && onDelete && (
        <button
          onClick={() => onDelete(msg)}
          className="p-1.5 rounded-md hover:bg-red-50 text-[var(--tg-text-secondary)] hover:text-red-500 transition-colors"
          title={t("delete")}
        >
          <Trash2 className="w-[14px] h-[14px]" />
        </button>
      )}
    </div>
  );
}
