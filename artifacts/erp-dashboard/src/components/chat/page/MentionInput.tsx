import { useState, useRef, useCallback, useEffect } from "react";
import { Send, X, Smile, AtSign, Mic, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/store/chatStore";
import { VoiceRecorder } from "./VoiceRecorder";

interface RoomMember {
  userId: string;
  fullName: string;
  employeeId?: string;
  avatarUrl?: string;
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
        (m.employeeId || "").toLowerCase().includes(mentionSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [text]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Check for @mention trigger
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

  // Focus when room changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [roomId]);

  if (isChannelReadOnly) {
    return (
      <div className="flex-shrink-0 border-t border-border/60 bg-background/95 px-4 py-3">
        <p className="text-sm text-muted-foreground text-center py-2">
          Bu kanal — faqat adminlar yozishi mumkin
        </p>
      </div>
    );
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) onUploadFile(file);
    e.target.value = "";
  }, [onUploadFile]);

  return (
    <div className="flex-shrink-0 border-t border-border/60 bg-background/95 px-4 py-3 relative">
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
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted/50 rounded-lg border-l-2 border-primary">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">{replyTo.senderName}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
          </div>
          {onCancelReply && (
            <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Mention dropdown */}
      {mentionSearch !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border/50 flex items-center gap-1">
            <AtSign className="w-3 h-3" />
            Mention
          </div>
          {(Array.isArray(filteredMembers) ? filteredMembers : []).map((member, idx) => (
            <button
              key={member.userId}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 transition-colors",
                idx === dropdownIndex && "bg-primary/10"
              )}
              onMouseDown={e => { e.preventDefault(); insertMention(member); }}
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                {(member.fullName || "?")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{member.fullName}</p>
                {member.employeeId && (
                  <p className="text-[10px] text-muted-foreground">{member.employeeId}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          className="flex-shrink-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-0.5"
          title="Emoji (tez orada)"
        >
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Xabar yozing... @ mention uchun"
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-border/60 bg-muted/30",
            "px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60",
            "placeholder:text-muted-foreground/50 transition-all",
            "scrollbar-thin max-h-[120px] overflow-y-auto"
          )}
          style={{ minHeight: "40px" }}
        />

        {/* File upload button */}
        {onUploadFile && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-0.5"
            title="Fayl yuklash"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        )}

        {/* Voice recorder toggle */}
        <button
          onClick={() => setShowVoiceRecorder((v) => !v)}
          className={cn(
            "flex-shrink-0 p-2 rounded-xl transition-colors mb-0.5",
            showVoiceRecorder
              ? "text-primary bg-primary/10 hover:bg-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Ovozli xabar"
        >
          <Mic className="w-5 h-5" />
        </button>

        <Button
          onClick={handleSend}
          disabled={!text.trim()}
          size="icon"
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl transition-all mb-0.5",
            text.trim()
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground/40 mt-1.5 pl-10">
        Enter — yuborish · Shift+Enter — yangi qator · @ — mention
      </p>
    </div>
  );
}
