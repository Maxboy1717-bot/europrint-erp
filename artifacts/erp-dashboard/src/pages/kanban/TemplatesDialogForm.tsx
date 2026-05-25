/**
 * @module TemplatesDialogForm
 * @description Create/edit template form used inside TemplatesDialog.
 * Split from TemplatesDialog.tsx (Rule 16).
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type T } from "./kanban-types";

export type TemplateFormData = { name: string; title: string; description: string; priority: string };

interface Props {
  formData: TemplateFormData;
  onFormChange: (form: TemplateFormData) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isPending: boolean;
  t: typeof T.uz;
}

export function TemplatesDialogForm({ formData, onFormChange, onCancel, onSubmit, isPending, t }: Props) {
  const fd = formData;
  const set = (patch: Partial<TemplateFormData>) => onFormChange({ ...fd, ...patch });

  return (
    <div className="space-y-4">
      <div>
        <Label>{t.templates.name}</Label>
        <Input
          value={fd.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder={t.templates.name}
          data-testid="input-template-name"
        />
      </div>
      <div>
        <Label>{t.templates.taskTitle}</Label>
        <Input
          value={fd.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder={t.templates.taskTitle}
          data-testid="input-template-title"
        />
      </div>
      <div>
        <Label>{t.fields.description}</Label>
        <Textarea
          value={fd.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder={t.fields.description}
          data-testid="input-template-description"
        />
      </div>
      <div>
        <Label>{t.fields.priority}</Label>
        <Select value={fd.priority} onValueChange={(v) => set({ priority: v })}>
          <SelectTrigger data-testid="select-template-priority" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgent">{t.priority.urgent}</SelectItem>
            <SelectItem value="high">{t.priority.high}</SelectItem>
            <SelectItem value="normal">{t.priority.normal}</SelectItem>
            <SelectItem value="low">{t.priority.low}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t.actions.cancel}</Button>
        <Button
          onClick={onSubmit}
          disabled={!fd.name || !fd.title || isPending}
          data-testid="button-save-template"
        >
          {t.actions.save}
        </Button>
      </div>
    </div>
  );
}
