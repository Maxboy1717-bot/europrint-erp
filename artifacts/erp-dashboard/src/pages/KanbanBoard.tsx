/**
 * @module KanbanBoard
 * @description Route-level orchestration: state, hooks, and layout shell.
 * All view rendering is delegated to KanbanBoardSections and KanbanBoardDialogs.
 */

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { T } from "./kanban/kanban-types";
import { ThreeBasketsPanel } from "@/components/kanban/ThreeBasketsPanel";
import { BoardHeader } from "@/components/kanban/BoardHeader";
import { KanbanViewTabs } from "@/components/kanban/KanbanViewTabs";
import { useKanbanBoard } from "@/hooks/useKanbanBoard";

import { EmptyBoardState, BoardContent } from "./KanbanBoardSections";
import {
  BoardDialogs,
  RobotsDialog,
  FlowsDialog,
  TemplatesDialog,
  ReportsDialog,
  TaskDetailSheet,
} from "./KanbanBoardDialogs";
import { EPErrorState } from "@/components/ep";

export default function KanbanBoard() {
  const [lang] = useState<"uz" | "ru">("uz");
  // BoardHeader and a few sections invoke `t(...)` as a function while
  // dialogs read `t.someNested.key`. Wrap the translation map in a
  // function carrier so both usage patterns work at runtime; the
  // function variant falls back to the key itself when not found.
  const tMap = T[lang] as Record<string, unknown>;
  const tFn = ((key: string, _params?: Record<string, string | number>): string => {
    const direct = tMap?.[key];
    return typeof direct === 'string' ? direct : key;
  }) as ((key: string, params?: Record<string, string | number>) => string);
  const t = Object.assign(tFn, tMap) as unknown as typeof T.uz & ((key: string, params?: Record<string, string | number>) => string);

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
    quickStartMutation,
    createColumnMutation,
    deleteColumnMutation,
    deleteBoardMutation,
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
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (boardsError) {
    return (
      <div className="p-6">
        <EPErrorState onRetry={refetchBoards} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col -m-4 lg:-m-6 overflow-hidden"
      style={{ background: "#F0F4FF", height: "calc(100dvh - 3.5rem)" }}
    >
      {/* Header row: view tabs + board controls */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <div style={{ marginBottom: 10 }}>
          <KanbanViewTabs viewMode={viewMode} setViewMode={setViewMode} t={t} />
        </div>
        <BoardHeader
          t={t}
          templates={templates}
          selectedBoardId={selectedBoardId}
          setSelectedBoardId={setSelectedBoardId}
          columns={columns}
          createCardMutation={createCardMutation as unknown as Parameters<typeof BoardHeader>[0]["createCardMutation"]}
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
          onDeleteBoard={boardId => deleteBoardMutation.mutate(boardId)}
        />
      </div>

      {/* Main content */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          background: "#F0F4FF",
          padding: "0 16px 16px",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {!selectedBoardId ? (
          <EmptyBoardState
            t={t}
            isQuickStartPending={quickStartMutation.isPending}
            onQuickStart={() => quickStartMutation.mutate()}
            onCreateBoard={() => setShowCreateBoard(true)}
          />
        ) : (
          <BoardContent
            viewMode={viewMode}
            sensors={sensors}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            columns={columns}
            cardsByColumn={cardsByColumn}
            cardsByDeadline={cardsByDeadline}
            filteredCards={filteredCards}
            activeCard={activeCard}
            selectedBoardId={selectedBoardId}
            boardLoading={boardLoading}
            setShowEditCard={setShowEditCard}
            setShowAddColumn={setShowAddColumn}
            setShowQuickTask={setShowQuickTask}
            setQuickTaskTitle={setQuickTaskTitle}
            deleteColumnMutation={deleteColumnMutation}
            updateCardMutation={updateCardMutation}
            t={t}
            quickTaskType={quickTaskType}
            setQuickTaskType={setQuickTaskType}
          />
        )}
      </div>

      <ThreeBasketsPanel t={t} />

      <BoardDialogs
        t={t}
        showCreateBoard={showCreateBoard}
        setShowCreateBoard={setShowCreateBoard}
        newBoardName={newBoardName}
        setNewBoardName={setNewBoardName}
        createBoardMutation={createBoardMutation as unknown as Parameters<typeof BoardDialogs>[0]["createBoardMutation"]}
        showQuickTask={showQuickTask}
        setShowQuickTask={setShowQuickTask}
        quickTaskType={quickTaskType}
        quickTaskTitle={quickTaskTitle}
        setQuickTaskTitle={setQuickTaskTitle}
        createCardMutation={createCardMutation as unknown as Parameters<typeof BoardDialogs>[0]["createCardMutation"]}
        selectedBoardId={selectedBoardId}
        columns={columns as unknown as Parameters<typeof BoardDialogs>[0]["columns"]}
        employees={employees}
        showAddColumn={showAddColumn}
        setShowAddColumn={setShowAddColumn}
        newColumnName={newColumnName}
        setNewColumnName={setNewColumnName}
        createColumnMutation={createColumnMutation as unknown as Parameters<typeof BoardDialogs>[0]["createColumnMutation"]}
      />

      <RobotsDialog open={showRobots} onOpenChange={setShowRobots} boardId={selectedBoardId} columns={columns} employees={employees} t={t} />
      <FlowsDialog open={showFlows} onOpenChange={setShowFlows} boardId={selectedBoardId} employees={employees} t={t} />
      <TemplatesDialog open={showTemplates} onOpenChange={setShowTemplates} boardId={selectedBoardId} columns={columns} t={t} />
      <ReportsDialog open={showReports} onOpenChange={setShowReports} />

      {showEditCard && (
        <TaskDetailSheet
          card={showEditCard}
          open={!!showEditCard}
          onOpenChange={open => !open && setShowEditCard(null)}
          employees={employees}
          columns={columns}
          onUpdate={data => updateCardMutation.mutate({ id: showEditCard.id, ...data })}
          onDelete={() => deleteCardMutation.mutate(showEditCard.id)}
          t={t}
        />
      )}
    </div>
  );
}
