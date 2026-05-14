/**
 * @module ChatUtils
 * @description React UI component.
 */

const TZ = "Asia/Tashkent";

/**
 * The DB uses TIMESTAMP WITHOUT TIMEZONE and the PostgreSQL session runs in
 * Asia/Tashkent. This means `NOW()` stores Tashkent local time, but when the
 * pg / Drizzle layer serialises the value to JSON it may append "Z" — making
 * the time look like UTC even though it is actually Tashkent local time.
 *
 * Correct approach: strip any timezone designator that was incorrectly added
 * and re-interpret the bare date-time string as Tashkent (UTC+5) by appending
 * "+05:00". This way `toLocaleTimeString({ timeZone: "Asia/Tashkent" })` shows
 * the value the DB actually stored — no double-conversion.
 */
function parseTZ(iso: string): Date {
  if (!iso) return new Date(NaN);
  // Remove any timezone suffix (Z, +05:00, -06:00, etc.)
  const bare = iso.replace(/Z$|[+-]\d{2}:\d{2}$/, "");
  // Re-attach as Tashkent so the Date object holds the correct UTC instant
  return new Date(bare + "+05:00");
}

/** "YYYY-MM-DD" string in Tashkent timezone — used for day comparisons. */
function toTZDate(d: Date): string {
  // Swedish locale reliably returns YYYY-MM-DD
  return d.toLocaleDateString("sv", { timeZone: TZ });
}

export function formatMsgTime(iso: string): string {
  return parseTZ(iso).toLocaleTimeString("uz", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  });
}

export function formatRoomTime(iso: string): string {
  const d = parseTZ(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86_400_000)
    return d.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  if (diff < 604_800_000)
    return d.toLocaleDateString("uz", { weekday: "short", timeZone: TZ });
  return d.toLocaleDateString("uz", { day: "2-digit", month: "2-digit", timeZone: TZ });
}

export function formatDateSeparator(iso: string): string {
  const d = parseTZ(iso);
  const now = new Date();

  // Compare calendar dates in Tashkent timezone
  const dDay  = new Date(toTZDate(d));
  const today = new Date(toTZDate(now));
  const diff  = today.getTime() - dDay.getTime();

  if (diff === 0) return "Bugun";
  if (diff === 86_400_000) return "Kecha";
  return d.toLocaleDateString("uz", {
    day: "2-digit", month: "long", year: "numeric", timeZone: TZ,
  });
}

export function getRoomIcon(type: string): string {
  switch (type) {
    case "direct":     return "";
    case "group":      return "👥";
    case "channel":    return "📢";
    case "department": return "🏢";
    default:           return "";
  }
}
