/**
 * @module CRMWorkspace
 * @description React page component. Route-level UI.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import {
  format,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addDays,
} from "date-fns";
import { uz, ru } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";
import { QuickCreateModal } from "@/pages/crm/QuickCreateModal";
import { DetailSheet } from "@/pages/crm/DetailSheet";
import { RobotsView } from "@/pages/crm/RobotsView";

import { CRMHeader } from "@/components/crm/workspace/CRMHeader";
import { CRMFilterBar } from "@/components/crm/workspace/CRMFilterBar";
import { CRMKpiCards } from "@/components/crm/workspace/CRMKpiCards";
import { AdvancedFilterPanel } from "@/components/crm/workspace/AdvancedFilterPanel";
import { KanbanView } from "@/components/crm/workspace/KanbanView";
import { ListView } from "@/components/crm/workspace/ListView";
import { ActivityLogPanel } from "@/components/crm/workspace/ActivityLogPanel";
import { ActivityDialog } from "@/components/crm/workspace/ActivityDialog";
import { useCRMWorkspace } from "@/components/crm/workspace/useCRMWorkspace";
import { EPErrorState } from "@/components/ep";

export default function CRMWorkspace() {
  const { t } = useTranslation("crm");
  const {
    activeEntity, setActiveEntity,
    viewMode, setViewMode,
    selectedId, setSelectedId,
    quickFilter, setQuickFilter,
    searchQuery, setSearchQuery,
    showQuickCreate, setShowQuickCreate,
    selectedItems, setSelectedItems,
    activeItemId,
    advancedFilters, setAdvancedFilters,
    showAdvancedFilters, setShowAdvancedFilters,
    nameSortAsc, setNameSortAsc,
    showActivityDialog, setShowActivityDialog,
    activityForm, setActivityForm,
    activityFilter, setActivityFilter,
    activeFilterCount,
    leadsError, refetchLeads,
    todayActivities, allActivities, activitiesLoading,
    createActivityMutation, doneActivityMutation, deleteActivityMutation,
    moveItemMutation, deleteItemsMutation,
    sensors, handleDragStart, handleDragEnd,
    filteredItems, stages, itemsByStage, stageValues,
    isLoading, supportsKanban, robots, robotsLoading,
  } = useCRMWorkspace();

  // Show KPI cards only for kanban/list views (not tasks/calendar/robots)
  const showKpi = !isLoading && !leadsError && ["kanban", "list"].includes(viewMode) && activeEntity !== "robots";

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-6" style={{ background: "#EEF2F7" }}>
      <CRMHeader
        activeEntity={activeEntity}
        onEntityChange={setActiveEntity}
        onQuickCreate={(e) => { setActiveEntity(e); setShowQuickCreate(true); }}
      />
      <CRMFilterBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        supportsKanban={supportsKanban}
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilterCount={activeFilterCount}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        filteredItemsCount={filteredItems.length}
        nameSortAsc={nameSortAsc}
        setNameSortAsc={setNameSortAsc}
        selectedItemsCount={selectedItems.size}
        onDeleteSelected={() => deleteItemsMutation.mutate(Array.from(selectedItems))}
      />
      {showAdvancedFilters && (
        <AdvancedFilterPanel
          filters={advancedFilters}
          setFilters={setAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          activeEntity={activeEntity}
          stages={stages}
        />
      )}

      {/* KPI Cards */}
      {showKpi && (
        <CRMKpiCards
          items={filteredItems as { id: number; [key: string]: unknown }[]}
          stages={stages}
          activeEntity={activeEntity}
          stageValues={stageValues}
        />
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={`k-${i}`} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : leadsError ? (
          <div className="p-6">
            <EPErrorState onRetry={refetchLeads} />
          </div>
        ) : (
          <>
            {viewMode === "kanban" && supportsKanban && (
              <KanbanView
                stages={stages}
                itemsByStage={itemsByStage}
                activeEntity={activeEntity}
                stageValues={stageValues}
                onItemClick={setSelectedId}
                onAddTask={setSelectedId}
                onQuickAdd={() => setShowQuickCreate(true)}
                sensors={sensors}
                handleDragStart={handleDragStart}
                handleDragEnd={handleDragEnd}
                activeItemId={activeItemId}
                activeItem={
                  activeItemId
                    ? (Array.isArray(filteredItems) ? filteredItems : []).find(
                        (i) => i.id === activeItemId,
                      ) || null
                    : null
                }
              />
            )}
            {viewMode === "list" && (
              <ListView
                items={filteredItems}
                activeEntity={activeEntity}
                selectedItems={selectedItems}
                onToggleItem={(id) => {
                  const next = new Set(selectedItems);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  setSelectedItems(next);
                }}
                onToggleAll={(checked) =>
                  setSelectedItems(
                    checked
                      ? new Set((Array.isArray(filteredItems) ? filteredItems : []).map((i) => i.id))
                      : new Set(),
                  )
                }
                onItemClick={setSelectedId}
              />
            )}
            {viewMode === "tasks" && (
              <ActivityLogPanel
                activityFilter={activityFilter}
                setActivityFilter={setActivityFilter}
                activities={activityFilter === "today" ? todayActivities : allActivities}
                isLoading={activitiesLoading}
                onAddActivity={() => setShowActivityDialog(true)}
                onDoneActivity={(id) => doneActivityMutation.mutate(id)}
                onDeleteActivity={(id) => deleteActivityMutation.mutate(id)}
              />
            )}
            {viewMode === "calendar" && (
              <CrmCalendarView items={filteredItems} stages={stages} onItemClick={setSelectedId} />
            )}
            {viewMode === "robots" && activeEntity === "robots" && (
              <RobotsView robots={robots} isLoading={robotsLoading} />
            )}
          </>
        )}
      </div>

      <DetailSheet
        entityId={selectedId}
        entityType={activeEntity}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        stages={stages}
      />
      {showQuickCreate && (
        <QuickCreateModal entityType={activeEntity} onClose={() => setShowQuickCreate(false)} />
      )}
      <ActivityDialog
        open={showActivityDialog}
        onOpenChange={setShowActivityDialog}
        form={activityForm}
        setForm={setActivityForm}
        onSubmit={(f) => createActivityMutation.mutate(f)}
        isPending={createActivityMutation.isPending}
        activityTypes={[
          { value: "call",      label: t("activityType.call") },
          { value: "meeting",   label: t("activityType.meeting") },
          { value: "email",     label: t("activityType.email") },
          { value: "follow_up", label: t("activityType.followUp") },
          { value: "other",     label: t("activityType.other") },
        ]}
      />
    </div>
  );
}

// ── CRM Calendar view ────────────────────────────────────────────────────────

type CalItem   = { id: number; title: string; color: string };
type CalStage  = { stageId: string; color: string | null };
type CalEntity = { id: number; [key: string]: unknown };

function CrmCalendarView({
  items,
  stages,
  onItemClick,
}: {
  items: CalEntity[];
  stages: CalStage[];
  onItemClick: (id: number) => void;
}) {
  const { t, language } = useTranslation("crm");
  const dateLocale = language === "ru" ? ru : uz;
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const startDay   = addDays(monthStart, -((getDay(monthStart) + 6) % 7));
  const endDay     = addDays(monthEnd, (7 - ((getDay(monthEnd) + 6) % 7)) % 7);
  const days       = eachDayOfInterval({ start: startDay, end: endDay });

  const WEEK_LABELS = language === "ru"
    ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    : ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

  const stageColorMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of stages) m[s.stageId] = s.color ?? "#6B7280";
    return m;
  }, [stages]);

  const itemsByDate = useMemo(() => {
    const result: Record<string, CalItem[]> = {};
    for (const item of (Array.isArray(items) ? items : [])) {
      const ds = (item["dateCreate"] as string) ?? (item["createdAt"] as string);
      if (!ds) continue;
      const d = new Date(ds);
      if (isNaN(d.getTime())) continue;
      const key = format(d, "yyyy-MM-dd");

      const rawTitle =
        (item["title"] as string) ??
        [(item["lastName"] as string), (item["name"] as string)].filter(Boolean).join(" ");
      const title = rawTitle || "—";

      const stageId =
        (item["statusId"] as string) ??
        (item["stageId"] as string) ??
        (item["status"] as string) ??
        "";
      const color = stageColorMap[stageId] ?? "#6B7280";

      if (!result[key]) result[key] = [];
      result[key].push({ id: item.id as number, title, color });
    }
    return result;
  }, [items, stageColorMap]);

  return (
    <div className="flex-1 overflow-auto p-4" data-testid="crm-calendar-view">
      {/* ── header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label={t("calendar.prevMonth")}
            data-testid="crm-cal-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold min-w-[180px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label={t("calendar.nextMonth")}
            data-testid="crm-cal-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(new Date())}
          data-testid="crm-cal-today"
        >
          {t("calendar.today")}
        </Button>
      </div>

      {/* ── grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border/60">
        {WEEK_LABELS.map((d) => (
          <div
            key={d}
            className="bg-muted/60 py-2 text-center text-xs font-semibold text-muted-foreground tracking-wide"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key      = format(day, "yyyy-MM-dd");
          const dayItems = itemsByDate[key] ?? [];
          const inMonth  = isSameMonth(day, currentMonth);
          const isTodays = isToday(day);

          return (
            <div
              key={key}
              className={[
                "bg-card min-h-[88px] p-1.5 transition-colors",
                !inMonth && "opacity-35",
                isTodays && "ring-2 ring-primary ring-inset",
              ]
                .filter(Boolean)
                .join(" ")}
              data-testid={`crm-cal-day-${key}`}
            >
              <span
                className={[
                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold mb-0.5",
                  isTodays
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>

              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    className="w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium text-white leading-snug hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: it.color }}
                    onClick={() => onItemClick(it.id)}
                    data-testid={`crm-cal-item-${it.id}`}
                  >
                    {it.title}
                  </button>
                ))}
                {dayItems.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1 leading-tight">
                    {t("calendar.morePlus", { n: String(dayItems.length - 3) })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
