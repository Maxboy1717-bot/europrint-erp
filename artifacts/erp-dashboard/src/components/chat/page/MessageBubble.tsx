import { useState, useCallback } from "react";
import {
  Check, CheckCheck, Pencil, Trash2, Paperclip,
  MessageSquare, CornerUpRight, Pin, Smile,
  Download, CornerDownRight, CheckSquare, Star,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/store/chatStore";
import { ChatAvatar } from "./ChatAvatar";
import { formatMsgTime } from "./ChatUtils";
import { MessageReactions, EmojiPicker } from "./MessageReactions";
import { MessagePoll } from "./MessagePoll";
import { ImageLightbox } from "./ImageLightbox";
import { CreateTaskModal } from "./CreateTaskModal";

interface Props {
  msg: ChatMessage;
  isMe: boolean;
  showAvatar: boolean;
  showName: boolean;
  isRead?: boolean;
  canPin?: boolean;
  onEdit?: (msg: ChatMessage) => void;
  onDelete?: (msg: ChatMessage) => void;
  onReply?: (msg: ChatMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onThread?: (msg: ChatMessage) => void;
  onForward?: (msg: ChatMessage) => void;
  onPin?: (msg: ChatMessage) => void;
  onScrollTo?: (msgId: string) => void;
}

export function MessageBubble({
  msg, isMe, showAvatar, showName, isRead, canPin,
  onEdit, onDelete, onReply, onReact, onThread, onForward, onPin, onScrollTo,
}: Props) {
  const [hover, setHover] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  const handleStar = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/messages/${msg.id}/star`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json() as { starred: boolean };
        setIsStarred(data.starred);
      }
    } catch {
      // ignore
    }
  }, [msg.id]);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    onReact?.(messageId, emoji);
    setShowEmojiPicker(false);
  }, [onReact]);

  if (msg.isDeleted) {
    return (
      <div className={cn("flex gap-2 mb-1", isMe ? "flex-row-reverse" : "flex-row")}>
        <div className={cn("w-8 flex-shrink-0", isMe && "hidden")} />
        <div className={cn("flex flex-col", isMe && "items-end")}>
          <span className="text-xs italic text-muted-foreground/60 px-3 py-1.5 bg-muted/30 rounded-2xl border border-border/30">
            Xabar o'chirildi
          </span>
        </div>
      </div>
    );
  }

  const hasAttachment = msg.fileUrl && (msg.messageType === "image" || msg.messageType === "file");
  const isImage = msg.messageType === "image";
  const isFile = msg.messageType === "file";
  const isPoll = msg.messageType === "poll";

  return (
    <>
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={msg.fileName}
          onClose={() => setLightboxSrc(null)}
        />
      )}

      <div
        className={cn("flex gap-2 mb-0.5 group relative", isMe ? "flex-row-reverse" : "flex-row")}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setShowEmojiPicker(false); }}
      >
        {/* Avatar */}
        <div className="w-8 flex-shrink-0 flex items-end">
          {showAvatar && !isMe ? (
            <ChatAvatar name={msg.senderName || "?"} url={msg.senderAvatar} size={30} />
          ) : null}
        </div>

        <div className={cn("max-w-[72%] flex flex-col", isMe && "items-end")}>
          {showName && !isMe && (
            <span className="text-[11px] text-muted-foreground ml-1 mb-0.5 font-medium">
              {msg.senderName}
            </span>
          )}

          {/* Pinned badge */}
          {msg.isPinned && (
            <div className="flex items-center gap-0.5 mb-0.5 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit">
              <Pin className="w-2.5 h-2.5 text-amber-600" />
              <span className="text-[9px] text-amber-600">Pinlangan</span>
            </div>
          )}

          <div className="flex items-end gap-1 relative">
            {/* Action bar (hover) */}
            {hover && !msg.isDeleted && (
              <div className={cn(
                "flex gap-0.5 mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                isMe ? "order-first mr-1" : "order-last ml-1"
              )}>
                {/* Task button — for text messages */}
                {msg.messageType === "text" && (
                  <button
                    onClick={() => setTaskModalOpen(true)}
                    className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    title="Task yaratish"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Emoji reaction */}
                {onReact && (
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker((p) => !p)}
                      className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      title="Reaksiya"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                    {showEmojiPicker && (
                      <div className={cn("absolute", isMe ? "right-0" : "left-0")}>
                        <EmojiPicker
                          messageId={msg.id}
                          onReact={handleReact}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Reply */}
                {onReply && (
                  <button
                    onClick={() => onReply(msg)}
                    className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    title="Javob berish"
                  >
                    <CornerUpRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Thread */}
                {onThread && (
                  <button
                    onClick={() => onThread(msg)}
                    className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    title="Thread ochish"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Forward */}
                {onForward && (
                  <button
                    onClick={() => onForward(msg)}
                    className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    title="Yuborish"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Pin (owner/admin only) */}
                {canPin && onPin && (
                  <button
                    onClick={() => onPin(msg)}
                    className={cn(
                      "p-1 rounded hover:bg-muted/80 transition-colors",
                      msg.isPinned ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
                    )}
                    title={msg.isPinned ? "Pinni olib tashlash" : "Pin qilish"}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Edit (own messages) */}
                {isMe && onEdit && msg.messageType === "text" && (
                  <button
                    onClick={() => onEdit(msg)}
                    className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    title="Tahrirlash"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}

                {/* Star / Bookmark */}
                <button
                  onClick={handleStar}
                  className={cn(
                    "p-1 rounded hover:bg-muted/80 transition-colors",
                    isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-foreground"
                  )}
                  title={isStarred ? "Yulduzchani olib tashlash" : "Yulduzcha qo'shish"}
                >
                  <Star className={cn("w-3.5 h-3.5", isStarred && "fill-yellow-500")} />
                </button>

                {/* Delete (own messages) */}
                {isMe && onDelete && (
                  <button
                    onClick={() => onDelete(msg)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Bubble */}
            <div
              className={cn(
                "px-3 py-2 rounded-2xl text-sm leading-relaxed break-words",
                isMe
                  ? "bg-primary text-primary-foreground rounded-tr-sm shadow-sm"
                  : "bg-card border border-border/60 text-foreground rounded-tl-sm shadow-sm",
                "max-w-full"
              )}
            >
              {/* Forward banner */}
              {msg.forwardFrom && (
                <div className={cn(
                  "flex items-center gap-1 mb-1 text-[10px] opacity-70 pb-1 border-b",
                  isMe ? "border-primary-foreground/20" : "border-border/40"
                )}>
                  <CornerDownRight className="w-3 h-3 flex-shrink-0" />
                  <span>Yuborildi: <strong>{msg.forwardFrom.senderName}</strong></span>
                </div>
              )}

              {/* Reply preview */}
              {msg.replyToMessage && (
                <button
                  onClick={() => msg.replyToId && onScrollTo?.(msg.replyToId)}
                  className={cn(
                    "flex flex-col gap-0 mb-1.5 pl-2 border-l-2 text-left w-full",
                    isMe ? "border-primary-foreground/50" : "border-primary/50"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-semibold",
                    isMe ? "text-primary-foreground/70" : "text-primary"
                  )}>
                    {msg.replyToMessage.senderName}
                  </span>
                  <span className={cn(
                    "text-[10px] truncate",
                    isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
                    {msg.replyToMessage.content || "[media]"}
                  </span>
                </button>
              )}

              {/* Poll content */}
              {isPoll && msg.poll ? (
                <MessagePoll messageId={msg.id} poll={msg.poll} isMe={isMe} />
              ) : (
                <>
                  {/* Text content */}
                  {msg.content && !isImage && !isFile && (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}

                  {/* Image */}
                  {isImage && msg.fileUrl && (
                    <button
                      className="block w-full"
                      onClick={() => setLightboxSrc(msg.fileUrl!)}
                    >
                      <img
                        src={msg.fileUrl}
                        alt={msg.fileName || "Rasm"}
                        className="max-w-full max-h-64 rounded-xl object-cover hover:opacity-95 transition-opacity"
                        loading="lazy"
                      />
                      {msg.fileName && (
                        <p className={cn("text-[10px] mt-1 text-left",
                          isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                        )}>{msg.fileName}</p>
                      )}
                    </button>
                  )}

                  {/* File */}
                  {isFile && msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl transition-colors",
                        isMe ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                             : "bg-muted/50 hover:bg-muted border border-border/40"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        isMe ? "bg-primary-foreground/20" : "bg-primary/10"
                      )}>
                        <Paperclip className={cn("w-4 h-4", isMe ? "text-primary-foreground" : "text-primary")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{msg.fileName || "Fayl"}</p>
                        {msg.fileSize && (
                          <p className={cn("text-[10px]",
                            isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>
                            {(msg.fileSize / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                      <Download className={cn("w-3.5 h-3.5 flex-shrink-0",
                        isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                      )} />
                    </a>
                  )}
                </>
              )}

              {msg.isEdited && (
                <span className={cn(
                  "text-[10px] block mt-0.5",
                  isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"
                )}>
                  (tahrirlangan)
                </span>
              )}
            </div>
          </div>

          {/* Reactions */}
          {((msg.reactions && msg.reactions.length > 0) || false) && (
            <MessageReactions
              messageId={msg.id}
              roomId={msg.roomId}
              reactions={msg.reactions}
              onReact={onReact || (() => {})}
              compact
            />
          )}

          {/* Thread count badge */}
          {(msg.threadCount ?? 0) > 0 && (
            <button
              onClick={() => onThread?.(msg)}
              className="flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[10px] text-primary hover:underline"
            >
              <MessageSquare className="w-2.5 h-2.5" />
              {msg.threadCount} thread javob
            </button>
          )}

          {/* Time + read status */}
          <div className={cn("flex items-center gap-1 mt-0.5 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
            <span className="text-[10px] text-muted-foreground">
              {formatMsgTime(msg.createdAt)}
            </span>
            {isMe && (
              <span className="text-[10px] text-muted-foreground/70 flex-shrink-0" title={isRead ? "O'qildi" : "Yuborildi"}>
                {isRead
                  ? <CheckCheck className="w-3 h-3 text-blue-400" />
                  : <Check className="w-3 h-3" />
                }
              </span>
            )}
          </div>
        </div>
      </div>

      <CreateTaskModal
        message={taskModalOpen ? msg : null}
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
      />
    </>
  );
}
