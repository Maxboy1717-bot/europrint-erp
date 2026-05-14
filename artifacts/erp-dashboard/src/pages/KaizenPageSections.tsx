/**
 * @module KaizenPageSections
 * @description Board, stats, filter, and card sections for KaizenPage.
 */

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb } from "lucide-react";
import type { KaizenSuggestion } from "./KaizenPageTypes";
import { STATUS_CONFIG, KANBAN_COLUMNS } from "./KaizenPageTypes";

import { useTranslation } from '@/lib/i18n';
// ── KaizenCard ────────────────────────────────────────────────────────────────

interface KaizenCardProps {
  suggestion: KaizenSuggestion;
  onStatusChange: (s: KaizenSuggestion) => void;
}

export function KaizenCard({suggestion, onStatusChange }: KaizenCardProps) {
  const { t } = useTranslation('common');
  const cfg = STATUS_CONFIG[suggestion.status] ?? STATUS_CONFIG["submitted"];
  const Icon = cfg.icon;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight flex-1">{suggestion.title}</p>
        <button
          onClick={() => onStatusChange(suggestion)}
          className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-0.5 shrink-0"
        >
          {t("status28")}
        </button>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{suggestion.description}</p>
      {suggestion.expectedImpact && (
        <p className="text-xs text-[var(--ep-blue)] line-clamp-1">↗ {suggestion.expectedImpact}</p>
      )}
      {suggestion.rejectionReason && (
        <p className="text-xs text-[var(--ep-red)] line-clamp-1">✕ {suggestion.rejectionReason}</p>
      )}
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {new Date(suggestion.createdAt).toLocaleDateString("uz-UZ")}
      </p>
    </div>
  );
}

// ── KaizenStats ───────────────────────────────────────────────────────────────

export function KaizenStats({ stats }: { stats: { stats: Record<string, number>; total: number } }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {(Array.isArray(KANBAN_COLUMNS) ? KANBAN_COLUMNS : []).map((s) => {
        const cfg = STATUS_CONFIG[s];
        const Icon = cfg.icon;
        return (
          <Card key={s} className="p-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.stats?.[s] ?? 0}</p>
          </Card>
        );
      })}
    </div>
  );
}

// ── KaizenFilter ──────────────────────────────────────────────────────────────

interface KaizenFilterProps {
  filterStatus: string;
  onFilterChange: (s: string) => void;
}

export function KaizenFilter({ filterStatus, onFilterChange }: KaizenFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium">{"Filtr:"}</span>
      {(["all", ...KANBAN_COLUMNS]).map((s) => (
        <button
          key={s}
          onClick={() => onFilterChange(s)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            filterStatus === s
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          {s === "all" ? "Barchasi" : STATUS_CONFIG[s]?.label}
        </button>
      ))}
    </div>
  );
}

// ── KaizenBoardSkeleton ───────────────────────────────────────────────────────

export function KaizenBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={`k-${i}`} className="h-48 rounded-lg" />
      ))}
    </div>
  );
}

// ── KaizenKanbanBoard ─────────────────────────────────────────────────────────

interface KaizenKanbanBoardProps {
  suggestions: KaizenSuggestion[];
  onStatusChange: (s: KaizenSuggestion) => void;
}

export function KaizenKanbanBoard({ suggestions, onStatusChange }: KaizenKanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
      {(Array.isArray(KANBAN_COLUMNS) ? KANBAN_COLUMNS : []).map((col) => {
        const colItems = (Array.isArray(suggestions) ? suggestions : []).filter((s) => s.status === col);
        const cfg = STATUS_CONFIG[col];
        return (
          <div key={col} className="min-w-[200px]">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
              <span className="text-xs text-muted-foreground">{colItems.length}</span>
            </div>
            <div className="space-y-3">
              {colItems.length === 0 ? (
                <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                  {t("goyalarYoq")}
                </div>
              ) : (
                (Array.isArray(colItems) ? colItems : []).map((s) => (
                  <KaizenCard key={s.id} suggestion={s} onStatusChange={onStatusChange} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── KaizenFilteredGrid ────────────────────────────────────────────────────────

interface KaizenFilteredGridProps {
  suggestions: KaizenSuggestion[];
  onStatusChange: (s: KaizenSuggestion) => void;
}

export function KaizenFilteredGrid({ suggestions, onStatusChange }: KaizenFilteredGridProps) {
  if (suggestions.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-3 text-center py-12 text-muted-foreground">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("hozirchaGoyalarYoq")}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {(Array.isArray(suggestions) ? suggestions : []).map((s) => (
        <KaizenCard key={s.id} suggestion={s} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}
