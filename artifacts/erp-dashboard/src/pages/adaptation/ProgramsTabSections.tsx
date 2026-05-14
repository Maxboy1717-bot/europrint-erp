/** @module ProgramsTabSections @description Reusable section/panel components for the ProgramsTab feature: TaskEditor and CheckpointEditor. */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, CheckSquare, Flag } from "lucide-react";
import type { TaskItem, CheckpointItem } from "./ProgramsTabTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// TaskEditor
// ---------------------------------------------------------------------------

interface TaskEditorProps {
  tasks: TaskItem[];
  onChange: (t: TaskItem[]) => void;
}

export function TaskEditor({ tasks, onChange }: TaskEditorProps) {
  const { t } = useTranslation("common");
  const addTask = () => onChange([...tasks, { title: "", description: "", day: 1 }]);
  const removeTask = (i: number) =>
    onChange((Array.isArray(tasks) ? tasks : []).filter((_, idx) => idx !== i));
  const updateTask = (i: number, field: keyof TaskItem, value: string | number) => {
    const copy = (Array.isArray(tasks) ? tasks : []).map((t, idx) =>
      idx === i ? { ...t, [field]: value } : t,
    );
    onChange(copy);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <CheckSquare className="w-4 h-4 text-primary" />
          Vazifalar ({tasks.length})
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addTask}
          data-testid="button-add-task"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> {t("vazifaQoshish")}
        </Button>
      </div>

      {tasks.length === 0 && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 text-center">
          {t("haliVazifalarYoqVazifaQoshish")}
        </p>
      )}

      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {(Array.isArray(tasks) ? tasks : []).map((task, i) => (
          <div
            key={`k-${i}`}
            className="flex gap-2 items-start bg-muted/30 rounded-lg p-2.5 border border-border/50"
            data-testid={`task-row-${i}`}
          >
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-2">
              <div className="col-span-2">
                <Input
                  placeholder={t("vazifaNomi1")}
                  value={task.title}
                  onChange={e => updateTask(i, "title", e.target.value)}
                  className="h-8 text-xs"
                  data-testid={`task-title-${i}`}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder={t("progress.description")}
                  value={task.description}
                  onChange={e => updateTask(i, "description", e.target.value)}
                  className="h-8 text-xs"
                  data-testid={`task-desc-${i}`}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder={t("kun")}
                  value={task.day}
                  min={1}
                  onChange={e => updateTask(i, "day", parseInt(e.target.value) || 1)}
                  className="h-8 text-xs"
                  data-testid={`task-day-${i}`}
                />
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              onClick={() => removeTask(i)}
              data-testid={`task-remove-${i}`}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CheckpointEditor
// ---------------------------------------------------------------------------

interface CheckpointEditorProps {
  checkpoints: CheckpointItem[];
  onChange: (c: CheckpointItem[]) => void;
}

export function CheckpointEditor({ checkpoints, onChange }: CheckpointEditorProps) {
  const { t } = useTranslation("common");
  const addCheckpoint = () =>
    onChange([...checkpoints, { day: 7, title: "", description: "" }]);
  const removeCheckpoint = (i: number) =>
    onChange((Array.isArray(checkpoints) ? checkpoints : []).filter((_, idx) => idx !== i));
  const updateCheckpoint = (
    i: number,
    field: keyof CheckpointItem,
    value: string | number,
  ) => {
    const copy = (Array.isArray(checkpoints) ? checkpoints : []).map((c, idx) =>
      idx === i ? { ...c, [field]: value } : c,
    );
    onChange(copy);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Flag className="w-4 h-4 text-primary" />
          Tekshirish nuqtalari ({checkpoints.length})
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addCheckpoint}
          data-testid="button-add-checkpoint"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> {t("nuqtaQoshish")}
        </Button>
      </div>

      {checkpoints.length === 0 && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 text-center">
          {t("haliTekshirishNuqtalariYoq")}
        </p>
      )}

      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {(Array.isArray(checkpoints) ? checkpoints : []).map((cp, i) => (
          <div
            key={`k-${i}`}
            className="flex gap-2 items-start bg-muted/30 rounded-lg p-2.5 border border-border/50"
            data-testid={`checkpoint-row-${i}`}
          >
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder={t("kun")}
                  value={cp.day}
                  min={1}
                  onChange={e => updateCheckpoint(i, "day", parseInt(e.target.value) || 1)}
                  className="h-8 text-xs"
                  data-testid={`checkpoint-day-${i}`}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder={t("nomi")}
                  value={cp.title}
                  onChange={e => updateCheckpoint(i, "title", e.target.value)}
                  className="h-8 text-xs"
                  data-testid={`checkpoint-title-${i}`}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder={t("progress.description")}
                  value={cp.description}
                  onChange={e => updateCheckpoint(i, "description", e.target.value)}
                  className="h-8 text-xs"
                  data-testid={`checkpoint-desc-${i}`}
                />
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              onClick={() => removeCheckpoint(i)}
              data-testid={`checkpoint-remove-${i}`}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
