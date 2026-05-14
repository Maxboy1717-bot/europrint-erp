/**
 * @module QuestionnaireDialogs
 * @description Dialog components for the Questionnaire page:
 *   - AddQuestionDialog — create a new questionnaire question
 *   - ViewResponseDialog — inspect and update a candidate response
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewQuestion, QuestionnaireResponse } from "./QuestionnaireTypes";
import { getStatusBadge } from "./QuestionnaireSections";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// AddQuestionDialog
// ---------------------------------------------------------------------------

type AddQuestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newQuestion: NewQuestion;
  onNewQuestionChange: (q: NewQuestion) => void;
  onSave: () => void;
  isSaving: boolean;
};

export function AddQuestionDialog({
  open,
  onOpenChange,
  newQuestion,
  onNewQuestionChange,
  onSave,
  isSaving,
}: AddQuestionDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-question" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiSavolQoshish")}</DialogTitle>
          <DialogDescription>{t("telegramBotdaKorsatiladiganYangiSavol")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="order">{t("tartibRaqami")}</Label>
            <Input
              id="order"
              type="number"
              value={newQuestion.order}
              onChange={(e) =>
                onNewQuestionChange({ ...newQuestion, order: parseInt(e.target.value) || 1 })
              }
              data-testid="input-order"
            />
          </div>
          <div>
            <Label htmlFor="question">Savol (O'zbek)</Label>
            <Input
              id="question"
              value={newQuestion.question}
              onChange={(e) =>
                onNewQuestionChange({ ...newQuestion, question: e.target.value })
              }
              placeholder={t("masalanToliqIsmingiz")}
              data-testid="input-question-uz"
            />
          </div>
          <div>
            <Label htmlFor="questionRu">Savol (Rus)</Label>
            <Input
              id="questionRu"
              value={newQuestion.questionRu}
              onChange={(e) =>
                onNewQuestionChange({ ...newQuestion, questionRu: e.target.value })
              }
              placeholder="Например: Полное имя"
              data-testid="input-question-ru"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            data-testid="button-save-question"
          >
            {isSaving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ViewResponseDialog
// ---------------------------------------------------------------------------

type ViewResponseDialogProps = {
  response: QuestionnaireResponse | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  isUpdating: boolean;
};

export function ViewResponseDialog({
  response,
  onClose,
  onUpdateStatus,
  isUpdating,
}: ViewResponseDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={!!response} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl p-6" data-testid="dialog-view-response">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("arizaTafsilotlari")}</DialogTitle>
          <DialogDescription>
            {response?.fullName} - {response?.phone}
          </DialogDescription>
        </DialogHeader>
        {response && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("status28")}</Label>
                <div className="mt-2">{getStatusBadge(response.status)}</div>
              </div>
              <div>
                <Label>{t("yuborilganVaqt")}</Label>
                <p className="text-sm mt-2">
                  {new Date(response.createdAt).toLocaleString("uz-UZ")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("javoblar1")}</Label>
              {(Array.isArray(response.responses) ? response.responses : []).map((r, idx) => (
                <Card key={idx}>
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold mb-1">{r.question}</p>
                    <p className="text-sm text-muted-foreground">{r.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <Label>{t("holatOzgartirish")}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(response.id, "pending")}
                  disabled={isUpdating || response.status === "pending"}
                  data-testid="button-status-pending"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {t("Kutilmoqda")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(response.id, "in_review")}
                  disabled={isUpdating || response.status === "in_review"}
                  data-testid="button-status-in-review"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {t("koribChiqilmoqda")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(response.id, "interviewed")}
                  disabled={isUpdating || response.status === "interviewed"}
                  data-testid="button-status-interviewed"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {t("intervyuQilindi")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(response.id, "approved")}
                  disabled={isUpdating || response.status === "approved"}
                  data-testid="button-status-approved"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t("approved")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[var(--ep-blue)] hover:bg-[var(--ep-blue)]/90 text-white"
                  onClick={() => onUpdateStatus(response.id, "hired")}
                  disabled={isUpdating || response.status === "hired"}
                  data-testid="button-status-hired"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t("ishgaOlindi")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onUpdateStatus(response.id, "not_hired")}
                  disabled={isUpdating || response.status === "not_hired"}
                  data-testid="button-status-not-hired"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("ishgaOlinmadi")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onUpdateStatus(response.id, "rejected")}
                  disabled={isUpdating || response.status === "rejected"}
                  data-testid="button-status-rejected"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("rejected")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
