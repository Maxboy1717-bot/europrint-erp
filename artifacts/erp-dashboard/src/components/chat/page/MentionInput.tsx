/**
 * @module MentionInput
 * @description React UI component.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, X, Smile, AtSign, Mic, Paperclip, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/store/chatStore";
import { VoiceRecorder } from "./VoiceRecorder";
import { useTranslation } from '@/lib/i18n';

interface RoomMember {
  userId: string;
  fullName: string;
  employeeId?: string | number | null;
  avatarUrl?: string | null;
}

interface Props {
  roomId: string;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  onSend: (content: string, replyToId?: string, mentionedUserIds?: string[]) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  members?: RoomMember[];
  isChannelReadOnly?: boolean;
  onUploadFile?: (file: File) => void;
  onCreatePoll?: () => void;
  onVoiceMessage?: (blob: Blob, durationSec: number, waveform: number[]) => void;
}

export function MentionInput({
  roomId, replyTo, onCancelReply, onSend, onTypingStart, onTypingStop,
  members = [], isChannelReadOnly = false, onUploadFile, onCreatePoll, onVoiceMessage,
}: Props) {
  const { t } = useTranslation("common");
  const [text, setText] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Mention autocomplete
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [dropdownIndex, setDropdownIndex] = useState(0);

  const filteredMembers = mentionSearch !== null
    ? (Array.isArray(members) ? members : []).filter(m =>
        m.fullName.toLowerCase().includes(mentionSearch.toLowerCase()) ||
        String(m.employeeId ?? "").toLowerCase().includes(mentionSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [text]);

  // Cancel any pending typing-stop timeout when the component unmounts so we
  // don't fire onTypingStop on a stale closure after unmount.
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    const cursor = e.target.selectionStart;
    const beforeCursor = val.slice(0, cursor);
    const atIdx = beforeCursor.lastIndexOf("@");

    if (atIdx !== -1) {
      const afterAt = beforeCursor.slice(atIdx + 1);
      if (!afterAt.includes(" ") && !afterAt.includes("\n")) {
        setMentionSearch(afterAt);
        setMentionStart(atIdx);
        setDropdownIndex(0);
      } else {
        setMentionSearch(null);
        setMentionStart(-1);
      }
    } else {
      setMentionSearch(null);
      setMentionStart(-1);
    }

    if (val.length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop();
      }
    }, 2000);
  }, [onTypingStart, onTypingStop]);

  const insertMention = useCallback((member: RoomMember) => {
    if (mentionStart < 0) return;
    const before = text.slice(0, mentionStart);
    const after = text.slice(textareaRef.current?.selectionStart ?? text.length);
    const newText = `${before}@${member.fullName} ${after}`;
    setText(newText);
    setMentionSearch(null);
    setMentionStart(-1);
    setMentionedUserIds(prev => {
      if (prev.includes(member.userId)) return prev;
      return [...prev, member.userId];
    });
    setTimeout(() => {
      const pos = before.length + member.fullName.length + 2;
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    }, 10);
  }, [text, mentionStart]);

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    onSend(content, replyTo?.id, mentionedUserIds.length > 0 ? mentionedUserIds : undefined);
    setText("");
    setMentionedUserIds([]);
    setMentionSearch(null);
    setMentionStart(-1);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
    if (onCancelReply) onCancelReply();
    setTimeout(() => textareaRef.current?.focus(), 10);
  }, [text, replyTo, mentionedUserIds, onSend, onTypingStop, onCancelReply]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionSearch !== null && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setDropdownIndex(i => Math.min(i + 1, filteredMembers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setDropdownIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[dropdownIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionSearch(null);
        setMentionStart(-1);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [mentionSearch, filteredMembers, dropdownIndex, insertMention, handleSend]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [roomId]);

  if (isChannelReadOnly) {
    return (
      <div className="flex-shrink-0 bg-[var(--tg-chat-bg)] px-4 py-3">
        <div className="flex items-center justify-center py-3 px-4 bg-[var(--tg-action-bar-bg)]/80 rounded-xl">
          <p className="text-[14px] text-[var(--tg-text-secondary)]">
            {t("buKanalFaqatAdminlarYozishi")}
          </p>
        </div>
      </div>
    );
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) onUploadFile(file);
    e.target.value = "";
  }, [onUploadFile]);

  const hasText = text.trim().length > 0;

  return (
    <div className="flex-shrink-0 bg-[var(--tg-chat-bg)] px-3 py-2 relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.docx,.xlsx,.doc,.xls"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Voice recorder panel */}
      {showVoiceRecorder && (
        <div className="mb-2">
          <VoiceRecorder
            onSend={(blob, durationSec, waveform) => {
              setShowVoiceRecorder(false);
              if (onVoiceMessage) onVoiceMessage(blob, durationSec, waveform);
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-[var(--tg-action-bar-bg)] rounded-xl border-l-2 border-[var(--tg-sidebar-active)] shadow-sm">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[var(--tg-sidebar-active)]">{replyTo.senderName}</p>
            <p className="text-[13px] text-[var(--tg-text-secondary)] truncate">{replyTo.content}</p>
          </div>
          {onCancelReply && (
            <button onClick={onCancelReply} className="text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)] p-1 rounded-full hover:bg-[var(--tg-hover)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Mention dropdown */}
      {mentionSearch !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 mb-1 bg-[var(--tg-action-bar-bg)] rounded-xl shadow-lg overflow-hidden z-50 border border-[var(--tg-border)]">
          <div className="px-3 py-1.5 text-[12px] text-[var(--tg-text-secondary)] border-b border-[var(--tg-border)] flex items-center gap-1">
            <AtSign className="w-3.5 h-3.5" />
            {t("mention")}
          </div>
          {(Array.isArray(filteredMembers) ? filteredMembers : []).map((member, idx) => (
            <button
              key={member.userId}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--tg-sidebar-hover)] transition-colors",
                idx === dropdownIndex && "bg-[var(--tg-sidebar-active)]/10"
              )}
              onMouseDown={e => { e.preventDefault(); insertMention(member); }}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--tg-sidebar-active)] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                {(member.fullName || "?")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium truncate text-[var(--tg-text-primary)]">{member.fullName}</p>
                {member.employeeId && (
                  <p className="text-[12px] text-[var(--tg-text-secondary)]">{member.employeeId}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Telegram-style input bar ── */}
      <div className="flex items-end gap-1.5 bg-[var(--tg-action-bar-bg)] rounded-[22px] shadow-sm border border-[var(--tg-border)] pl-2 pr-1.5 py-1">
        {/* Emoji button */}
        <button
          className="flex-shrink-0 p-1.5 rounded-full text-[var(--tg-text-placeholder)] hover:text-[var(--tg-text-secondary)] transition-colors mb-[2px]"
          title={t("emoji")}
        >
          <Smile className="w-[22px] h-[22px]" />
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t("xabarYozing")}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent",
            "px-1 py-[7px] text-[15px] leading-[1.3125] text-[var(--tg-text-primary)]",
            "border-0 border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0",
            "placeholder:text-[var(--tg-text-placeholder)] caret-[var(--tg-text-primary)] transition-all",
            "scrollbar-thin max-h-[120px] overflow-y-auto"
          )}
          style={{ minHeight: "34px", boxShadow: "none" }}
        />

        {/* File upload */}
        {onUploadFile && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-1.5 rounded-full text-[var(--tg-text-placeholder)] hover:text-[var(--tg-text-secondary)] transition-colors mb-[2px]"
            title={t("fayl")}
          >
            <Paperclip className="w-[22px] h-[22px]" />
          </button>
        )}

        {/* Send / Voice toggle */}
        {hasText ? (
          <button
            onClick={handleSend}
            className="flex-shrink-0 w-[38px] h-[38px] rounded-full bg-[var(--tg-sidebar-active)] hover:bg-[#2b7ed8] text-white flex items-center justify-center transition-all mb-[1px] shadow-sm active:scale-95"
          >
            <Send className="w-[18px] h-[18px] ml-0.5" />
          </button>
        ) : (
          <button
            onClick={() => setShowVoiceRecorder((v) => !v)}
            className={cn(
              "flex-shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all mb-[1px]",
              showVoiceRecorder
                ? "bg-[var(--tg-sidebar-active)] text-white shadow-sm"
                : "text-[var(--tg-text-placeholder)] hover:text-[var(--tg-text-secondary)]"
            )}
            title={t("ovozliXabar")}
          >
            <Mic className="w-[22px] h-[22px]" />
          </button>
        )}
      </div>
    </div>
  );
}
