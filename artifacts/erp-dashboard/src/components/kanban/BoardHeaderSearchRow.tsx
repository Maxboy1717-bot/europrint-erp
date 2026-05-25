/**
 * @module BoardHeaderSearchRow
 * @description Second header row: board selector, new board, delete, search, tag/clear filters.
 * Split from BoardHeader.tsx (Rule 16).
 */

import { Search, X, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanBoardType, KanbanTranslations, FilterState } from "./types";
import { NeuBtn, BTN_SHADOW, BTN_SHADOW_HOVER, INPUT_SHADOW } from "./BoardHeaderButtons";

interface BoardHeaderSearchRowProps {
  selectedBoardId: string | null;
  setSelectedBoardId: (id: string | null) => void;
  boards: KanbanBoardType[];
  setShowCreateBoard: (show: boolean) => void;
  onDeleteBoard: (boardId: string) => void;
  filters: FilterState;
  setFilters: (update: FilterState | ((f: FilterState) => FilterState)) => void;
  hasActiveFilters: boolean;
  t: KanbanTranslations & ((key: string) => string);
}

export function BoardHeaderSearchRow({
  selectedBoardId, setSelectedBoardId, boards, setShowCreateBoard, onDeleteBoard,
  filters, setFilters, hasActiveFilters, t,
}: BoardHeaderSearchRowProps) {
  const clearFilters = () => setFilters(() => ({
    search: "", columnId: null, priority: null, assigneeId: null,
    overdue: false, hasNewComments: false, tagId: null, tagName: null,
  }));

  return (
    <div className="flex items-center gap-3 mt-3 flex-wrap">
      {/* Board selector */}
      <Select value={selectedBoardId ? String(selectedBoardId) : ""} onValueChange={setSelectedBoardId}>
        <SelectTrigger
          className="w-full sm:w-[220px] h-9"
          data-testid="select-board"
          style={{
            borderRadius: 12, border: "none",
            background: "#EEF2F7", color: "#2D3748", fontSize: 13,
            boxShadow: INPUT_SHADOW, height: 40,
          }}
        >
          <SelectValue placeholder={t.empty?.selectBoard ?? "Doska tanlang"} />
        </SelectTrigger>
        <SelectContent>
          {(Array.isArray(boards) ? boards : []).map(b => (
            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* New board */}
      <NeuBtn onClick={() => setShowCreateBoard(true)} testId="button-new-board">
        <Plus style={{ width: 14, height: 14 }} />
        {t.board?.newBoard ?? "Yangi doska"}
      </NeuBtn>

      {/* Delete board */}
      {selectedBoardId && (
        <button
          title={t("doskaniOchirish")}
          data-testid="button-delete-board"
          onClick={() => {
            const board = boards.find(b => String(b.id) === String(selectedBoardId));
            const name = board?.name ?? "bu doska";
            if (window.confirm(`"${name}" doskasini o'chirasizmi? Barcha ustunlar va kartalar ham o'chadi.`)) {
              onDeleteBoard(String(selectedBoardId));
            }
          }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.7)", boxShadow: BTN_SHADOW,
            color: "#EF4444", transition: "box-shadow 0.18s, background 0.18s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "#FEE2E2";
            (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW_HOVER;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.7)";
            (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW;
          }}
        >
          <Trash2 style={{ width: 15, height: 15 }} />
        </button>
      )}

      <div className="flex-1 min-w-[20px]" />

      {/* Search input */}
      <div className="relative" style={{ width: 280 }}>
        <Search
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#A0AEC0" }}
        />
        <input
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder={t("Qidirish...")}
          data-testid="input-search"
          style={{
            width: "100%", height: 40,
            paddingLeft: 36, paddingRight: filters.search ? 36 : 14,
            borderRadius: 12, border: "none",
            background: "#EEF2F7", color: "#2D3748",
            fontSize: 13, outline: "none",
            boxShadow: INPUT_SHADOW, transition: "box-shadow 0.18s",
          }}
          onFocus={e => { (e.target as HTMLElement).style.boxShadow = "inset 3px 3px 8px rgba(163,177,198,0.40), inset -2px -2px 6px rgba(255,255,255,0.70), 0 0 0 2px rgba(91,155,213,0.25)"; }}
          onBlur={e  => { (e.target as HTMLElement).style.boxShadow = INPUT_SHADOW; }}
        />
        {filters.search && (
          <button
            onClick={() => setFilters(f => ({ ...f, search: "" }))}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#A0AEC0",
            }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        )}
      </div>

      {/* Tag filter badge */}
      {filters.tagId && filters.tagName && (
        <button
          onClick={() => setFilters(f => ({ ...f, tagId: null, tagName: null }))}
          data-testid="badge-tag-filter"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 8,
            border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 500, color: "#5B9BD5",
            background: "rgba(91,155,213,0.12)",
          }}
        >
          Teg: {filters.tagName}
          <X style={{ width: 11, height: 11 }} />
        </button>
      )}

      {/* Clear all filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          data-testid="button-clear-filters"
          style={{ fontSize: 12, color: "#F08080", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
        >
          {t.filters?.clear ?? "Filtrlarni tozalash"}
        </button>
      )}
    </div>
  );
}
