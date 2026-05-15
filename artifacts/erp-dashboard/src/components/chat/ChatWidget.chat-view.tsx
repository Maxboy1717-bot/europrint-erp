/**
 * @module ChatWidget.chat-view
 * @description ChatView panel (message timeline + composer) for ChatWidget.
 *   Split out so the sibling views file stays under 300 lines.
 */

import { type RefObject } from "react";
import { MessageCircle, X, Send, ChevronLeft, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatRoom, ChatMessage } from "@/store/chatStore";

import { Avatar, formatTime } from "./ChatWidget.helpers";

export function ChatView({
  activeRoom,
  messages,
  groupedMessages,
  currentUserId,
  typingUsers,
  inputText,
  inputRef,
  messagesEndRef,
  onBack,
  onClose,
  onChange,
  onSend,
  t,
}: {
  activeRoom: ChatRoom;
  messages: ChatMessage[];
  groupedMessages: { date: string; msgs: ChatMessage[] }[];
  currentUserId: number | string | undefined;
  typingUsers: Set<string>;
  inputText: string;
  inputRef: RefObject<HTMLInputElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onClose: () => void;
  onChange: (v: string) => void;
  onSend: () => void;
  t: (k: string) => string;
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-primary text-primary-foreground">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/20">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <Avatar
          name={activeRoom.displayName || activeRoom.name || "?"}
          url={activeRoom.avatarUrl}
          size={32}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{activeRoom.displayName || activeRoom.name}</p>
          {typingUsers.size > 0 ? (
            <p className="text-[11px] opacity-80">{Array.from(typingUsers)[0]} yozmoqda...</p>
          ) : (
            <p className="text-[11px] opacity-70 capitalize">{activeRoom.type}</p>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 bg-muted/20">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <MessageCircle className="w-8 h-8 opacity-30" />
            <p>{t("xabarlarYoqBirinchiXabarniYuboring")}</p>
          </div>
        )}
        {(Array.isArray(groupedMessages) ? groupedMessages : []).map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex justify-center my-2">
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {date}
              </span>
            </div>
            {(Array.isArray(msgs) ? msgs : []).map((msg, idx) => {
              const isMe = String(msg.senderId) === String(currentUserId);
              const prevMsg = idx > 0 ? msgs[idx - 1] : null;
              const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
              const showName = !isMe && showAvatar;

              if (msg.isDeleted) {
                return (
                  <div
                    key={msg.id}
                    className={cn("flex gap-2 mb-1", isMe ? "flex-row-reverse" : "flex-row")}
                  >
                    <div className={cn("w-7 flex-shrink-0", isMe && "hidden")} />
                    <span className="text-xs italic text-muted-foreground/60 px-3 py-1.5 bg-muted/30 rounded-lg">
                      {t("xabarOchirildi")}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-2 mb-1", isMe ? "flex-row-reverse" : "flex-row")}
                >
                  <div className={cn("w-7 flex-shrink-0", isMe && "hidden")}>
                    {showAvatar && <Avatar name={msg.senderName} url={msg.senderAvatar} size={28} />}
                  </div>
                  <div className={cn("max-w-[75%] flex flex-col", isMe && "items-end")}>
                    {showName && (
                      <span className="text-[11px] text-muted-foreground ml-1 mb-0.5">
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-background border border-border rounded-tl-sm"
                      )}
                    >
                      {msg.messageType === "text" && (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                      {msg.messageType === "file" && msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-[160px]">{msg.fileName || "Fayl"}</span>
                        </a>
                      )}
                      {msg.isEdited && (
                        <span
                          className={cn(
                            "text-[9px] opacity-60",
                            isMe ? "text-primary-foreground" : "text-muted-foreground"
                          )}
                        >
                          {" "}
                          (tahrirlangan)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 py-2 border-t border-border bg-background flex items-end gap-2">
        <Input
          ref={inputRef}
          value={inputText}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={t("xabarYozing")}
          className="flex-1 h-9 text-sm"
        />
        <Button size="sm" onClick={onSend} disabled={!inputText.trim()} className="h-9 w-9 p-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
}
