/**
 * @module ForwardModal
 * @description React UI component.
 */

import { useState, useCallback } from "react";
import { X, Search, CornerUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore, ChatMessage } from "@/store/chatStore";
import { ChatAvatar } from "./ChatAvatar";
import { getChatApiBase } from "@/lib/apiBase";
import { safeStorage } from '@/lib/safeStorage';

interface Props {
  message: ChatMessage;
  onClose: () => void;
}

export function ForwardModal({ message, onClose }: Props) {
  const rooms = useChatStore((s) => s.rooms);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const filtered = (Array.isArray(rooms) ? rooms : []).filter((r) =>
    r.id !== message.roomId &&
    (r.displayName || r.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleForward = useCallback(async () => {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const token = safeStorage.getItem("access_token");
      await fetch(`${getChatApiBase()}/messages/${message.id}/forward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetRoomId: selected }),
      });
      setDone(true);
      setTimeout(onClose, 800);
    } finally {
      setLoading(false);
    }
  }, [selected, loading, message.id, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <CornerUpRight className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Xabarni yuborish</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border/40">
          <p className="text-xs text-muted-foreground truncate">
            "{message.content?.slice(0, 80)}"
          </p>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-border/40">
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Xona qidiring..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Room list */}
        <div className="max-h-[240px] overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Xona topilmadi</p>
          ) : (
            (Array.isArray(filtered) ? filtered : []).map((room) => (
              <button
                key={room.id}
                onClick={() => setSelected(room.id === selected ? null : room.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left",
                  selected === room.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50"
                )}
              >
                <ChatAvatar name={room.displayName || room.name || "?"} url={room.avatarUrl} size={28} />
                <span className="text-sm font-medium truncate">
                  {room.displayName || room.name}
                </span>
                {selected === room.id && (
                  <span className="ml-auto text-primary text-xs">✓</span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-border/60">
          <button
            onClick={handleForward}
            disabled={!selected || loading || done}
            className={cn(
              "w-full py-2 rounded-xl text-sm font-medium transition-colors",
              done
                ? "bg-[var(--ep-green)] text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            )}
          >
            {done ? "✓ Yuborildi!" : loading ? "Yuborilmoqda..." : "Yuborish"}
          </button>
        </div>
      </div>
    </div>
  );
}
