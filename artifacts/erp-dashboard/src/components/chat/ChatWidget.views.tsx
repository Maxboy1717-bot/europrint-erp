/**
 * @module ChatWidget.views
 * @description RoomsView and NewChatView panels used by ChatWidget.
 *   ChatView lives in `ChatWidget.chat-view.tsx`.
 *   Split out so each file stays under 300 lines.
 */

import { MessageCircle, X, Search, ChevronLeft, Users, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ChatRoom } from "@/store/chatStore";

import { Avatar, formatTime } from "./ChatWidget.helpers";
import type { Employee } from "./ChatWidget.helpers";

export function RoomsView({
  rooms,
  search,
  setSearch,
  openRoom,
  openNewChat,
  onClose,
  t,
}: {
  rooms: ChatRoom[];
  search: string;
  setSearch: (v: string) => void;
  openRoom: (r: ChatRoom) => void;
  openNewChat: () => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">{t("ichkiChat")}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={openNewChat}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title={t("yangiChat1")}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
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
            placeholder={t("chatlarniQidirish")}
            className="pl-7 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
            <MessageCircle className="w-8 h-8 opacity-30" />
            <p>{t("chatlarYoq")}</p>
            <button onClick={openNewChat} className="text-primary text-xs underline">
              {t("yangiChatBoshlash")}
            </button>
          </div>
        )}
        {(Array.isArray(rooms) ? rooms : []).map((room) => (
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
                  <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] h-4 min-w-4 px-1 flex-shrink-0">
                    {room.unreadCount > 99 ? "99+" : room.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

export function NewChatView({
  employees,
  currentUserId,
  empSearch,
  onEmpSearch,
  onSelect,
  onBack,
  t,
}: {
  employees: Employee[];
  currentUserId: number | string | undefined;
  empSearch: string;
  onEmpSearch: (v: string) => void;
  onSelect: (emp: Employee) => void;
  onBack: () => void;
  t: (k: string) => string;
}) {
  const list = (Array.isArray(employees) ? employees : []).filter(
    (e) => e.id !== currentUserId
  );
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/20">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm">{t("yangiChat")}</span>
      </div>
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={empSearch}
            onChange={(e) => onEmpSearch(e.target.value)}
            placeholder={t("xodimniQidirish")}
            className="pl-7 h-8 text-sm"
            autoFocus
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {list.map((emp) => (
          <button
            key={emp.id}
            onClick={() => onSelect(emp)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/40"
          >
            <Avatar name={emp.fullName} url={emp.avatarUrl} size={36} />
            <div>
              <p className="text-sm font-medium">{emp.fullName}</p>
              <p className="text-xs text-muted-foreground">{emp.departmentName || emp.employeeId}</p>
            </div>
          </button>
        ))}
        {list.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            {t("xodimTopilmadi")}
          </div>
        )}
      </div>
    </>
  );
}
