/**
 * @module MessageReactions
 * @description React UI component.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChatReaction } from "@/store/chatStore";
import { useAuth } from "@/hooks/useAuth";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const EMOJI_GRID = [
  "👍", "👎", "❤️", "😂", "😮", "😢", "🔥", "🎉",
  "👏", "🙏", "😍", "🤔", "😅", "🫡", "💯", "✅",
  "🚀", "💪", "👋", "🤝", "😎", "🥳", "🤩", "💡",
  "⭐", "🏆", "🎯", "💰", "📈", "✍️", "📌", "🔔",
];

interface Props {
  messageId: string;
  roomId: string;
  reactions?: ChatReaction[];
  onReact: (messageId: string, emoji: string) => void;
  compact?: boolean;
}

export function MessageReactions({ messageId, reactions = [], onReact, compact }: Props) {
  const { user } = useAuth();
  const userId = String(user?.id);

  const handleReact = useCallback((emoji: string) => {
    onReact(messageId, emoji);
  }, [messageId, onReact]);

  if (reactions.length === 0 && compact) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {(Array.isArray(reactions) ? reactions : []).map((r) => {
        const iReacted = r.userIds?.includes(userId);
        return (
          <button
            key={r.emoji}
            onClick={() => handleReact(r.emoji)}
            title={r.users?.join(", ")}
            className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-all",
              iReacted
                ? "bg-primary/10 border-primary/40 text-primary font-medium"
                : "bg-muted/50 border-border/40 text-foreground hover:bg-muted/80"
            )}
          >
            <span>{r.emoji}</span>
            <span className="text-[10px] font-medium">{r.count}</span>
          </button>
        );
      })}
    </div>
  );
}

interface EmojiPickerProps {
  messageId: string;
  onReact: (messageId: string, emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ messageId, onReact, onClose }: EmojiPickerProps) {
  const [showAll, setShowAll] = useState(false);

  const handleReact = (emoji: string) => {
    onReact(messageId, emoji);
    onClose();
  };

  return (
    <div className="absolute z-50 bg-popover border border-border rounded-xl shadow-lg p-2 bottom-full mb-1"
      style={{ minWidth: "220px" }}>
      <div className="flex flex-wrap gap-1">
        {(showAll ? EMOJI_GRID : QUICK_EMOJIS).map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="w-8 h-8 flex items-center justify-center text-base rounded-lg hover:bg-muted transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
      <button
        onClick={() => setShowAll(!showAll)}
        className="w-full mt-1 text-[10px] text-muted-foreground hover:text-foreground text-center py-0.5"
      >
        {showAll ? "Kamroq ko'rsatish" : "Ko'proq..."}
      </button>
    </div>
  );
}
