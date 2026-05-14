/**
 * @module CameraMissionEditor
 * @description React UI component.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_TASK_CATALOG, AI_TASK_GROUPS, normalizeCategories, type AiTaskGroup } from "../taskCatalog";
import type { CameraAiRow } from "../types";
import { cn } from "@/lib/utils";
import "../camera-ai-visual.css";

interface CameraMissionEditorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  camera: CameraAiRow | null;
  lang: "uz" | "ru";
  isSaving: boolean;
  onSave: (payload: {
    aiCategories: string[];
    aiPrompt: string | null;
    aiSensitivity: "low" | "medium" | "high";
  }) => void;
}

export function CameraMissionEditor({
  open,
  onOpenChange,
  camera,
  lang,
  isSaving,
  onSave,
}: CameraMissionEditorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState("");
  const [sensitivity, setSensitivity] = useState<"low" | "medium" | "high">("medium");

  useEffect(() => {
    if (!camera || !open) return;
    setSelected(new Set(normalizeCategories(camera.aiCategories)));
    setPrompt(camera.aiPrompt ?? "");
    const s = camera.aiSensitivity;
    setSensitivity(s === "low" || s === "high" ? s : "medium");
  }, [camera, open]);

  const byGroup = useMemo(() => {
    const m = new Map<AiTaskGroup, typeof AI_TASK_CATALOG>();
    for (const t of AI_TASK_CATALOG) {
      const arr = m.get(t.group) ?? [];
      arr.push(t);
      m.set(t.group, arr);
    }
    return m;
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  if (!camera) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cai-mission-dialog max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-cyan-500/30 bg-card sm:rounded-xl">
        <div className="cai-mission-header">
          <DialogHeader className="text-left space-y-2 p-0">
            <DialogTitle className="cai-mission-title">
              {lang === "uz" ? "AI topshiriqlar markazi" : "Центр задач AI"}
            </DialogTitle>
            <DialogDescription className="cai-mission-desc">
              <span className="font-semibold text-foreground/90">{camera.name}</span>
              {camera.code ? ` · ${camera.code}` : ""}
              <br />
              {lang === "uz"
                ? "Davlat va korxona nazorati uchun har vazifa alohida yoqiladi."
                : "Каждая задача включается отдельно."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 max-h-[46vh] px-5">
          <div className="space-y-6 py-4">
            {(Array.from(byGroup.entries()) as [AiTaskGroup, typeof AI_TASK_CATALOG][]).map(([group, tasks]) => (
              <div key={group}>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ep-cyan)] dark:text-cyan-400 mb-2">
                  {lang === "uz" ? AI_TASK_GROUPS[group].uz : AI_TASK_GROUPS[group].ru}
                </p>
                <div className="space-y-2">
                  {(Array.isArray(tasks) ? tasks : []).map((task) => (
                    <label
                      key={task.id}
                      className={cn(
                        "cai-task-pill flex gap-3 cursor-pointer transition-colors",
                        selected.has(task.id) && "cai-task-pill-active",
                      )}
                    >
                      <Checkbox
                        checked={selected.has(task.id)}
                        onCheckedChange={() => toggle(task.id)}
                        className="mt-0.5 border-cyan-500/50 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                      />
                      <span className="min-w-0">
                        <span className="font-semibold text-sm block">
                          {lang === "uz" ? task.labelUz : task.labelRu}
                        </span>
                        <span className="text-xs text-muted-foreground">{task.hintUz}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="px-5 space-y-3 border-t border-border/80 pt-4 bg-muted/20">
          <div className="space-y-1">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {lang === "uz" ? "Sezgirlik" : "Чувствительность"}
            </Label>
            <Select value={sensitivity} onValueChange={(v) => setSensitivity(v as typeof sensitivity)}>
              <SelectTrigger className="rounded-xl border-cyan-500/20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{lang === "uz" ? "Past" : "Низкая"}</SelectItem>
                <SelectItem value="medium">{lang === "uz" ? "O‘rtacha" : "Средняя"}</SelectItem>
                <SelectItem value="high">{lang === "uz" ? "Yuqori" : "Высокая"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {lang === "uz" ? "Operator prompti" : "Промпт оператора"}
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={
                lang === "uz"
                  ? "Masalan: faqat sariq kaskani PPE deb hisobla..."
                  : "Например: только жёлтые каски..."
              }
              className="resize-none text-sm rounded-xl border-cyan-500/15"
            />
          </div>
        </div>

        <DialogFooter className="p-5 pt-3 border-t border-border/80 gap-2 sm:gap-0 bg-card">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            {lang === "uz" ? "Bekor" : "Отмена"}
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            className="cai-btn-primary rounded-xl px-6"
            onClick={() =>
              onSave({
                aiCategories: Array.from(selected),
                aiPrompt: prompt.trim() || null,
                aiSensitivity: sensitivity,
              })
            }
          >
            {isSaving ? "…" : lang === "uz" ? "Saqlash" : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
