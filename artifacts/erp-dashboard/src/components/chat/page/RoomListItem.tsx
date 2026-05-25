/**
 * @module RoomListItem
 * @description Single room row component for RoomList.
 * Split from RoomList.tsx (Rule 16).
 */

import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatRoom } from "@/store/chatStore";
import { ChatAvatar } from "./ChatAvatar";
import { formatRoomTime } from "./ChatUtils";
import { useTranslation } from '@/lib/i18n';

export interface RoomItemProps {
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
  hasBirthday?: boolean;
  isOnline?: boolean;
}

export function RoomItem({ room, isActive, onClick, hasBirthday, isOnline }: RoomItemProps) {
  const { t } = useTranslation("common");
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
        {hasBirthday && (
          <span className="absolute -top-1 -right-1 text-[16px] leading-none" title={t("bugunTugilganKun")}>
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
