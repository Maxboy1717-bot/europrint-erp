export function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" });
}

export function formatRoomTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000) return d.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604_800_000) return d.toLocaleDateString("uz", { weekday: "short" });
  return d.toLocaleDateString("uz", { day: "2-digit", month: "2-digit" });
}

export function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff === 0) return "Bugun";
  if (diff === 86_400_000) return "Kecha";
  return d.toLocaleDateString("uz", { day: "2-digit", month: "long", year: "numeric" });
}

export function getRoomIcon(type: string): string {
  switch (type) {
    case "direct": return "";
    case "group": return "👥";
    case "channel": return "📢";
    case "department": return "🏢";
    default: return "";
  }
}
