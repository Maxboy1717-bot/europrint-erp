/**
 * @module MessageArea
 * @description React UI component.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore, ChatMessage } from "@/store/chatStore";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { formatDateSeparator } from "./ChatUtils";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from '@/lib/i18n';

interface GroupedMsgs {
  date: string;
  msgs: ChatMessage[];
}

interface Props {
  roomId: string;
  canPin?: boolean;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
  onReply: (msg: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onThread: (msg: ChatMessage) => void;
  onForward: (msg: ChatMessage) => void;
  onPin: (msg: ChatMessage) => void;
}

const EMPTY_MESSAGES: ChatMessage[] = [];
const EMPTY_TYPING = new Set<string>();

export function MessageArea({
  roomId, canPin, onEdit, onDelete, onReply, onReact, onThread, onForward, onPin,
}: Props) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const messages = useChatStore((s) => s.messages[roomId] ?? EMPTY_MESSAGES);
  const typingUsers = useChatStore((s) => s.typingUsers[roomId] ?? EMPTY_TYPING);
  const isReadByOthers = useChatStore((s) => s.readByOthers.has(roomId));
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const msgRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const scrollToMessage = useCallback((msgId: string) => {
    const el = msgRefs.current.get(msgId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-[var(--tg-sidebar-active)]/40", "rounded-lg");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-[var(--tg-sidebar-active)]/40", "rounded-lg");
      }, 1500);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(false);
  }, [roomId, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  }, []);

  // Group by date
  const grouped = messages.reduce<GroupedMsgs[]>((acc, msg) => {
    const date = formatDateSeparator(msg.createdAt);
    const last = acc[acc.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else acc.push({ date, msgs: [msg] });
    return acc;
  }, []);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: "var(--tg-chat-bg)" }}>
        <div className="flex flex-col items-center gap-3 bg-[var(--tg-date-pill)] border border-black/[0.06] rounded-lg px-8 py-6 shadow-sm backdrop-blur-sm">
          <span className="text-5xl">💬</span>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-[var(--tg-text-primary)]">{t("xabarlarYoq")}</p>
            <p className="text-[13px] text-[var(--tg-text-secondary)] mt-1">{t("birinchiXabarniYuboring")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "var(--tg-chat-bg)" }}>
      {/* Subtle WhatsApp-style background pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 scroll-smooth relative"
        style={{ overscrollBehavior: "contain" }}
      >
        {(Array.isArray(grouped) ? grouped : []).map(({ date, msgs }) => (
          <div key={date}>
            {/* ── Date separator with lines ── */}
            <div className="flex items-center gap-3 my-4 px-2">
              <div className="flex-1 h-px bg-black/10" />
              <span className="text-[12px] font-medium text-[#666] bg-[var(--tg-date-pill)] px-3 py-1 rounded-full shadow-sm select-none backdrop-blur-sm whitespace-nowrap border border-black/[0.06]">
                {date}
              </span>
              <div className="flex-1 h-px bg-black/10" />
            </div>

            {(Array.isArray(msgs) ? msgs : []).map((msg, idx) => {
              const isMe = String(msg.senderId) === String(user?.id);
              const prevMsg = idx > 0 ? msgs[idx - 1] : null;
              const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
              const showName = !isMe && showAvatar && !!msg.senderName;

              return (
                <div
                  key={msg.id}
                  ref={(el) => {
                    if (el) msgRefs.current.set(msg.id, el);
                    else msgRefs.current.delete(msg.id);
                  }}
                  className="transition-all"
                >
                  <MessageBubble
                    msg={msg}
                    isMe={isMe}
                    showAvatar={showAvatar}
                    showName={showName}
                    isRead={isMe ? isReadByOthers : undefined}
                    canPin={canPin}
                    onEdit={isMe ? onEdit : undefined}
                    onDelete={isMe ? onDelete : undefined}
                    onReply={onReply}
                    onReact={onReact}
                    onThread={onThread}
                    onForward={onForward}
                    onPin={canPin ? onPin : undefined}
                    onScrollTo={scrollToMessage}
                  />
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className={cn(
            "absolute bottom-16 right-5 z-10 w-10 h-10 rounded-full",
            "bg-[var(--tg-action-bar-bg)] shadow-[0_2px_12px_rgba(0,0,0,0.18)] border border-[var(--tg-border)]",
            "flex items-center justify-center",
            "hover:scale-105 transition-all active:scale-95"
          )}
        >
          <ChevronDown className="w-5 h-5 text-[var(--tg-sidebar-active)]" />
        </button>
      )}
    </div>
  );
}
