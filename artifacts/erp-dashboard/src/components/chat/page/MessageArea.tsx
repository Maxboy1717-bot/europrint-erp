import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore, ChatMessage } from "@/store/chatStore";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { formatDateSeparator } from "./ChatUtils";
import { useAuth } from "@/hooks/useAuth";

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
      el.classList.add("ring-2", "ring-primary/40", "rounded-2xl");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary/40", "rounded-2xl");
      }, 1500);
    }
  }, []);

  // On new message, scroll if near bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Initial load scroll
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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/10">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <span className="text-3xl">💬</span>
        </div>
        <p className="text-sm">Birinchi xabarni yuboring!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
        style={{ overscrollBehavior: "contain" }}
      >
        {(Array.isArray(grouped) ? grouped : []).map(({ date, msgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-3">
              <span className="text-[11px] bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border/40 select-none">
                {date}
              </span>
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
            "absolute bottom-16 right-4 z-10 w-9 h-9 rounded-full",
            "bg-background border border-border shadow-md",
            "flex items-center justify-center",
            "hover:bg-muted transition-colors"
          )}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
