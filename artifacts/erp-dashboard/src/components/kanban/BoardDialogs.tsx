/**
 * @module BoardDialogs
 * @description React UI component.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KanbanTranslations } from "./types";
// Permissive shape — accepts react-query UseMutationResult plus minimal handles.
// Components only need `mutate(...)` and `isPending`. We use `unknown` for the
// variables type, which forces callers to pass typed args through `as never`-style
// casts but lets us accept varied concrete mutation shapes from the parent.
interface KanbanMutation {
  mutate: (vars: unknown) => void;
  isPending: boolean;
}

interface Employee {
  id: number | string;
  fullName: string;
  position?: string;
}

interface ColumnShape {
  id: string | number;
  name?: string | null;
}

interface BoardDialogsProps {
  t:                    KanbanTranslations;
  showCreateBoard:      boolean;
  setShowCreateBoard:   (show: boolean) => void;
  newBoardName:         string;
  setNewBoardName:      (name: string) => void;
  createBoardMutation:  KanbanMutation;
  showQuickTask:        boolean;
  setShowQuickTask:     (show: boolean) => void;
  quickTaskType:        "task" | "project" | "template";
  quickTaskTitle:       string;
  setQuickTaskTitle:    (title: string) => void;
  createCardMutation:   KanbanMutation;
  selectedBoardId:      string | null;
  columns:              ColumnShape[];
  employees?:           Employee[];
  showAddColumn:        boolean;
  setShowAddColumn:     (show: boolean) => void;
  newColumnName:        string;
  setNewColumnName:     (name: string) => void;
  createColumnMutation: KanbanMutation;
}

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "🔴 Shoshilinch" },
  { value: "high",   label: "🟠 Yuqori" },
  { value: "normal", label: "🟢 O'rta" },
  { value: "low",    label: "⚪ Past" },
];

export function BoardDialogs({
  t: tProp,
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
  employees = [],
  showAddColumn,
  setShowAddColumn,
  newColumnName,
  setNewColumnName,
  createColumnMutation,
}: BoardDialogsProps) {
  const t = tProp as unknown as KanbanTranslations & ((key: string) => string);
  const [quickPriority, setQuickPriority] = useState<string>("normal");
  const [quickDueDate, setQuickDueDate]   = useState<string>("");
  const [quickAssignee, setQuickAssignee] = useState<string>("");
  const [quickColumnId, setQuickColumnId] = useState<string>("");

  // Reset local state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setQuickPriority("normal");
      setQuickDueDate("");
      setQuickAssignee("");
      setQuickColumnId(columns.length > 0 ? String(columns[0].id) : "");
    }
    setShowQuickTask(open);
  };

  const handleSubmitTask = () => {
    const colId = quickColumnId || (columns[0] ? String(columns[0].id) : null);
    if (!selectedBoardId || !colId) return;
    createCardMutation.mutate({
      title:    quickTaskTitle,
      columnId: colId,
      sortOrder: 0,
      priority: quickPriority,
      ...(quickDueDate  ? { dueDate:    quickDueDate }       : {}),
      ...(quickAssignee ? { assignedTo: Number(quickAssignee) } : {}),
    });
  };

  return (
    <>
      {/* ── Create Board ──────────────────────────────────────────────── */}
      <Dialog open={showCreateBoard} onOpenChange={setShowCreateBoard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t.board.newBoard}</DialogTitle>
            <DialogDescription>{t("yangiDoskaNomiKiriting")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("name")}</Label>
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder={t("doskaNomi")}
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

      {/* ── Quick Task ────────────────────────────────────────────────── */}
      <Dialog open={showQuickTask} onOpenChange={handleOpenChange}>
        <DialogContent style={{ maxWidth: 480 }} className="p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold"> {quickTaskType === "task"
                ? t.create.task
                : quickTaskType === "project"
                ? t.create.project
                : t.create.template}</DialogTitle>
            <DialogDescription>
              {columns.length === 0 ? "Avval ustun yarating" : "Yangi vazifa ma'lumotlari"}
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Title */}
            <div>
              <Label style={{ fontSize: 12, marginBottom: 4, display: "block" }}>{t.fields.title}</Label>
              <Input
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder={t("vazifaSarlavhasi")}
                data-testid="input-quick-task-title"
                disabled={columns.length === 0}
                style={{ fontSize: 14 }}
                autoFocus
              />
            </div>

            {/* Column selector */}
            {columns.length > 1 && (
              <div>
                <Label style={{ fontSize: 12, marginBottom: 4, display: "block" }}>{t("ustun")}</Label>
                <select
                  value={quickColumnId || String(columns[0]?.id ?? "")}
                  onChange={(e) => setQuickColumnId(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1px solid #E2E8F0", fontSize: 13, background: "#fff",
                    outline: "none", cursor: "pointer",
                  }}
                >
                  {columns.map(col => (
                    <option key={col.id} value={String(col.id)}>
                      {col.name || `Ustun ${col.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div>
              <Label style={{ fontSize: 12, marginBottom: 4, display: "block" }}>{t("priority")}</Label>
              <div style={{ display: "flex", gap: 6 }}>
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuickPriority(opt.value)}
                    style={{
                      flex:         1,
                      padding:      "6px 4px",
                      borderRadius: 8,
                      border:       quickPriority === opt.value
                        ? "2px solid #3B82F6"
                        : "2px solid #E2E8F0",
                      background:   quickPriority === opt.value ? "#EFF6FF" : "#fff",
                      fontSize:     11,
                      fontWeight:   quickPriority === opt.value ? 700 : 500,
                      cursor:       "pointer",
                      color:        "#374151",
                      transition:   "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row: due date + assignee */}
            <div style={{ display: "flex", gap: 10 }}>
              {/* Due date */}
              <div style={{ flex: 1 }}>
                <Label style={{ fontSize: 12, marginBottom: 4, display: "block" }}>{t("muddat")}</Label>
                <Input
                  type="datetime-local"
                  value={quickDueDate}
                  onChange={(e) => setQuickDueDate(e.target.value)}
                  style={{ fontSize: 13, padding: "7px 10px" }}
                />
              </div>

              {/* Assignee */}
              {employees.length > 0 && (
                <div style={{ flex: 1 }}>
                  <Label style={{ fontSize: 12, marginBottom: 4, display: "block" }}>{t("masul")}</Label>
                  <select
                    value={quickAssignee}
                    onChange={(e) => setQuickAssignee(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 8,
                      border: "1px solid #E2E8F0", fontSize: 13, background: "#fff",
                      outline: "none", cursor: "pointer", height: 38,
                    }}
                  >
                    <option value="">{t("belgilanmagan")}</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={String(emp.id)}>
                        {emp.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {columns.length === 0 && (
              <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>
                {t("avvalUstunQoshishOrqaliKamida")}
              </p>
            )}
          </div>

          <DialogFooter style={{ marginTop: 4 }}>
            <Button variant="outline" onClick={() => setShowQuickTask(false)}>{t.actions.cancel}</Button>
            <Button
              onClick={handleSubmitTask}
              disabled={
                !quickTaskTitle.trim() ||
                !selectedBoardId       ||
                columns.length === 0   ||
                createCardMutation.isPending
              }
              data-testid="button-submit-quick-task"
            >
              {createCardMutation.isPending ? "Saqlanmoqda..." : t.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Column ────────────────────────────────────────────────── */}
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t.board.newColumn}</DialogTitle>
            <DialogDescription>{t("yangiUstunNomiKiriting")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("name")}</Label>
              <Input
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder={t("ustunNomi")}
                data-testid="input-column-name"
                autoFocus
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
