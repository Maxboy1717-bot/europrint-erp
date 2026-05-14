/**
 * @module ChatLayoutSidebar
 * @description Left sidebar panel for the chat layout. Renders the room list
 * or the search panel depending on the current UI state. Handles responsive
 * visibility so the sidebar is hidden on mobile when a chat is active.
 */

import { cn } from "@/lib/utils";
import { RoomList } from "./RoomList";
import { ChatSearchPanel } from "./ChatSearchPanel";
import { ChatLayoutSidebarProps } from "./ChatLayoutTypes";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders the 360 px (desktop) / full-width (mobile) left sidebar that either
 * shows the room list or the search panel.
 */
export function ChatLayoutSidebar({
  showSearch,
  mobileShowChat,
  onRoomSelect,
  onOpenSearch,
  onCloseSearch,
}: ChatLayoutSidebarProps) {
  return (
    <aside
      className={cn(
        "flex-shrink-0 flex flex-col bg-[var(--tg-sidebar-bg)] border-r border-[var(--tg-border)]",
        "w-full sm:w-[360px]",
        mobileShowChat && "hidden sm:flex"
      )}
    >
      {showSearch ? (
        <ChatSearchPanel onClose={onCloseSearch} />
      ) : (
        <RoomList onRoomSelect={onRoomSelect} onOpenSearch={onOpenSearch} />
      )}
    </aside>
  );
}
