/**
 * @module KanbanColumn
 * @description React page component. Route-level UI.
 */

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, AlertTriangle, Clock, Trash2, Pencil } from "lucide-react";
import { SortableTaskCard } from "./KanbanCard";
import type { CardWithOwner } from "./kanban-types";
import type { KanbanColumn as KanbanColumnType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from '@/lib/i18n';

// ── WIP limits ─────────────────────────────────────────────────────────────
const WIP_LIMITS: Record<string, number> = {
  "jarayonda": 10, "in_progress": 10, "in progress": 10,
  "bajarilmoqda": 10, "ishda": 10,
  "ko'rib chiqish": 5, "tekshirish": 5, "review": 5,
  "checking": 5, "ko'rib chiqilmoqda": 5,
};
const INBOX_KEYWORDS = ["kiruvchi", "inbox", "yangi", "kirim"];

function getWipLimit(name: string): number | null {
  return WIP_LIMITS[name.toLowerCase().trim()] ?? null;
}
function isInbox(name: string): boolean {
  const l = name.toLowerCase().trim();
  return INBOX_KEYWORDS.some(k => l.includes(k));
}
function isOverdue24h(createdAt: string | Date | null | undefined): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() > 24 * 60 * 60 * 1000;
}

function hexToRgba(hex: string, alpha: number): string {
  try {
    if (!hex?.startsWith("#") || hex.length < 7) return `rgba(107,114,128,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return `rgba(107,114,128,${alpha})`; }
}

// ── Column accent colors (light) ───────────────────────────────────────────
function resolveAccent(column: KanbanColumnType): string {
  const base = column.color;
  const name = (column.name || "").toLowerCase();
  if (base) return base;
  if (name.includes("kiruvchi") || name.includes("inbox") || name.includes("yangi") || name.includes("new"))
    return "#94A3B8";
  if (name.includes("rejada") || name.includes("plan"))                                 return "#3B82F6";
  if (name.includes("jarayon") || name.includes("progress") || name.includes("bajaril") || name.includes("ishda"))
    return "#F59E0B";
  if (name.includes("tekshir") || name.includes("review") || name.includes("ko'rib"))   return "#8B5CF6";
  if (name.includes("tugat") || name.includes("done") || name.includes("completed"))    return "#10B981";
  if (name.includes("bekor") || name.includes("cancel"))                                return "#EF4444";
  return "#3B82F6";
}

// ── Props ──────────────────────────────────────────────────────────────────
interface KanbanColumnProps {
  column:         KanbanColumnType;
  cards:          CardWithOwner[];
  onCardClick:    (card: CardWithOwner) => void;
  onAddCard:      () => void;
  onDeleteColumn: (columnId: string) => void;
  /**
   * Translation bundle from parent. KanbanColumn itself only consumes
   * `useTranslation` directly; the prop is forwarded for future use by
   * descendants. Accept the KanbanT-shaped object plus the callable carrier
   * variant used by KanbanBoard ancestors.
   */
  t:              import("../KanbanBoardTypes").KanbanT & ((key: string) => string);
}

export function KanbanColumn({ column, cards, onCardClick, onAddCard, onDeleteColumn }: KanbanColumnProps) {
  const { t } = useTranslation("common");
  // String() conversion — column.id integer DB'dan kelganda dnd-kit matching to'g'ri ishlashi uchun
  const { setNodeRef, isOver } = useDroppable({ id: String(column.id) });

  const qc = useQueryClient();
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(column.name ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (renaming) inputRef.current?.focus(); }, [renaming]);

  const renameMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest("PATCH", `/api/kanban/boards/${column.boardId}/columns/${column.id}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      qc.invalidateQueries({ queryKey: ["/api/kanban/boards", String(column.boardId)] });
      setRenaming(false);
    },
    onError: () => setRenaming(false),
  });

  function commitRename() {
    const trimmed = renameVal.trim();
    if (trimmed && trimmed !== column.name) renameMutation.mutate(trimmed);
    else setRenaming(false);
  }

  const accent       = resolveAccent(column);
  const wipLimit     = getWipLimit(column.name || "");
  const isOverWip    = wipLimit !== null && cards.length > wipLimit;
  const isInboxCol   = isInbox(column.name || "");
  const overdueCount = isInboxCol
    ? (Array.isArray(cards) ? cards : []).filter(c => isOverdue24h(c.createdAt)).length
    : 0;

  // Neumorphic shadows
  const shadowIdle = "6px 6px 20px rgba(163,177,198,0.45), -4px -4px 12px rgba(255,255,255,0.80)";
  const shadowOver = `inset 4px 4px 12px rgba(163,177,198,0.30), inset -2px -2px 8px rgba(255,255,255,0.60), 0 0 0 2px ${hexToRgba(accent, 0.40)}`;

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: isOver ? "color-mix(in srgb, var(--ep-blue) 8%, var(--ep-surface))" : "var(--ep-surface)",
        borderRadius: 18,
        boxShadow: isOver ? shadowOver : shadowIdle,
        transition: "box-shadow 0.2s, background 0.2s",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "12px 14px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span style={{
            width: 10, height: 10, borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 0 3px ${hexToRgba(accent, 0.15)}`,
            flexShrink: 0,
          }} />
          {renaming ? (
            <input
              ref={inputRef}
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { if (e.key === "Enter") commitRename(); else if (e.key === "Escape") setRenaming(false); }}
              className="truncate font-semibold bg-transparent border-b border-primary outline-none"
              style={{ fontSize: 13, color: "var(--ep-text)", width: "100%", minWidth: 60 }}
              data-testid={`input-rename-column-${column.id}`}
            />
          ) : (
            <h3
              className="truncate font-semibold cursor-pointer hover:text-primary transition-colors"
              style={{ fontSize: 13, color: "var(--ep-text)", letterSpacing: "0.01em" }}
              onDoubleClick={() => { setRenameVal(column.name ?? ""); setRenaming(true); }}
              data-testid={`heading-column-name-${column.id}`}
            >
              {column.name}
            </h3>
          )}
          {isOverWip && <AlertTriangle style={{ width: 12, height: 12, color: "var(--ep-yellow)", flexShrink: 0 }} />}
          {isInboxCol && overdueCount > 0 && <Clock style={{ width: 11, height: 11, color: "var(--ep-red)", flexShrink: 0 }} />}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: accent, background: hexToRgba(accent, 0.12),
            padding: "3px 9px", borderRadius: 999,
            minWidth: 24, textAlign: "center",
            boxShadow: `inset 1px 1px 3px ${hexToRgba(accent, 0.15)}, inset -1px -1px 2px rgba(255,255,255,0.7)`,
          }}>
            {cards.length}{wipLimit !== null ? `/${wipLimit}` : ""}
          </span>

          <button
            onClick={() => { setRenameVal(column.name ?? ""); setRenaming(true); }}
            title="Ustun nomini o'zgartirish"
            data-testid={`button-rename-column-${column.id}`}
            style={{
              width: 26, height: 26, borderRadius: 8,
              background: "rgba(163,177,198,0.10)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(163,177,198,0.20)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(163,177,198,0.10)"; }}
          >
            <Pencil style={{ width: 11, height: 11, color: "var(--ep-muted)" }} />
          </button>

          <button
            onClick={onAddCard}
            disabled={isOverWip}
            data-testid={`button-add-card-${column.id}`}
            title={t("vazifaQoshish")}
            style={{
              width: 26, height: 26, borderRadius: 8,
              background: "rgba(163,177,198,0.10)",
              border: "none",
              cursor: isOverWip ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: isOverWip ? 0.45 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (!isOverWip) (e.currentTarget as HTMLElement).style.background = "rgba(163,177,198,0.20)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(163,177,198,0.10)"; }}
          >
            <Plus style={{ width: 13, height: 13, color: "var(--ep-muted)" }} />
          </button>

          <button
            onClick={() => {
              if (window.confirm(`"${column.name}" ustunini o'chirasizmi? Barcha kartalar ham o'chadi.`))
                onDeleteColumn(String(column.id));
            }}
            title={t("ustunniOchirish")}
            data-testid={`button-delete-column-${column.id}`}
            style={{
              width: 26, height: 26, borderRadius: 8,
              background: "rgba(163,177,198,0.06)",
              border: "none",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.14)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(163,177,198,0.06)"; }}
          >
            <Trash2 style={{ width: 11, height: 11, color: "var(--ep-muted)" }} />
          </button>
        </div>
      </div>

      {/* Ajratuvchi */}
      <div className="mx-3 mb-2" style={{ height: 1, background: "rgba(0,0,0,0.05)" }} />

      {/* WIP / overdue warning */}
      {(isOverWip || (isInboxCol && overdueCount > 0)) && (
        <div
          className="flex items-center gap-1.5 mx-3 px-2.5 py-1.5 mb-2"
          style={{
            background: "rgba(254,242,242,1)",
            borderRadius: 8,
          }}
        >
          {isOverWip
            ? <AlertTriangle style={{ width: 11, height: 11, color: "var(--ep-red)" }} />
            : <Clock         style={{ width: 11, height: 11, color: "var(--ep-red)" }} />}
          <span style={{ fontSize: 10.5, color: "var(--ep-red)", fontWeight: 500 }}>
            {isOverWip
              ? `WIP chegarasi (${wipLimit}) oshdi!`
              : `${overdueCount} ta karta 24 soatdan o'tdi!`}
          </span>
        </div>
      )}

      {/* Drop zone + cards */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col"
        style={{
          padding: "0 10px 12px",
          overflowY: "auto",
          minHeight: 80,
        }}
        data-testid={`kanban-column-${column.id}`}
      >
        <SortableContext
          items={(Array.isArray(cards) ? cards : []).map(c => String(c.id ?? ""))}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <button
              onClick={onAddCard}
              className="w-full flex flex-col items-center justify-center gap-2 transition-all"
              style={{
                minHeight: 88, borderRadius: 12,
                border: `2px dashed ${hexToRgba(accent, 0.30)}`,
                background: hexToRgba(accent, 0.04),
                cursor: "pointer",
              }}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-lg leading-none"
                style={{
                  background: hexToRgba(accent, 0.12), color: accent,
                  boxShadow: `2px 2px 6px ${hexToRgba(accent, 0.18)}, -1px -1px 4px rgba(255,255,255,0.7)`,
                }}
              >
                +
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: hexToRgba(accent, 0.65) }}>
                {isOver ? "📌 Bu yerga tashlang" : "Vazifa qo'shish"}
              </span>
            </button>
          ) : (
            (Array.isArray(cards) ? cards : []).map(card => {
              const overdue24 = isInboxCol && isOverdue24h(card.createdAt);
              return (
                <div
                  key={card.id}
                  style={overdue24 ? { outline: "2px solid rgba(239,68,68,0.35)", borderRadius: 14, outlineOffset: 1 } : undefined}
                  title={overdue24 ? "24 soatdan ko'proq vaqt o'tdi!" : undefined}
                >
                  <SortableTaskCard
                    card={card}
                    onClick={() => onCardClick(card)}
                    columnName={column.name}
                  />
                </div>
              );
            })
          )}
        </SortableContext>
      </div>
    </div>
  );
}
