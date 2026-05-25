/**
 * @module MessageInput
 * @description React UI component.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, X, Smile, Paperclip, BarChart2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/store/chatStore";
import { VoiceRecorder } from "./VoiceRecorder";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from '@/lib/i18n/tLabel';
interface Props {
  roomId: string;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  onSend: (content: string, replyToId?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onUploadFile?: (file: File) => void;
  onCreatePoll?: () => void;
  onVoiceMessage?: (blob: Blob, durationSec: number, waveform: number[]) => void;
}

export function MessageInput({
  roomId, replyTo, onCancelReply, onSend, onTypingStart, onTypingStop, onUploadFile, onCreatePoll, onVoiceMessage,
}: Props) {
  const { t } = useTranslation("common");
  const [text, setText] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [text]);

  // Cancel pending typing-stop timeout when the component unmounts.
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

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    onSend(content, replyTo?.id);
    setText("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
    if (onCancelReply) onCancelReply();
    setTimeout(() => textareaRef.current?.focus(), 10);
  }, [text, replyTo, onSend, onTypingStop, onCancelReply]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Clipboard paste (images)
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = (Array.isArray(items) ? items : []).find((item) => item.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file && onUploadFile) {
        e.preventDefault();
        onUploadFile(file);
      }
    }
  }, [onUploadFile]);

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && onUploadFile) {
      onUploadFile(files[0]);
    }
  }, [onUploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
    }
    e.target.value = "";
  }, [onUploadFile]);

  // Focus when room changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [roomId]);

  return (
    <div
      className={cn(
        "flex-shrink-0 border-t border-border/60 bg-background/95 px-4 py-3 transition-colors",
        isDragOver && "bg-primary/5 border-primary/30"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="mb-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/30 text-xs text-primary text-center">
          {t("faylniTashlang")}
        </div>
      )}

      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted/50 rounded-lg border-l-2 border-primary">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">{replyTo.senderName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {replyTo.messageType === "image" ? "🖼 Rasm"
                : replyTo.messageType === "file" ? "📎 Fayl"
                : replyTo.messageType === "poll" ? "📊 So'rovnoma"
                : replyTo.content}
            </p>
          </div>
          {onCancelReply && (
            <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

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

      <div className="flex items-end gap-2">
        {/* Emoji button (placeholder) */}
        <button
          className="flex-shrink-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-0.5"
          title={t("emoji")}
        >
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={tLabel('common.MessageInput.xabarYozingEnterYuborishShift', "Xabar yozing... (Enter = yuborish, Shift+Enter = yangi qator)")}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-border/60 bg-muted/30",
            "px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60",
            "placeholder:text-muted-foreground/50 transition-all",
            "scrollbar-thin max-h-[120px] overflow-y-auto"
          )}
          style={{ minHeight: "40px" }}
        />

        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-0.5"
          title={t("faylYuklash")}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.docx,.xlsx,.doc,.xls"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Poll button */}
        {onCreatePoll && (
          <button
            onClick={onCreatePoll}
            className="flex-shrink-0 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-0.5"
            title={t("sorovnomaYaratish")}
          >
            <BarChart2 className="w-5 h-5" />
          </button>
        )}

        {/* Voice recorder button */}
        <button
          onClick={() => setShowVoiceRecorder((v) => !v)}
          className={cn(
            "flex-shrink-0 p-2 rounded-xl transition-colors mb-0.5",
            showVoiceRecorder
              ? "text-primary bg-primary/10 hover:bg-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title={t("ovozliXabar")}
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
        {t("enterYuborishShiftEnterYangi")}
      </p>
    </div>
  );
}
