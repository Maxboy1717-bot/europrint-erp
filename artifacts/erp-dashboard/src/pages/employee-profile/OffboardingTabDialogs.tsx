/**
 * @module OffboardingTabDialogs
 * @description Dialog/form components for OffboardingTab — ExitInterviewForm.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Question } from "./OffboardingTabTypes";
import { useTranslation } from '@/lib/i18n';

// ── ExitInterviewForm ─────────────────────────────────────────────────────────
interface ExitInterviewFormProps {
  caseId: number;
  onDone: () => void;
}

export function ExitInterviewForm({ caseId, onDone }: ExitInterviewFormProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/hr/offboarding/questions"],
    queryFn: () => apiRequest('GET', "/api/hr/offboarding/questions").then(r => r.json()),
  });

  const save = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/hr/offboarding/cases/${caseId}/exit-interview`, { answers }),
    onSuccess: (data: { blocksSettlement: boolean; missingAnswers: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/offboarding/cases", caseId] });
      if (data?.blocksSettlement) {
        toast({
          title: "Suhbat saqlandi — hisob-kitob blokda",
          description: "Barcha savollar to'ldirilmagan. Hisob-kitob bajarilishi uchun to'ldiring.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Chiqish suhbati saqlandi" });
      }
      onDone();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const questionList = Array.isArray(questions) ? questions : [];

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/20">
      <p className="text-sm font-semibold text-foreground">{t("chiqishSuhbati4Savol")}</p>

      {questionList.map(q => (
        <div key={q.key} className="space-y-1.5">
          <Label className="text-sm">
            {q.label}
            {q.required && <span className="text-[var(--ep-red)] ml-1">*</span>}
          </Label>

          {q.type === "text" && (
            <Textarea
              placeholder={t("javobingizniKiriting")}
              className="text-sm min-h-[60px] resize-none"
              value={answers[q.key] ?? ""}
              onChange={e => setAnswers(a => ({ ...a, [q.key]: e.target.value }))}
            />
          )}

          {q.type === "rating" && (
            <Select
              value={answers[q.key] ?? ""}
              onValueChange={v => setAnswers(a => ({ ...a, [q.key]: v }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("bahoTanlang15")} />
              </SelectTrigger>
              <SelectContent>
                {(["1", "2", "3", "4", "5"]).map(v => (
                  <SelectItem key={v} value={v}>
                    {v} — {v === "1" ? "Juda yomon" : v === "5" ? "A'lo" : v === "3" ? "O'rtacha" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {q.type === "choice" && (
            <Select
              value={answers[q.key] ?? ""}
              onValueChange={v => setAnswers(a => ({ ...a, [q.key]: v }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("javobniTanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{t("haTavsiyaQilaman")}</SelectItem>
                <SelectItem value="maybe">{t("balki")}</SelectItem>
                <SelectItem value="no">{t("yoqTavsiyaQilmayman")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {t("Saqlash")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>{t("Bekor")}</Button>
      </div>
    </div>
  );
}
