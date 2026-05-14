/** @module ProductivityInterviewDialogStep1 @description Step 1 panel — work experience (ish tajribasi). Renders per-workplace 4-question form with add/remove controls. */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import type { WorkplaceEntry } from "./ProductivityInterviewDialogTypes";

interface Step1Props {
  workplaces: WorkplaceEntry[];
  onUpdate: (id: string, field: keyof WorkplaceEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function Step1WorkExperience({ workplaces, onUpdate, onAdd, onRemove }: Step1Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-primary">Bo'lim 1: Har bir ish joyidan 4 savol</h3>
          <Badge variant="outline" className="text-[9px]">Maks. 3 ish joyi</Badge>
        </div>
        {workplaces.length < 3 && (
          <Button size="sm" variant="outline" onClick={onAdd} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            Ish joyi qo'shish
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Nomzodning oldingi har bir ish joyiga 4 ta asosiy savol beriladi.
      </p>

      {(Array.isArray(workplaces) ? workplaces : []).map((wp, idx) => (
        <div
          key={wp.id}
          className="border border-border/40 rounded-lg p-3 bg-muted/40 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary">{idx + 1}-ish joyi</p>
            {workplaces.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(wp.id)}
                className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-[var(--ep-red)]/90/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] mb-0.5 block text-muted-foreground">Kompaniya</Label>
              <Input
                className="h-7 text-xs"
                placeholder="Kompaniya nomi"
                value={wp.company}
                onChange={e => onUpdate(wp.id, "company", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[10px] mb-0.5 block text-muted-foreground">Lavozim</Label>
              <Input
                className="h-7 text-xs"
                placeholder="Lavozim"
                value={wp.position}
                onChange={e => onUpdate(wp.id, "position", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[10px] mb-0.5 block text-muted-foreground">Davomiylik</Label>
              <Input
                className="h-7 text-xs"
                placeholder="Masalan: 2 yil"
                value={wp.duration}
                onChange={e => onUpdate(wp.id, "duration", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">
              <span className="text-primary font-semibold">S1.</span> Eng murakkab vazifani ayting?
            </Label>
            <Textarea
              rows={2}
              className="text-xs"
              placeholder="Qanday murakkab vazifa oldingizda turgan?"
              value={wp.hard_task}
              onChange={e => onUpdate(wp.id, "hard_task", e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">
              <span className="text-primary font-semibold">S2.</span> Uni qanday hal qildingiz?
            </Label>
            <Textarea
              rows={2}
              className="text-xs"
              placeholder="Qanday yondashuv, nima natija chiqdi?"
              value={wp.how_solved}
              onChange={e => onUpdate(wp.id, "how_solved", e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">
              <span className="text-primary font-semibold">S3.</span> Tashabbuskorlik misoli?
            </Label>
            <Textarea
              rows={2}
              className="text-xs"
              placeholder="O'z tashabbusi bilan nima qildi? Birov so'ramasdan?"
              value={wp.initiative}
              onChange={e => onUpdate(wp.id, "initiative", e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block">
              <span className="text-primary font-semibold">S4.</span> Bu ish joyida nima o'rgandingiz?
            </Label>
            <Textarea
              rows={2}
              className="text-xs"
              placeholder="Asosiy dars yoki ko'nikma?"
              value={wp.lesson}
              onChange={e => onUpdate(wp.id, "lesson", e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
