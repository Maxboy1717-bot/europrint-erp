/**
 * @module MessageBubble
 * @description React UI component.
 */

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
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation("common");
  const [hover, setHover] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(msg.isStarred ?? false);

  const handleStar = useCallback(async () => {
    try {
      const res = await apiRequest('POST', `/api/chat/messages/${msg.id}/star`);
      {
        const data = (res as { starred: boolean });
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
      <div className={cn("flex gap-2 mb-1 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
        <div className={cn("w-[34px] flex-shrink-0", isMe && "hidden")} />
        <div className={cn("flex flex-col", isMe && "items-end")}>
          <span className="text-[13px] italic text-[var(--tg-text-secondary)]/60 px-3 py-1.5 bg-[var(--tg-action-bar-bg)]/50 rounded-lg">
            {t("xabarOchirildi")}
          </span>
        </div>
      </div>
    );
  }

  const hasAttachment = msg.fileUrl && (msg.messageType === "image" || msg.messageType === "file");
  const isImage = msg.messageType === "image";
  const isFile = msg.messageType === "file";
  const isPoll = msg.messageType === "poll";
  // Detect voice message: explicit type, audio mime, or voice- filename
  const isVoice = msg.messageType === "voice"
    || (!!msg.fileType && msg.fileType.startsWith("audio/"))
    || (!!msg.fileName && msg.fileName.startsWith("voice-"));

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
        className={cn("flex gap-1.5 mb-[2px] group relative px-1", isMe ? "flex-row-reverse" : "flex-row")}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setShowEmojiPicker(false); }}
      >
        {/* Avatar */}
        <div className="w-[34px] flex-shrink-0 flex items-end">
          {showAvatar && !isMe ? (
            <ChatAvatar name={msg.senderName || "?"} url={msg.senderAvatar} size={34} />
          ) : null}
        </div>

        <div className={cn("max-w-[70%] flex flex-col", isMe && "items-end")}>
          {/* Pinned badge */}
          {msg.isPinned && (
            <div className="flex items-center gap-1 mb-0.5 px-2 py-0.5 bg-[var(--tg-action-bar-bg)]/80 rounded-full w-fit shadow-sm">
              <Pin className="w-3 h-3 text-[var(--tg-sidebar-active)] rotate-45" />
              <span className="text-[10px] text-[var(--tg-sidebar-active)] font-medium">{t("pinlangan")}</span>
            </div>
          )}

          <div className="flex items-end gap-1 relative">
            {/* Action bar (hover) */}
            {hover && !msg.isDeleted && (
              <div className={cn(
                "flex gap-0.5 mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                "bg-[var(--tg-action-bar-bg)] rounded-lg shadow-md border border-[var(--tg-border)] p-0.5",
                isMe ? "order-first mr-0.5" : "order-last ml-0.5"
              )}>
                {msg.messageType === "text" && (
                  <button
                    onClick={() => setTaskModalOpen(true)}
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
            )}

            {/* ── Telegram Bubble ── */}
            <div
              className={cn(
                "px-[10px] pt-[7px] pb-[6px] text-[14.5px] leading-[1.4] break-words relative",
                isMe
                  ? "bg-[var(--tg-bubble-out)] text-[var(--tg-text-primary)] rounded-[18px] rounded-tr-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.12),0_1px_0_rgba(0,0,0,0.04)]"
                  : "bg-[var(--tg-bubble-in)] text-[var(--tg-text-primary)] rounded-[18px] rounded-tl-[5px] shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_0_rgba(0,0,0,0.04)]",
                "max-w-full"
              )}
            >
              {/* Sender name */}
              {showName && !isMe && (
                <p className="text-[13px] font-semibold text-[var(--tg-sidebar-active)] mb-[2px]">
                  {msg.senderName}
                </p>
              )}

              {/* Forward banner */}
              {msg.forwardFrom && (
                <div className={cn(
                  "flex items-center gap-1 mb-1 text-[11px] pb-1 border-b",
                  isMe ? "text-[var(--tg-time-out-color)] border-[var(--tg-bubble-out-darker)]" : "text-[var(--tg-text-secondary)] border-[var(--tg-border)]"
                )}>
                  <CornerDownRight className="w-3 h-3 flex-shrink-0" />
                  <span>{t("yuborildi")}<strong>{msg.forwardFrom.senderName}</strong></span>
                </div>
              )}

              {/* Reply preview */}
              {msg.replyToMessage && (
                <button
                  onClick={() => msg.replyToId && onScrollTo?.(msg.replyToId)}
                  className={cn(
                    "flex flex-col gap-0 mb-[6px] pl-2 border-l-2 text-left w-full rounded-r-md py-1",
                    isMe
                      ? "border-[#4fae4e] bg-[var(--tg-bubble-out-darker)]/40"
                      : "border-[var(--tg-sidebar-active)] bg-[var(--tg-sidebar-active)]/5"
                  )}
                >
                  <span className={cn(
                    "text-[12px] font-semibold",
                    isMe ? "text-[#4fae4e]" : "text-[var(--tg-sidebar-active)]"
                  )}>
                    {msg.replyToMessage.senderName}
                  </span>
                  <span className="text-[12px] text-[var(--tg-text-secondary)] truncate">
                    {msg.replyToMessage.content || "[media]"}
                  </span>
                </button>
              )}

              {/* Poll content */}
              {isPoll && msg.poll ? (
                <MessagePoll messageId={msg.id} poll={msg.poll} isMe={isMe} />
              ) : (
                <>
                  {/* Text content with inline time */}
                  {msg.content && !isImage && !isFile && !isVoice && (
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                      {/* Invisible spacer for time */}
                      <span className={cn(
                        "inline-block w-[70px] h-0",
                        isMe && "w-[90px]"
                      )} />
                    </p>
                  )}

                  {/* Image */}
                  {isImage && msg.fileUrl && (
                    <button
                      className="block w-full -mx-[9px] -mt-[6px] -mb-[5px]"
                      onClick={() => setLightboxSrc(msg.fileUrl ?? '')}
                    >
                      <img
                        src={msg.fileUrl}
                        alt={msg.fileName || t("image")}
                        className="max-w-full max-h-[320px] rounded-[18px] object-cover hover:opacity-95 transition-opacity"
                        loading="lazy"
                      />
                    </button>
                  )}

                  {/* Voice message — inline player */}
                  {isVoice && msg.fileUrl && (
                    <VoiceMessagePlayer src={msg.fileUrl} isMe={isMe} />
                  )}

                  {/* File (non-voice) */}
                  {isFile && !isVoice && msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl transition-colors",
                        isMe
                          ? "bg-[var(--tg-bubble-out-darker)]/30 hover:bg-[var(--tg-bubble-out-darker)]/50"
                          : "bg-[var(--tg-bubble-reply-bg)] hover:bg-black/[0.06]"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        isMe ? "bg-[#4fae4e]" : "bg-[var(--tg-sidebar-active)]"
                      )}>
                        <Paperclip className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium truncate">{msg.fileName || t("file")}</p>
                        {msg.fileSize && (
                          <p className="text-[12px] text-[var(--tg-text-secondary)]">
                            {(msg.fileSize / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                      <Download className="w-5 h-5 text-[var(--tg-text-secondary)] flex-shrink-0" />
                    </a>
                  )}
                </>
              )}

              {/* ── Time + read status (inside bubble, bottom-right) ── */}
              <span className={cn(
                "float-right relative -mb-[3px] ml-2 flex items-center gap-0.5",
                "text-[11px] leading-none",
                isImage ? "absolute bottom-2 right-2 bg-black/40 px-1.5 py-0.5 rounded text-white" : "",
                !isImage && isMe && "text-[var(--tg-time-out-color)]",
                !isImage && !isMe && "text-[var(--tg-time-color)]"
              )}>
                {msg.isEdited && (
                  <span className="mr-0.5">{t("editedShort")}</span>
                )}
                {formatMsgTime(msg.createdAt)}
                {isMe && (
                  <span className="ml-0.5 flex-shrink-0">
                    {isRead
                      ? <CheckCheck className="w-[14px] h-[14px] text-[#4fae4e]" />
                      : <Check className="w-[14px] h-[14px]" />
                    }
                  </span>
                )}
              </span>
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
              className="flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[12px] text-[var(--tg-sidebar-active)] hover:underline"
            >
              <MessageSquare className="w-3 h-3" />
              {msg.threadCount} {t("replies")}
            </button>
          )}
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
