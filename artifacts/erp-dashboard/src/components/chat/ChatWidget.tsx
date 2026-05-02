import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Search, ChevronLeft, Paperclip, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore, ChatRoom, ChatMessage } from "@/store/chatStore";
import { useChatSocket, getSharedSocket } from "@/hooks/chat/useChatSocket";

interface Employee {
  id: number;
  fullName: string;
  employeeId: string;
  avatarUrl?: string;
  departmentName?: string;
}

function Avatar({ name, url, size = 32 }: { name: string; url?: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500"];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div
      className={cn("rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0", color)}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString("uz", { weekday: "short" });
  return d.toLocaleDateString("uz", { day: "2-digit", month: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff === 0) return "Bugun";
  if (diff === 86400000) return "Kecha";
  return d.toLocaleDateString("uz", { day: "2-digit", month: "long", year: "numeric" });
}

export function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"rooms" | "chat" | "new_chat">("rooms");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // From shared store
  const rooms = useChatStore((s) => s.rooms);
  const totalUnread = useChatStore((s) => s.totalUnread);
  const allMessages = useChatStore((s) => s.messages);
  const { joinRoom, sendMessage: sendSharedMessage, sendTypingStart, sendTypingStop, startDirect } = useChatSocket();

  const messages = activeRoom ? (allMessages[activeRoom.id] ?? []) : [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Listen for widget-specific typing (local state)
  useEffect(() => {
    if (!isAuthenticated) return;
    const s = getSharedSocket();
    if (!s) return;

    const handler = ({ userId: uid, roomId, isTyping: typing, userName }: { userId: number; roomId: string; isTyping: boolean; userName: string }) => {
      if (!userName || !activeRoom || roomId !== activeRoom.id) return;
      const key = `${uid}:${roomId}`;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (typing) {
          next.add(userName);
          const old = typingTimers.current.get(key);
          if (old) clearTimeout(old);
          const timer = setTimeout(() => {
            setTypingUsers((p) => { const n = new Set(p); n.delete(userName); return n; });
            typingTimers.current.delete(key);
          }, 3000);
          typingTimers.current.set(key, timer);
        } else {
          next.delete(userName);
          const old = typingTimers.current.get(key);
          if (old) clearTimeout(old);
          typingTimers.current.delete(key);
        }
        return next;
      });
    };

    s.on("user_typing", handler);
    return () => { s.off("user_typing", handler); };
  }, [isAuthenticated, activeRoom]);

  const openRoom = useCallback((room: ChatRoom) => {
    setActiveRoom(room);
    setView("chat");
    joinRoom(room.id);
  }, [joinRoom]);

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || !activeRoom) return;
    sendSharedMessage(activeRoom.id, inputText.trim());
    setInputText("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    sendTypingStop(activeRoom.id);
  }, [inputText, activeRoom, sendSharedMessage, sendTypingStop]);

  const handleTyping = useCallback((val: string) => {
    setInputText(val);
    if (!activeRoom) return;
    if (val.length > 0) sendTypingStart(activeRoom.id);
    else sendTypingStop(activeRoom.id);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      if (activeRoom) sendTypingStop(activeRoom.id);
    }, 2000);
  }, [activeRoom, sendTypingStart, sendTypingStop]);

  const loadEmployees = useCallback(async (q?: string) => {
    try {
      const res = await fetch(`/api/chat/employees${q ? `?search=${encodeURIComponent(q)}` : ""}`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (res.ok) setEmployees(await res.json());
    } catch {}
  }, []);

  const openNewChat = useCallback(() => {
    setView("new_chat");
    setEmpSearch("");
    loadEmployees();
  }, [loadEmployees]);

  const startDirectChat = useCallback((emp: Employee) => {
    startDirect(emp.id);
    setView("rooms");
  }, [startDirect]);

  const filteredRooms = (Array.isArray(rooms) ? rooms : []).filter((r) => {
    if (!search) return true;
    return (r.displayName || r.name || "").toLowerCase().includes(search.toLowerCase());
  });

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const at = a.lastMessage?.createdAt || a.createdAt;
    const bt = b.lastMessage?.createdAt || b.createdAt;
    return new Date(bt).getTime() - new Date(at).getTime();
  });

  const groupedMessages = messages.reduce<{ date: string; msgs: ChatMessage[] }[]>((acc, msg) => {
    const date = formatDate(msg.createdAt);
    const last = acc[acc.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else acc.push({ date, msgs: [msg] });
    return acc;
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2">
      {isOpen && (
        <div className="w-[360px] h-[560px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {view === "rooms" && (
            <>
              <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold text-sm">Ichki Chat</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={openNewChat}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    title="Yangi chat"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="px-3 py-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Chatlarni qidirish..."
                    className="pl-7 h-8 text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {sortedRooms.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                    <MessageCircle className="w-8 h-8 opacity-30" />
                    <p>Chatlar yo'q</p>
                    <button onClick={openNewChat} className="text-primary text-xs underline">
                      Yangi chat boshlash
                    </button>
                  </div>
                )}
                {(Array.isArray(sortedRooms) ? sortedRooms : []).map((room) => (
                  <button
                    key={room.id}
                    onClick={() => openRoom(room)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/40"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar name={room.displayName || room.name || "?"} url={room.avatarUrl} size={40} />
                      {(room.type === "group" || room.type === "department") && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                          <Users className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{room.displayName || room.name}</span>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-1">
                          {room.lastMessage ? formatTime(room.lastMessage.createdAt) : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">
                          {room.lastMessage
                            ? room.lastMessage.messageType === "text"
                              ? room.lastMessage.content
                              : "📎 Fayl"
                            : "Xabar yo'q"}
                        </span>
                        {room.unreadCount > 0 && (
                          <Badge className="ml-1 bg-[#ff5d2e] hover:bg-[#ff5d2e] text-white text-[10px] h-4 min-w-4 px-1 flex-shrink-0">
                            {room.unreadCount > 99 ? "99+" : room.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {view === "new_chat" && (
            <>
              <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground">
                <button onClick={() => setView("rooms")} className="p-1 rounded-lg hover:bg-white/20">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-sm">Yangi Chat</span>
              </div>
              <div className="px-3 py-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={empSearch}
                    onChange={(e) => { setEmpSearch(e.target.value); loadEmployees(e.target.value); }}
                    placeholder="Xodimni qidirish..."
                    className="pl-7 h-8 text-sm"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {(Array.isArray(employees) ? employees : []).filter((e) => e.id !== user?.id)
                  .map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => startDirectChat(emp)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/40"
                    >
                      <Avatar name={emp.fullName} url={emp.avatarUrl} size={36} />
                      <div>
                        <p className="text-sm font-medium">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">{emp.departmentName || emp.employeeId}</p>
                      </div>
                    </button>
                  ))}
                {(Array.isArray(employees) ? employees : []).filter((e) => e.id !== user?.id).length === 0 && (
                  <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                    Xodim topilmadi
                  </div>
                )}
              </div>
            </>
          )}

          {view === "chat" && activeRoom && (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-primary text-primary-foreground">
                <button onClick={() => setView("rooms")} className="p-1 rounded-lg hover:bg-white/20">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <Avatar name={activeRoom.displayName || activeRoom.name || "?"} url={activeRoom.avatarUrl} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{activeRoom.displayName || activeRoom.name}</p>
                  {typingUsers.size > 0 ? (
                    <p className="text-[11px] opacity-80">{Array.from(typingUsers)[0]} yozmoqda...</p>
                  ) : (
                    <p className="text-[11px] opacity-70 capitalize">{activeRoom.type}</p>
                  )}
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/20">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 bg-muted/20">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                    <MessageCircle className="w-8 h-8 opacity-30" />
                    <p>Xabarlar yo'q. Birinchi xabarni yuboring!</p>
                  </div>
                )}
                {(Array.isArray(groupedMessages) ? groupedMessages : []).map(({ date, msgs }) => (
                  <div key={date}>
                    <div className="flex justify-center my-2">
                      <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{date}</span>
                    </div>
                    {(Array.isArray(msgs) ? msgs : []).map((msg, idx) => {
                      const isMe = String(msg.senderId) === String(user?.id);
                      const prevMsg = idx > 0 ? msgs[idx - 1] : null;
                      const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
                      const showName = !isMe && showAvatar;

                      if (msg.isDeleted) {
                        return (
                          <div key={msg.id} className={cn("flex gap-2 mb-1", isMe ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn("w-7 flex-shrink-0", isMe && "hidden")} />
                            <span className="text-xs italic text-muted-foreground/60 px-3 py-1.5 bg-muted/30 rounded-2xl">
                              Xabar o'chirildi
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={cn("flex gap-2 mb-1", isMe ? "flex-row-reverse" : "flex-row")}>
                          <div className={cn("w-7 flex-shrink-0", isMe && "hidden")}>
                            {showAvatar && <Avatar name={msg.senderName} url={msg.senderAvatar} size={28} />}
                          </div>
                          <div className={cn("max-w-[75%] flex flex-col", isMe && "items-end")}>
                            {showName && (
                              <span className="text-[11px] text-muted-foreground ml-1 mb-0.5">{msg.senderName}</span>
                            )}
                            <div className={cn(
                              "px-3 py-1.5 rounded-2xl text-sm",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-background border border-border rounded-tl-sm",
                            )}>
                              {msg.messageType === "text" && (
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              )}
                              {msg.messageType === "file" && msg.fileUrl && (
                                <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 underline">
                                  <Paperclip className="w-3 h-3" />
                                  <span className="truncate max-w-[160px]">{msg.fileName || "Fayl"}</span>
                                </a>
                              )}
                              {msg.isEdited && (
                                <span className={cn("text-[9px] opacity-60", isMe ? "text-primary-foreground" : "text-muted-foreground")}>
                                  {" "}(tahrirlangan)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-3 py-2 border-t border-border bg-background flex items-end gap-2">
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Xabar yozing..."
                  className="flex-1 h-9 text-sm"
                />
                <Button size="sm" onClick={sendMessage} disabled={!inputText.trim()} className="h-9 w-9 p-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          "bg-primary text-primary-foreground hover:scale-105 active:scale-95",
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#ff5d2e] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}
