import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickCreateModal } from "@/pages/crm/QuickCreateModal";
import { DetailSheet } from "@/pages/crm/DetailSheet";
import { RobotsView } from "@/pages/crm/RobotsView";

import { CRMHeader } from "@/components/crm/workspace/CRMHeader";
import { CRMFilterBar } from "@/components/crm/workspace/CRMFilterBar";
import { AdvancedFilterPanel } from "@/components/crm/workspace/AdvancedFilterPanel";
import { KanbanView } from "@/components/crm/workspace/KanbanView";
import { ListView } from "@/components/crm/workspace/ListView";
import { ActivityLogPanel } from "@/components/crm/workspace/ActivityLogPanel";
import { ActivityDialog } from "@/components/crm/workspace/ActivityDialog";
import { useCRMWorkspace } from "@/components/crm/workspace/useCRMWorkspace";

export default function CRMWorkspace() {
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
    isLoading, supportsKanban, robots, robotsLoading
  } = useCRMWorkspace();

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-6 bg-surface">
      <div className="flex">
        <CRMHeader activeEntity={activeEntity} onEntityChange={setActiveEntity} onQuickCreate={(e) => { setActiveEntity(e); setShowQuickCreate(true); }} />
        <Button variant="ghost" size="sm" onClick={() => refetchLeads()} className="sr-only" aria-label="Yangilash">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <CRMFilterBar viewMode={viewMode} setViewMode={setViewMode} supportsKanban={supportsKanban} quickFilter={quickFilter} setQuickFilter={setQuickFilter} searchQuery={searchQuery} setSearchQuery={setSearchQuery} activeFilterCount={activeFilterCount} showAdvancedFilters={showAdvancedFilters} setShowAdvancedFilters={setShowAdvancedFilters} filteredItemsCount={filteredItems.length} nameSortAsc={nameSortAsc} setNameSortAsc={setNameSortAsc} selectedItemsCount={selectedItems.size} onDeleteSelected={() => deleteItemsMutation.mutate(Array.from(selectedItems))} />
      {showAdvancedFilters && <AdvancedFilterPanel filters={advancedFilters} setFilters={setAdvancedFilters} onClose={() => setShowAdvancedFilters(false)} activeEntity={activeEntity} stages={stages} />}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? <div className="p-6 space-y-4">{([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-24 w-full" />)}</div> : leadsError ? <div className="p-6"><ErrorState onRetry={refetchLeads} /></div> : (
          <>
            {viewMode === "kanban" && supportsKanban && <KanbanView stages={stages} itemsByStage={itemsByStage} activeEntity={activeEntity} stageValues={stageValues} onItemClick={setSelectedId} onAddTask={setSelectedId} onQuickAdd={() => setShowQuickCreate(true)} sensors={sensors} handleDragStart={handleDragStart} handleDragEnd={handleDragEnd} activeItemId={activeItemId} activeItem={activeItemId ? (Array.isArray(filteredItems) ? filteredItems : []).find(i => i.id === activeItemId) || null : null} />}
            {viewMode === "list" && <ListView items={filteredItems} activeEntity={activeEntity} selectedItems={selectedItems} onToggleItem={(id) => { const next = new Set(selectedItems); if (next.has(id)) next.delete(id); else next.add(id); setSelectedItems(next); }} onToggleAll={(checked) => setSelectedItems(checked ? new Set((Array.isArray(filteredItems) ? filteredItems : []).map(i => i.id)) : new Set())} onItemClick={setSelectedId} />}
            {viewMode === "tasks" && <ActivityLogPanel activityFilter={activityFilter} setActivityFilter={setActivityFilter} activities={activityFilter === "today" ? todayActivities : allActivities} isLoading={activitiesLoading} onAddActivity={() => setShowActivityDialog(true)} onDoneActivity={(id) => doneActivityMutation.mutate(id)} onDeleteActivity={(id) => deleteActivityMutation.mutate(id)} />}
            {viewMode === "calendar" && <div className="flex-1 flex items-center justify-center text-muted-foreground"><div className="text-center"><Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Kalendar ko'rinishi yaqin orada...</p></div></div>}
            {viewMode === "robots" && activeEntity === "robots" && <RobotsView robots={robots} isLoading={robotsLoading} />}
          </>
        )}
      </div>
      <DetailSheet entityId={selectedId} entityType={activeEntity} open={!!selectedId} onClose={() => setSelectedId(null)} stages={stages} />
      {showQuickCreate && <QuickCreateModal entityType={activeEntity} onClose={() => setShowQuickCreate(false)} />}
      <ActivityDialog open={showActivityDialog} onOpenChange={setShowActivityDialog} form={activityForm} setForm={setActivityForm} onSubmit={(f) => createActivityMutation.mutate(f)} isPending={createActivityMutation.isPending} activityTypes={[{ value: "call", label: "Qo'ng'iroq" }, { value: "meeting", label: "Uchrashuv" }, { value: "email", label: "Email" }, { value: "follow_up", label: "Kuzatuv" }, { value: "other", label: "Boshqa" }]} />
    </div>
  );
}
