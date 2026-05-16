/** @module CoordinationPageHelpers @description Small presentational helper components for the CoordinationPage: status badges and priority indicator. No data-fetching logic. */

import { cn } from "@/lib/utils";
import type { DoklaStatus, RaspoStatus } from "./CoordinationPageTypes";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── DoklaStatusBadge ─────────────────────────────────────────────────────
export function DoklaStatusBadge({ status }: { status: DoklaStatus }) {
  const cfg: Record<DoklaStatus, { label: string; cls: string }> = {
    sent:     { label: "Yuborildi",   cls: "bg-blue-100 text-[var(--ep-blue)]"        },
    read:     { label: tLabel('common.CoordinationPageHelpers.tsx.oqildi', "O'qildi"),     cls: "bg-amber-100 text-[var(--ep-yellow)]"      },
    resolved: { label: "Hal qilindi", cls: "bg-emerald-100 text-[var(--ep-green)]"  },
  };
  const { label, cls } = cfg[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", cls)}>
      {label}
    </span>
  );
}

// ─── RaspoStatusBadge ─────────────────────────────────────────────────────
export function RaspoStatusBadge({ status }: { status: RaspoStatus }) {
  const cfg: Record<RaspoStatus, { label: string; cls: string }> = {
    assigned:    { label: "Topshirildi",   cls: "bg-blue-100 text-[var(--ep-blue)]"        },
    in_progress: { label: tLabel('common.CoordinationPageHelpers.tsx.bajarilmoqda', "Bajarilmoqda"),  cls: "bg-amber-100 text-[var(--ep-yellow)]"      },
    done:        { label: "Bajarildi",     cls: "bg-emerald-100 text-[var(--ep-green)]"  },
    overdue:     { label: tLabel('common.CoordinationPageHelpers.tsx.muddatiOtdi', "Muddati o'tdi"), cls: "bg-red-100 text-[var(--ep-red)]"          },
  };
  const { label, cls } = cfg[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", cls)}>
      {label}
    </span>
  );
}

// ─── PriorityDot ──────────────────────────────────────────────────────────
export function PriorityDot({ p }: { p: string }) {
  const map: Record<string, string> = {
    high:   "bg-red-500",
    medium: "bg-amber-400",
    low:    "bg-emerald-400",
  };
  return (
    <span className={cn("inline-block w-2 h-2 rounded-full mr-1", map[p] ?? "bg-muted")} />
  );
}
