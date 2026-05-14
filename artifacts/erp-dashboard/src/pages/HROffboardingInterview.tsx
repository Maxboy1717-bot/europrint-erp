/**
 * @module HROffboardingInterview
 * @description Exit-interview form component used inside the checklist panel.
 * Renders the four structured questions and Save/Cancel actions.
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXIT_QUESTIONS } from "./HROffboardingTypes";
import { useTranslation } from '@/lib/i18n';

interface Props {
  answers: Record<string, string>;
  onAnswerChange: (key: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function ExitInterviewForm({
  answers,
  onAnswerChange,
  onSave,
  onCancel,
  isSaving,
}: Props) {
  const { t } = useTranslation("common");
  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-3 bg-muted/20">
      <p className="text-sm font-semibold">{t("chiqishSuhbati4TaSavol")}</p>

      {EXIT_QUESTIONS.map(q => (
        <div key={q.key} className="space-y-1">
          <Label className="text-xs">
            {q.label}
            <span className="text-[var(--ep-red)] ml-1">*</span>
          </Label>

          {q.type === "text" && (
            <Textarea
              placeholder={t("javobingizniKiriting")}
              className="text-sm min-h-[60px] resize-none"
              value={answers[q.key] ?? ""}
              onChange={e => onAnswerChange(q.key, e.target.value)}
            />
          )}

          {q.type === "rating" && (
            <Select
              value={answers[q.key] ?? ""}
              onValueChange={v => onAnswerChange(q.key, v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Baho (1-5)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t("k1JudaYomon1")}</SelectItem>
                <SelectItem value="2">{t("k2Yomon1")}</SelectItem>
                <SelectItem value="3">{t("k3Ortacha1")}</SelectItem>
                <SelectItem value="4">{t("k4Yaxshi1")}</SelectItem>
                <SelectItem value="5">{t("k5Alo1")}</SelectItem>
              </SelectContent>
            </Select>
          )}

          {q.type === "choice" && (
            <Select
              value={answers[q.key] ?? ""}
              onValueChange={v => onAnswerChange(q.key, v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("javobniTanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Ha, tavsiya qilaman</SelectItem>
                <SelectItem value="maybe">{t("balki")}</SelectItem>
                <SelectItem value="no">{t("no")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs bg-primary hover:bg-primary/90 text-white"
          onClick={onSave}
          disabled={isSaving}
        >
          {t("Saqlash")}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>
          {t("Bekor")}
        </Button>
      </div>
    </div>
  );
}
