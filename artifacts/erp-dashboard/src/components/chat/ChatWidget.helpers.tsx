/**
 * @module ChatWidget.helpers
 * @description Avatar primitive and date/time formatters used by ChatWidget.
 * Split out so the widget composition stays under 300 lines.
 */

import { cn } from "@/lib/utils";

export interface Employee {
  id: number;
  fullName: string;
  employeeId: string;
  avatarUrl?: string;
  departmentName?: string;
}

export function Avatar({
  name,
  url,
  size = 32,
}: {
  name: string;
  url?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0",
        color
      )}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString("uz", { weekday: "short" });
  return d.toLocaleDateString("uz", { day: "2-digit", month: "2-digit" });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff === 0) return "Bugun";
  if (diff === 86400000) return "Kecha";
  return d.toLocaleDateString("uz", { day: "2-digit", month: "long", year: "numeric" });
}
