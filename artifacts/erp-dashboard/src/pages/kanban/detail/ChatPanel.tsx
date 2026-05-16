/**
 * @module ChatPanel
 * @description React page component. Route-level UI.
 */

import { useState, useRef, useEffect } from "react";
import { tLabel } from "@/lib/i18n/tLabel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Plus, MessageSquare, Send, Target, Bot, Paperclip, File, X, MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import {
  type ChatMessageWithUser,
  type Employee,
  getDateKey,
  formatChatDateSeparator,
  getFileIcon,
  isImageFile,
} from "../kanban-types";

interface ChatPanelProps {
  chatMessages: ChatMessageWithUser[];
  newChatMessage: string;
  onNewChatMessageChange: (val: string) => void;
  onSendMessage: (data: { message: string; files?: File[] }) => void;
  isSending: boolean;
  onCreateTaskFromMessage: (msg: ChatMessageWithUser) => void;
  chatFiles: File[];
  onChatFilesChange: (files: File[]) => void;
  employees?: Employee[];
  t: { tabs: { activity: string }; chat: { systemLog: string; placeholder: string; mentionHint: string } };
}

export function ChatPanel({
  chatMessages,
  newChatMessage,
  onNewChatMessageChange,
  onSendMessage,
  isSending,
  onCreateTaskFromMessage,
  chatFiles,
  onChatFilesChange,
  employees = [],
  t,
}: ChatPanelProps) {
  const [mentionQuery, setMentionQuery]   = useState<string | null>(null);
  const [mentionOpen,  setMentionOpen]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (val: string) => {
    onNewChatMessageChange(val);

    const cursor = inputRef.current?.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const atIdx  = before.lastIndexOf('@');

    if (atIdx !== -1) {
      const query = before.slice(atIdx + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query.toLowerCase());
        setMentionOpen(true);
        return;
      }
    }
    setMentionOpen(false);
    setMentionQuery(null);
  };

  const insertMention = (emp: Employee) => {
    const cursor  = inputRef.current?.selectionStart ?? newChatMessage.length;
    const before  = newChatMessage.slice(0, cursor);
    const after   = newChatMessage.slice(cursor);
    const atIdx   = before.lastIndexOf('@');
    const newText = before.slice(0, atIdx) + `@${emp.fullName} ` + after;
    onNewChatMessageChange(newText);
    setMentionOpen(false);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const filteredEmployees = mentionQuery !== null
    ? employees.filter(e => e.fullName.toLowerCase().includes(mentionQuery))
    : employees;

  const canSend = newChatMessage.trim() || chatFiles.length > 0;

  return (
    <div className="w-80 flex flex-col bg-muted/30 relative">
      <div className="p-3 border-b font-medium text-sm flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        {t.tabs.activity}
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {(() => {
            let lastDateKey = "";
            return (Array.isArray(chatMessages) ? chatMessages : []).map((msg) => {
              const currentDateKey = msg.createdAt ? getDateKey(msg.createdAt) : "";
              const showDateSeparator = currentDateKey && currentDateKey !== lastDateKey;
              if (currentDateKey) lastDateKey = currentDateKey;
              const isSystemMessage = msg.messageType === "system";

              return (
                <div key={msg.id}>
                  {showDateSeparator && msg.createdAt && (
                    <div className="flex items-center gap-2 py-2" data-testid={`chat-date-separator-${currentDateKey}`}>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">{formatChatDateSeparator(msg.createdAt)}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <div
                    className={`group ${isSystemMessage ? "bg-muted/50 rounded-md p-2" : ""}`}
                    data-testid={`chat-${msg.id}`}
                  >
                    <div className="flex items-start gap-2">
                      {isSystemMessage ? (
                        <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-3 w-3 text-[var(--ep-yellow)]" />
                        </div>
                      ) : msg.user ? (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={msg.user.profileImageUrl || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {String((msg.user as unknown as Record<string,unknown>)?.fullName ?? (msg.user as unknown as Record<string,unknown>)?.full_name ?? "?")
                              .split(" ").map(n => n[0] ?? "").join("").substring(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                          <Target className="h-3 w-3" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {isSystemMessage ? t.chat.systemLog : (
                                msg.user
                                  ? String((msg.user as unknown as Record<string,unknown>).fullName ?? (msg.user as unknown as Record<string,unknown>).full_name ?? t.chat.systemLog)
                                  : t.chat.systemLog
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {msg.createdAt && format(new Date(msg.createdAt), "HH:mm")}
                            </span>
                          </div>
                          {!isSystemMessage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onCreateTaskFromMessage(msg)}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  {tLabel("kanban.vazifaYaratish", "Vazifa yaratish")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* @mention larni highlight qilish */}
                        <p className={`mt-0.5 ${isSystemMessage ? "text-sm italic text-muted-foreground" : "text-sm"}`}>
                          {renderWithMentions(msg.message)}
                        </p>

                        {msg.files && msg.files.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(Array.isArray(msg.files) ? msg.files : []).map((file) => {
                              const { icon: FileIcon, color: iconColor } = getFileIcon(file.mimeType || null, file.fileName || '');
                              const showThumbnail = isImageFile(file.mimeType || null, file.fileName || '');
                              return (
                                <div key={file.id} className="relative group">
                                  {showThumbnail ? (
                                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <div className="h-12 w-12 rounded border overflow-hidden cursor-pointer hover:ring-1 ring-primary">
                                        <img src={file.fileUrl} alt={file.fileName} className="h-full w-full object-cover" />
                                      </div>
                                    </a>
                                  ) : (
                                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-1 border rounded text-xs hover:bg-muted">
                                      <FileIcon className={`h-3 w-3 ${iconColor}`} />
                                      <span className="max-w-[60px] truncate">{file.fileName}</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}

          {chatMessages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">{tLabel("kanban.xabarlarYoq", "Xabarlar yo'q")}</p>
          )}
        </div>
      </ScrollArea>

      {/* ── Fayl preview ─────────────────────────────────────────────────── */}
      <div className="p-3 border-t space-y-2">
        {chatFiles.length > 0 && (
          <div className="flex flex-wrap gap-1 pb-1">
            {(Array.isArray(chatFiles) ? chatFiles : []).map((file, idx) => {
              const showThumbnail = file.type.startsWith('image/');
              return (
                <div key={idx} className="relative group">
                  {showThumbnail ? (
                    <div className="h-10 w-10 rounded border overflow-hidden">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="ghost" size="icon" className="h-4 w-4 text-white"
                          onClick={() => onChatFilesChange((chatFiles).filter((_, i) => i !== idx))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px]">
                      <File className="h-3 w-3 text-muted-foreground" />
                      <span className="max-w-[50px] truncate">{file.name}</span>
                      <Button variant="ghost" size="icon" className="h-4 w-4 ml-0.5"
                        onClick={() => onChatFilesChange((chatFiles).filter((_, i) => i !== idx))}>
                        <X className="h-2 w-2" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── @mention autocomplete dropdown ───────────────────────────── */}
        {mentionOpen && filteredEmployees.length > 0 && (
          <div
            className="absolute bottom-20 left-3 right-3 bg-background border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
            data-testid="mention-dropdown"
          >
            {filteredEmployees.slice(0, 8).map(emp => (
              <button
                key={emp.id}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
                onMouseDown={(e) => { e.preventDefault(); insertMention(emp); }}
                data-testid={`mention-option-${emp.id}`}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={emp.profileImageUrl || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {(emp.fullName || "?").split(" ").map(n => n[0] ?? "").join("").substring(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span>{emp.fullName || "Noma'lum"}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Input qatori ─────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <input
            type="file"
            id="chat-file-input"
            className="hidden"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) onChatFilesChange([...chatFiles, ...files]);
              e.target.value = '';
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={() => document.getElementById('chat-file-input')?.click()}
            data-testid="button-chat-attach"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            value={newChatMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t.chat.placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setMentionOpen(false); return; }
              if (e.key === 'Enter' && canSend) {
                onSendMessage({ message: newChatMessage || "📎", files: chatFiles });
              }
            }}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={() => canSend && onSendMessage({ message: newChatMessage || "📎", files: chatFiles })}
            disabled={!canSend || isSending}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground" data-testid="text-mention-hint">
          {t.chat.mentionHint}
        </p>
      </div>
    </div>
  );
}

function renderWithMentions(text: string) {
  if (!text?.includes('@')) return text;
  const parts = text.split(/(@\w[\w\s]*)/);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-[var(--ep-blue)] font-medium">{part}</span>
      : part,
  );
}
