/**
 * @module ChatLayoutMessages
 * @description Center panel for the chat layout. Contains the room header bar,
 * pinned-message banner, upload progress indicator, the scrollable message
 * area, an embedded Jitsi video call panel, the edit/reply action bar, and the
 * message input. Also renders the empty-state screen when no room is selected.
 */

import { cn } from "@/lib/utils";
import { MessageArea } from "./MessageArea";
import { MentionInput } from "./MentionInput";
import { ChatAvatar } from "./ChatAvatar";
import { Pin, X, Search, ArrowLeft, MoreVertical, Video, CheckSquare, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
import { ChatLayoutMessagesProps, VIDEO_HEIGHT_EXPANDED } from "./ChatLayoutTypes";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
// ---------------------------------------------------------------------------
// Sub-components (file-private)
// ---------------------------------------------------------------------------

/** Telegram-style room header bar with avatar, name, status and action buttons. */
function RoomHeader({
  activeRoom,
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
  activeRoomType,
}: Pick<
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
> & { activeRoomType: string }) {
  return (
    <div className="flex items-center gap-3 px-4 h-[56px] bg-[var(--tg-header-bg)] border-b border-[var(--tg-border)] flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Mobile back button */}
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
          title="Qidirish"
        >
          <Search className="w-[22px] h-[22px]" />
        </button>

        {/* Video call button */}
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

        {/* Task button — only on direct chats */}
        {activeRoomType === "direct" && (
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

/** Pinned message banner shown directly below the header. */
function PinnedBanner({
  pinnedMessage,
  onUnpin,
}: {
  pinnedMessage: NonNullable<ChatLayoutMessagesProps["pinnedMessage"]>;
  onUnpin: () => void;
}) {
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

/** Embedded Jitsi video call panel. */
function VideoCallPanel({
  videoCallUrl,
  videoHeight,
  videoMinimized,
  roomDisplayName,
  onClose,
  onToggleMinimize,
  onToggleHeight,
}: {
  videoCallUrl: string;
  videoHeight: number;
  videoMinimized: boolean;
  roomDisplayName: string;
  onClose: () => void;
  onToggleMinimize: () => void;
  onToggleHeight: () => void;
}) {
  return (
    <div
      className="flex-shrink-0 border-t border-[var(--tg-border)] bg-[#0d1117] flex flex-col transition-all duration-200"
      style={{ height: videoMinimized ? 44 : videoHeight }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 h-[44px] bg-[#161b22] flex-shrink-0 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-[13px] text-white/80 font-medium truncate">
            🎥 {roomDisplayName}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Height resize — only when expanded */}
          {!videoMinimized && (
            <button
              onClick={onToggleHeight}
              className="p-1.5 rounded text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors"
              title={videoHeight >= VIDEO_HEIGHT_EXPANDED ? "Kichraytirish" : "Kattalashtirish"}
            >
              {videoHeight >= VIDEO_HEIGHT_EXPANDED ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          {/* Collapse / expand */}
          <button
            onClick={onToggleMinimize}
            className="p-1.5 rounded text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors"
            title={videoMinimized ? "Ochish" : "Yig'ish"}
          >
            {videoMinimized ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded text-white/50 hover:text-red-400 hover:bg-[var(--ep-red)]/90/10 transition-colors"
            title="Qo'ng'iroqni tugatish"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!videoMinimized && (
        <iframe
          src={videoCallUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          allowFullScreen
          className="flex-1 w-full border-0 min-h-0"
          title="Video qo'ng'iroq"
        />
      )}
    </div>
  );
}

/** Edit-mode action bar shown above the input when editing a message. */
function EditIndicator({
  content,
  onCancel,
}: {
  content: string;
  onCancel: () => void;
}) {
  return (
    <div className="mx-3 mb-1 px-3 py-2 bg-[var(--tg-action-bar-bg)] border-l-2 border-[var(--tg-sidebar-active)] rounded-lg flex items-center justify-between shadow-sm">
      <div className="min-w-0">
        <p className="text-xs text-[var(--tg-sidebar-active)] font-medium">Tahrirlash</p>
        <p className="text-[13px] text-[var(--tg-text-primary)] truncate">{content}</p>
      </div>
      <button
        onClick={onCancel}
        className="ml-2 text-[var(--tg-text-secondary)] hover:text-[var(--tg-text-primary)] p-1 rounded-full hover:bg-[var(--tg-hover)] transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Empty state shown when no room is selected. */
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-[var(--tg-chat-bg)]">
      <div className="w-full sm:w-[120px] h-[120px] rounded-full bg-[var(--tg-sidebar-active)]/10 flex items-center justify-center">
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--tg-sidebar-active)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[17px] font-medium text-[var(--tg-text-primary)]/70">
          Chatni tanlang
        </p>
        <p className="text-[14px] text-[var(--tg-text-secondary)] mt-1">
          Suhbatni boshlash uchun chap paneldan tanlang
        </p>
      </div>
      <a
        href="/"
        className="mt-2 text-[13px] text-[var(--tg-sidebar-active)] hover:underline"
      >
        ← ERP ga qaytish
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Full center panel: header, banners, message list, video call embed,
 * edit indicator and message input. Renders EmptyState when no room is active.
 */
export function ChatLayoutMessages({ activeRoom, activeRoomId, memberCount, canPin, isChannelReadOnly, activeMembers, onlineUserIds, typingText, pinnedMessage, uploadProgress, editingMsg, replyToMsg, onCancelEdit, onCancelReply, videoCallUrl, videoLoading, videoHeight, videoMinimized, onVideoCall, onVideoClose, onVideoToggleMinimize, onVideoToggleHeight, showSearch, infoOpen, onToggleSearch, onToggleInfo, onMobileBack, onTaskFromLastMsg, onSend, onEdit, onDelete, onReply, onReact, onThread, onForward, onPin, onUploadFile, onVoiceMessage, onCreatePoll, onTypingStart, onTypingStop, onUnpinMessage, mobileShowChat, }: ChatLayoutMessagesProps & { mobileShowChat: boolean }) {
  const { t } = useTranslation('common');
  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-w-0",
        !mobileShowChat && "hidden sm:flex"
      )}
    >
      {activeRoom ? (
        <>
          <RoomHeader
            activeRoom={activeRoom}
            memberCount={memberCount}
            onlineUserIds={onlineUserIds}
            typingText={typingText}
            showSearch={showSearch}
            infoOpen={infoOpen}
            videoCallUrl={videoCallUrl}
            videoLoading={videoLoading}
            onToggleSearch={onToggleSearch}
            onToggleInfo={onToggleInfo}
            onMobileBack={onMobileBack}
            onVideoCall={onVideoCall}
            onTaskFromLastMsg={onTaskFromLastMsg}
            activeRoomType={activeRoom.type}
          />

          {/* Pinned message banner */}
          {pinnedMessage && (
            <PinnedBanner pinnedMessage={pinnedMessage} onUnpin={onUnpinMessage} />
          )}

          {/* Upload progress */}
          {uploadProgress && (
            <div className="px-4 py-1.5 bg-[var(--tg-sidebar-active)]/5 border-b border-[var(--tg-sidebar-active)]/20 flex-shrink-0">
              <p className="text-xs text-[var(--tg-sidebar-active)]">{uploadProgress}</p>
            </div>
          )}

          {/* Message list */}
          <MessageArea
            roomId={activeRoomId}
            canPin={canPin}
            onEdit={onEdit}
            onDelete={onDelete}
            onReply={onReply}
            onReact={onReact}
            onThread={onThread}
            onForward={onForward}
            onPin={onPin}
          />

          {/* Embedded video call */}
          {videoCallUrl && (
            <VideoCallPanel
              videoCallUrl={videoCallUrl}
              videoHeight={videoHeight}
              videoMinimized={videoMinimized}
              roomDisplayName={activeRoom.displayName || activeRoom.name || ""}
              onClose={onVideoClose}
              onToggleMinimize={onVideoToggleMinimize}
              onToggleHeight={onVideoToggleHeight}
            />
          )}

          {/* Edit indicator */}
          {editingMsg && (
            <EditIndicator content={editingMsg.content} onCancel={onCancelEdit} />
          )}

          {/* Message input */}
          <MentionInput
            roomId={activeRoomId}
            replyTo={replyToMsg}
            onCancelReply={onCancelReply}
            onSend={onSend}
            onTypingStart={onTypingStart}
            onTypingStop={onTypingStop}
            onUploadFile={onUploadFile}
            onVoiceMessage={onVoiceMessage}
            onCreatePoll={onCreatePoll}
            members={activeMembers}
            isChannelReadOnly={isChannelReadOnly}
          />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
