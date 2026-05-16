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
          {t("tayyorShablonlar")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("tayyorShablonlarniTanlang")}</DialogTitle>
          <DialogDescription>
            {t("quyidagiShablonlardanBiriniTanlangSavollar")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUsePreset("reception")}
            data-testid="preset-reception"
          >
            <div className="font-semibold">{t("qabulxona")}</div>
            <div className="text-xs text-muted-foreground">{t("k5TaSavol")}</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUsePreset("marketing")}
            data-testid="preset-marketing"
          >
            <div className="font-semibold">{t('marketing')}</div>
            <div className="text-xs text-muted-foreground">{t("k5TaSavol2")}</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUsePreset("developer")}
            data-testid="preset-developer"
          >
            <div className="font-semibold">{t("dasturchi")}</div>
            <div className="text-xs text-muted-foreground">{t("k5TaSavol3")}</div>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4"
            onClick={() => onUsePreset("sales")}
            data-testid="preset-sales"
          >
            <div className="font-semibold">{t("sotuvchi")}</div>
            <div className="text-xs text-muted-foreground">{t("k5TaSavol4")}</div>
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
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onOpenNew} data-testid="button-add-template">
          <Plus className="w-4 h-4 mr-2" />
          {t("yangiShablon")}
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
              <Label htmlFor="description">{t("tavsifUz")}</Label>
              <Textarea id="description" {...form.register("description")} rows={3} data-testid="input-description" />
            </div>
            <div>
              <Label htmlFor="descriptionRu">{t("tavsifRu")}</Label>
              <Textarea id="descriptionRu" {...form.register("descriptionRu")} rows={3} data-testid="input-description-ru" />
            </div>
          </div>
          <div>
            <Label htmlFor="positionId">{t("lavozimAgarMaLumLavozimUchun")}</Label>
            <Select
              value={form.watch("positionId")}
              onValueChange={(value) => form.setValue("positionId", value)}
            >
              <SelectTrigger data-testid="select-position" className="h-9">
                <SelectValue placeholder={t("lavozimTanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("barchaLavozimlarUchun")}</SelectItem>
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
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onOpenNew} data-testid="button-add-question">
          <Plus className="w-4 h-4 mr-2" />
          {t("savolQoshish")}
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
              <Label htmlFor="questionType">{t("savolTuri1")}<span className="text-destructive">*</span></Label>
              <Select
                value={form.watch("questionType")}
                onValueChange={(value) => form.setValue("questionType", value)}
              >
                <SelectTrigger data-testid="select-question-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t("matn")}</SelectItem>
                  <SelectItem value="yes_no">Ha/Yo'q</SelectItem>
                  <SelectItem value="multiple_choice">{t("kopVariantli")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="order">{t("tartibRaqami")}<span className="text-destructive">*</span></Label>
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
            <Label htmlFor="isRequired">{t("majburiySavol")}</Label>
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
