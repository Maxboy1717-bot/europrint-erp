/**
 * @module ep/EPTable
 * @description Canonical EuroPrint data-table primitive (design-system §3.4).
 *
 * Promotes the previously-orphaned `components/dizayn-new/DataTable.tsx`
 * (`DataTableRedesign`) into the sanctioned `components/ep/` library, restyled
 * to the DESIGN-SYSTEM-AUDIT-2026-07-11 §3.4 separation spec:
 *   - Container: `border border-[var(--ep-border)] rounded-lg overflow-hidden`
 *     on a `bg-card` surface — the majority-good pattern (EmployeeTable,
 *     MaterialInventoryTable) — so the table never blends into the page bg.
 *   - Header:    `bg-muted/50`, uppercase medium-weight labels — the dominant
 *     convention across the audited sample; formalized here as mandatory.
 *   - Zebra:     optional `tr:nth-child(even)` striping (POS `.pos-table`
 *     reference impl) — recommended for dense financial/inventory tables.
 *
 * Crucially, unlike `DataTableRedesign`, every piece of interactive chrome
 * (search box, pagination, row selection, row-action menu, add button) is
 * OPT-IN. With none enabled, `EPTable` is a pure presentational table that
 * only adds the mandated visual separation — making it a behavior-preserving
 * drop-in for converting existing "NOT separated" tables (design task D5)
 * without changing what data is shown or how it sorts/filters.
 *
 * Reuses the existing `DataTable.atoms` (SortIcon, RowActionMenu, Checkbox)
 * and `DataTable.types` (TableColumn) rather than duplicating them.
 */
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

import type { TableColumn, SortDir } from "@/components/dizayn-new/DataTable.types";
import { SortIcon, RowActionMenu, Checkbox } from "@/components/dizayn-new/DataTable.atoms";

export type { TableColumn } from "@/components/dizayn-new/DataTable.types";

export interface EPTableProps<T extends { id: string | number }> {
  /** Column definitions (key/label/render/sortable/width). */
  columns: TableColumn<T>[];
  /** Row data. Guarded with Array.isArray internally. */
  data: T[];
  /** Optional heading rendered in the header toolbar. */
  title?: string;
  /** Show a client-side free-text search box (default: false). */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Rows per page. Omit for no pagination (render all rows) — default off. */
  pageSize?: number;
  /** Render a leading checkbox column with row selection (default: false). */
  selectable?: boolean;
  /** Zebra-stripe even rows (POS-style) — recommended for dense tables. */
  zebra?: boolean;
  /** Compact cell padding (default: false = comfortable). */
  dense?: boolean;
  /** Optional "+ add" button in the header toolbar. */
  onAdd?: () => void;
  addLabel?: string;
  /** Optional trailing row-action (⋯) menu column. */
  onRowAction?: (id: string | number, action: string) => void;
  /** Loading skeleton rows. */
  isLoading?: boolean;
  /** Empty-state message (defaults to i18n common.noResults). */
  emptyMessage?: string;
  className?: string;
}

export function EPTable<T extends { id: string | number }>({
  columns,
  data,
  title,
  searchable = false,
  searchPlaceholder = "Qidirish...",
  pageSize,
  selectable = false,
  zebra = false,
  dense = false,
  onAdd,
  addLabel = "+ Qo'shish",
  onRowAction,
  isLoading = false,
  emptyMessage,
  className,
}: EPTableProps<T>) {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [page, setPage] = useState(1);

  const rows = Array.isArray(data) ? data : [];
  const cols = Array.isArray(columns) ? columns : [];

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row as Record<string, unknown>).some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    );
  }, [rows, search, searchable]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey] ?? "";
      const bv = (b as Record<string, unknown>)[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "uz");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paginate = typeof pageSize === "number" && pageSize > 0;
  const totalPages = paginate ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const pageData = paginate
    ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sorted;

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }
    setSortKey(null);
    setSortDir(null);
  };

  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(pageData.map((r) => r.id)) : new Set());
  const toggleRow = (id: string | number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = pageData.length > 0 && pageData.every((r) => selectedIds.has(r.id));
  const someSelected = pageData.some((r) => selectedIds.has(r.id));

  const cellPad = dense ? "px-3 py-2" : "px-4 py-3";
  const showToolbar = Boolean(title || searchable || onAdd || selectedIds.size > 0);
  const leadCols = (selectable ? 1 : 0) + cols.length + (onRowAction ? 1 : 0);

  return (
    <div
      className={cn(
        "bg-card border border-[var(--ep-border)] rounded-lg overflow-hidden",
        className,
      )}
      role="region"
      aria-label={title ?? "Jadval"}
    >
      {showToolbar && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-[var(--ep-border)]">
          <div className="flex items-center gap-3 flex-1">
            {title && (
              <h3 className="text-base font-semibold text-foreground flex-shrink-0">{title}</h3>
            )}
            {searchable && (
              <div className="relative max-w-xs w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="pl-9 h-8 text-sm bg-background"
                  aria-label={t("search")}
                />
              </div>
            )}
            {searchable && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                <span aria-live="polite">{filtered.length} ta natija</span>
              </div>
            )}
          </div>
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedIds.size} ta tanlangan
            </Badge>
          )}
          {onAdd && (
            <Button size="sm" onClick={onAdd} className="h-8 text-xs gap-1">
              {addLabel}
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          aria-label={title ?? "Ma'lumotlar jadvali"}
          aria-busy={isLoading}
        >
          <thead>
            <tr className="border-b border-[var(--ep-border)] bg-muted/50">
              {selectable && (
                <th className={cn("w-10 text-left", cellPad)} scope="col">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                    aria-label={t("barchasiniTanlash")}
                  />
                </th>
              )}
              {cols.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                    cellPad,
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                  )}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  aria-sort={
                    sortKey === String(col.key)
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : col.sortable
                        ? "none"
                        : undefined
                  }
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <SortIcon dir={sortKey === String(col.key) ? sortDir : null} />
                    )}
                  </span>
                </th>
              ))}
              {onRowAction && <th scope="col" className={cn("w-12", cellPad)} aria-label={t("Amallar")} />}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`k-${i}`} className="border-b border-[var(--ep-border)] last:border-0">
                  <td className={cellPad} colSpan={leadCols}>
                    <div className="h-5 bg-muted rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={leadCols}
                  className="px-4 py-12 text-center text-muted-foreground text-sm"
                >
                  {emptyMessage ?? t("noResults")}
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-[var(--ep-border)] last:border-0 transition-colors",
                    selectedIds.has(row.id)
                      ? "bg-primary/5"
                      : zebra && idx % 2 === 1
                        ? "bg-muted/30 hover:bg-muted/50"
                        : "hover:bg-muted/40",
                  )}
                >
                  {selectable && (
                    <td className={cellPad}>
                      <Checkbox
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        aria-label={`Qator tanlash: ${row.id}`}
                      />
                    </td>
                  )}
                  {cols.map((col) => {
                    const rawVal = (row as Record<string, unknown>)[String(col.key)];
                    return (
                      <td key={String(col.key)} className={cn("text-sm text-foreground", cellPad)}>
                        {col.render ? col.render(rawVal, row) : String(rawVal ?? "")}
                      </td>
                    );
                  })}
                  {onRowAction && (
                    <td className={cellPad}>
                      <RowActionMenu id={row.id} onAction={onRowAction} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginate && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--ep-border)]">
          <span className="text-xs text-muted-foreground">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} /{" "}
            {sorted.length} ta
          </span>
          <div className="flex items-center gap-1" role="navigation" aria-label={t("sahifalash")}>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label={t("previousPageAria")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return p <= totalPages ? (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-label={`${p}-sahifa`}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={cn(
                    "w-7 h-7 text-xs font-medium rounded-md transition-colors",
                    p === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ) : null;
            })}
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label={t("nextPageAria")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EPTable;
