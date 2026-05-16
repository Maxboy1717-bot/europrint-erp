/**
 * @module ProbationReviewDialog
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n';

const SCORE_CRITERIA = [
  { key: "task_quality",    label: "Vazifalarni bajarish sifati" },
  { key: "independence",    label: "Mustaqillik darajasi" },
  { key: "teamwork",        label: "Jamoa bilan munosabat" },
  { key: "discipline",      label: "Intizom va vaqtga rioya" },
  { key: "learning_speed",  label: "O'rganish tezligi" },
  { key: "motivation",      label: "Motivatsiya va ishtiyoq" },
] as const;

type ScoreKey = typeof SCORE_CRITERIA[number]["key"];

const DECISIONS = [
  { value: "continue",      label: "Davom ettirish",   icon: CheckCircle,   color: "text-[var(--ep-green)]", border: "border-green-400", bg: "bg-green-50" },
  { value: "extended_trial",label: "Qo'shimcha sinov", icon: AlertTriangle,  color: "text-[var(--ep-yellow)]", border: "border-amber-400", bg: "bg-amber-50" },
  { value: "terminate",     label: "Tugatish",          icon: XCircle,        color: "text-[var(--ep-red)]",   border: "border-red-400",   bg: "bg-red-50" },
] as const;

export interface ProbationReview {
  id: number;
  pipeline_entry_id: number;
  review_type: "30" | "90";
  scores: Record<ScoreKey, number>;
  observations: { strengths?: string; improvements?: string };
  decision: string;
  reviewer_name: string | null;
  employee_name: string | null;
  position_name: string | null;
  mentor_name: string | null;
  review_date: string | null;
  created_at: string;
}

function ScoreDots({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(dot => {
        const active = dot <= value;
        const dotColor = dot <= 3 ? "bg-red-400" : dot <= 6 ? "bg-amber-400" : "bg-green-500";
        return (
          <button
            key={dot}
            type="button"
            onClick={() => onChange(dot)}
            className={cn(
              "w-5 h-5 rounded-full border-2 transition-all text-[9px] font-bold",
              active
                ? `${dotColor} border-transparent text-white`
                : "bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-400"
            )}
          >
            {dot}
          </button>
        );
      })}
    </div>
  );
}

function ScoreRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const color =
    value >= 8 ? "text-[var(--ep-green)] bg-green-50" :
    value >= 5 ? "text-[var(--ep-yellow)] bg-amber-50" :
    "text-[var(--ep-red)] bg-red-50";

  return (
    <div className="flex items-center gap-3">
      <div className="w-40 text-xs text-slate-600 shrink-0 leading-tight">{label}</div>
      <ScoreDots value={value} onChange={onChange} />
      <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded shrink-0", color)}>{value}/10</span>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineEntryId: number;
  reviewType: "30" | "90";
  candidateName: string;
  existingReview?: ProbationReview | null;
}

export function ProbationReviewDialog({
  open,
  onOpenChange,
  pipelineEntryId,
  reviewType,
  candidateName,
  existingReview,
}: Props) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultScores: Record<ScoreKey, number> = {
    task_quality: 5,
    independence: 5,
    teamwork: 5,
    discipline: 5,
    learning_speed: 5,
    motivation: 5,
  };

  const [scores, setScores] = useState<Record<ScoreKey, number>>(
    existingReview?.scores
      ? (existingReview.scores as Record<ScoreKey, number>)
      : defaultScores
  );
  const [observations, setObservations] = useState({
    strengths: existingReview?.observations?.strengths ?? "",
    improvements: existingReview?.observations?.improvements ?? "",
  });
  const [decision, setDecision] = useState(existingReview?.decision ?? "continue");
  const [reviewerName, setReviewerName] = useState(existingReview?.reviewer_name ?? "");
  const [employeeName, setEmployeeName] = useState(existingReview?.employee_name ?? candidateName);
  const [positionName, setPositionName] = useState(existingReview?.position_name ?? "");
  const [mentorName, setMentorName] = useState(existingReview?.mentor_name ?? "");
  const [reviewDate, setReviewDate] = useState(
    existingReview?.review_date
      ? existingReview.review_date.split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  const avgScore = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/hr/recruitment/pipeline/${pipelineEntryId}/probation-review`, {
        review_type: reviewType,
        scores,
        observations,
        decision,
        reviewer_name: reviewerName,
        employee_name: employeeName,
        position_name: positionName,
        mentor_name: mentorName,
        review_date: reviewDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/hr/recruitment/pipeline/${pipelineEntryId}/probation-review`],
      });
      toast({ title: `${reviewType}-kun baholash saqlandi!` });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const typeLabel = reviewType === "30" ? "30-Kun" : "90-Kun";
  const avgColor =
    avgScore >= 8 ? "text-[var(--ep-green)] bg-green-50 border-green-200" :
    avgScore >= 5 ? "text-[var(--ep-yellow)] bg-amber-50 border-amber-200" :
    "text-[var(--ep-red)] bg-red-50 border-red-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="from-primary to-amber-500 text-white px-6 pt-5 pb-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-orange-400" />
              {typeLabel} Sinov Davri Baholash Formasi
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300 mt-1">{candidateName}</p>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Kirish ma'lumotlari */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("kirishMalumotlari")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">{t("xodimIsmi")}</Label>
                <Input
                  value={employeeName}
                  onChange={e => setEmployeeName(e.target.value)}
                  className="text-sm h-8"
                  placeholder={t("toliqIsm")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">{t("lavozim1")}</Label>
                <Input
                  value={positionName}
                  onChange={e => setPositionName(e.target.value)}
                  className="text-sm h-8"
                  placeholder={t("lavozimNomi1")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">{t("nastavnikMentor")}</Label>
                <Input
                  value={mentorName}
                  onChange={e => setMentorName(e.target.value)}
                  className="text-sm h-8"
                  placeholder={t("mentorIsmi")}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">{t("baholashSanasi")}</Label>
                <Input
                  type="date"
                  value={reviewDate}
                  onChange={e => setReviewDate(e.target.value)}
                  className="text-sm h-8"
                />
              </div>
            </div>
          </div>

          {/* Baholash mezonlari */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("baholashMezonlari110")}</p>
              <span className={cn("text-sm font-bold px-2.5 py-1 rounded-full border", avgColor)}>
                O'rtacha: {avgScore}/10
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3.5 border border-slate-200">
              {(Array.isArray(SCORE_CRITERIA) ? SCORE_CRITERIA : []).map(criterion => (
                <ScoreRow
                  key={criterion.key}
                  label={criterion.label}
                  value={scores[criterion.key as ScoreKey] ?? 5}
                  onChange={v => setScores(prev => ({ ...prev, [criterion.key]: v }))}
                />
              ))}
            </div>
          </div>

          {/* Kuzatuvlar */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("kuzatuvlar")}</p>
            <div>
              <Label className="text-xs mb-1 block text-[var(--ep-green)]">{t("kuchliTomonlar")}</Label>
              <Textarea
                value={observations.strengths}
                onChange={e => setObservations(prev => ({ ...prev, strengths: e.target.value }))}
                rows={2}
                className="text-sm resize-none"
                placeholder={t("xodimningKuchliTomonlari")}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block text-[var(--ep-yellow)]">{t("rivojlanishSohalari")}</Label>
              <Textarea
                value={observations.improvements}
                onChange={e => setObservations(prev => ({ ...prev, improvements: e.target.value }))}
                rows={2}
                className="text-sm resize-none"
                placeholder={t("rivojlantirishKerakBolganSohalar")}
              />
            </div>
          </div>

          {/* Qaror */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("qaror")}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {(Array.isArray(DECISIONS) ? DECISIONS : []).map(d => {
                const Icon = d.icon;
                const isSelected = decision === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDecision(d.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border-2 text-xs font-medium transition-all",
                      isSelected
                        ? `${d.border} ${d.bg}`
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isSelected ? d.color : "text-slate-300")} />
                    <span className={isSelected ? d.color : "text-slate-400"}>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HR menejer imzosi */}
          <div>
            <Label className="text-xs mb-1 block">{t("hrMenejerIsmiImzo")}</Label>
            <Input
              value={reviewerName}
              onChange={e => setReviewerName(e.target.value)}
              className="text-sm h-8"
              placeholder={t("hrMenejerToliqIsmi")}
            />
          </div>
        </div>

        <DialogFooter className="px-6 pb-5 pt-2 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !decision}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            data-testid="button-save-probation-review"
          >
            <ClipboardCheck className="w-4 h-4" />
            {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
