/**
 * @module KanbanCard
 * @description React page component. Route-level UI.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MessageSquare, Paperclip, CheckSquare, Clock, User } from "lucide-react";
import {
  type CardWithOwner,
  getDeadlineCategory, formatDeadlineUzbek,
} from "./kanban-types";
import { getProp } from "./kanban-utils";
import { useTranslation } from '@/lib/i18n';

// ── Priority config ────────────────────────────────────────────────────────
const PRIORITY: Record<string, { accent: string; label: string; labelColor: string; labelBg: string }> = {
  urgent: { accent: "#EF4444", label: "Kritik",    labelColor: "#B91C1C", labelBg: "rgba(239,68,68,0.10)"   },
  high:   { accent: "#F59E0B", label: "Yuqori",    labelColor: "#92400E", labelBg: "rgba(245,158,11,0.10)"  },
  normal: { accent: "#3B82F6", label: "O'rtacha",  labelColor: "#1D4ED8", labelBg: "rgba(59,130,246,0.10)"  },
  low:    { accent: "#22C55E", label: "Past",       labelColor: "#15803D", labelBg: "rgba(34,197,94,0.10)"   },
};

// ── Deadline helpers ───────────────────────────────────────────────────────
function deadlineStyle(dueDate: string): { color: string; bg: string } {
  const cat = getDeadlineCategory(dueDate);
  if (cat === "overdue")  return { color: "#DC2626", bg: "rgba(239,68,68,0.08)"  };
  if (cat === "today")    return { color: "#D97706", bg: "rgba(245,158,11,0.10)" };
  if (cat === "thisWeek") return { color: "#2563EB", bg: "rgba(59,130,246,0.08)" };
  return                         { color: "#6B7280", bg: "rgba(107,114,128,0.08)"};
}
function deadlineText(dueDate: string): string {
  const cat = getDeadlineCategory(dueDate);
  const d = new Date(dueDate);
  const hm = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  if (cat === "overdue") return "Kechikkan!";
  if (cat === "today")   return `Bugun ${hm}`;
  return formatDeadlineUzbek(dueDate);
}

// ── Avatar helpers ─────────────────────────────────────────────────────────
const GRADIENTS = [
  "linear-gradient(135deg,#6366F1,#8B5CF6)",
  "linear-gradient(135deg,#3B82F6,#06B6D4)",
  "linear-gradient(135deg,#10B981,#059669)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#EC4899,#A855F7)",
  "linear-gradient(135deg,#14B8A6,#3B82F6)",
];
function initials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}
function avatarGrad(name: string): string {
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
}

// ── Column opacity ─────────────────────────────────────────────────────────
function columnOpacity(colName?: string): number {
  if (!colName) return 1;
  const l = colName.toLowerCase();
  if (l.includes("bajarildi") || l.includes("done") || l.includes("tugatil") || l.includes("completed")) return 0.65;
  if (l.includes("bekor") || l.includes("cancel")) return 0.40;
  return 1;
}

// ── Tag colours ────────────────────────────────────────────────────────────
const TAG_PALETTE = [
  { color: "#7C3AED", bg: "rgba(124,58,237,0.09)" },
  { color: "#DB2777", bg: "rgba(219,39,119,0.09)" },
  { color: "#0891B2", bg: "rgba(8,145,178,0.09)"  },
  { color: "#059669", bg: "rgba(5,150,105,0.09)"  },
  { color: "#D97706", bg: "rgba(217,119,6,0.09)"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sortable Task Card  (Bitrix24 uslubi)
// ─────────────────────────────────────────────────────────────────────────────
export function SortableTaskCard({
  card,
  onClick,
  columnName,
}: {
  card:        CardWithOwner;
  onClick:     () => void;
  columnName?: string;
}) {
  const { t } = useTranslation("common");
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: String(card.id ?? "") });

  const p       = PRIORITY[(card.priority ?? "normal")] ?? PRIORITY.normal;
  const opacity = isDragging ? 0.90 : columnOpacity(columnName);

  const dueDate = card.dueDate ?? getProp<string>(card, 'due_date');
  const ds      = dueDate ? deadlineStyle(dueDate) : null;
  const isOverdue = dueDate ? getDeadlineCategory(dueDate) === "overdue" : false;

  const tags               = Array.isArray(card.tags) ? card.tags.slice(0, 3) : [];
  const subtasksCount      = card.subtasksCount    ?? 0;
  const subtasksCompleted  = card.subtasksCompleted ?? 0;
  const hasChecklist       = subtasksCount > 0;
  const checkPct           = hasChecklist ? Math.round((subtasksCompleted / subtasksCount) * 100) : 0;
  const commentsCount      = card.commentsCount ?? 0;
  const filesCount         = card.filesCount    ?? 0;
  const hasActiveTimer     = !!(card as CardWithOwner).activeTimeTrack;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform:  CSS.Transform.toString(transform),
        transition,
        opacity,
        zIndex: isDragging ? 999 : undefined,
      }}
      className="mb-2 select-none"
      {...attributes}
      {...listeners}
    >
      <div
        data-testid={`card-${card.id}`}
        onClick={onClick}
        style={{
          background:    "var(--ep-surface)",
          borderRadius:  10,
          border:        isOverdue
            ? "1px solid rgba(239,68,68,0.40)"
            : "1px solid rgba(226,232,240,0.80)",
          boxShadow:     isDragging
            ? "0 8px 24px rgba(0,0,0,0.14)"
            : "0 1px 3px rgba(0,0,0,0.06)",
          cursor:        "pointer",
          display:       "flex",
          position:      "relative",
          overflow:      "hidden",
          transition:    "box-shadow 0.15s, border-color 0.15s",
        }}
        onMouseEnter={e => {
          if (!isDragging) {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow     = "0 4px 12px rgba(0,0,0,0.10)";
            el.style.borderColor   = isOverdue ? "rgba(239,68,68,0.55)" : "rgba(148,163,184,0.60)";
          }
        }}
        onMouseLeave={e => {
          if (!isDragging) {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow     = "0 1px 3px rgba(0,0,0,0.06)";
            el.style.borderColor   = isOverdue ? "rgba(239,68,68,0.40)" : "rgba(226,232,240,0.80)";
          }
        }}
      >
        {/* ── Left accent strip ──────────────────────────────────────────── */}
        <div style={{
          width:           4,
          flexShrink:      0,
          background:      p.accent,
          borderRadius:    "10px 0 0 10px",
          alignSelf:       "stretch",
        }} />

        {/* ── Card body ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: "10px 12px 9px", minWidth: 0 }}>

          {/* Row 1: priority label + ID */}
          <div className="flex items-center justify-between gap-1" style={{ marginBottom: 6 }}>
            <span style={{
              fontSize:      9.5, fontWeight: 700, letterSpacing: "0.04em",
              textTransform: "uppercase",
              color:         p.labelColor, background: p.labelBg,
              padding:       "2px 7px", borderRadius: 5, lineHeight: 1.4,
            }}>
              {p.label}
            </span>
            <div className="flex items-center gap-1.5">
              {hasActiveTimer && (
                <span title={t("vaqtKuzatilmoqda")} style={{ color: "var(--ep-green)", display: "flex", alignItems: "center" }}>
                  <Clock style={{ width: 10, height: 10 }} />
                </span>
              )}
              <span style={{ fontSize: 9.5, color: "var(--ep-muted)", fontFamily: "monospace", letterSpacing: "0.03em" }}>
                #{String(card.id ?? "").slice(-6)}
              </span>
            </div>
          </div>

          {/* Title */}
          <p
            className="font-semibold leading-snug line-clamp-2"
            style={{ fontSize: 13, color: "var(--ep-text)", marginBottom: 8 }}
          >
            {card.title}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1" style={{ marginBottom: 7 }}>
              {tags.map((tag, i) => {
                const tc  = TAG_PALETTE[i % TAG_PALETTE.length];
                const nm  = getProp<string>(tag, 'name') ?? "";
                return (
                  <span key={nm || i} style={{
                    fontSize: 9.5, fontWeight: 600,
                    color: tc.color, background: tc.bg,
                    padding: "2px 7px", borderRadius: 999,
                  }}>
                    {nm}
                  </span>
                );
              })}
            </div>
          )}

          {/* Checklist progress */}
          {hasChecklist && (
            <div style={{ marginBottom: 8 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "var(--ep-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                  <CheckSquare style={{ width: 10, height: 10 }} />
                  {subtasksCompleted}/{subtasksCount}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: checkPct === 100 ? "var(--ep-green)" : "var(--ep-muted)" }}>
                  {checkPct}%
                </span>
              </div>
              <div style={{ height: 3, background: "rgba(226,232,240,0.80)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height:     "100%",
                  width:      `${checkPct}%`,
                  background: checkPct === 100 ? "var(--ep-green)" : p.accent,
                  borderRadius: 3,
                  transition: "width 0.4s ease-out",
                }} />
              </div>
            </div>
          )}

          {/* Bottom row ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-1" style={{ marginTop: 4 }}>

            {/* Left: deadline + counts */}
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {dueDate && ds && (
                <span style={{
                  fontSize: 10.5, fontWeight: 600,
                  color: ds.color, background: ds.bg,
                  padding: "2px 7px", borderRadius: 5,
                  display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
                }}>
                  <Calendar style={{ width: 9, height: 9 }} />
                  {deadlineText(dueDate)}
                </span>
              )}

              {commentsCount > 0 && (
                <span style={{
                  fontSize: 10, color: "var(--ep-muted)",
                  display: "flex", alignItems: "center", gap: 2,
                }}>
                  <MessageSquare style={{ width: 10, height: 10 }} />
                  {commentsCount}
                </span>
              )}
              {filesCount > 0 && (
                <span style={{
                  fontSize: 10, color: "var(--ep-muted)",
                  display: "flex", alignItems: "center", gap: 2,
                }}>
                  <Paperclip style={{ width: 10, height: 10 }} />
                  {filesCount}
                </span>
              )}
            </div>

            {/* Right: assignee avatar + name */}
            {card.owner ? (
              <div className="flex items-center gap-1.5 shrink-0" style={{ minWidth: 0 }}>
                <div
                  className="flex items-center justify-center rounded-full text-white font-bold shrink-0"
                  title={card.owner.fullName}
                  style={{
                    width: 22, height: 22, fontSize: 8.5,
                    background: avatarGrad(card.owner.fullName),
                    border: "1.5px solid rgba(255,255,255,0.80)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                  }}
                >
                  {initials(card.owner.fullName)}
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 500,
                  color: "var(--ep-muted)",
                  maxWidth: 72,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {card.owner.fullName.split(" ")[0]}
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1 shrink-0"
                style={{ color: "var(--ep-muted)", fontSize: 10 }}
                title={t("tayinlanmagan")}
              >
                <User style={{ width: 12, height: 12 }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drag overlay
// ─────────────────────────────────────────────────────────────────────────────
export function CardOverlay({ card }: { card: CardWithOwner }) {
  const { t } = useTranslation("common");
  const p = PRIORITY[(card.priority ?? "normal")] ?? PRIORITY.normal;
  return (
    <div style={{
      background:   "var(--ep-surface)",
      borderRadius: 10,
      border:       "1px solid rgba(148,163,184,0.60)",
      boxShadow:    "0 12px 32px rgba(0,0,0,0.18)",
      display:      "flex",
      overflow:     "hidden",
      width:        272,
      transform:    "rotate(1.5deg) scale(1.02)",
      opacity:      0.95,
    }}>
      <div style={{ width: 4, flexShrink: 0, background: p.accent }} />
      <div style={{ flex: 1, padding: "10px 12px 9px" }}>
        <div className="flex items-center justify-between gap-1" style={{ marginBottom: 6 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
            color: p.labelColor, background: p.labelBg, padding: "2px 7px", borderRadius: 5, lineHeight: 1.4,
          }}>
            {p.label}
          </span>
          <span style={{ fontSize: 9.5, color: "var(--ep-muted)", fontFamily: "monospace" }}>
            #{String(card.id ?? "").slice(-6)}
          </span>
        </div>
        <p className="font-semibold line-clamp-2" style={{ fontSize: 13, color: "var(--ep-text)", marginBottom: 6 }}>
          {card.title}
        </p>
        {card.owner && (
          <div className="flex items-center gap-1.5">
            <div style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              background: avatarGrad(card.owner.fullName),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 700, color: "white",
            }}>
              {initials(card.owner.fullName)}
            </div>
            <span style={{ fontSize: 10.5, color: "var(--ep-muted)" }}>
              {card.owner.fullName.split(" ")[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
