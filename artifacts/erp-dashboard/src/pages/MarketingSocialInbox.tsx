import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  MessageCircle,
  Send,
  Search,
  Bot,
  ArrowLeft,
  Sparkles,
  CheckCheck,
  Instagram,
  Facebook,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

interface SocialConversation {
  id: string;
  platform: string;
  externalId: string;
  contactName: string;
  contactPhone: string | null;
  contactAvatar: string | null;
  status: string;
  assignedTo: string | null;
  isAiHandling: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  priority: string | null;
  tags: string[] | null;
}

interface SocialMessage {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  text: string;
  mediaUrl: string | null;
  mediaType: string | null;
  isAi: boolean;
  isAiGenerated: boolean;
  isRead: boolean;
  sentAt: string;
}

interface InboxStats {
  totalConversations: number;
  openConversations: number;
  unreadCount: number;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "hozirgina";
  if (diffMin < 60) return `${diffMin} min oldin`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} soat oldin`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} kun oldin`;
  return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

const platformConfig: Record<string, { icon: typeof MessageSquare; color: string; label: string }> = {
  instagram: { icon: Instagram, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", label: "Instagram" },
  facebook: { icon: Facebook, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "Facebook" },
  telegram: { icon: Send, color: "bg-sky-500/10 text-sky-600 dark:text-sky-400", label: "Telegram" },
  whatsapp: { icon: MessageCircle, color: "bg-green-500/10 text-green-600 dark:text-green-400", label: "WhatsApp" },
};

const statusLabels: Record<string, string> = {
  open: "Ochiq",
  assigned: "Tayinlangan",
  resolved: "Hal qilingan",
};

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const config = platformConfig[platform] || platformConfig.telegram;
  const Icon = config.icon;
  return <Icon className={className || "h-4 w-4"} />;
}

function PlatformBadge({ platform }: { platform: string }) {
  const config = platformConfig[platform] || platformConfig.telegram;

  return (
    <Badge variant="secondary" className={config.color} data-testid={`badge-platform-${platform}`}>
      <PlatformIcon platform={platform} className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

export default function MarketingSocialInbox() {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryParams = new URLSearchParams();
  if (platformFilter !== "all") queryParams.set("platform", platformFilter);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (searchQuery) queryParams.set("search", searchQuery);
  const queryString = queryParams.toString();

  const { data: stats, isError, refetch} = useQuery<InboxStats>({
    queryKey: ["/api/marketing/inbox/stats"],
    refetchInterval: 15000,
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery<SocialConversation[]>({
    queryKey: ["/api/marketing/inbox/conversations", queryString],
    queryFn: async () => {
      const url = queryString
        ? `/api/marketing/inbox/conversations?${queryString}`
        : "/api/marketing/inbox/conversations";
      const res = await fetch(url, { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const json = await res.json();
      return Array.isArray(json) ? json : (json?.data ?? []);
    },
    refetchInterval: 15000,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<SocialMessage[]>({
    queryKey: ["/api/marketing/inbox/conversations", selectedId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/marketing/inbox/conversations/${selectedId}/messages`, { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedId,
    refetchInterval: 10000,
  });

  const replyMutation = useMutation({
    mutationFn: (text: string) => apiRequest("POST", `/api/marketing/inbox/conversations/${selectedId}/reply`, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/inbox/conversations", selectedId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/inbox/conversations"] });
      setReplyText("");
    },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const aiReplyMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/marketing/inbox/ai-reply/${selectedId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/inbox/conversations", selectedId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/inbox/conversations"] });
      toast({ title: "AI javob yuborildi" });
    },
    onError: (e: Error) => toast({ title: "AI xatolik", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiRequest("PATCH", `/api/marketing/inbox/conversations/${selectedId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/inbox/conversations"] });
      toast({ title: "Holat yangilandi" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations?.find((c) => c.id === selectedId);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setMobileShowChat(true);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedId) return;
    replyMutation.mutate(replyText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="social-inbox">
      <div className="flex items-center gap-3 p-3 border-b flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          {stats && (
            <>
              <div className="flex items-center gap-1.5" data-testid="stat-total">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{stats.totalConversations}</span>
                <span className="text-xs text-muted-foreground">jami</span>
              </div>
              <div className="flex items-center gap-1.5" data-testid="stat-open">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">{stats.openConversations}</span>
                <span className="text-xs text-muted-foreground">ochiq</span>
              </div>
              <div className="flex items-center gap-1.5" data-testid="stat-unread">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="text-sm font-medium">{stats.unreadCount}</span>
                <span className="text-xs text-muted-foreground">o'qilmagan</span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-platform-filter">
              <SelectValue placeholder="Platforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="open">Ochiq</SelectItem>
              <SelectItem value="assigned">Tayinlangan</SelectItem>
              <SelectItem value="resolved">Hal qilingan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`w-full md:w-[30%] border-r flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}
          data-testid="conversations-panel"
        >
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Qidirish..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground" data-testid="empty-conversations">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Suhbatlar topilmadi</p>
              </div>
            ) : (
              <div className="p-1">
                {(Array.isArray(conversations) ? conversations : []).map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedId === conv.id ? "bg-surface-container-high" : "hover:bg-surface-container-low"
                    } ${conv.unreadCount > 0 ? "border-l-2 border-primary bg-primary-container/10" : ""}`}
                    onClick={() => handleSelectConversation(conv.id)}
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
                        <span className="font-medium text-sm truncate" data-testid={`text-contact-name-${conv.id}`}>
                          {conv.contactName}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || "..."}</p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="text-[10px] px-1.5 min-w-[20px] justify-center" data-testid={`badge-unread-${conv.id}`}>
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div
          className={`flex-1 flex flex-col ${mobileShowChat ? "flex" : "hidden md:flex"}`}
          data-testid="chat-panel"
        >
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground" data-testid="empty-chat">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Suhbatni tanlang</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 border-b">
                <Button
                  size="icon"
                  variant="ghost"
                  className="md:hidden"
                  onClick={() => setMobileShowChat(false)}
                  data-testid="button-back-to-list"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedConversation && (
                  <>
                    <Avatar>
                      <AvatarImage src={selectedConversation.contactAvatar || undefined} />
                      <AvatarFallback>
                        {selectedConversation.contactName?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid="text-chat-contact-name">
                        {selectedConversation.contactName}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <PlatformBadge platform={selectedConversation.platform} />
                        <Badge variant="outline" className="text-xs">
                          {statusLabels[selectedConversation.status] || selectedConversation.status}
                        </Badge>
                        {selectedConversation.isAiHandling && (
                          <Badge variant="secondary" className="text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select
                        value={selectedConversation.status}
                        onValueChange={(v) => statusMutation.mutate(v)}
                      >
                        <SelectTrigger className="w-[130px]" data-testid="select-change-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Ochiq</SelectItem>
                          <SelectItem value="assigned">Tayinlangan</SelectItem>
                          <SelectItem value="resolved">Hal qilingan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

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
                    <p className="text-sm">Xabarlar yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(messages) ? messages : []).map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                        data-testid={`message-${msg.id}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            msg.direction === "outbound"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                          {msg.mediaUrl && (
                            <div className="mt-1.5">
                              {msg.mediaType?.startsWith("image") ? (
                                <img
                                  src={msg.mediaUrl}
                                  alt="media"
                                  className="max-w-full rounded-md max-h-48 object-cover"
                                />
                              ) : (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline"
                                >
                                  Faylni ko'rish
                                </a>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 justify-end">
                            {msg.isAiGenerated && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                                AI
                              </Badge>
                            )}
                            <span
                              className={`text-[10px] ${
                                msg.direction === "outbound"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatMessageTime(msg.sentAt)}
                            </span>
                            {msg.direction === "outbound" && msg.isRead && (
                              <CheckCheck className={`h-3 w-3 ${
                                msg.direction === "outbound"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Xabar yozing..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={replyMutation.isPending}
                    data-testid="input-reply-message"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => aiReplyMutation.mutate()}
                    disabled={aiReplyMutation.isPending}
                    data-testid="button-ai-reply"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || replyMutation.isPending}
                    data-testid="button-send-reply"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
