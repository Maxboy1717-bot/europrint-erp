import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, FolderKanban,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";

import { T } from "./kanban/kanban-types";
import { CardOverlay } from "./kanban/KanbanCard";
import { DeadlineColumn } from "./kanban/DeadlineColumn";
import { ReportsDialog } from "./kanban/ReportsDialog";
import { RobotsDialog } from "./kanban/RobotsDialog";
import { TemplatesDialog } from "./kanban/TemplatesDialog";
import { TaskDetailSheet } from "./kanban/TaskDetailSheet";
import { CalendarView } from "./kanban/CalendarView";
import { GanttView } from "./kanban/GanttView";
import { MyPlanView } from "./kanban/MyPlanView";
import { ResourceAllocationView } from "./kanban/ResourceAllocationView";
import { FlowsDialog } from "./kanban/FlowsDialog";
import { DashboardPanel } from "./kanban/DashboardPanel";
import { ListView } from "./kanban/ListView";

import { ThreeBasketsPanel } from "@/components/kanban/ThreeBasketsPanel";
import { BoardHeader } from "@/components/kanban/BoardHeader";
import { BoardDialogs } from "@/components/kanban/BoardDialogs";
import { KanbanViewTabs } from "@/components/kanban/KanbanViewTabs";
import { KanbanBoardView } from "@/components/kanban/KanbanBoardView";
import { DEADLINE_COLUMNS } from "@/components/kanban/types";
import { useKanbanBoard } from "@/hooks/useKanbanBoard";

export default function KanbanBoard() {
  const [lang] = useState<"uz" | "ru">("uz");
  const t = T[lang];

  const {
    selectedBoardId, setSelectedBoardId,
    viewMode, setViewMode,
    roleFilter, setRoleFilter,
    activeCard,
    showEditCard, setShowEditCard,
    showCreateBoard, setShowCreateBoard,
    showAddColumn, setShowAddColumn,
    showQuickTask, setShowQuickTask,
    showRobots, setShowRobots,
    showFlows, setShowFlows,
    showTemplates, setShowTemplates,
    showReports, setShowReports,
    showNotifications, setShowNotifications,
    newBoardName, setNewBoardName,
    newColumnName, setNewColumnName,
    quickTaskTitle, setQuickTaskTitle,
    quickTaskType, setQuickTaskType,
    filters, setFilters,
    sensors,
    boards, boardsLoading, boardsError, refetchBoards,
    boardLoading,
    employees,
    templates,
    unreadCount,
    createBoardMutation,
    createColumnMutation,
    createCardMutation,
    updateCardMutation,
    deleteCardMutation,
    columns,
    filteredCards,
    cardsByDeadline,
    cardsByColumn,
    overdueCount,
    newCommentsCount,
    hasActiveFilters,
    handleDragStart,
    handleDragEnd,
  } = useKanbanBoard();

  if (boardsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (boardsError) {
    return (
      <div className="p-6">
        <ErrorState onRetry={refetchBoards} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Kanban <span className="font-bold text-primary">Taxtasi</span>
        </h1>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 flex-shrink-0 rounded-2xl mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <KanbanViewTabs viewMode={viewMode} setViewMode={setViewMode} t={t} />
          </div>
          <BoardHeader
            t={t}
            templates={templates}
            selectedBoardId={selectedBoardId}
            setSelectedBoardId={setSelectedBoardId}
            columns={columns}
            createCardMutation={createCardMutation}
            setQuickTaskType={setQuickTaskType}
            setShowQuickTask={setShowQuickTask}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            filters={filters}
            setFilters={setFilters}
            overdueCount={overdueCount}
            newCommentsCount={newCommentsCount}
            unreadCount={unreadCount}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            setShowRobots={setShowRobots}
            setShowFlows={setShowFlows}
            setShowReports={setShowReports}
            setShowTemplates={setShowTemplates}
            boards={boards}
            setShowCreateBoard={setShowCreateBoard}
            hasActiveFilters={hasActiveFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
        {!selectedBoardId ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.empty.selectBoard}</h3>
            <Button onClick={() => setShowCreateBoard(true)} data-testid="button-create-board-empty">
              <Plus className="h-4 w-4 mr-1" /> {t.empty.createBoard}
            </Button>
          </div>
        ) : boardLoading ? (
          <div className="flex gap-4">
            {([1, 2, 3, 4, 5]).map((i) => <Skeleton key={`k-${i}`} className="h-[500px] w-72 flex-shrink-0" />)}
          </div>
        ) : viewMode === "kanban" ? (
          <KanbanBoardView
            sensors={sensors}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            columns={columns}
            cardsByColumn={cardsByColumn}
            setShowEditCard={setShowEditCard}
            setShowAddColumn={setShowAddColumn}
            setShowQuickTask={setShowQuickTask}
            setQuickTaskTitle={setQuickTaskTitle}
            selectedBoardId={selectedBoardId}
            activeCard={activeCard}
            t={t}
          />
        ) : viewMode === "list" ? <ListView cards={filteredCards} columns={columns} onCardClick={setShowEditCard} t={t} />
        : viewMode === "deadlines" ? (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <ScrollArea className="w-full h-full">
              <div className="flex gap-4 pb-4">
                {(Object.keys(DEADLINE_COLUMNS) as Array<keyof typeof DEADLINE_COLUMNS>).map((key) => (
                  <DeadlineColumn key={key} columnKey={key} cards={cardsByDeadline[key]} onCardClick={setShowEditCard}
                    onAddCard={() => { setQuickTaskType("task"); setShowQuickTask(true); }} t={t} />
                ))}
              </div>
            </ScrollArea>
            <DragOverlay>{activeCard && <CardOverlay card={activeCard} />}</DragOverlay>
          </DndContext>
        ) : viewMode === "calendar" ? <CalendarView cards={filteredCards} onCardClick={setShowEditCard} onCreateTask={() => { if (selectedBoardId && columns.length > 0) { setQuickTaskTitle(""); setShowQuickTask(true); } }} t={t} />
        : viewMode === "gantt" ? <GanttView cards={filteredCards} columns={columns} onCardClick={setShowEditCard} t={t} />
        : viewMode === "myPlan" ? <MyPlanView cards={filteredCards} onCardClick={setShowEditCard} onToggleComplete={(card) => updateCardMutation.mutate({ id: card.id!, status: card.status === "completed" ? "active" : "completed" })} t={t} />
        : viewMode === "dashboard" ? <DashboardPanel t={t} />
        : viewMode === "allocation" ? <ResourceAllocationView t={t} boardId={selectedBoardId} />
        : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Bu ko'rinish hali tayyor emas</p></div>}
      </div>

      <ThreeBasketsPanel />

      <BoardDialogs
        t={t}
        showCreateBoard={showCreateBoard}
        setShowCreateBoard={setShowCreateBoard}
        newBoardName={newBoardName}
        setNewBoardName={setNewBoardName}
        createBoardMutation={createBoardMutation}
        showQuickTask={showQuickTask}
        setShowQuickTask={setShowQuickTask}
        quickTaskType={quickTaskType}
        quickTaskTitle={quickTaskTitle}
        setQuickTaskTitle={setQuickTaskTitle}
        createCardMutation={createCardMutation}
        selectedBoardId={selectedBoardId}
        columns={columns}
        showAddColumn={showAddColumn}
        setShowAddColumn={setShowAddColumn}
        newColumnName={newColumnName}
        setNewColumnName={setNewColumnName}
        createColumnMutation={createColumnMutation}
      />

      <RobotsDialog open={showRobots} onOpenChange={setShowRobots} boardId={selectedBoardId} columns={columns} employees={employees} t={t} />
      <FlowsDialog open={showFlows} onOpenChange={setShowFlows} boardId={selectedBoardId} employees={employees} t={t} />
      <TemplatesDialog open={showTemplates} onOpenChange={setShowTemplates} boardId={selectedBoardId} columns={columns} t={t} />
      <ReportsDialog open={showReports} onOpenChange={setShowReports} />

      {showEditCard && (
        <TaskDetailSheet
          card={showEditCard}
          open={!!showEditCard}
          onOpenChange={(open) => !open && setShowEditCard(null)}
          employees={employees}
          columns={columns}
          onUpdate={(data) => updateCardMutation.mutate({ id: showEditCard.id!, ...data })}
          onDelete={() => deleteCardMutation.mutate(showEditCard.id!)}
          t={t}
        />
      )}
    </div>
  );
}
