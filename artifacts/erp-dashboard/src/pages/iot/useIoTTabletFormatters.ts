/**
 * @module useIoTTabletFormatters
 * @description Pure utility functions for formatting time values displayed on
 * the IoT tablet UI. No React hooks — safe to call outside of hook context.
 */

/**
 * Format a duration in seconds as HH:MM:SS.
 * @example formatTime(3665) === "01:01:05"
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format a duration in seconds as a human-readable estimate ("~2s 5d" / "~5 daqiqa").
 * @param t  Bilingual selector from useIoTTabletCore
 */
export function formatEstimatedTime(
  seconds: number,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `~${hours}${t("ttHourAbbrev")} ${mins}${t("ttMinAbbrevShort")}`;
  return `~${mins} ${t("ttMinutes")}`;
}
