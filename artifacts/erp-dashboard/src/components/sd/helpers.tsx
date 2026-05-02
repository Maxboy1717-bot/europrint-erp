import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
    A: { label: "A — VIP", cls: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    B: { label: "B — Doimiy", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    C: { label: "C — Oddiy", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    D: { label: "D — Xavfli", cls: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  };
  const c = conf[cat || "C"] || conf.C;
  return <Badge className={c.cls}>{c.label}</Badge>;
};

export const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  if (status === "blacklist") return <Badge variant="destructive">Qora ro'yxat</Badge>;
  if (status === "inactive") return <Badge variant="secondary">Nofaol</Badge>;
  return <Badge variant="default">Aktiv</Badge>;
};

export const ComplaintStatusBadge = ({ status }: { status: string }) => {
  const conf: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    closed: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    new: "Yangi", in_progress: "Jarayonda", resolved: "Hal qilindi", closed: "Yopildi",
  };
  return <Badge className={conf[status] || conf.new}>{labels[status] || status}</Badge>;
};

export const PaymentRatingBadge = ({ rating }: { rating: string }) => {
  const conf: Record<string, string> = {
    A: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    B: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    D: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  const labels: Record<string, string> = {
    A: "A — Ideal", B: "B — Yaxshi", C: "C — O'rtacha", D: "D — Yomon",
  };
  return <Badge className={conf[rating] || conf.C}>{labels[rating] || rating}</Badge>;
};

export function KpiCard({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md bg-muted ${color}`}><Icon className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
