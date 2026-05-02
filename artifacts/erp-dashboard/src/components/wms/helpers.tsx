import { Badge } from "@/components/ui/badge";

export const fmtNum = (n: unknown) => parseFloat(String(n || 0)) || 0;

export const fmtQty = (n: unknown, unit = "") => {
  const v = fmtNum(n);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K ${unit}`.trim();
  return `${v.toLocaleString("uz-UZ", { maximumFractionDigits: 2 })} ${unit}`.trim();
};

export const fmtMoney = (n: unknown, currency = "UZS") => {
  const v = fmtNum(n);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ${currency}`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${currency}`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ${currency}`;
  return `${v.toLocaleString()} ${currency}`;
};

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export function StockStatusBadge({ status }: { status: string }) {
  if (status === "zero") return <Badge className="bg-gray-800 text-gray-100 dark:bg-gray-900 dark:text-gray-200">Tugagan</Badge>;
  if (status === "critical") return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Kritik</Badge>;
  if (status === "low") return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Kam</Badge>;
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Normal</Badge>;
}

export function AbcBadge({ segment }: { segment?: string | null }) {
  if (!segment) return null;
  const cls = segment === "A"
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    : segment === "B"
    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    : "bg-muted text-muted-foreground";
  return <Badge className={cls}>{segment}</Badge>;
}
