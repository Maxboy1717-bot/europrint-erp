/**
 * @module format
 * @description Display formatters for dates, datetimes, currency, and
 *   plain numbers. Used everywhere the UI shows numeric or date data.
 *   All formatters are null-safe — they return "-" or "0" rather than
 *   crashing on missing values.
 * @layer Frontend utility (UI formatting only — never use for storage)
 *
 * WHY 'uz-UZ' LOCALE AND NOT DEVICE DEFAULT
 *   The ERP is for an Uzbek manufacturer — operators expect UZ formatting
 *   regardless of browser locale (Chrome's en-US default would produce
 *   confusing dates like 04/22/2026 instead of 22.04.2026, and decimal
 *   separators flipped).
 *
 *   If/when we expand to RU-locale formatting, branch on user's chosen
 *   language and select `'uz-UZ' | 'ru-RU'` here. We deliberately do NOT
 *   include that switch yet — only the date-format strings differ, and
 *   business stakeholders said "everyone reads 22.04.2026 the same way".
 *
 * WHY UZS CURRENCY ROUNDS TO 0 DECIMALS
 *   Som (UZS) has no sub-unit in everyday use; even though the BLR
 *   technically has tiyin, no one prices in fractional som. Setting
 *   `maximumFractionDigits: 0` avoids ugly "1,500,000.00 UZS" output.
 *   If we ever quote in USD/EUR (foreign customers), pass the currency
 *   arg and the formatter still applies the right minor unit rules via
 *   Intl.NumberFormat's built-in CLDR data.
 *
 * WHY `"0 " + currency` FALLBACK (not just "—" / "N/A")
 *   Currency cells in tables look ugly when mixed: some "—", some
 *   "1,500 UZS". Returning a real "0 UZS" value keeps column alignment
 *   and makes "no charge" visually identical to "explicit zero". For
 *   distinguishing "missing data" from "actually zero", check upstream
 *   and conditionally render — don't rely on the formatter.
 *
 * WHY NULL-SAFE WRAPPERS INSTEAD OF Intl directly
 *   `Intl.NumberFormat.format(null)` throws or returns "NaN". Hundreds
 *   of dashboard cells receive `null` from optional fields. Centralising
 *   the null-check here means components stay clean:
 *     <td>{formatCurrency(row.total)}</td>     (works always)
 *   vs.
 *     <td>{row.total != null ? Intl... : '—'}</td>  (repeats everywhere)
 */

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number | null | undefined, currency: string = "UZS"): string {
  if (amount === null || amount === undefined) return "0 " + currency;
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("uz-UZ").format(num);
}

// ────────────────────────────────────────────────────────────────
// Compact display helpers — P3-4 canonical location.
// Previously duplicated inside each module's helpers.tsx.
// Use these instead of re-defining fmtNum / fmtMoney / fmtDate.
// ────────────────────────────────────────────────────────────────

/** Parse any value to a safe number; returns 0 for null/undefined/NaN. */
export const fmtNum = (n: unknown): number => parseFloat(String(n || 0)) || 0;

/**
 * Compact UZS amount with K/M/B abbreviation.
 * @example fmtMoney(1_500_000) // "1.5M UZS"
 */
export const fmtMoney = (n: unknown, currency = "UZS"): string => {
  const v = fmtNum(n);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ${currency}`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M ${currency}`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K ${currency}`;
  return `${v.toLocaleString()} ${currency}`;
};

/**
 * Compact date — "dd.mm.yyyy" or "—" for null/undefined.
 * Identical to the fmtDate in most module helpers.tsx files.
 */
export const fmtDate = (d: string | Date | null | undefined): string =>
  d ? new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
