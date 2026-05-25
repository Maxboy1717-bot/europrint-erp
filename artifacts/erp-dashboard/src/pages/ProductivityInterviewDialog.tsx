/** @module ProductivityInterviewDialog @description Main dialog shell for the Productivity Interview (Material №46). Manages state, step navigation, save mutation, and composes step panels. */

import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronLeft, ChevronRight } from "lucide-react";
import { computeWorkerType } from "@/lib/workerType";

import {
  STEPS,
  makeWorkplace,
  DEFAULT_MOTIVATION,
  DEFAULT_COMPETENCY,
  DEFAULT_SUMMARY,
} from "./ProductivityInterviewDialogTypes";
import type {
  ProductivityInterviewDialogProps,
  WorkplaceEntry,
  MotivationData,
  CompetencyData,
  SummaryData,
} from "./ProductivityInterviewDialogTypes";

import { Step1WorkExperience } from "./ProductivityInterviewDialogStep1";
import { Step2Motivation }     from "./ProductivityInterviewDialogStep2";
import { Step3Competency }     from "./ProductivityInterviewDialogStep3";
import { Step4Summary }        from "./ProductivityInterviewDialogStep4";
import { useTranslation } from '@/lib/i18n';

export function ProductivityInterviewDialog({
  candidateId, candidateName, funnelId, open, onClose,
}: ProductivityInterviewDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [step, setStep]           = useState(0);
  const [workplaces, setWorkplaces] = useState<WorkplaceEntry[]>([makeWorkplace()]);
  const [motivation, setMotivation] = useState<MotivationData>(DEFAULT_MOTIVATION);
  const [competency, setCompetency] = useState<CompetencyData>(DEFAULT_COMPETENCY);
  const [summary, setSummary]       = useState<SummaryData>(DEFAULT_SUMMARY);

  // ── Workplace helpers ──────────────────────────────────────────────────────
  function updateWorkplace(id: string, field: keyof WorkplaceEntry, value: string) {
    setWorkplaces(prev => (Array.isArray(prev) ? prev : []).map(
      w => w.id === id ? { ...w, [field]: value } : w
    ));
  }
  function addWorkplace() {
    if (workplaces.length < 3) setWorkplaces(prev => [...prev, makeWorkplace()]);
  }
  function removeWorkplace(id: string) {
    if (workplaces.length > 1)
      setWorkplaces(prev => (Array.isArray(prev) ? prev : []).filter(w => w.id !== id));
  }

  // ── Typed field updaters ───────────────────────────────────────────────────
  function updateMotivation<K extends keyof MotivationData>(field: K, val: MotivationData[K]) {
    setMotivation(prev => ({ ...prev, [field]: val }));
  }
  function updateCompetency<K extends keyof CompetencyData>(field: K, val: string) {
    setCompetency(prev => ({ ...prev, [field]: val }));
  }
  function updateSummary<K extends keyof SummaryData>(field: K, val: SummaryData[K]) {
    setSummary(prev => ({ ...prev, [field]: val }));
  }
  function toggleToolTest(key: string) {
    setSummary(prev => ({
      ...prev,
      tool_test_passed: { ...prev.tool_test_passed, [key]: !prev.tool_test_passed[key] },
    }));
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const avgScore = Math.round(
    (summary.productivity_score + summary.motivation_score + summary.competency_score) / 3 * 10
  ) / 10;

  const workerType = useMemo(() => computeWorkerType({
    motivation_level: motivation.motivation_level,
    tool_test_passed: summary.tool_test_passed,
    avg_score: avgScore,
    flow_direction: motivation.flow_direction,
  }), [motivation.motivation_level, summary.tool_test_passed, avgScore, motivation.flow_direction]);

  // ── Save mutation ──────────────────────────────────────────────────────────
  const wps = Array.isArray(workplaces) ? workplaces : [];

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hr/recruitment/productivity-interview", {
      candidateId,
      funnelId,
      productivityInterview: {
        hasConcreteResults:      wps.some(w => w.hard_task.trim().length > 0),
        concreteResultsExamples: wps.map(w => w.how_solved).filter(Boolean),
        canWorkIndependently:    wps.some(w => w.initiative.trim().length > 0),
        independenceExamples:    wps.map(w => w.initiative).filter(Boolean),
        problemSolvingExamples:  wps.map(w => w.hard_task).filter(Boolean),
        achievements: wps.map(w => ({ description: w.lesson, measurable: false })).filter(a => a.description),
        workHistory: wps.map(w => ({
          company: w.company, position: w.position, duration: w.duration,
          mainResult: w.how_solved, leftReason: "",
        })),
        overallScore: summary.productivity_score,
        interviewerNotes: ([
          motivation.q1_work_meaning && `Ish ma'nosi: ${motivation.q1_work_meaning}`,
          motivation.q2_ideal_env    && `Ideal muhit: ${motivation.q2_ideal_env}`,
          motivation.q3_achievement  && `Yutuq: ${motivation.q3_achievement}`,
          motivation.q4_future_goal  && `Maqsad: ${motivation.q4_future_goal}`,
          competency.q1_problem      && `Muammo: ${competency.q1_problem}`,
          competency.q2_team         && `Jamoa: ${competency.q2_team}`,
          competency.q3_growth       && `O'sish: ${competency.q3_growth}`,
          competency.practical_task  && `Amaliy: ${competency.practical_task}`,
          summary.final_notes        && `Xulosa: ${summary.final_notes}`,
        ]).filter(Boolean).join("\n"),
      },
      finalDecision: summary.final_decision === "qabul" ? "APPROVE"
        : summary.final_decision === "rad" || summary.final_decision === "hech_qachon" ? "REJECT"
        : "HOLD",
      worker_type: workerType,
      finalNotes: JSON.stringify({
        motivation_answers:       { q1_work_meaning: motivation.q1_work_meaning, q2_ideal_env: motivation.q2_ideal_env, q3_achievement: motivation.q3_achievement, q4_future_goal: motivation.q4_future_goal },
        motivation_rubric_level:  motivation.motivation_level,
        motivation_score_1_10:    summary.motivation_score,
        flow_direction:           motivation.flow_direction,
        competency_answers:       { q1_problem: competency.q1_problem, q2_team: competency.q2_team, q3_growth: competency.q3_growth, practical_task: competency.practical_task },
        competency_score_1_10:    summary.competency_score,
        productivity_score_1_10:  summary.productivity_score,
        tool_test_passed:         summary.tool_test_passed,
        avg_score:                avgScore,
        final_decision:           summary.final_decision,
        worker_type:              workerType,
      }),
    }),
    onSuccess: () => { toast({ title: "Suhbat blanki saqlandi" }); onClose(); },
    onError:   () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{t("produktivlikSuhbatBlanki")}</span>
            <span className="text-muted-foreground font-normal text-sm">— {candidateName}</span>
            <Badge variant="outline" className="text-[10px] ml-auto">{t("material46")}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Step navigator */}
        <div className="flex gap-1 mb-4">
          {(Array.isArray(STEPS) ? STEPS : []).map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-all border ${
                  step === i
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 border-border/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="leading-tight text-center">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Step panels */}
        {step === 0 && (
          <Step1WorkExperience
            workplaces={workplaces}
            onUpdate={updateWorkplace}
            onAdd={addWorkplace}
            onRemove={removeWorkplace}
          />
        )}
        {step === 1 && (
          <Step2Motivation motivation={motivation} onChange={updateMotivation} />
        )}
        {step === 2 && (
          <Step3Competency competency={competency} onChange={updateCompetency} />
        )}
        {step === 3 && (
          <Step4Summary
            summary={summary}
            avgScore={avgScore}
            workerType={workerType}
            onChange={updateSummary}
            onToggleToolTest={toggleToolTest}
          />
        )}

        <DialogFooter className="flex items-center justify-between mt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            {t("back")}
          </Button>
          <div className="flex gap-2">
            {step === STEPS.length - 1 && (
              <Button
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !summary.final_decision}
                className="bg-green-600 hover:bg-[var(--ep-green)]/90"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            )}
            {step < STEPS.length - 1 && (
              <Button size="sm" onClick={() => setStep(s => s + 1)}>
                {t("nextBtn")}
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
