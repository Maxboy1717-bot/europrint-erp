/**
 * @module TaskDetailSheetHeader
 * @description Sticky header section rendered at the top of TaskDetailSheet.
 * Displays task ID, priority badge, status badges (accepted / completed /
 * tracking), an editable title input, the owner chip, and the created / due
 * date row.  All mutation side-effects stay in the orchestrator.
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Flag, Check, CheckCheck, X } from "lucide-react";
import { format } from "date-fns";
import { UZBEK_MONTHS } from "./kanban-types";
import {
  PRIORITY_DARK,
  initials,
  avatarGradient,
  type TaskDetailSheetHeaderProps,
} from "./TaskDetailSheetTypes";

/**
 * Renders the three-row header inside the Sheet:
 *  - Row 1: task-ID chip, priority badge, status badges, close button
 *  - Row 2: editable title + owner chip
 *  - Row 3: created-at / due-date meta line
 */
export function TaskDetailSheetHeader({
  card,
  onOpenChange,
  onUpdate,
  isCompleted,
  isAccepted,
  isTracking,
  ownerName,
}: TaskDetailSheetHeaderProps) {
  const priority = (card.priority ?? "normal") as keyof typeof PRIORITY_DARK;
  const pBadge   = PRIORITY_DARK[priority] ?? PRIORITY_DARK.normal;

  return (
    <div className="px-4 pt-3.5 pb-3 border-b bg-muted/30 flex-shrink-0">
      {/* Row 1: ID + priority + status badges + close ─────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Task ID */}
          <span
            className="text-[11px] font-mono text-muted-foreground bg-background border rounded-md px-2 py-0.5"
            data-testid="text-task-id"
          >
            #{String(card.id ?? "").slice(-6)}
          </span>

          {/* Priority badge */}
          <span
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: pBadge.color, background: pBadge.bg,
              border: `1px solid ${pBadge.border}`,
              padding: "2px 9px", borderRadius: 999,
              display: "inline-flex", alignItems: "center", gap: 3,
            }}
          >
            <Flag style={{ width: 9, height: 9 }} />
            {pBadge.label}
          </span>

          {/* Accepted badge */}
          {isAccepted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--ep-green)] bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              <Check style={{ width: 9, height: 9 }} />Qabul qilindi
            </span>
          )}

          {/* Completed badge */}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full px-2 py-0.5">
              <CheckCheck style={{ width: 9, height: 9 }} />Bajarildi
            </span>
          )}

          {/* Timer running indicator */}
          {isTracking && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--ep-green)] bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              <span
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#10B981", boxShadow: "0 0 6px #10B981",
                  display: "inline-block",
                }}
              />
              Vaqt ketmoqda
            </span>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          data-testid="button-close-detail"
          className="w-7 h-7 rounded-md flex items-center justify-center bg-background border hover:bg-muted shrink-0 transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Row 2: editable title + owner chip ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Input
          defaultValue={card.title}
          className="text-base font-semibold border-none px-0 focus-visible:ring-0 flex-1 min-w-0 bg-transparent"
          onBlur={e => e.target.value !== card.title && onUpdate({ title: e.target.value })}
          data-testid="input-task-title"
        />
        {ownerName && (
          <div className="flex items-center gap-1.5 shrink-0 bg-background border rounded-full pl-1 pr-2.5 py-0.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: avatarGradient(ownerName), fontSize: 8 }}
            >
              {initials(ownerName)}
            </div>
            <span className="text-[11px] text-muted-foreground">{ownerName}</span>
          </div>
        )}
      </div>

      {/* Row 3: meta dates ───────────────────────────────────────────────── */}
      {card.createdAt && (
        <p className="text-[10.5px] text-muted-foreground/70 mt-1.5">
          Yaratilgan:{" "}
          {(() => {
            const d = new Date(card.createdAt);
            return `${d.getDate()} ${UZBEK_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
          })()}
          {card.dueDate && (
            <span className="ml-3">
              Muddat: {format(new Date(card.dueDate), "dd.MM.yyyy")}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
