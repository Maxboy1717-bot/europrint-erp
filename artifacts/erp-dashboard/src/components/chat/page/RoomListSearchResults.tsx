/**
 * @module RoomListSearchResults
 * @description Search results panel (rooms + messages) for RoomList.
 * Split from RoomList.tsx (Rule 16).
 */

import { Search, Hash } from "lucide-react";
import { ChatAvatar } from "./ChatAvatar";
import { EPLoader } from "@/components/ep";

export interface SearchResult {
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

interface RoomListSearchResultsProps {
  searching: boolean;
  searchResults: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  t: (key: string) => string;
}

export function RoomListSearchResults({ searching, searchResults, onResultClick, t }: RoomListSearchResultsProps) {
  if (searching) {
    return (
      <div className="flex items-center justify-center py-8 text-[var(--tg-text-secondary)] gap-2">
        <EPLoader className="w-5 h-5" />
        <span className="text-[14px]">{t("qidirilmoqda")}</span>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-[var(--tg-text-secondary)]">
        <Search className="w-12 h-12 opacity-20" />
        <p className="text-[14px]">{t("noResults")}</p>
      </div>
    );
  }

  const roomResults = (Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "room");
  const messageResults = (Array.isArray(searchResults) ? searchResults : []).filter(r => r.type === "message");

  return (
    <div>
      {roomResults.length > 0 && (
        <>
          <p className="text-[12px] font-semibold text-[var(--tg-sidebar-active)] uppercase tracking-wider px-4 pt-3 pb-1">
            {t("chatlar")}
          </p>
          {roomResults.map((result) => (
            <button
              key={result.id}
              onClick={() => onResultClick(result)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--tg-sidebar-hover)] text-left transition-colors"
            >
              <ChatAvatar name={result.displayName || result.name || "?"} size={42} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium truncate text-[var(--tg-text-primary)]">
                  {result.displayName || result.name}
                </p>
              </div>
            </button>
          ))}
        </>
      )}

      {messageResults.length > 0 && (
        <>
          <p className="text-[12px] font-semibold text-[var(--tg-sidebar-active)] uppercase tracking-wider px-4 pt-3 pb-1">
            {t("xabarlar")}
          </p>
          {messageResults.map((result, i) => (
            <button
              key={result.id || i}
              onClick={() => onResultClick(result)}
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
  );
}
