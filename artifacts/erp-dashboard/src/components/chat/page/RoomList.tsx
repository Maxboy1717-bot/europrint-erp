/**
 * @module RoomList
 * @description React UI component.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Plus, MessageSquarePlus, Hash, Users, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatRoom, useChatStore } from "@/store/chatStore";
import { ChatAvatar } from "./ChatAvatar";
import { formatRoomTime } from "./ChatUtils";
import { CreateRoomModal } from "./CreateRoomModal";
import { DirectMessageModal } from "./DirectMessageModal";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
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

function RoomItem({ room, isActive, onClick, hasBirthday, isOnline }: {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
  hasBirthday?: boolean;
  isOnline?: boolean;
}) {
  const isGroup = room.type !== "direct";
  const isChannel = room.type === "channel";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 transition-all text-left group",
        "hover:bg-[var(--tg-sidebar-hover)]",
        isActive && "bg-[var(--tg-sidebar-active)] hover:bg-[var(--tg-sidebar-active)]"
      )}
    >
      <div className="relative flex-shrink-0">
        <ChatAvatar
          name={room.displayName || room.name || "?"}
          url={room.avatarUrl}
          size={54}
          online={!isGroup ? isOnline : undefined}
        />
        {isGroup && (
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 border-2",
            isActive ? "border-[var(--tg-sidebar-active)]" : "border-[var(--tg-sidebar-bg)]",
            isChannel ? "bg-orange-500" : "bg-blue-500"
          )}>
            {isChannel
              ? <span className="text-white text-[8px] font-bold w-3 h-3 flex items-center justify-center">📢</span>
              : <Users className="w-2.5 h-2.5 text-white" />
            }
          </span>
        )}
        {/* Birthday badge */}
        {hasBirthday && (
          <span className="absolute -top-1 -right-1 text-[16px] leading-none" title="Bugun tug'ilgan kun! 🎂">
            🎂
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            "text-[15px] font-medium truncate leading-tight",
            isActive ? "text-white" : "text-[var(--tg-text-primary)]",
            room.unreadCount > 0 && !isActive && "font-semibold"
          )}>
            {room.displayName || room.name || "Chat"}
            {hasBirthday && <span className="ml-1 text-[13px]">🎂</span>}
          </span>
          {room.lastMessage && (
            <span className={cn(
              "text-[12px] flex-shrink-0",
              isActive ? "text-white/70" : "text-[var(--tg-text-secondary)]"
            )}>
              {formatRoomTime(room.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className={cn(
            "text-[13px] truncate",
            isActive ? "text-white/70" : "text-[var(--tg-text-secondary)]"
          )}>
            {room.lastMessage
              ? room.lastMessage.messageType !== "text"
                ? "📎 Fayl"
                : room.lastMessage.content || "..."
              : "Xabar yo'q"}
          </span>
          {room.unreadCount > 0 && (
            <Badge className={cn(
              "ml-1 text-white text-[11px] h-[22px] min-w-[22px] px-1.5 flex-shrink-0 rounded-full font-medium",
              isActive
                ? "bg-white/30 hover:bg-white/30"
                : "bg-[var(--tg-unread-badge)] hover:bg-[var(--tg-unread-badge)]"
            )}>
              {room.unreadCount > 99 ? "99+" : room.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

type TabKey = "all" | "direct" | "group" | "channel";

export function RoomList({ onRoomSelect, onOpenSearch }: Props) {
  const rooms = useChatStore((s) => s.rooms);
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // Birthday data — fetch once per session
  const { data: birthdays = [] } = useQuery<{ id: number; fullName: string }[]>({
    queryKey: ["chat-birthdays-today"],
    queryFn: async () => {
      const res = await apiRequest('GET', "/api/chat/birthdays/today");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 3_600_000,
    refetchOnWindowFocus: false,
  });
  const birthdayUserIds = new Set((Array.isArray(birthdays) ? birthdays : []).map((b) => Number(b.id)));

  // Full-text search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredRooms = (Array.isArray(rooms) ? rooms : []).filter((r) =>
    !search || (r.displayName || r.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filteredRooms].sort((a, b) => {
    const at = a.lastMessage?.createdAt || a.createdAt;
    const bt = b.lastMessage?.createdAt || b.createdAt;
    return new Date(bt).getTime() - new Date(at).getTime();
  });

  const tabFiltered = sorted.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "direct") return r.type === "direct";
    if (activeTab === "group") return r.type === "group" || r.type === "department" || r.type === "context";
    if (activeTab === "channel") return r.type === "channel";
    return true;
  });

  // Unread counts per tab for badges
  const allRooms = Array.isArray(rooms) ? rooms : [];
  const unreadDirect = allRooms.filter(r => r.type === "direct" && r.unreadCount > 0).length;
  const unreadGroup = allRooms.filter(r => (r.type === "group" || r.type === "department" || r.type === "context") && r.unreadCount > 0).length;
  const unreadChannel = allRooms.filter(r => r.type === "channel" && r.unreadCount > 0).length;

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

  useEffect(() => {
    if (showSearchBar) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearchBar]);

  const handleSearchResultClick = useCallback((result: SearchResult) => {
    const roomId = result.type === "room" ? result.id : result.roomId;
    if (!roomId) return;
    const room = (Array.isArray(rooms) ? rooms : []).find((r) => r.id === roomId);
    if (room) {
      onRoomSelect(room);
    }
    setSearch("");
    setSearchResults([]);
    setShowSearchBar(false);
  }, [rooms, onRoomSelect]);

  const showSearchResults = search.length >= 2;

  return (
    <div className="flex flex-col h-full">
      {/* ── Telegram-style header ── */}
      <div className="h-[56px] flex items-center px-3 gap-2 flex-shrink-0 border-b border-[var(--tg-border)]">
        {showSearchBar ? (
          /* Search mode */
          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={() => { setShowSearchBar(false); setSearch(""); setSearchResults([]); }}
              className="p-1.5 rounded-full text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)] transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tg-text-placeholder)]" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full pl-9 pr-3 py-2 text-[15px] bg-[var(--tg-input-bg)] rounded-full outline-none border-0 ring-0 focus:outline-none focus:ring-0 focus:border-0 text-[var(--tg-text-primary)] placeholder:text-[var(--tg-text-placeholder)]"
                style={{ boxShadow: "none" }}
              />
            </div>
          </div>
        ) : (
          /* Normal mode */
          <>
            <a
              href="/"
              className="p-2 rounded-full text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)] transition-colors flex-shrink-0"
              title="ERP ga qaytish"
            >
              <Menu className="w-[22px] h-[22px]" />
            </a>

            <button
              onClick={() => setShowSearchBar(true)}
              className="flex-1 mx-1"
            >
              <div className="flex items-center gap-2 px-3 py-[7px] bg-[var(--tg-input-bg)] rounded-full">
                <Search className="w-4 h-4 text-[var(--tg-text-placeholder)]" />
                <span className="text-[15px] text-[var(--tg-text-placeholder)]">Qidirish</span>
              </div>
            </button>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => setDmOpen(true)}
                className="p-2 rounded-full text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)] transition-colors"
                title="Yangi xabar"
              >
                <MessageSquarePlus className="w-[20px] h-[20px]" />
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="p-2 rounded-full text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)] transition-colors"
                title="Guruh yaratish"
              >
                <Plus className="w-[20px] h-[20px]" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Tabs: All / DM / Groups / Channels ── */}
      {!showSearchBar && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--tg-border)] flex-shrink-0">
          {(
            [
              { key: "all",     label: "Barchasi",  badge: 0 },
              { key: "direct",  label: "💬 DM",     badge: unreadDirect },
              { key: "group",   label: "👥 Guruh",  badge: unreadGroup },
              { key: "channel", label: "📢 Kanal",  badge: unreadChannel },
            ] as { key: TabKey; label: string; badge: number }[]
          ).map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "relative flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                activeTab === key
                  ? "bg-[var(--tg-sidebar-active)] text-white"
                  : "text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)]"
              )}
            >
              {label}
              {badge > 0 && (
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
                  activeTab === key ? "bg-white text-[var(--tg-sidebar-active)]" : "bg-[var(--tg-unread-badge)] text-white"
                )}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Search results */}
      {showSearchResults ? (
        <div className="flex-1 overflow-y-auto">
          {searching ? (
            <div className="flex items-center justify-center py-8 text-[var(--tg-text-secondary)] gap-2">
              <EPLoader className="w-5 h-5" />
              <span className="text-[14px]">Qidirilmoqda...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-[var(--tg-text-secondary)]">
              <Search className="w-12 h-12 opacity-20" />
              <p className="text-[14px]">Natija topilmadi</p>
            </div>
          ) : (
            <div>
              {/* Rooms section */}
              {(Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "room").length > 0 && (
                <>
                  <p className="text-[12px] font-semibold text-[var(--tg-sidebar-active)] uppercase tracking-wider px-4 pt-3 pb-1">Chatlar</p>
                  {(Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "room").map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--tg-sidebar-hover)] text-left transition-colors"
                    >
                      <ChatAvatar name={result.displayName || result.name || "?"} size={42} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium truncate text-[var(--tg-text-primary)]">{result.displayName || result.name}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Messages section */}
              {(Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "message").length > 0 && (
                <>
                  <p className="text-[12px] font-semibold text-[var(--tg-sidebar-active)] uppercase tracking-wider px-4 pt-3 pb-1">Xabarlar</p>
                  {(Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "message").map((result, i) => (
                    <button
                      key={result.id || i}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full flex items-start gap-3 px-4 py-2 hover:bg-[var(--tg-sidebar-hover)] text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--tg-sidebar-active)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Hash className="w-5 h-5 text-[var(--tg-sidebar-active)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[var(--tg-sidebar-active)]">{result.roomName}</p>
                        <p className="text-[14px] font-medium truncate text-[var(--tg-text-primary)]">{result.senderName}</p>
                        <p className="text-[13px] text-[var(--tg-text-secondary)] line-clamp-2">{result.content}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Room list ── */
        <div className="flex-1 overflow-y-auto">
          {tabFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-[var(--tg-text-secondary)]">
              <div className="w-16 h-16 rounded-full bg-[var(--tg-sidebar-active)]/10 flex items-center justify-center">
                <Hash className="w-8 h-8 text-[var(--tg-sidebar-active)] opacity-50" />
              </div>
              <p className="text-[14px]">
                {search ? "Topilmadi" : activeTab !== "all" ? "Bu bo'limda chat yo'q" : "Chatlar yo'q"}
              </p>
              {!search && activeTab === "all" && (
                <button
                  onClick={() => setDmOpen(true)}
                  className="text-[14px] text-[var(--tg-sidebar-active)] hover:underline"
                >
                  Yangi chat boshlash
                </button>
              )}
            </div>
          ) : (
            tabFiltered.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={activeRoomId === room.id}
                onClick={() => onRoomSelect(room)}
                hasBirthday={
                  room.type === "direct" &&
                  room.otherUserId != null &&
                  birthdayUserIds.has(Number(room.otherUserId))
                }
                isOnline={
                  room.type === "direct" &&
                  room.otherUserId != null
                    ? onlineUserIds.has(Number(room.otherUserId))
                    : undefined
                }
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
