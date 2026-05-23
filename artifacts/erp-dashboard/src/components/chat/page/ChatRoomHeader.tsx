/**
 * @module ChatRoomHeader
 * @description Telegram-style room header bar with avatar, name, status and
 * action buttons. Extracted from ChatLayoutMessages.tsx (Rule 16).
 */

import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";
import { Search, ArrowLeft, MoreVertical, Video, CheckSquare } from "lucide-react";
import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import type { ChatLayoutMessagesProps } from "./ChatLayoutTypes";

type RoomHeaderProps = Pick<
  ChatLayoutMessagesProps,
  | "activeRoom"
  | "memberCount"
  | "onlineUserIds"
  | "typingText"
  | "showSearch"
  | "infoOpen"
  | "videoCallUrl"
  | "videoLoading"
  | "onToggleSearch"
  | "onToggleInfo"
  | "onMobileBack"
  | "onVideoCall"
  | "onTaskFromLastMsg"
> & { activeRoomType: string };

export function ChatRoomHeader({
  activeRoom, memberCount, onlineUserIds, typingText,
  showSearch, infoOpen, videoCallUrl, videoLoading,
  onToggleSearch, onToggleInfo, onMobileBack, onVideoCall,
  onTaskFromLastMsg, activeRoomType,
}: RoomHeaderProps) {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center gap-3 px-4 h-[56px] bg-[var(--tg-header-bg)] border-b border-[var(--tg-border)] flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <button
        onClick={onMobileBack}
        className="sm:hidden p-1.5 -ml-1 rounded-full text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <button onClick={onToggleInfo} className="flex-shrink-0">
        <ChatAvatar
          name={activeRoom.displayName || activeRoom.name || "?"}
          url={activeRoom.avatarUrl}
          emoji={activeRoom.avatarEmoji}
          size={42}
          online={
            activeRoom.type === "direct" && activeRoom.otherUserId != null
              ? onlineUserIds.has(Number(activeRoom.otherUserId))
              : undefined
          }
        />
      </button>

      <button onClick={onToggleInfo} className="flex-1 min-w-0 text-left">
        <h3 className="font-semibold text-[15px] text-[var(--tg-text-primary)] leading-tight truncate">
          {activeRoom.displayName || activeRoom.name || "Chat"}
        </h3>
        <p className="text-[13px] leading-tight">
          {typingText ? (
            <span className="text-[var(--tg-sidebar-active)]">{typingText}</span>
          ) : activeRoom.type === "direct" ? (
            activeRoom.otherUserId != null &&
            onlineUserIds.has(Number(activeRoom.otherUserId)) ? (
              <span className="text-[var(--ep-green)] font-medium">{t("online2")}</span>
            ) : (
              <span className="text-[var(--tg-text-secondary)]">{"Oflayn"}</span>
            )
          ) : (
            <span className="text-[var(--tg-text-secondary)]">{memberCount} a'zo</span>
          )}
        </p>
      </button>

      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleSearch}
          className={cn(
            "p-2 rounded-full transition-colors",
            showSearch
              ? "bg-[var(--tg-sidebar-active)]/10 text-[var(--tg-sidebar-active)]"
              : "text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)]"
          )}
          title={t("search")}
        >
          <Search className="w-[22px] h-[22px]" />
        </button>

        <button
          onClick={onVideoCall}
          disabled={videoLoading}
          className={cn(
            "p-2 rounded-full transition-colors",
            videoCallUrl
              ? "bg-red-500/10 text-[var(--ep-red)] hover:bg-[var(--ep-red)]/90/20"
              : videoLoading
              ? "text-[var(--tg-text-secondary)] opacity-60"
              : "text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)]"
          )}
          title={videoCallUrl ? "Video qo'ng'iroqni yopish" : "Video qo'ng'iroq"}
        >
          {videoLoading ? (
            <EPLoader className="w-[22px] h-[22px]" />
          ) : (
            <Video className="w-[22px] h-[22px]" />
          )}
        </button>

        {activeRoomType === "direct" && (
          <button
            onClick={onTaskFromLastMsg}
            className="p-2 rounded-full text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)] transition-colors"
            title={t("vazifaQoshish")}
          >
            <CheckSquare className="w-[22px] h-[22px]" />
          </button>
        )}

        <button
          onClick={onToggleInfo}
          className={cn(
            "p-2 rounded-full transition-colors",
            infoOpen
              ? "bg-[var(--tg-sidebar-active)]/10 text-[var(--tg-sidebar-active)]"
              : "text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)]"
          )}
          title={t("info")}
        >
          <MoreVertical className="w-[22px] h-[22px]" />
        </button>
      </div>
    </div>
  );
}
