import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KanbanTranslations } from "./types";

interface KanbanMutation {
  mutate: (vars: Record<string, unknown>) => void;
  isPending: boolean;
}

interface BoardDialogsProps {
  t: KanbanTranslations;
  showCreateBoard: boolean;
  setShowCreateBoard: (show: boolean) => void;
  newBoardName: string;
  setNewBoardName: (name: string) => void;
  createBoardMutation: KanbanMutation;
  showQuickTask: boolean;
  setShowQuickTask: (show: boolean) => void;
  quickTaskType: "task" | "project" | "template";
  quickTaskTitle: string;
  setQuickTaskTitle: (title: string) => void;
  createCardMutation: KanbanMutation;
  selectedBoardId: string | null;
  columns: Record<string, unknown>[];
  showAddColumn: boolean;
  setShowAddColumn: (show: boolean) => void;
  newColumnName: string;
  setNewColumnName: (name: string) => void;
  createColumnMutation: KanbanMutation;
}

export function BoardDialogs({
  t,
  showCreateBoard,
  setShowCreateBoard,
  newBoardName,
  setNewBoardName,
  createBoardMutation,
  showQuickTask,
  setShowQuickTask,
  quickTaskType,
  quickTaskTitle,
  setQuickTaskTitle,
  createCardMutation,
  selectedBoardId,
  columns,
  showAddColumn,
  setShowAddColumn,
  newColumnName,
  setNewColumnName,
  createColumnMutation,
}: BoardDialogsProps) {
  return (
    <>
      <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.board.newBoard}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nomi</Label>
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Doska nomi"
                data-testid="input-board-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBoard(false)}>{t.actions.cancel}</Button>
            <Button
              onClick={() => createBoardMutation.mutate({ name: newBoardName, type: "custom" })}
              disabled={!newBoardName.trim() || createBoardMutation.isPending}
              data-testid="button-submit-board"
            >
              {t.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQuickTask} onOpenChange={setShowQuickTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{quickTaskType === "task" ? t.create.task : quickTaskType === "project" ? t.create.project : t.create.template}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.fields.title}</Label>
              <Input
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder={t.fields.title}
                data-testid="input-quick-task-title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickTask(false)}>{t.actions.cancel}</Button>
            <Button
              onClick={() => {
                if (selectedBoardId && columns.length > 0) {
                  createCardMutation.mutate({
                    title: quickTaskTitle,
                    columnId: columns[0].id,
                    sortOrder: 0,
                    priority: "normal",
                  });
                }
              }}
              disabled={!quickTaskTitle.trim() || !selectedBoardId || columns.length === 0 || createCardMutation.isPending}
              data-testid="button-submit-quick-task"
            >
              {t.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.board.newColumn}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nomi</Label>
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Ustun nomi"
                data-testid="input-column-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddColumn(false)}>{t.actions.cancel}</Button>
            <Button
              onClick={() => createColumnMutation.mutate({ name: newColumnName, sortOrder: columns.length })}
              disabled={!newColumnName.trim() || createColumnMutation.isPending}
              data-testid="button-submit-column"
            >
              {t.actions.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
