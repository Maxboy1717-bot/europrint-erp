/**
 * @module MarketingSocialInbox
 * @description React page component. Route-level UI.
 * State management, data-fetching hooks, and orchestration only.
 * UI sections live in MarketingSocialInboxSections.tsx.
 */

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import type { InboxStats, SocialConversation, SocialMessage } from "./MarketingSocialInboxTypes";
import { ConversationsPanel, ChatPanel } from "./MarketingSocialInboxSections";
import { useTranslation } from '@/lib/i18n';

export default function MarketingSocialInbox() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // — UI state —
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // — Query string —
  const queryParams = new URLSearchParams();
  if (platformFilter !== "all") queryParams.set("platform", platformFilter);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (searchQuery) queryParams.set("search", searchQuery);
  const queryString = queryParams.toString();

  // — Data queries —
  const { data: stats, isError, refetch } = useQuery<InboxStats>({
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
      const res = await apiRequest('GET', `/api/marketing/inbox/conversations/${selectedId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedId,
    refetchInterval: 10000,
  });

  // — Mutations —
  const replyMutation = useMutation({
    mutationFn: (text: string) =>
      apiRequest("POST", `/api/marketing/inbox/conversations/${selectedId}/reply`, { text }),
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
    mutationFn: (status: string) =>
      apiRequest("PATCH", `/api/marketing/inbox/conversations/${selectedId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/inbox/conversations"] });
      toast({ title: "Holat yangilandi" });
    },
  });

  // — Effects —
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // — Derived —
  const selectedConversation = conversations?.find((c) => c.id === selectedId);

  // — Handlers —
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

  // — Render —
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="social-inbox">
      {/* Top bar — stats + filters */}
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
                <span className="text-xs text-muted-foreground">{t("oqilmagan1")}</span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-9" data-testid="select-platform-filter">
              <SelectValue placeholder={t("platforma")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Barchasi")}</SelectItem>
              <SelectItem value="instagram">{t("instagram")}</SelectItem>
              <SelectItem value="facebook">{t("facebook")}</SelectItem>
              <SelectItem value="telegram">{t("telegram")}</SelectItem>
              <SelectItem value="whatsapp">{t("whatsapp")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-9" data-testid="select-status-filter">
              <SelectValue placeholder={t("status28")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("Barchasi")}</SelectItem>
              <SelectItem value="open">{t("ochiq")}</SelectItem>
              <SelectItem value="assigned">{t("tayinlangan")}</SelectItem>
              <SelectItem value="resolved">{t("halQilingan")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        <ConversationsPanel
          mobileShowChat={mobileShowChat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          conversationsLoading={conversationsLoading}
          conversations={conversations}
          selectedId={selectedId}
          onSelectConversation={handleSelectConversation}
        />
        <ChatPanel
          mobileShowChat={mobileShowChat}
          selectedId={selectedId}
          selectedConversation={selectedConversation}
          messages={messages}
          messagesLoading={messagesLoading}
          messagesEndRef={messagesEndRef}
          replyText={replyText}
          onReplyTextChange={setReplyText}
          onKeyDown={handleKeyDown}
          onSendReply={handleSendReply}
          onAiReply={() => aiReplyMutation.mutate()}
          onStatusChange={(v) => statusMutation.mutate(v)}
          onBackToList={() => setMobileShowChat(false)}
          replyPending={replyMutation.isPending}
          aiReplyPending={aiReplyMutation.isPending}
        />
      </div>
    </div>
  );
}
