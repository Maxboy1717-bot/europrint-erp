import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid,
  List,
  CheckSquare,
  Calendar as CalendarIcon,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewMode, QuickFilter } from "@/pages/crm/crm-types";
import { CRMFilterBarProps } from "./types";

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
  return (
    <div className="bg-surface-container-lowest px-4 py-3 space-y-3 shadow-sm border-b border-outline-variant">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="bg-surface-container-low">
              {supportsKanban && (
                <TabsTrigger value="kanban" data-testid="tab-view-kanban">
                  <LayoutGrid className="h-4 w-4 mr-1.5" />
                  Kanban
                </TabsTrigger>
              )}
              <TabsTrigger value="list" data-testid="tab-view-list">
                <List className="h-4 w-4 mr-1.5" />
                Ro'yxat
              </TabsTrigger>
              <TabsTrigger value="tasks" data-testid="tab-view-tasks">
                <CheckSquare className="h-4 w-4 mr-1.5" />
                Ishlar
              </TabsTrigger>
              <TabsTrigger value="calendar" data-testid="tab-view-calendar">
                <CalendarIcon className="h-4 w-4 mr-1.5" />
                Kalendar
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={quickFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setQuickFilter("all")}
            data-testid="button-filter-all"
            className={cn(quickFilter === "all" ? "bg-primary text-white" : "text-on-surface")}
          >
            Barcha
          </Button>
          <Button
            variant={quickFilter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setQuickFilter("today")}
            data-testid="button-filter-today"
            className={cn(quickFilter === "today" ? "bg-primary text-white" : "text-on-surface")}
          >
            Bugun
          </Button>
          <Button
            variant={quickFilter === "my" ? "default" : "outline"}
            size="sm"
            onClick={() => setQuickFilter("my")}
            data-testid="button-filter-my"
            className={cn(quickFilter === "my" ? "bg-primary text-white" : "text-on-surface")}
          >
            Mening
          </Button>
          <Button
            variant={quickFilter === "incoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setQuickFilter("incoming")}
            data-testid="button-filter-incoming"
            className={cn(quickFilter === "incoming" ? "bg-primary text-white" : "text-on-surface")}
          >
            Kiruvchi
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <Input
              placeholder="Qidirish..."
              className="pl-9 bg-surface-container-low border-none focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Button
            variant={activeFilterCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2 shrink-0"
            data-testid="button-filters"
          >
            <Filter className="h-4 w-4" />
            Filtrlar
            {activeFilterCount > 0 && (
              <span className="bg-white text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
            Jami: <span className="font-medium text-on-surface">{filteredItemsCount} ta</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-on-surface-variant"
            onClick={() => setNameSortAsc(!nameSortAsc)}
            data-testid="button-sort"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>

          {selectedItemsCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 h-8"
              onClick={onDeleteSelected}
              data-testid="button-delete-selected"
            >
              <Trash2 className="h-4 w-4" />
              O'chirish ({selectedItemsCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
