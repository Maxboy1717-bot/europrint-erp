/**
 * HRCapitalTestsHelpers — ScoreBar component and pure display-helper
 * functions for HRCapitalTests.
 */
import { Badge } from "@/components/ui/badge";
import { Brain, FlaskConical, Target, ClipboardList } from "lucide-react";
import { IQ_LEVELS } from "./HRCapitalTestsTypes";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── ScoreBar ─────────────────────────────────────────────────────────────────

export function ScoreBar({ value, max = 100, color = "bg-primary" }: { value: number; max?: number; color?: string }) {
  const center   = 50;
  const pct      = Math.max(0, Math.min(100, ((value + max) / (max * 2)) * 100));
  const isNeg    = value < 0;
  const barLeft  = isNeg ? pct : center;
  const barWidth = Math.abs(pct - center);
  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      <div className={`absolute top-0 h-full ${color} transition-all`} style={{ left: `${barLeft}%`, width: `${barWidth}%` }} />
      <div className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: "50%" }} />
    </div>
  );
}

// ─── Pure label/icon helpers ──────────────────────────────────────────────────

export function getIQLevelInfo(score: number) {
  return IQ_LEVELS.find(l => score >= l.min && score <= l.max) ?? IQ_LEVELS[IQ_LEVELS.length - 1];
}

export function getTestTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    tool_test:   "TOOL TEST",
    iq:          "IQ Test",
    leadership:  "Liderlik",
    replication: "Takrorlash",
  };
  return labels[type] ?? type;
}

export function getTestTypeIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    tool_test:   <Brain className="w-4 h-4" />,
    iq:          <FlaskConical className="w-4 h-4" />,
    leadership:  <Target className="w-4 h-4" />,
    replication: <ClipboardList className="w-4 h-4" />,
  };
  return icons[type] ?? <Brain className="w-4 h-4" />;
}

export function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending:     { label: tLabel('hr.HRCapitalTestsHelpers.tsx.kutilmoqda', "Kutilmoqda"),      className: "bg-gray-100 text-gray-700" },
    in_progress: { label: tLabel('hr.HRCapitalTestsHelpers.tsx.jarayonda', "Jarayonda"),       className: "bg-blue-100 text-[var(--ep-blue)]" },
    completed:   { label: "Tugallandi",      className: "bg-green-100 text-[var(--ep-green)]" },
    expired:     { label: "Muddati o'tdi",   className: "bg-red-100 text-[var(--ep-red)]" },
  };
  const info = map[status] ?? { label: status, className: "" };
  return <Badge className={`${info.className} border-0 text-xs`}>{info.label}</Badge>;
}
