/**
 * @module EntityCardSections
 * @description Sub-section UI components used inside EntityCard.
 */

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DollarSign, Phone, Mail, Target, AlertTriangle,
  Flame, Star, Calendar, Building2, MoreHorizontal,
} from "lucide-react";
import { hexToRgba, scoreColor, SOURCE_LABELS, PRIORITY_CONFIG } from "./EntityCardTypes";
import type { QuickScore } from "./EntityCardTypes";
import { useTranslation } from '@/lib/i18n';

// ── TopBar ────────────────────────────────────────────────────────────────────

interface TopBarProps {
  stageColor: string;
  source: string | null;
  entityId: string | number;
  onAddTask?: (id: string | number) => void;
}

export function TopBar({ stageColor, source, entityId, onAddTask }: TopBarProps) {
  const { t } = useTranslation("common");
  const sourceInfo = source ? SOURCE_LABELS[source.toUpperCase()] : null;
  return (
    <>
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${stageColor}ee, ${stageColor}22)`,
          borderRadius: "16px 16px 0 0",
        }}
      />
      {sourceInfo ? (
        <span
          className="absolute top-3 right-2.5 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white leading-none"
          style={{ backgroundColor: sourceInfo.color }}
        >
          {sourceInfo.label}
        </span>
      ) : (
        <button
          className="absolute top-2.5 right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
          style={{ background: "rgba(163,177,198,0.14)", color: "#A0AEC0" }}
          onClick={(e) => { e.stopPropagation(); onAddTask?.(entityId); }}
          data-testid={`button-menu-${entityId}`}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      )}
    </>
  );
}

// ── PriorityRow ───────────────────────────────────────────────────────────────

export function PriorityRow({ priority }: { priority: string | null }) {
  if (!priority) return null;
  const cfg = PRIORITY_CONFIG[priority.toLowerCase()];
  if (!cfg) return null;
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span
        className="text-[10px] font-semibold px-2 py-[3px] rounded-[6px] leading-none"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ── AmountBadge ───────────────────────────────────────────────────────────────

interface AmountBadgeProps {
  amount: number;
  currency: string;
  stageColor: string;
  formatCurrency: (amount: number, currency: string) => string;
}

export function AmountBadge({ amount, currency, stageColor, formatCurrency }: AmountBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-1 mb-2.5 px-2.5 py-1 rounded-[10px]"
      style={{
        background: hexToRgba(stageColor, 0.12),
        boxShadow: `inset 1px 1px 4px ${hexToRgba(stageColor, 0.15)}, inset -1px -1px 3px rgba(255,255,255,0.60)`,
      }}
    >
      <DollarSign className="h-3.5 w-3.5 shrink-0" style={{ color: stageColor }} />
      <span className="text-[13px] font-bold tabular-nums" style={{ color: stageColor }}>
        {formatCurrency(amount, currency)}
      </span>
    </div>
  );
}

// ── ContactRow ────────────────────────────────────────────────────────────────

export function ContactRow({ phone, email }: { phone: string | null; email: string | null }) {
  if (!phone && !email) return null;
  return (
    <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
      {phone && (
        <span className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "rgba(163,177,198,0.12)" }}>
          <Phone className="h-2.5 w-2.5 shrink-0" style={{ color: "#A0AEC0" }} />
          <span className="text-[10px] truncate max-w-[90px]" style={{ color: "#718096" }}>{phone}</span>
        </span>
      )}
      {email && (
        <span className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "rgba(163,177,198,0.12)" }}>
          <Mail className="h-2.5 w-2.5 shrink-0" style={{ color: "#A0AEC0" }} />
          <span className="text-[10px] truncate max-w-[80px]" style={{ color: "#718096" }}>{email}</span>
        </span>
      )}
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────

export function ProgressBar({ progressPct, stageColor }: { progressPct: number; stageColor: string }) {
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-medium uppercase tracking-wide" style={{ color: "#A0AEC0" }}>
          {t("jarayon")}
        </span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: stageColor }}>
          {progressPct}%
        </span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: 5,
          background: "rgba(163,177,198,0.22)",
          boxShadow: "inset 1px 1px 3px rgba(163,177,198,0.28), inset -1px -1px 3px rgba(255,255,255,0.60)",
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: stageColor }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── AiScoreRow ────────────────────────────────────────────────────────────────

export function AiScoreRow({ quickScore, entityId }: { quickScore: QuickScore; entityId: string | number }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {quickScore.score >= 70 && <Flame className="h-3 w-3 text-[var(--ep-primary)]" />}
      {quickScore.score >= 40 && quickScore.score < 70 && <Star className="h-3 w-3 text-[var(--ep-yellow)]" />}
      <div
        className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
        style={{ backgroundColor: scoreColor(quickScore.score) }}
        data-testid={`badge-ai-score-${entityId}`}
      >
        <Target className="h-2.5 w-2.5" />
        {quickScore.score}
      </div>
      {quickScore.churnRisk === "high" && (
        <AlertTriangle className="h-3 w-3 text-[var(--ep-red)]" data-testid={`badge-churn-risk-${entityId}`} />
      )}
    </div>
  );
}

// ── AvatarFooter ──────────────────────────────────────────────────────────────

interface AvatarFooterProps {
  initials: string;
  personName: string;
  dateStr: string;
  avatarBg: string;
  stageColor: string;
}

export function AvatarFooter({ initials, personName, dateStr, avatarBg, stageColor }: AvatarFooterProps) {
  return (
    <div className="flex items-center gap-2">
      <Avatar
        className="h-[26px] w-[26px] shrink-0"
        style={{ boxShadow: "0 0 0 2px #fff, 2px 2px 6px rgba(163,177,198,0.35)" }}
      >
        <AvatarFallback
          className="text-[10px] font-semibold"
          style={{ backgroundColor: avatarBg, color: stageColor }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <p
        className="text-[11px] font-medium truncate flex-1"
        style={{ color: "#718096" }}
        title={personName}
      >
        {personName}
      </p>
      <div className="flex items-center gap-1 shrink-0">
        <Calendar className="h-2.5 w-2.5" style={{ color: "#A0AEC0" }} />
        <span className="text-[10px] tabular-nums" style={{ color: "#A0AEC0" }}>{dateStr}</span>
      </div>
    </div>
  );
}

// ── CompanyRow ────────────────────────────────────────────────────────────────

export function CompanyRow({ company }: { company: string | null }) {
  if (!company) return null;
  return (
    <div className="flex items-center gap-1 mb-2">
      <Building2 className="h-3 w-3 shrink-0" style={{ color: "#A0AEC0" }} />
      <span className="text-[11px] truncate" style={{ color: "#718096" }}>{company}</span>
    </div>
  );
}
