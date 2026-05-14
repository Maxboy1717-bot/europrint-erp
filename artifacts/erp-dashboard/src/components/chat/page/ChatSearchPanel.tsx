/**
 * @module ChatSearchPanel
 * @description React UI component.
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatAvatar } from "./ChatAvatar";
import { Search, X, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useChatStore } from "@/store/chatStore";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { useDebounce } from "@/hooks/useDebounce";

import { EPLoader } from "@/components/ep";
interface SearchResult {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  messageType: string;
  senderName: string;
  senderAvatar?: string;
  roomName: string;
  roomType: string;
  highlight: string;
}

interface Props {
  onClose: () => void;
}

function highlightText(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (Array.isArray(parts) ? parts : []).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <mark key={`k-${i}`} className="bg-yellow-200 dark:bg-yellow-800/60 text-yellow-900 dark:text-yellow-100 rounded px-0.5">
          {part.slice(2, -2)}
        </mark>
      );
    }
    return <span key={`k-${i}`}>{part}</span>;
  });
}

export function ChatSearchPanel({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const setActiveRoomId = useChatStore((s) => s.setActiveRoomId);
  const { joinRoom } = useChatSocket();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["chat-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { results: [], total: 0 };
      const url = `/api/chat/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<{ results: SearchResult[]; total: number }>;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 10_000,
  });

  const handleGoToRoom = useCallback((result: SearchResult) => {
    setActiveRoomId(result.roomId);
    joinRoom(result.roomId);
    onClose();
  }, [setActiveRoomId, joinRoom, onClose]);

  const results = data?.results || [];
  const total = data?.total || 0;
  const showLoading = (isLoading || isFetching) && debouncedQuery.length >= 2;

  return (
    <div className="flex flex-col h-full">
      {/* Search header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 flex-shrink-0">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Xabarlarda qidirish..."
          autoFocus
          className="border-0 shadow-none p-0 h-auto text-sm focus-visible:ring-0 flex-1"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!query || query.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <Search className="w-8 h-8 opacity-30" />
            <p className="text-xs">Kamida 2 ta belgi kiriting</p>
          </div>
        ) : showLoading ? (
          <div className="flex items-center justify-center h-24">
            <EPLoader tone="muted" className="w-5 h-5" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <Search className="w-8 h-8 opacity-30" />
            <p className="text-xs">Natijalar topilmadi</p>
          </div>
        ) : (
          <>
            <div className="px-3 py-2 border-b border-border/30">
              <p className="text-xs text-muted-foreground">
                {total} natija topildi
              </p>
            </div>
            <div className="divide-y divide-border/30">
              {(Array.isArray(results) ? results : []).map((result) => (
                <div
                  key={result.id}
                  className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => handleGoToRoom(result)}
                >
                  <ChatAvatar name={result.senderName} url={result.senderAvatar} size={30} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold truncate">{result.senderName}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {format(new Date(result.createdAt), "dd.MM HH:mm")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5 truncate">
                      #{result.roomName || "Xona"}
                    </p>
                    <p className="text-xs text-foreground/80 line-clamp-2">
                      {result.highlight
                        ? highlightText(result.highlight)
                        : result.content
                      }
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    title="Xonaga o'tish"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
