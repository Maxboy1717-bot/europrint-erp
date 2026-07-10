/**
 * @module KanbanBoardSections
 * @description Empty-state panel for KanbanBoard (no board selected) and the
 * main content switcher that renders the correct view based on viewMode.
 * All heavy sub-components (KanbanBoardView, ListView, GanttView, etc.) are
 * imported from their own files and simply composed here.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FolderKanban } from "lucide-react";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";

import { CardOverlay } from "./kanban/KanbanCard";
import { DeadlineColumn } from "./kanban/DeadlineColumn";
import { CalendarView } from "./kanban/CalendarView";
import { GanttView } from "./kanban/GanttView";
import { MyPlanView } from "./kanban/MyPlanView";
import { ResourceAllocationView } from "./kanban/ResourceAllocationView";
import { DashboardPanel } from "./kanban/DashboardPanel";
import { ListView } from "./kanban/ListView";

import { KanbanBoardView } from "@/components/kanban/KanbanBoardView";
import { DEADLINE_COLUMNS } from "@/components/kanban/types";

import type { KanbanT } from "./KanbanBoardTypes";
import type { useKanbanBoard } from "@/hooks/useKanbanBoard";
import { tLabel } from "@/lib/i18n/tLabel";

type BoardHook = ReturnType<typeof useKanbanBoard>;

// ─── Empty-state / no-board-selected panel ───────────────────────────────────

interface EmptyBoardStateProps {
  t: KanbanT & ((key: string) => string);
  isQuickStartPending: boolean;
  onQuickStart: () => void;
  onCreateBoard: () => void;
}

export function EmptyBoardState({
  t,
  isQuickStartPending,
  onQuickStart,
  onCreateBoard,
}: EmptyBoardStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ flex: 1, minHeight: 280 }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: "var(--ep-surface)",
          boxShadow:
            "8px 8px 20px rgba(163,177,198,0.45), -5px -5px 14px rgba(255,255,255,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <FolderKanban style={{ width: 36, height: 36, color: "var(--ep-blue)", opacity: 0.75 }} />
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ep-text)", marginBottom: 8 }}>
        {t.empty.selectBoard}
      </h3>
      <p style={{ fontSize: 13, color: "var(--ep-muted)", marginBottom: 28, maxWidth: 360 }}>
        {tLabel("kanban.birinchiDoskangizniYaratingYokiEuroprint", "Birinchi doskangizni yarating yoki EuroPrint shabloni ishlatib boshlang.")}
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onQuickStart}
          disabled={isQuickStartPending}
          data-testid="button-quick-start"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 24px",
            borderRadius: 14,
            border: "none",
            cursor: isQuickStartPending ? "wait" : "pointer",
            fontSize: 14,
            fontWeight: 700,
            background: "var(--ep-blue)",
            color: "var(--ep-surface)",
            boxShadow:
              "5px 5px 14px rgba(91,155,213,0.45), -2px -2px 6px rgba(255,255,255,0.50)",
            transition: "box-shadow 0.18s, opacity 0.18s",
            opacity: isQuickStartPending ? 0.7 : 1,
          }}
          onMouseEnter={e => {
            if (!isQuickStartPending)
              (e.currentTarget as HTMLElement).style.boxShadow =
                "7px 7px 20px rgba(91,155,213,0.58)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "5px 5px 14px rgba(91,155,213,0.45)";
          }}
        >
          <FolderKanban style={{ width: 16, height: 16 }} />
          {isQuickStartPending
            ? tLabel("kanban.yaratilmoqda", "Yaratilmoqda...")
            : tLabel("kanban.europrintTezkorBoshlash", "⚡ Europrint tezkor boshlash")}
        </button>

        <button
          onClick={onCreateBoard}
          data-testid="button-create-board-empty"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 20px",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            background: "var(--ep-surface)",
            color: "var(--ep-muted)",
            boxShadow:
              "4px 4px 12px rgba(163,177,198,0.40), -3px -3px 8px rgba(255,255,255,0.80)",
            transition: "box-shadow 0.18s",
          }}
          onMouseEnter={e =>
            ((e.currentTarget as HTMLElement).style.boxShadow =
              "6px 6px 16px rgba(163,177,198,0.55)")
          }
          onMouseLeave={e =>
            ((e.currentTarget as HTMLElement).style.boxShadow =
              "4px 4px 12px rgba(163,177,198,0.40)")
          }
        >
          <Plus style={{ width: 15, height: 15 }} />
          {t.empty.createBoard}
        </button>
      </div>

      <p style={{ fontSize: 11, color: "var(--ep-muted)", marginTop: 16 }}>
        {tLabel("kanban.tezkorBoshlashKiruvchiRejadaJarayonda", "Tezkor boshlash: Kiruvchi, Rejada, Jarayonda, Yakunlangan ustunlari avtomatik yaratiladi.")}
      </p>
    </div>
  );
}

// ─── Board content area (view switcher) ──────────────────────────────────────

interface BoardContentProps
  extends Pick<
    BoardHook,
    | "viewMode"
    | "sensors"
    | "handleDragStart"
    | "handleDragEnd"
    | "columns"
    | "cardsByColumn"
    | "cardsByDeadline"
    | "filteredCards"
    | "activeCard"
    | "selectedBoardId"
    | "boardLoading"
    | "setShowEditCard"
    | "setShowAddColumn"
    | "setShowQuickTask"
    | "setQuickTaskTitle"
    | "deleteColumnMutation"
    | "updateCardMutation"
  > {
  t: KanbanT & ((key: string) => string);
  quickTaskType: string;
  setQuickTaskType: (v: string) => void;
}

export function BoardContent({
  viewMode,
  sensors,
  handleDragStart,
  handleDragEnd,
  columns,
  cardsByColumn,
  cardsByDeadline,
  filteredCards,
  activeCard,
  selectedBoardId,
  boardLoading,
  setShowEditCard,
  setShowAddColumn,
  setShowQuickTask,
  setQuickTaskTitle,
  deleteColumnMutation,
  updateCardMutation,
  t,
  setQuickTaskType,
}: BoardContentProps) {
  if (boardLoading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={`k-${i}`} className="h-[500px] w-72 flex-shrink-0 rounded-lg" />
        ))}
      </div>
    );
  }

  if (viewMode === "kanban") {
    return (
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
        onDeleteColumn={colId => deleteColumnMutation.mutate(colId)}
        selectedBoardId={selectedBoardId}
        activeCard={activeCard}
        t={t}
      />
    );
  }

  if (viewMode === "list") {
    return (
      <ListView cards={filteredCards} columns={columns} onCardClick={setShowEditCard} t={t} />
    );
  }

  if (viewMode === "deadlines") {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full h-full">
          <div className="flex gap-4 pb-4">
            {(Object.keys(DEADLINE_COLUMNS) as Array<keyof typeof DEADLINE_COLUMNS>).map(key => (
              <DeadlineColumn
                key={key}
                columnKey={key}
                cards={cardsByDeadline[key]}
                onCardClick={setShowEditCard}
                onAddCard={() => {
                  setQuickTaskType("task");
                  setShowQuickTask(true);
                }}
                t={t}
              />
            ))}
          </div>
        </ScrollArea>
        <DragOverlay>{activeCard && <CardOverlay card={activeCard} />}</DragOverlay>
      </DndContext>
    );
  }

  if (viewMode === "calendar") {
    return (
      <CalendarView
        cards={filteredCards}
        onCardClick={setShowEditCard}
        onCreateTask={() => {
          if (selectedBoardId && columns.length > 0) {
            setQuickTaskTitle("");
            setShowQuickTask(true);
          }
        }}
        t={t}
      />
    );
  }

  if (viewMode === "gantt") {
    return (
      <GanttView cards={filteredCards} columns={columns} onCardClick={setShowEditCard} t={t} />
    );
  }

  if (viewMode === "myPlan") {
    return (
      <MyPlanView
        cards={filteredCards}
        onCardClick={setShowEditCard}
        onToggleComplete={card =>
          updateCardMutation.mutate({
            id: card.id,
            status: card.status === "completed" ? "active" : "completed",
          })
        }
        t={t}
      />
    );
  }

  if (viewMode === "dashboard") {
    return <DashboardPanel t={t} boardId={selectedBoardId} />;
  }

  if (viewMode === "allocation") {
    return <ResourceAllocationView t={t} boardId={selectedBoardId} />;
  }

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p>{tLabel("kanban.buKorinishHaliTayyorEmas", "Bu ko'rinish hali tayyor emas")}</p>
    </div>
  );
}
