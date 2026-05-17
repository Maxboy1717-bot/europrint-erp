/**
 * @module ChatWidget
 * @description Floating chat widget. Composes RoomsView / NewChatView / ChatView
 *   from `ChatWidget.views.tsx` plus helpers from `ChatWidget.helpers.tsx`
 *   to stay under the 300-line file budget.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore, ChatRoom, ChatMessage } from "@/store/chatStore";
import { useChatSocket, getSharedSocket } from "@/hooks/chat/useChatSocket";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

import { formatDate } from "./ChatWidget.helpers";
import type { Employee } from "./ChatWidget.helpers";
import { RoomsView, NewChatView } from "./ChatWidget.views";
import { ChatView } from "./ChatWidget.chat-view";

export function ChatWidget() {
  const { t } = useTranslation("common");
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

  const rooms = useChatStore((s) => s.rooms);
  const totalUnread = useChatStore((s) => s.totalUnread);
  const allMessages = useChatStore((s) => s.messages);
  const { joinRoom, sendMessage: sendSharedMessage, sendTypingStart, sendTypingStop, startDirect } =
    useChatSocket();

  const messages = activeRoom ? allMessages[activeRoom.id] ?? [] : [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    return () => {
      Array.from(typingTimers.current.values()).forEach((timer) => clearTimeout(timer));
      typingTimers.current.clear();
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const s = getSharedSocket();
    if (!s) return;
    const handler = ({
      userId: uid,
      roomId,
      isTyping: typing,
      userName,
    }: {
      userId: number;
      roomId: string;
      isTyping: boolean;
      userName: string;
    }) => {
      if (!userName || !activeRoom || roomId !== activeRoom.id) return;
      const key = `${uid}:${roomId}`;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (typing) {
          next.add(userName);
          const old = typingTimers.current.get(key);
          if (old) clearTimeout(old);
          const timer = setTimeout(() => {
            setTypingUsers((p) => {
              const n = new Set(p);
              n.delete(userName);
              return n;
            });
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
    return () => {
      s.off("user_typing", handler);
    };
  }, [isAuthenticated, activeRoom]);

  const openRoom = useCallback(
    (room: ChatRoom) => {
      setActiveRoom(room);
      setView("chat");
      joinRoom(room.id);
    },
    [joinRoom]
  );

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || !activeRoom) return;
    sendSharedMessage(activeRoom.id, inputText.trim());
    setInputText("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    sendTypingStop(activeRoom.id);
  }, [inputText, activeRoom, sendSharedMessage, sendTypingStop]);

  const handleTyping = useCallback(
    (val: string) => {
      setInputText(val);
      if (!activeRoom) return;
      if (val.length > 0) sendTypingStart(activeRoom.id);
      else sendTypingStop(activeRoom.id);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        if (activeRoom) sendTypingStop(activeRoom.id);
      }, 2000);
    },
    [activeRoom, sendTypingStart, sendTypingStop]
  );

  const loadEmployees = useCallback(async (q?: string) => {
    try {
      const res = await apiRequest<unknown>(
        "GET",
        `/api/chat/employees${q ? `?search=${encodeURIComponent(q)}` : ""}`
      );
      setEmployees(res as Parameters<typeof setEmployees>[0]);
    } catch (e) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("ChatWidget loadEmployees failed:", e);
      }
    }
  }, []);

  const openNewChat = useCallback(() => {
    setView("new_chat");
    setEmpSearch("");
    loadEmployees();
  }, [loadEmployees]);

  const startDirectChat = useCallback(
    (emp: Employee) => {
      startDirect(emp.id);
      setView("rooms");
    },
    [startDirect]
  );

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
        <div className="w-full sm:w-[360px] h-[560px] bg-background border border-border rounded-lg shadow-lg flex flex-col overflow-hidden">
          {view === "rooms" && (
            <RoomsView
              rooms={sortedRooms}
              search={search}
              setSearch={setSearch}
              openRoom={openRoom}
              openNewChat={openNewChat}
              onClose={() => setIsOpen(false)}
              t={t}
            />
          )}
          {view === "new_chat" && (
            <NewChatView
              employees={employees}
              currentUserId={user?.id}
              empSearch={empSearch}
              onEmpSearch={(v) => {
                setEmpSearch(v);
                loadEmployees(v);
              }}
              onSelect={startDirectChat}
              onBack={() => setView("rooms")}
              t={t}
            />
          )}
          {view === "chat" && activeRoom && (
            <ChatView
              activeRoom={activeRoom}
              messages={messages}
              groupedMessages={groupedMessages}
              currentUserId={user?.id}
              typingUsers={typingUsers}
              inputText={inputText}
              inputRef={inputRef}
              messagesEndRef={messagesEndRef}
              onBack={() => setView("rooms")}
              onClose={() => setIsOpen(false)}
              onChange={handleTyping}
              onSend={sendMessage}
              t={t}
            />
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}
