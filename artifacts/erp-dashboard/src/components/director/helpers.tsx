import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatMoney(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function DaysSince(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
}

export function StatusDot({ ok }: { ok: boolean }) {
  return <span className={cn("inline-block w-2 h-2 rounded-full mr-2", ok ? "bg-emerald-500" : "bg-red-500")} />;
}

export function TrendChip({ change, trend }: { change?: string; trend?: string }) {
  if (!change) return null;
  const up = trend === "up";
  const down = trend === "down";
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-md",
      up ? "bg-emerald-50 text-emerald-700" : down ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"
    )}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : down ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {change}
    </span>
  );
}

export function SectionTitle({ icon: Icon, title, sub, accent = "text-primary" }: { icon: React.ElementType; title: string; sub?: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10")}>
        <Icon className={cn("w-4.5 h-4.5", accent)} />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function MachineCell({ session }: { session: { id: number; equipmentId: string; status: string; targetQty: number; producedQty: number; defectQty: number; oee: number } }) {
  const isRunning = session.status === "running" || session.status === "active";
  const isMaintenance = session.status === "maintenance";
  const defectRate = session.targetQty > 0 ? ((session.defectQty / session.targetQty) * 100).toFixed(1) : "0";
  return (
    <div className={cn(
      "rounded-lg p-3 border text-center space-y-1",
      isRunning ? "border-emerald-200 bg-emerald-50" :
      isMaintenance ? "border-amber-200 bg-amber-50" :
      "border-red-200 bg-red-50"
    )} data-testid={`machine-cell-${session.equipmentId}`}>
      <div className="flex items-center justify-center gap-1">
        <span className={cn("w-2 h-2 rounded-full", isRunning ? "bg-emerald-500" : isMaintenance ? "bg-amber-500" : "bg-red-500")} />
        <span className="text-xs font-bold text-foreground">{session.equipmentId}</span>
      </div>
      <p className="text-xs text-muted-foreground">{isRunning ? "Ishlamoqda" : isMaintenance ? "Ta'mirda" : "To'xtagan"}</p>
      {session.oee && <p className="text-[10px] font-semibold text-muted-foreground">OEE {Number(session.oee).toFixed(0)}%</p>}
      <p className="text-[10px] text-muted-foreground">Brak {defectRate}%</p>
    </div>
  );
}

export function stateConfig(key: string) {
  const map: Record<string, { label: string; ru: string; color: string; border: string }> = {
    GROWTH:   { label: "O'SISH",  ru: "РОСТ",       color: "bg-emerald-500", border: "border-emerald-200" },
    NORMAL:   { label: "NORMAL",  ru: "НОРМА",      color: "bg-blue-500",    border: "border-blue-200"    },
    RISK:     { label: "XAVF",    ru: "РИСК",       color: "bg-amber-500",   border: "border-amber-200"   },
    CRITICAL: { label: "INQIROZ", ru: "КРИЗИС",     color: "bg-red-500",     border: "border-red-200"     },
    osish:    { label: "O'SISH",  ru: "РОСТ",       color: "bg-emerald-500", border: "border-emerald-200" },
    normal:   { label: "NORMAL",  ru: "НОРМА",      color: "bg-blue-500",    border: "border-blue-200"    },
    ehtiyot:  { label: "EHTIYOT", ru: "ОСТОРОЖНО",  color: "bg-yellow-500",  border: "border-yellow-200"  },
    xavf:     { label: "XAVF",    ru: "РИСК",       color: "bg-amber-500",   border: "border-amber-200"   },
    inqiroz:  { label: "INQIROZ", ru: "КРИЗИС",     color: "bg-red-500",     border: "border-red-200"     },
  };
  return map[key] ?? map.NORMAL;
}
