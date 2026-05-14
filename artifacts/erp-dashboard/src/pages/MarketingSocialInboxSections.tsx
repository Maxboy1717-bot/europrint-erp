/**
 * @module MarketingSocialInboxSections
 * @description Major section components: ConversationsPanel and ChatPanel.
 */

import { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Search, Bot, ArrowLeft, Sparkles, CheckCheck } from "lucide-react";
import {
  SocialConversation,
  SocialMessage,
  platformConfig,
  statusLabels,
  formatRelativeTime,
  formatMessageTime,
} from "./MarketingSocialInboxTypes";
import { PlatformIcon, PlatformBadge } from "./MarketingSocialInboxHelpers";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill } from "@/components/ep";
// — MessageBubble —
function MessageBubble({ msg }: { msg: SocialMessage }) {
  const isOut = msg.direction === "outbound";
  const timeColor = isOut ? "text-primary-foreground/70" : "text-muted-foreground";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.id}`}>
      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isOut ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
        {msg.mediaUrl && (
          <div className="mt-1.5">
            {msg.mediaType?.startsWith("image") ? (
              <img src={msg.mediaUrl} alt={"media"} className="max-w-full rounded-md max-h-48 object-cover" />
            ) : (
              <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline">{t("faylniKorish")}</a>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-1 justify-end">
          {msg.isAiGenerated && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />AI
            </Badge>
          )}
          <span className={`text-[10px] ${timeColor}`}>{formatMessageTime(msg.sentAt)}</span>
          {isOut && msg.isRead && <CheckCheck className={`h-3 w-3 ${timeColor}`} />}
        </div>
      </div>
    </div>
  );
}

// — ConversationItem —
interface ConvItemProps { conv: SocialConversation; isSelected: boolean; onSelect: (id: string) => void; }
function ConversationItem({ conv, isSelected, onSelect }: ConvItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-muted" : "hover:bg-muted/40"} ${conv.unreadCount > 0 ? "border-l-2 border-primary bg-primary/10/10" : ""}`}
      onClick={() => onSelect(conv.id)}
      data-testid={`conversation-item-${conv.id}`}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={conv.contactAvatar || undefined} />
          <AvatarFallback>{conv.contactName?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5">
          <div className={`rounded-full p-0.5 ${platformConfig[conv.platform]?.color || ""}`}>
            <PlatformIcon platform={conv.platform} className="h-3 w-3" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-medium text-sm truncate" data-testid={`text-contact-name-${conv.id}`}>{conv.contactName}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(conv.lastMessageAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || "..."}</p>
          {conv.unreadCount > 0 && <EPStatusPill tone="success" className="text-[10px] px-1.5 min-w-[20px] justify-center" data-testid={`badge-unread-${conv.id}`}>{conv.unreadCount}</EPStatusPill>}
        </div>
      </div>
    </div>
  );
}

// — ConversationsPanel —
interface ConversationsPanelProps {
  mobileShowChat: boolean;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  conversationsLoading: boolean;
  conversations: SocialConversation[] | undefined;
  selectedId: string | null;
  onSelectConversation: (id: string) => void;
}

export function ConversationsPanel({mobileShowChat,
  searchQuery,
  onSearchChange,
  conversationsLoading,
  conversations,
  selectedId,
  onSelectConversation,
}: ConversationsPanelProps) {
  const { t } = useTranslation('common');
  return (
    <div
      className={`w-full md:w-[30%] border-r flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}
      data-testid="conversations-panel"
    >
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Qidirish...")}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="input-search-conversations"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="p-2 space-y-2" data-testid="conversations-loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`k-${i}`} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-48 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" data-testid="empty-conversations">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t("suhbatlarTopilmadi")}</p>
          </div>
        ) : (
          <div className="p-1">
            {(Array.isArray(conversations) ? conversations : []).map((conv) => (
              <ConversationItem key={conv.id} conv={conv} isSelected={selectedId === conv.id} onSelect={onSelectConversation} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// — ChatHeader —
interface ChatHeaderProps {
  conv: SocialConversation;
  onBackToList: () => void;
  onStatusChange: (s: string) => void;
}
function ChatHeader({ conv, onBackToList, onStatusChange }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 p-3 border-b">
      <Button size="icon" variant="ghost" className="md:hidden" onClick={onBackToList} data-testid="button-back-to-list">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Avatar>
        <AvatarImage src={conv.contactAvatar || undefined} />
        <AvatarFallback>{conv.contactName?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" data-testid="text-chat-contact-name">{conv.contactName}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <PlatformBadge platform={conv.platform} />
          <Badge variant="outline" className="text-xs">{statusLabels[conv.status] || conv.status}</Badge>
          {conv.isAiHandling && <Badge variant="secondary" className="text-xs"><Bot className="h-3 w-3 mr-1" />AI</Badge>}
        </div>
      </div>
      <Select value={conv.status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[130px] h-9" data-testid="select-change-status"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="open">{t("ochiq")}</SelectItem>
          <SelectItem value="assigned">{t("tayinlangan")}</SelectItem>
          <SelectItem value="resolved">{t("halQilingan")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// — ChatPanel —
interface ChatPanelProps {
  mobileShowChat: boolean;
  selectedId: string | null;
  selectedConversation: SocialConversation | undefined;
  messages: SocialMessage[] | undefined;
  messagesLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  replyText: string;
  onReplyTextChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSendReply: () => void;
  onAiReply: () => void;
  onStatusChange: (status: string) => void;
  onBackToList: () => void;
  replyPending: boolean;
  aiReplyPending: boolean;
}

export function ChatPanel({
  mobileShowChat,
  selectedId,
  selectedConversation,
  messages,
  messagesLoading,
  messagesEndRef,
  replyText,
  onReplyTextChange,
  onKeyDown,
  onSendReply,
  onAiReply,
  onStatusChange,
  onBackToList,
  replyPending,
  aiReplyPending,
}: ChatPanelProps) {
  return (
    <div
      className={`flex-1 flex flex-col ${mobileShowChat ? "flex" : "hidden md:flex"}`}
      data-testid="chat-panel"
    >
      {!selectedId ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground" data-testid="empty-chat">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t("suhbatniTanlang")}</p>
          </div>
        </div>
      ) : (
        <>
          {selectedConversation && (
            <ChatHeader conv={selectedConversation} onBackToList={onBackToList} onStatusChange={onStatusChange} />
          )}

          <ScrollArea className="flex-1 p-4">
            {messagesLoading ? (
              <div className="space-y-4" data-testid="messages-loading">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`k-${i}`} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <Skeleton className="h-12 w-48 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12" data-testid="empty-messages">
                <p className="text-sm">{t("xabarlarYoq")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(messages) ? messages : []).map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder={t("xabarYozing")}
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={replyPending}
                data-testid="input-reply-message"
              />
              <Button size="icon" variant="ghost" onClick={onAiReply} disabled={aiReplyPending} data-testid="button-ai-reply">
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={onSendReply} disabled={!replyText.trim() || replyPending} data-testid="button-send-reply">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
