/**
 * @module helpers
 * @description React UI component.
 */

export function formatShortCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1) + " mlrd";
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + " mln";
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + " ming";
  }
  return amount.toString();
}

export function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) return "—";
  return value.toFixed(1) + "%";
}

export function formatRatio(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) return "—";
  return value.toFixed(2);
}

export function formatDays(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) return "—";
  return value.toFixed(1) + " kun";
}
