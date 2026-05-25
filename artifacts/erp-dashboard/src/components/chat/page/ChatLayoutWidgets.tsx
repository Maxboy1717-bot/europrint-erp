/**
 * @module ChatLayoutWidgets
 * @description Self-contained UI widgets used inside the chat center panel:
 * the embedded Jitsi video-call iframe, the edit-mode action bar shown above
 * the input, and the empty-state screen rendered when no room is selected.
 * All components are purely presentational (no local state or data fetching).
 */

import { X, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
import { VIDEO_HEIGHT_EXPANDED } from "./ChatLayoutTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// VideoCallPanel
// ---------------------------------------------------------------------------

export interface VideoCallPanelProps {
  videoCallUrl: string;
  videoHeight: number;
  videoMinimized: boolean;
  roomDisplayName: string;
  onClose: () => void;
  onToggleMinimize: () => void;
  onToggleHeight: () => void;
}

/** Embedded Jitsi video call panel rendered below the message list. */
export function VideoCallPanel({
  videoCallUrl,
  videoHeight,
  videoMinimized,
  roomDisplayName,
  onClose,
  onToggleMinimize,
  onToggleHeight,
}: VideoCallPanelProps) {
  const { t } = useTranslation("common");
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
            {"🎥"} {roomDisplayName}
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
            title={t("qongiroqniTugatish")}
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
          title={t("videoQongiroq")}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditIndicator
// ---------------------------------------------------------------------------

export interface EditIndicatorProps {
  content: string;
  onCancel: () => void;
}

/** Action bar shown above the message input while editing an existing message. */
export function EditIndicator({ content, onCancel }: EditIndicatorProps) {
  const { t } = useTranslation("common");
  return (
    <div className="mx-3 mb-1 px-3 py-2 bg-[var(--tg-action-bar-bg)] border-l-2 border-[var(--tg-sidebar-active)] rounded-lg flex items-center justify-between shadow-sm">
      <div className="min-w-0">
        <p className="text-xs text-[var(--tg-sidebar-active)] font-medium">{t("edit")}</p>
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

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

/** Full-panel placeholder rendered in the center column when no room is active. */
export function EmptyState() {
  const { t } = useTranslation("common");
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
          {t("chatniTanlang")}
        </p>
        <p className="text-[14px] text-[var(--tg-text-secondary)] mt-1">
          {t("suhbatniBoshlashUchunChapPaneldan")}
        </p>
      </div>
      <a
        href="/"
        className="mt-2 text-[13px] text-[var(--tg-sidebar-active)] hover:underline"
      >
        {"←"} ERP ga qaytish
      </a>
    </div>
  );
}
