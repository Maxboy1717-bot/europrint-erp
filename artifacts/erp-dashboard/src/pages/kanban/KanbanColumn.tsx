import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, AlertTriangle, Lock, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableTaskCard } from "./KanbanCard";
import type { CardWithOwner } from "./kanban-types";
import type { KanbanColumn as KanbanColumnType } from "@shared/schema";

type TLang = {
  board: { addCard: string; newBoard: string; newColumn: string; newCard: string };
  actions: { save: string; cancel: string; delete: string; add: string; send: string; upload: string; start: string; stop: string };
  views: Record<string, string>;
  columns: Record<string, string>;
  priority: Record<string, string>;
  tabs: Record<string, string>;
  fields: Record<string, string>;
  table: Record<string, string>;
  time: Record<string, string>;
  roles: Record<string, string>;
  filters: Record<string, string>;
  empty: Record<string, string>;
  chat: Record<string, string>;
  create: Record<string, string>;
  notifications: Record<string, string>;
  robots: Record<string, string>;
  templates: Record<string, string>;
  flows: Record<string, string>;
  allocation: Record<string, string>;
};

const WIP_LIMITS: Record<string, number> = {
  "jarayonda":    10,
  "in_progress":  10,
  "in progress":  10,
  "bajarilmoqda": 10,
  "ishda":        10,
  "ko'rib chiqish": 5,
  "tekshirish":   5,
  "review":       5,
  "checking":     5,
  "ko'rib chiqilmoqda": 5,
};

const INBOX_COLUMN_KEYWORDS = ["kiruvchi", "inbox", "yangi", "kirim"];

function getWipLimit(columnName: string): number | null {
  const key = columnName.toLowerCase().trim();
  return WIP_LIMITS[key] ?? null;
}

function isInboxColumn(columnName: string): boolean {
  const lower = columnName.toLowerCase().trim();
  return INBOX_COLUMN_KEYWORDS.some((kw) => lower.includes(kw));
}

function isOverdue24h(createdAt: string | Date | null | undefined): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  return Date.now() - created.getTime() > 24 * 60 * 60 * 1000;
}

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: CardWithOwner[];
  onCardClick: (card: CardWithOwner) => void;
  onAddCard: () => void;
  t: TLang;
}

export function KanbanColumn({ column, cards, onCardClick, onAddCard, t }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const columnName = column.name || "";
  const wipLimit = getWipLimit(columnName);
  const isOverWip = wipLimit !== null && cards.length > wipLimit;
  const isAtWip   = wipLimit !== null && cards.length === wipLimit;

  const isInbox = isInboxColumn(columnName);
  const overdueCount = isInbox
    ? (Array.isArray(cards) ? cards : []).filter((c) => isOverdue24h(c.createdAt)).length
    : 0;

  const headerBg = column.color
    ? `${column.color}22`
    : "rgba(26,26,46,0.06)";

  const borderColor = overdueCount > 0
    ? "#ef4444"
    : isOverWip
    ? "#ef4444"
    : isAtWip
    ? "#f59e0b"
    : isOver
    ? "#ff5d2e"
    : "transparent";

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-xl shrink-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm"
      style={{
        width: 288,
        minHeight: 120,
        border: `2px solid ${borderColor}`,
        transition: "border-color 0.15s",
        boxShadow: isOver ? "0 0 0 2px #ff5d2e33" : undefined,
      }}
      data-testid={`kanban-column-${column.id}`}
    >
      {/* ── Column header ────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-xl"
        style={{ background: headerBg }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {column.color && (
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: column.color }}
            />
          )}
          <span className="font-semibold text-sm truncate">{column.name}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Card count badge */}
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4 min-w-4 text-center"
          >
            {cards.length}
          </Badge>

          {/* 24h overdue badge for inbox columns */}
          {isInbox && overdueCount > 0 && (
            <Badge
              className="text-[10px] px-1.5 py-0 h-4 flex items-center gap-0.5 bg-red-500 text-white"
              title={`${overdueCount} ta kartochka 24 soatdan ko'proq vaqt o'tdi`}
            >
              <Clock className="h-2.5 w-2.5" />
              {overdueCount}
            </Badge>
          )}

          {/* WIP limit badge */}
          {wipLimit !== null && (
            <Badge
              className={`text-[10px] px-1.5 py-0 h-4 flex items-center gap-0.5 ${
                isOverWip
                  ? "bg-red-500 text-white"
                  : isAtWip
                  ? "bg-amber-500 text-white"
                  : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {isOverWip ? (
                <AlertTriangle className="h-2.5 w-2.5" />
              ) : isAtWip ? (
                <Lock className="h-2.5 w-2.5" />
              ) : null}
              WIP {wipLimit}
            </Badge>
          )}

          {/* Add card button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:bg-[#ff5d2e]/10 hover:text-[#ff5d2e]"
            onClick={onAddCard}
            data-testid={`button-add-card-${column.id}`}
            disabled={isOverWip}
            title={isOverWip ? `WIP limit: ${wipLimit}` : t.board.addCard}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* ── WIP warning banner ───────────────────────────────────── */}
      {isOverWip && (
        <div className="mx-2 mt-1.5 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2.5 py-1 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
          <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
            WIP chegarasi ({wipLimit}) oshib ketdi!
          </span>
        </div>
      )}

      {/* ── 24h overdue inbox warning banner ─────────────────────── */}
      {isInbox && overdueCount > 0 && !isOverWip && (
        <div className="mx-2 mt-1.5 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-2.5 py-1 flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-red-500 shrink-0" />
          <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
            {overdueCount} ta karta 24 soatdan o'tdi!
          </span>
        </div>
      )}

      {/* ── Cards ────────────────────────────────────────────────── */}
      <SortableContext items={(Array.isArray(cards) ? cards : []).map((c) => c.id!)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2 flex-1 min-h-[60px]">
          {cards.length === 0 ? (
            <div
              className={`flex-1 flex items-center justify-center rounded-lg min-h-[60px] border-2 border-dashed transition-colors ${
                isOver
                  ? "border-[#ff5d2e] bg-[#ff5d2e]/5"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className="text-xs text-muted-foreground">
                {isOver ? "Bu yerga tashlang" : "Karta yo'q"}
              </span>
            </div>
          ) : (
            (Array.isArray(cards) ? cards : []).map((card) => {
              const cardIsOverdue24h = isInbox && isOverdue24h(card.createdAt);
              return (
                <div
                  key={card.id}
                  className={cardIsOverdue24h ? "rounded-lg ring-2 ring-red-500 ring-offset-1" : undefined}
                  title={cardIsOverdue24h ? "24 soatdan ko'proq vaqt o'tdi — 3-savat qoidasi buzildi!" : undefined}
                >
                  <SortableTaskCard
                    card={card}
                    onClick={() => onCardClick(card)}
                    t={t}
                  />
                </div>
              );
            })
          )}
        </div>
      </SortableContext>
    </div>
  );
}
