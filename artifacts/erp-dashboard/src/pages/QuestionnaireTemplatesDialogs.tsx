/**
 * @module QuestionnaireTemplatesDialogs
 * @description Dialog and form components for the QuestionnaireTemplates page.
 * Includes the preset-picker dialog, the template create/edit dialog, and the
 * question create/edit dialog. Each dialog is self-contained with its own
 * trigger and receives all state/handlers from the parent orchestrator via
 * props.
 */

import { UseFormReturn } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Star } from "lucide-react";
import type { TemplateFormData, QuestionFormData, TemplateWithPosition, Position } from "./QuestionnaireTemplatesTypes";
import type { QuestionnaireQuestion } from "@shared/schema";

import { useTranslation } from '@/lib/i18n';
// ---------------------------------------------------------------------------
// PresetsDialog
// ---------------------------------------------------------------------------

interface PresetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUsePreset: (presetKey: string) => void;
}

export function PresetsDialog({open, onOpenChange, onUsePreset }: PresetsDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-presets">
          <Star className="w-4 h-4 mr-2" />
          Tayyor shablonlar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Tayyor shablonlarni tanlang</DialogTitle>
          <DialogDescription>
            Quyidagi shablonlardan birini tanlang - savollar avtomatik qo'shiladi
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUsePreset("reception")}
            data-testid="preset-reception"
          >
            <div className="font-semibold">Qabulxona</div>
            <div className="text-xs text-muted-foreground">5 ta savol</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUsePreset("marketing")}
            data-testid="preset-marketing"
          >
            <div className="font-semibold">{t('marketing')}</div>
            <div className="text-xs text-muted-foreground">5 ta savol</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUsePreset("developer")}
            data-testid="preset-developer"
          >
            <div className="font-semibold">Dasturchi</div>
            <div className="text-xs text-muted-foreground">5 ta savol</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUsePreset("sales")}
            data-testid="preset-sales"
          >
            <div className="font-semibold">Sotuvchi</div>
            <div className="text-xs text-muted-foreground">5 ta savol</div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TemplateDialog
// ---------------------------------------------------------------------------

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: TemplateWithPosition | null;
  form: UseFormReturn<TemplateFormData>;
  positions: Position[];
  onOpenNew: () => void;
  onSubmit: (data: TemplateFormData) => void;
}

export function TemplateDialog({
  open,
  onOpenChange,
  editingTemplate,
  form,
  positions,
  onOpenNew,
  onSubmit,
}: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onOpenNew} data-testid="button-add-template">
          <Plus className="w-4 h-4 mr-2" />
          Yangi shablon
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{editingTemplate ? "Shablonni tahrirlash" : "Yangi shablon"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nomi (UZ) <span className="text-destructive">*</span></Label>
              <Input id="name" {...form.register("name")} data-testid="input-name" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="nameRu">Nomi (RU) <span className="text-destructive">*</span></Label>
              <Input id="nameRu" {...form.register("nameRu")} data-testid="input-name-ru" />
              {form.formState.errors.nameRu && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.nameRu.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">Tavsif (UZ)</Label>
              <Textarea id="description" {...form.register("description")} rows={3} data-testid="input-description" />
            </div>
            <div>
              <Label htmlFor="descriptionRu">Tavsif (RU)</Label>
              <Textarea id="descriptionRu" {...form.register("descriptionRu")} rows={3} data-testid="input-description-ru" />
            </div>
          </div>
          <div>
            <Label htmlFor="positionId">Lavozim (agar ma'lum lavozim uchun bo'lsa)</Label>
            <Select
              value={form.watch("positionId")}
              onValueChange={(value) => form.setValue("positionId", value)}
            >
              <SelectTrigger data-testid="select-position" className="h-9">
                <SelectValue placeholder="Lavozim tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Barcha lavozimlar uchun</SelectItem>
                {(Array.isArray(positions) ? positions : []).map((p: Position) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" data-testid="button-submit-template">
              {editingTemplate ? "Yangilash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// QuestionDialog
// ---------------------------------------------------------------------------

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuestion: QuestionnaireQuestion | null;
  form: UseFormReturn<QuestionFormData>;
  onOpenNew: () => void;
  onSubmit: (data: QuestionFormData) => void;
}

export function QuestionDialog({
  open,
  onOpenChange,
  editingQuestion,
  form,
  onOpenNew,
  onSubmit,
}: QuestionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onOpenNew} data-testid="button-add-question">
          <Plus className="w-4 h-4 mr-2" />
          Savol qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{editingQuestion ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="question">Savol (UZ) <span className="text-destructive">*</span></Label>
              <Input id="question" {...form.register("question")} data-testid="input-question" />
              {form.formState.errors.question && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.question.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="questionRu">Savol (RU) <span className="text-destructive">*</span></Label>
              <Input id="questionRu" {...form.register("questionRu")} data-testid="input-question-ru" />
              {form.formState.errors.questionRu && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.questionRu.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="questionType">Savol turi <span className="text-destructive">*</span></Label>
              <Select
                value={form.watch("questionType")}
                onValueChange={(value) => form.setValue("questionType", value)}
              >
                <SelectTrigger data-testid="select-question-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Matn</SelectItem>
                  <SelectItem value="yes_no">Ha/Yo'q</SelectItem>
                  <SelectItem value="multiple_choice">Ko'p variantli</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="order">Tartib raqami <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                id="order"
                {...form.register("order", { valueAsNumber: true })}
                data-testid="input-order"
              />
              {form.formState.errors.order && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.order.message}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRequired"
              {...form.register("isRequired")}
              className="rounded"
              data-testid="checkbox-required"
            />
            <Label htmlFor="isRequired">Majburiy savol</Label>
          </div>
          <DialogFooter>
            <Button type="submit" data-testid="button-submit-question">
              {editingQuestion ? "Yangilash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
