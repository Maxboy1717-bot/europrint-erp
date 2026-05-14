/**
 * @module helpers
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";

export const fmtMoney = (n: number | string | null | undefined) => {
  const v = parseFloat(String(n || "0")) || 0;
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B UZS`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M UZS`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K UZS`;
  return `${v.toLocaleString()} UZS`;
};

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export const fmtNum = (n: number | string | null | undefined) =>
  parseFloat(String(n || "0")) || 0;

export const CategoryBadge = ({ cat }: { cat: string | null | undefined }) => {
  const conf: Record<string, { label: string; cls: string }> = {
    A: { label: "A — VIP", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800" },
    B: { label: "B — Doimiy", cls: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 border-sky-200 dark:border-sky-800" },
    C: { label: "C — Oddiy", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200 dark:border-amber-800" },
    D: { label: "D — Xavfli", cls: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-200 dark:border-rose-800" },
  };
  const c = conf[cat || "C"] || conf.C;
  return <Badge variant="outline" className={`text-[10px] font-semibold ${c.cls}`}>{c.label}</Badge>;
};

export const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  if (status === "blacklist") return <Badge variant="destructive" className="text-[10px]">Qora ro'yxat</Badge>;
  if (status === "inactive") return <Badge variant="secondary" className="text-[10px]">Nofaol</Badge>;
  return <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800" variant="outline">Aktiv</Badge>;
};

export const ComplaintStatusBadge = ({ status }: { status: string }) => {
  const conf: Record<string, string> = {
    new: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
    in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    closed: "bg-muted text-muted-foreground",
    open: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
  };
  const labels: Record<string, string> = {
    new: "Yangi", in_progress: "Jarayonda", resolved: "Hal qilindi", closed: "Yopildi", open: "Ochiq",
  };
  return <Badge className={`text-[10px] ${conf[status] || conf.new}`}>{labels[status] || status}</Badge>;
};

export const PaymentRatingBadge = ({ rating }: { rating: string }) => {
  const conf: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    B: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
    C: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    D: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200",
  };
  const labels: Record<string, string> = {
    A: "A — Ideal", B: "B — Yaxshi", C: "C — O'rtacha", D: "D — Yomon",
  };
  return <Badge className={`text-[10px] ${conf[rating] || conf.C}`}>{labels[rating] || rating}</Badge>;
};

export function KpiCard({ icon: Icon, label, value, sub, color = "text-primary", gradient }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string; color?: string;
  gradient?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3.5 hover:shadow-sm transition-shadow">
      {gradient && (
        <div className={`absolute -right-3 -top-3 w-14 h-14 rounded-full ${gradient} opacity-10`} />
      )}
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-base font-bold leading-tight mt-0.5 truncate">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
