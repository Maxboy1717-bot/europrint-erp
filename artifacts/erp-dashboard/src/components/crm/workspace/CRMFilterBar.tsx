/**
 * @module CRMFilterBar
 * @description React UI component.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutGrid,
  List,
  CheckSquare,
  Calendar as CalendarIcon,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Trash2,
  Inbox,
  Clock,
  Users,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewMode, QuickFilter } from "@/pages/crm/crm-types";
import { CRMFilterBarProps } from "./types";
import { useTranslation } from '@/lib/i18n';

const VIEW_MODES: {
  value: ViewMode;
  icon: React.ElementType;
  label: string;
  testId: string;
}[] = [
  { value: "kanban",   icon: LayoutGrid,   label: "Kanban",   testId: "tab-view-kanban"   },
  { value: "list",     icon: List,         label: "Ro'yxat",  testId: "tab-view-list"     },
  { value: "tasks",    icon: CheckSquare,  label: "Ishlar",   testId: "tab-view-tasks"    },
  { value: "calendar", icon: CalendarIcon, label: "Kalendar", testId: "tab-view-calendar" },
];

const QUICK_FILTERS: {
  value: QuickFilter;
  label: string;
  icon: React.ElementType;
  testId: string;
}[] = [
  { value: "all",      label: "Barcha",   icon: Inbox,  testId: "button-filter-all"      },
  { value: "today",    label: "Bugun",    icon: Clock,  testId: "button-filter-today"    },
  { value: "my",       label: "Mening",   icon: Star,   testId: "button-filter-my"       },
  { value: "incoming", label: "Kiruvchi", icon: Users,  testId: "button-filter-incoming" },
];

export function CRMFilterBar({
  viewMode,
  setViewMode,
  supportsKanban,
  quickFilter,
  setQuickFilter,
  searchQuery,
  setSearchQuery,
  activeFilterCount,
  showAdvancedFilters,
  setShowAdvancedFilters,
  filteredItemsCount,
  nameSortAsc,
  setNameSortAsc,
  selectedItemsCount,
  onDeleteSelected,
}: CRMFilterBarProps) {
  const { t } = useTranslation("common");
  const visibleModes = supportsKanban
    ? VIEW_MODES
    : VIEW_MODES.filter((m) => m.value !== "kanban");

  return (
    <div
      className="px-6 py-2.5 border-b flex items-center gap-3 flex-wrap"
      style={{
        background: "var(--ep-primary)",
        borderColor: "rgba(0,0,0,0.06)",
      }}
    >
      {/* ── View mode toggle ────────────────────────────────────── */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.7)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.9)",
        }}
      >
        {visibleModes.map(({ value, icon: Icon, label, testId }) => {
          const isActive = viewMode === value;
          return (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              data-testid={testId}
              className={cn(
                "relative flex items-center gap-2 px-3.5 h-8 rounded-lg text-[13px] font-medium",
                "transition-all duration-200 select-none",
                isActive ? "text-white" : "text-slate-500 hover:text-slate-700 hover:bg-white/60",
              )}
            >
              {/* Sliding active pill */}
              {isActive && (
                <motion.span
                  layoutId="view-mode-pill"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: "var(--ep-primary)",
                    boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="h-3.5 w-3.5 shrink-0 relative z-10" />
              <span className="hidden sm:inline relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Slim divider */}
      <div className="h-5 w-px shrink-0" style={{ background: "rgba(0,0,0,0.08)" }} />

      {/* ── Quick filter pills ──────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {QUICK_FILTERS.map(({ value, label, icon: Icon, testId }) => {
          const isActive = quickFilter === value;
          return (
            <motion.button
              key={value}
              onClick={() => setQuickFilter(value)}
              data-testid={testId}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 rounded-xl text-[12px] font-semibold",
                "transition-colors duration-150 select-none",
                isActive
                  ? "bg-[var(--ep-blue)] text-white shadow-md shadow-indigo-200"
                  : "bg-white/70 text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm",
              )}
              style={
                isActive
                  ? {
                      background: "var(--ep-primary)",
                      boxShadow: "0 2px 10px rgba(99,102,241,0.30)",
                    }
                  : {}
              }
            >
              <Icon className="h-3 w-3 shrink-0" />
              {label}
            </motion.button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* ── Search ─────────────────────────────────────────────── */}
      <div
        className="relative shrink-0"
        style={{ width: "210px" }}
      >
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
          style={{ color: "#94a3b8" }}
        />
        <Input
          placeholder={t("Qidirish...")}
          className="pl-9 h-9 text-[13px] border-0 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.8)",
            boxShadow: "inset 0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(255,255,255,0.9)",
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      {/* ── Filter button ──────────────────────────────────────── */}
      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
        <Button
          variant="ghost"
          size="default"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          data-testid="button-filters"
          className={cn(
            "h-8 gap-2 shrink-0 text-[13px] font-semibold rounded-xl px-3.5",
            "border-0 transition-all duration-200",
            activeFilterCount > 0
              ? "text-[var(--ep-blue)]"
              : "text-slate-500 hover:text-slate-700",
          )}
          style={{
            background:
              activeFilterCount > 0
                ? "rgba(99,102,241,0.10)"
                : "rgba(255,255,255,0.7)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t("filtrlar")}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ background: "var(--ep-primary)" }}
              >
                {activeFilterCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* ── Count + sort ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[12px] font-medium" style={{ color: "#94a3b8" }}>
          Jami:{" "}
          <strong className="font-bold" style={{ color: "#334155" }}>
            {filteredItemsCount}
          </strong>{" "}
          ta
        </span>
        <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.7)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              color: "#94a3b8",
            }}
            onClick={() => setNameSortAsc(!nameSortAsc)}
            data-testid="button-sort"
            title={nameSortAsc ? "A→Z" : "Z→A"}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      </div>

      {/* ── Bulk delete ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItemsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Button
              size="default"
              className="h-8 gap-2 shrink-0 text-[13px] font-semibold rounded-xl px-3.5 border-0 text-[var(--ep-red)]"
              style={{
                background: "rgba(239,68,68,0.10)",
                boxShadow: "0 1px 3px rgba(239,68,68,0.15)",
              }}
              onClick={onDeleteSelected}
              data-testid="button-delete-selected"
            >
              <Trash2 className="h-3.5 w-3.5" />
              O'chirish ({selectedItemsCount})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
