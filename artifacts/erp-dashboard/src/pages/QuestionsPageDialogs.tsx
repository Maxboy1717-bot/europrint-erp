/**
 * @module QuestionsPageDialogs
 * @description Dialogs for QuestionsPage:
 *   - CreateQuestionDialog — form to create a new question
 *   - DeleteQuestionAlert — confirmation alert before deletion
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from '@/lib/i18n';
import {
  DIFFICULTY_MAP,
  TYPE_LABELS,
  type QuestionFormState,
} from "./QuestionsPageTypes";

// ─── Create dialog ────────────────────────────────────────────────────────────

interface CreateQuestionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: QuestionFormState;
  onFormChange: (f: QuestionFormState) => void;
  onSubmit: () => void;
  isSubmitPending: boolean;
}

export function CreateQuestionDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isSubmitPending,
}: CreateQuestionDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiSavol")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>{t("savolMatni1")}</Label>
            <Textarea
              value={form.question_text}
              onChange={e => onFormChange({ ...form, question_text: e.target.value })}
              placeholder={t("savol1")}
              rows={3}
              data-testid="input-question-text"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>{t("tur")}</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={form.question_type}
                onChange={e => onFormChange({ ...form, question_type: e.target.value })}
                data-testid="select-question-type"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("qiyinlik")}</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={form.difficulty}
                onChange={e => onFormChange({ ...form, difficulty: e.target.value })}
                data-testid="select-question-difficulty"
              >
                {Object.entries(DIFFICULTY_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("ball")}</Label>
              <Input
                type="number"
                value={form.points}
                onChange={e => onFormChange({ ...form, points: e.target.value })}
                min="1"
                data-testid="input-question-points"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("testId1")}</Label>
            <Input
              value={form.test_id}
              onChange={e => onFormChange({ ...form, test_id: e.target.value })}
              placeholder="Test ID (ixtiyoriy)"
              data-testid="input-question-test-id"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Bekor")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!form.question_text.trim() || isSubmitPending}
            data-testid="button-confirm-create-question"
          >
            {isSubmitPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete confirmation alert ────────────────────────────────────────────────

interface DeleteQuestionAlertProps {
  deleteId: string | number | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteQuestionAlert({
  deleteId,
  onOpenChange,
  onConfirm,
}: DeleteQuestionAlertProps) {
  const { t } = useTranslation("common");
  return (
    <AlertDialog open={deleteId !== null} onOpenChange={open => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("savolniOchirish")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("buSavolniOchirishniTasdiqlaysizmi")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Bekor")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground"
            onClick={onConfirm}
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
