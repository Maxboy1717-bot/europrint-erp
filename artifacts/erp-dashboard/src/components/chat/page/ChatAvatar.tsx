/**
 * @module ChatAvatar
 * @description React UI component.
 */

import { cn } from "@/lib/utils";

const COLORS = [
  "bg-blue-500", "bg-green-500", "bg-purple-500",
  "bg-orange-500", "bg-pink-500", "bg-indigo-500",
  "bg-teal-500", "bg-red-500", "bg-yellow-600",
];

function colorForName(name: string) {
  return COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % COLORS.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface Props {
  name: string;
  url?: string;
  emoji?: string;
  size?: number;
  online?: boolean;
  className?: string;
}

export function ChatAvatar({ name, url, emoji, size = 36, online, className }: Props) {
  const color = colorForName(name || "?");
  const px = `${size}px`;

  return (
    <div className={cn("relative flex-shrink-0", className)} style={{ width: px, height: px }}>
      {url ? (
        <img
          src={url}
          alt={name}
          className="rounded-full object-cover w-full h-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : emoji ? (
        <div
          className="rounded-full flex items-center justify-center bg-muted w-full h-full"
          style={{ fontSize: size * 0.5 }}
        >
          {emoji}
        </div>
      ) : (
        <div
          className={cn("rounded-full flex items-center justify-center text-white font-semibold w-full h-full", color)}
          style={{ fontSize: size * 0.36 }}
        >
          {initials(name || "?")}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            online ? "bg-green-500" : "bg-gray-400"
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
