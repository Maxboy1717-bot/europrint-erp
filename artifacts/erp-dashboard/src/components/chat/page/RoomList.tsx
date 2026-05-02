import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Plus, MessageSquarePlus, Hash, Users, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatRoom, useChatStore } from "@/store/chatStore";
import { ChatAvatar } from "./ChatAvatar";
import { formatRoomTime } from "./ChatUtils";
import { CreateRoomModal } from "./CreateRoomModal";
import { DirectMessageModal } from "./DirectMessageModal";
import { apiRequest } from "@/lib/queryClient";

interface Props {
  onRoomSelect: (room: ChatRoom) => void;
  onOpenSearch?: () => void;
}

interface SearchResult {
  type: "room" | "message";
  id: string;
  roomId?: string;
  roomName?: string;
  content?: string;
  senderName?: string;
  createdAt?: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
}

function RoomItem({ room, isActive, onClick }: {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
}) {
  const isGroup = room.type !== "direct";
  const isChannel = room.type === "channel";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group",
        isActive
          ? "bg-primary/10 dark:bg-primary/20 text-foreground"
          : "hover:bg-muted/60 text-foreground"
      )}
    >
      <div className="relative flex-shrink-0">
        <ChatAvatar
          name={room.displayName || room.name || "?"}
          url={room.avatarUrl}
          size={42}
        />
        {isGroup && (
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 border border-background",
            isChannel ? "bg-orange-500" : "bg-blue-500"
          )}>
            {isChannel
              ? <span className="text-white text-[8px] font-bold w-3 h-3 flex items-center justify-center">📢</span>
              : <Users className="w-2 h-2 text-white" />
            }
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            "text-sm font-medium truncate",
            room.unreadCount > 0 ? "text-foreground font-semibold" : "text-foreground/80"
          )}>
            {room.displayName || room.name || "Chat"}
          </span>
          {room.lastMessage && (
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {formatRoomTime(room.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-xs text-muted-foreground truncate max-w-[160px]">
            {room.lastMessage
              ? room.lastMessage.messageType !== "text"
                ? "📎 Fayl"
                : room.lastMessage.content || "..."
              : "Xabar yo'q"}
          </span>
          {room.unreadCount > 0 && (
            <Badge className="ml-1 bg-[#ff5d2e] hover:bg-[#ff5d2e] text-white text-[10px] h-4 min-w-[18px] px-1 flex-shrink-0 rounded-full">
              {room.unreadCount > 99 ? "99+" : room.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export function RoomList({ onRoomSelect, onOpenSearch }: Props) {
  const rooms = useChatStore((s) => s.rooms);
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);

  // Full-text search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter rooms by name locally
  const filteredRooms = (Array.isArray(rooms) ? rooms : []).filter((r) =>
    !search || (r.displayName || r.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filteredRooms].sort((a, b) => {
    const at = a.lastMessage?.createdAt || a.createdAt;
    const bt = b.lastMessage?.createdAt || b.createdAt;
    return new Date(bt).getTime() - new Date(at).getTime();
  });

  // Full-text search via API (debounced)
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!search || search.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiRequest("GET", `/api/chat/search?q=${encodeURIComponent(search)}`) as {
          rooms: SearchResult[];
          messages: SearchResult[];
        };
        const combined: SearchResult[] = [
          ...(res.rooms || []).map((r: SearchResult) => ({ ...r, type: "room" as const })),
          ...(res.messages || []).map((m: SearchResult) => ({ ...m, type: "message" as const })),
        ];
        setSearchResults(combined);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  const handleSearchResultClick = useCallback((result: SearchResult) => {
    const roomId = result.type === "room" ? result.id : result.roomId;
    if (!roomId) return;
    const room = (Array.isArray(rooms) ? rooms : []).find((r) => r.id === roomId);
    if (room) {
      onRoomSelect(room);
    }
    setSearch("");
    setSearchResults([]);
  }, [rooms, onRoomSelect]);

  const showSearchResults = search.length >= 2;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-foreground">Chatlar</h2>
          <div className="flex gap-1">
            {onOpenSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-muted-foreground hover:text-foreground"
                onClick={onOpenSearch}
                title="Xabarlarda qidirish"
                aria-label="Xabarlarda qidirish"
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={() => setDmOpen(true)}
              title="Yangi direct xabar"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={() => setCreateOpen(true)}
              title="Guruh yaratish"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Xona yoki xabar qidirish..."
            className="pl-8 pr-8 h-8 text-sm bg-muted/40 border-border/50 rounded-lg"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setSearchResults([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {showSearchResults ? (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {searching ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Qidirilmoqda...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Search className="w-8 h-8 opacity-20" />
              <p className="text-xs">Natija topilmadi</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Rooms section */}
              {(Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "room").length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1 pb-0.5">Xonalar</p>
                  {(Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "room").map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/60 text-left transition-colors"
                    >
                      <ChatAvatar name={result.displayName || result.name || "?"} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{result.displayName || result.name}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Messages section */}
              {(Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "message").length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-2 pb-0.5">Xabarlar</p>
                  {(Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "message").map((result, i) => (
                    <button
                      key={result.id || i}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-muted/60 text-left transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Hash className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-primary truncate">{result.roomName}</p>
                        <p className="text-xs font-medium truncate">{result.senderName}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{result.content}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Regular room list */
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Hash className="w-10 h-10 opacity-20" />
              <p className="text-sm">
                {search ? "Topilmadi" : "Chatlar yo'q"}
              </p>
              {!search && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setDmOpen(true)}
                >
                  Yangi chat boshlash
                </Button>
              )}
            </div>
          ) : (
            (sorted ?? []).map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={activeRoomId === room.id}
                onClick={() => onRoomSelect(room)}
              />
            ))
          )}
        </div>
      )}

      <CreateRoomModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <DirectMessageModal open={dmOpen} onClose={() => setDmOpen(false)} />
    </div>
  );
}
