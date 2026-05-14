/**
 * @module ChatLayoutHeader
 * @description Header strip, pinned-message banner, and upload-progress bar for
 * the chat center panel. These elements are visually stacked at the top of the
 * message area and share no state with the message list itself.
 */

import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";
import { Pin, X, Search, ArrowLeft, MoreVertical, Video, CheckSquare } from "lucide-react";
import { ChatRoom } from "@/store/chatStore";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomHeaderProps {
  activeRoom: ChatRoom;
  memberCount: number;
  onlineUserIds: Set<number>;
  typingText: string | null;
  showSearch: boolean;
  infoOpen: boolean;
  videoCallUrl: string | null;
  videoLoading: boolean;
  onToggleSearch: () => void;
  onToggleInfo: () => void;
  onMobileBack: () => void;
  onVideoCall: () => void;
  onTaskFromLastMsg: () => void;
}

export interface PinnedBannerProps {
  pinnedMessage: { id: string; content: string; senderName: string };
  onUnpin: () => void;
}

export interface UploadProgressProps {
  uploadProgress: string;
}

// ---------------------------------------------------------------------------
// RoomHeader
// ---------------------------------------------------------------------------

/**
 * Telegram-style top bar with avatar, room name, online/typing status,
 * and action icon buttons (search, video, task, info).
 */
export function RoomHeader({activeRoom,
  memberCount,
  onlineUserIds,
  typingText,
  showSearch,
  infoOpen,
  videoCallUrl,
  videoLoading,
  onToggleSearch,
  onToggleInfo,
  onMobileBack,
  onVideoCall,
  onTaskFromLastMsg,
}: RoomHeaderProps) {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center gap-3 px-4 h-[56px] bg-[var(--tg-header-bg)] border-b border-[var(--tg-border)] flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Mobile back */}
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
              <span className="text-[var(--ep-green)] font-medium">● Online</span>
            ) : (
              <span className="text-[var(--tg-text-secondary)]">{t('offline1')}</span>
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
          title="Qidirish"
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

        {activeRoom.type === "direct" && (
          <button
            onClick={onTaskFromLastMsg}
            className="p-2 rounded-full text-[var(--tg-text-secondary)] hover:bg-[var(--tg-hover)] transition-colors"
            title="Vazifa qo'shish"
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
          title="Ma'lumot"
        >
          <MoreVertical className="w-[22px] h-[22px]" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PinnedBanner
// ---------------------------------------------------------------------------

/**
 * Slim banner shown below the header when the room has a pinned message.
 */
export function PinnedBanner({ pinnedMessage, onUnpin }: PinnedBannerProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--tg-header-bg)] border-b border-[var(--tg-border)] flex-shrink-0">
      <Pin className="w-3.5 h-3.5 text-[var(--tg-sidebar-active)] flex-shrink-0 rotate-45" />
      <div className="flex-1 min-w-0 border-l-2 border-[var(--tg-sidebar-active)] pl-2">
        <span className="text-[11px] text-[var(--tg-sidebar-active)] font-medium">
          Pinlangan xabar
        </span>
        <p className="text-[13px] text-[var(--tg-text-primary)] truncate">
          {pinnedMessage.content}
        </p>
      </div>
      <button
        onClick={onUnpin}
        className="text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)] p-1 rounded-full hover:bg-[var(--tg-hover)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UploadProgressBar
// ---------------------------------------------------------------------------

/** Thin progress bar displayed while a file is being uploaded. */
export function UploadProgressBar({ uploadProgress }: UploadProgressProps) {
  return (
    <div className="px-4 py-1.5 bg-[var(--tg-sidebar-active)]/5 border-b border-[var(--tg-sidebar-active)]/20 flex-shrink-0">
      <p className="text-xs text-[var(--tg-sidebar-active)]">{uploadProgress}</p>
    </div>
  );
}
