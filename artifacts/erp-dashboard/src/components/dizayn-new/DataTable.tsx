/**
 * DIZAYN-NEW: DataTable — Enterprise jadval komponenti
 * Vazifa 4: Sort, filter, search, pagination, row select, status badge, avatar
 * Linear uslubida — TanStack Table bilan ishlaydigan generik komponent
 */
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from '@/lib/i18n';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Search, ChevronLeft, ChevronRight,
  MoreVertical, SlidersHorizontal,
} from "lucide-react";

// ─── Status config ─────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  dot: string;
}> = {
  active:    { label: "Aktiv",         color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20",  dot: "bg-[hsl(var(--success))]"  },
  vacation:  { label: "Ta'tilda",      color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))] border-[hsl(var(--info))]/20",          dot: "bg-[hsl(var(--info))]"     },
  sick:      { label: "Kasal",         color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20", dot: "bg-[hsl(var(--warning))]"  },
  dismissed: { label: "Ishdan ketgan", color: "bg-[hsl(var(--error))]/10 text-[hsl(var(--error))] border-[hsl(var(--error))]/20",       dot: "bg-[hsl(var(--error))]"    },
  probation: { label: "Sinov muddati", color: "bg-secondary/10 text-secondary border-secondary/20",                                     dot: "bg-secondary"              },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTableProps<T extends { id: string | number }> {
  title?: string;
  columns: TableColumn<T>[];
  data: T[];
  pageSize?: number;
  onAdd?: () => void;
  addLabel?: string;
  onRowAction?: (id: string | number, action: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("common");
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium",
        cfg.color
      )}
      role="status"
      aria-label={cfg.label}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

// ─── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: SortDir }) {
  const { t } = useTranslation("common");
  if (dir === "asc")  return <ChevronUp  className="w-3.5 h-3.5 text-primary" aria-label={t("ascending")} />;
  if (dir === "desc") return <ChevronDown className="w-3.5 h-3.5 text-primary" aria-label={t("descending")} />;
  return <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/50" aria-label={t("sortBy")} />;
}

// ─── Row action menu ───────────────────────────────────────────────────────────

function RowActionMenu({
  id,
  onAction,
}: {
  id: string | number;
  onAction?: (id: string | number, action: string) => void;
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const actions = [
    { key: "view", label: "Ko'rish" },
    { key: "edit", label: "Tahrirlash" },
    { key: "delete", label: "O'chirish", danger: true },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        aria-label={t("amallarMenyusi")}
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <MoreVertical className="w-4 h-4" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 top-8 z-20 w-36 bg-card border border-border rounded-lg shadow-[var(--shadow-lg)] overflow-hidden"
          >
            {(Array.isArray(actions) ? actions : []).map((a) => (
              <button
                key={a.key}
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onAction?.(id, a.key); }}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left transition-colors",
                  a.danger
                    ? "text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/10"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  indeterminate,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (v: boolean) => void;
  "aria-label": string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => { if (el) el.indeterminate = !!indeterminate; }}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
      className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
    />
  );
}

// ─── Main DataTable Component ─────────────────────────────────────────────────

export function DataTableRedesign<T extends { id: string | number }>({
  title,
  columns,
  data,
  pageSize = 10,
  onAdd,
  addLabel = "+ Qo'shish",
  onRowAction,
  searchPlaceholder = "Qidirish...",
  isLoading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [page, setPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return (Array.isArray(data) ? data : []).filter((row) =>
      Object.values(row as Record<string, unknown>).some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [data, search]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey] ?? "";
      const bv = (b as Record<string, unknown>)[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "uz");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); return; }
    if (sortDir === "asc") { setSortDir("desc"); return; }
    setSortKey(null); setSortDir(null);
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set((Array.isArray(pageData) ? pageData : []).map((r) => r.id)) : new Set());
  };

  const toggleRow = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = pageData.length > 0 && (Array.isArray(pageData) ? pageData : []).every((r) => selectedIds.has(r.id));
  const someSelected = (Array.isArray(pageData) ? pageData : []).some((r) => selectedIds.has(r.id));

  return (
    <div
      className="bg-card border border-border rounded-xl shadow-[var(--shadow-md)] overflow-hidden"
      role="region"
      aria-label={title ?? "Jadval"}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3 flex-1">
          {title && (
            <h3 className="text-base font-semibold text-foreground flex-shrink-0">{title}</h3>
          )}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="pl-9 h-8 text-sm bg-background"
              aria-label={t("search")}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span aria-live="polite">{filtered.length} ta natija</span>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedIds.size} ta tanlangan
          </Badge>
        )}

        {onAdd && (
          <Button
            size="sm"
            onClick={onAdd}
            className="h-8 text-xs gap-1 bg-primary hover:bg-[hsl(var(--primary-dim,216_100%_32%))] text-primary-foreground"
          >
            {addLabel}
          </Button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table
          className="w-full text-sm"
          aria-label={title ?? "Ma'lumotlar jadvali"}
          aria-busy={isLoading}
        >
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-10 px-4 py-3 text-left" scope="col">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleAll}
                  aria-label={t("barchasiniTanlash")}
                />
              </th>
              {(Array.isArray(columns) ? columns : []).map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                    col.sortable && "cursor-pointer select-none hover:text-foreground"
                  )}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  aria-sort={sortKey === String(col.key)
                    ? sortDir === "asc" ? "ascending" : "descending"
                    : col.sortable ? "none" : undefined
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
              <th scope="col" className="w-12 px-4 py-3" aria-label={t("Amallar")} />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`k-${i}`} className="border-b border-border last:border-0">
                  <td className="px-4 py-3" colSpan={columns.length + 2}>
                    <div className="h-5 bg-muted rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              (Array.isArray(pageData) ? pageData : []).map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    selectedIds.has(row.id)
                      ? "bg-primary/5"
                      : "hover:bg-muted/40"
                  )}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Qator tanlash: ${row.id}`}
                    />
                  </td>
                  {(Array.isArray(columns) ? columns : []).map((col) => {
                    const rawVal = (row as Record<string, unknown>)[String(col.key)];
                    return (
                      <td key={String(col.key)} className="px-4 py-3 text-sm text-foreground">
                        {col.render ? col.render(rawVal, row) : String(rawVal ?? "")}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <RowActionMenu id={row.id} onAction={onRowAction} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} / {sorted.length} ta
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
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

// ─── Employee table preset ─────────────────────────────────────────────────────

export interface EmployeeRow {
  id: number;
  name: string;
  position: string;
  department: string;
  status: string;
  avatar?: string;
}

export function EmployeeTable({
  data,
  onAdd,
  onRowAction,
}: {
  data: EmployeeRow[];
  onAdd?: () => void;
  onRowAction?: (id: string | number, action: string) => void;
}) {
  const { t } = useTranslation("common");
  const columns: TableColumn<EmployeeRow>[] = [
    {
      key: "name",
      label: "Ism Familiya",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7 flex-shrink-0">
            {row.avatar && <AvatarImage src={row.avatar} alt={row.name} />}
            <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
              {row.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    { key: "position",   label: "Lavozim",  sortable: true },
    { key: "department", label: "Bo'lim",   sortable: true },
    {
      key: "status",
      label: "Holat",
      render: (val) => <StatusBadge status={String(val)} />,
    },
  ];

  return (
    <DataTableRedesign
      title={t("xodimlar")}
      columns={columns}
      data={data}
      onAdd={onAdd}
      addLabel="+ Xodim qo'shish"
      onRowAction={onRowAction}
      searchPlaceholder="Xodim qidirish..."
    />
  );
}

export default DataTableRedesign;
