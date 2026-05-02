import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Save, ChevronLeft, ChevronRight,
  Briefcase, Target, Star, CheckSquare,
} from "lucide-react";
import { computeWorkerType, WORKER_TYPE_META } from "@/lib/workerType";

// ─── Motivatsiya darajalari (Material №46 Bo'lim 2) ──────────────────────────
const MOTIVATION_LEVELS = [
  {
    level: 4,
    label: "Burch",
    description: "Mas'uliyat va majburiyat asosida ishlaydi. Jamiyat va kompaniya oldidagi burch tuyg'usi.",
    color: "border-blue-500/60 bg-blue-500/10 text-blue-300",
    icon: "🏛",
  },
  {
    level: 3,
    label: "E'tiqod",
    description: "Ishiga ishonadi, missiyaga mos harakat qiladi. Ichki qadriyatlar va g'oyaviy motivatsiya.",
    color: "border-indigo-500/60 bg-indigo-500/10 text-indigo-300",
    icon: "💎",
  },
  {
    level: 2,
    label: "Manfaat",
    description: "Natija va mukofot uchun ishlaydi. O'sish imkoniyatlari, karyera va professional rivojlanish.",
    color: "border-amber-500/60 bg-amber-500/10 text-amber-300",
    icon: "📈",
  },
  {
    level: 1,
    label: "Pul",
    description: "Asosan moddiy manfaat uchun ishlaydi. Ish haqining muhimligi birinchi o'rinda.",
    color: "border-orange-500/60 bg-orange-500/10 text-orange-300",
    icon: "💰",
  },
];

// ─── TOOL TEST natijalari (A-J) ───────────────────────────────────────────────
const TOOL_TRAITS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

interface WorkplaceEntry {
  id: string;
  company: string;
  position: string;
  duration: string;
  // 4 savol har bir ish joyi uchun
  hard_task: string;      // 1. Murakkab vazifa
  how_solved: string;     // 2. Qanday hal qildi
  initiative: string;     // 3. Tashabbusi nima bo'ldi
  lesson: string;         // 4. Nima o'rgandi
}

interface MotivationData {
  q1_work_meaning: string;        // 1. Bu ish nimani anglatadi?
  q2_ideal_env: string;           // 2. Ideal ish muhiti
  q3_achievement: string;         // 3. Eng yaxshi natija
  q4_future_goal: string;         // 4. Kelajakda kim bo'lmoqchi?
  flow_direction: "inflow" | "outflow" | "";  // Kiruvchi / Chiquvchi oqim
  motivation_level: number;       // 1-4
}

interface CompetencyData {
  q1_problem: string;             // 1. Murakkab muammo misoli
  q2_team: string;                // 2. Jamoa bilan ishlash
  q3_growth: string;              // 3. Professional o'sish
  practical_task: string;         // Amaliy topshiriq javobi
}

interface SummaryData {
  productivity_score: number;     // 1-10
  motivation_score: number;       // 1-10
  competency_score: number;       // 1-10
  productivity_note: string;
  motivation_note: string;
  competency_note: string;
  tool_test_passed: Record<string, boolean>;  // A-J checkbox
  final_decision: "qabul" | "kutish" | "rad" | "hech_qachon" | "";
  final_notes: string;
}

interface ProductivityInterviewDialogProps {
  candidateId: number;
  candidateName: string;
  funnelId?: number;
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: "section1", icon: Briefcase, title: "1. Ish tajribasi" },
  { id: "section2", icon: Target,    title: "2. Motivatsiya" },
  { id: "section3", icon: Star,      title: "3. Kompetensiya" },
  { id: "summary",  icon: CheckSquare, title: "Yakuniy xulosa" },
];

function makeWorkplace(): WorkplaceEntry {
  return {
    id: crypto.randomUUID(),
    company: "", position: "", duration: "",
    hard_task: "", how_solved: "", initiative: "", lesson: "",
  };
}

const DEFAULT_MOTIVATION: MotivationData = {
  q1_work_meaning: "", q2_ideal_env: "", q3_achievement: "", q4_future_goal: "",
  flow_direction: "", motivation_level: 0,
};

const DEFAULT_COMPETENCY: CompetencyData = {
  q1_problem: "", q2_team: "", q3_growth: "", practical_task: "",
};

const DEFAULT_SUMMARY: SummaryData = {
  productivity_score: 5, motivation_score: 5, competency_score: 5,
  productivity_note: "", motivation_note: "", competency_note: "",
  tool_test_passed: Object.fromEntries(TOOL_TRAITS.map(k => [k, false])),
  final_decision: "", final_notes: "",
};

export function ProductivityInterviewDialog({
  candidateId, candidateName, funnelId, open, onClose,
}: ProductivityInterviewDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [workplaces, setWorkplaces] = useState<WorkplaceEntry[]>([makeWorkplace()]);
  const [motivation, setMotivation] = useState<MotivationData>(DEFAULT_MOTIVATION);
  const [competency, setCompetency] = useState<CompetencyData>(DEFAULT_COMPETENCY);
  const [summary, setSummary] = useState<SummaryData>(DEFAULT_SUMMARY);

  function updateWorkplace(id: string, field: keyof WorkplaceEntry, value: string) {
    setWorkplaces(prev => (prev ?? []).map(w => w.id === id ? { ...w, [field]: value } : w));
  }

  function addWorkplace() {
    if (workplaces.length < 3) setWorkplaces(prev => [...prev, makeWorkplace()]);
  }

  function removeWorkplace(id: string) {
    if (workplaces.length > 1) setWorkplaces(prev => (prev ?? []).filter(w => w.id !== id));
  }

  function m(field: keyof MotivationData) {
    return (val: string | number) => setMotivation(prev => ({ ...prev, [field]: val }));
  }

  function c(field: keyof CompetencyData) {
    return (val: string) => setCompetency(prev => ({ ...prev, [field]: val }));
  }

  function s(field: keyof SummaryData) {
    return (val: unknown) => setSummary(prev => ({ ...prev, [field]: val }));
  }

  function toggleToolTest(key: string) {
    setSummary(prev => ({
      ...prev,
      tool_test_passed: { ...prev.tool_test_passed, [key]: !prev.tool_test_passed[key] },
    }));
  }

  const avgScore = Math.round(
    (summary.productivity_score + summary.motivation_score + summary.competency_score) / 3 * 10
  ) / 10;

  const workerType = useMemo(() => computeWorkerType({
    motivation_level: motivation.motivation_level,
    tool_test_passed: summary.tool_test_passed,
    avg_score: avgScore,
    flow_direction: motivation.flow_direction,
  }), [motivation.motivation_level, summary.tool_test_passed, avgScore, motivation.flow_direction]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hr/recruitment/productivity-interview", {
      candidateId,
      funnelId,
      // Section 1 — workplaces mapped to DTO
      productivityInterview: {
        hasConcreteResults: (Array.isArray(workplaces) ? workplaces : []).some(w => w.hard_task.trim().length > 0),
        concreteResultsExamples: (Array.isArray(workplaces) ? workplaces : []).map(w => w.how_solved).filter(Boolean),
        canWorkIndependently: (Array.isArray(workplaces) ? workplaces : []).some(w => w.initiative.trim().length > 0),
        independenceExamples: (Array.isArray(workplaces) ? workplaces : []).map(w => w.initiative).filter(Boolean),
        problemSolvingExamples: (Array.isArray(workplaces) ? workplaces : []).map(w => w.hard_task).filter(Boolean),
        achievements: (Array.isArray(workplaces) ? workplaces : []).map(w => ({
          description: w.lesson,
          measurable: false,
        })).filter(a => a.description),
        workHistory: (Array.isArray(workplaces) ? workplaces : []).map(w => ({
          company: w.company,
          position: w.position,
          duration: w.duration,
          mainResult: w.how_solved,
          leftReason: "",
        })),
        overallScore: summary.productivity_score,
        interviewerNotes: ([
          motivation.q1_work_meaning && `Ish ma'nosi: ${motivation.q1_work_meaning}`,
          motivation.q2_ideal_env && `Ideal muhit: ${motivation.q2_ideal_env}`,
          motivation.q3_achievement && `Yutuq: ${motivation.q3_achievement}`,
          motivation.q4_future_goal && `Maqsad: ${motivation.q4_future_goal}`,
          competency.q1_problem && `Muammo: ${competency.q1_problem}`,
          competency.q2_team && `Jamoa: ${competency.q2_team}`,
          competency.q3_growth && `O'sish: ${competency.q3_growth}`,
          competency.practical_task && `Amaliy: ${competency.practical_task}`,
          summary.final_notes && `Xulosa: ${summary.final_notes}`,
        ]).filter(Boolean).join("\n"),
      },
      // Extra data stored in finalNotes
      finalDecision: summary.final_decision === "qabul" ? "APPROVE"
        : summary.final_decision === "rad" || summary.final_decision === "hech_qachon" ? "REJECT"
        : "HOLD",
      worker_type: workerType,
      finalNotes: JSON.stringify({
        motivation_answers: {
          q1_work_meaning: motivation.q1_work_meaning,
          q2_ideal_env: motivation.q2_ideal_env,
          q3_achievement: motivation.q3_achievement,
          q4_future_goal: motivation.q4_future_goal,
        },
        motivation_rubric_level: motivation.motivation_level,  // 1-4: Burch/E'tiqod/Manfaat/Pul
        motivation_score_1_10: summary.motivation_score,       // 1-10: rekruter bahosi
        flow_direction: motivation.flow_direction,              // inflow / outflow
        competency_answers: {
          q1_problem: competency.q1_problem,
          q2_team: competency.q2_team,
          q3_growth: competency.q3_growth,
          practical_task: competency.practical_task,
        },
        competency_score_1_10: summary.competency_score,
        productivity_score_1_10: summary.productivity_score,
        tool_test_passed: summary.tool_test_passed,
        avg_score: avgScore,
        final_decision: summary.final_decision,
        worker_type: workerType,
      }),
    }),
    onSuccess: () => {
      toast({ title: "Suhbat blanki saqlandi" });
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Produktivlik Suhbat Blanki</span>
            <span className="text-muted-foreground font-normal text-sm">— {candidateName}</span>
            <Badge variant="outline" className="text-[10px] ml-auto">Material №46</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Step Navigator */}
        <div className="flex gap-1 mb-4">
          {(Array.isArray(STEPS) ? STEPS : []).map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-all border ${
                  step === i
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container-low border-border/40 text-on-surface-variant hover:border-primary/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="leading-tight text-center">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* ── BO'LIM 1: Ish tajribasi ── */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-primary">Bo'lim 1: Har bir ish joyidan 4 savol</h3>
                <Badge variant="outline" className="text-[9px]">Maks. 3 ish joyi</Badge>
              </div>
              {workplaces.length < 3 && (
                <Button size="sm" variant="outline" onClick={addWorkplace} className="h-7 text-xs gap-1">
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
                className="border border-border/40 rounded-lg p-3 bg-surface-container-low flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary">
                    {idx + 1}-ish joyi
                  </p>
                  {workplaces.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeWorkplace(wp.id)}
                      className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Kompaniya</Label>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Kompaniya nomi"
                      value={wp.company}
                      onChange={e => updateWorkplace(wp.id, "company", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Lavozim</Label>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Lavozim"
                      value={wp.position}
                      onChange={e => updateWorkplace(wp.id, "position", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] mb-0.5 block text-muted-foreground">Davomiylik</Label>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Masalan: 2 yil"
                      value={wp.duration}
                      onChange={e => updateWorkplace(wp.id, "duration", e.target.value)}
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
                    onChange={e => updateWorkplace(wp.id, "hard_task", e.target.value)}
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
                    onChange={e => updateWorkplace(wp.id, "how_solved", e.target.value)}
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
                    onChange={e => updateWorkplace(wp.id, "initiative", e.target.value)}
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
                    onChange={e => updateWorkplace(wp.id, "lesson", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BO'LIM 2: Motivatsiya ── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm text-primary">Bo'lim 2: Motivatsiya</h3>
              <Badge variant="outline" className="text-[9px]">4 savol + oqim + daraja</Badge>
            </div>

            {/* 4 ta savol */}
            <div>
              <Label className="text-xs mb-1 block">
                <span className="text-primary font-semibold">S1.</span> Bu ish sizga nima anglatadi?
              </Label>
              <Textarea
                rows={2}
                className="text-xs"
                placeholder="Bu lavozimda ishlashning nima ma'nosi bor sizga?"
                value={motivation.q1_work_meaning}
                onChange={e => m("q1_work_meaning")(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                <span className="text-primary font-semibold">S2.</span> Ideal ish muhiti qanday bo'lishi kerak?
              </Label>
              <Textarea
                rows={2}
                className="text-xs"
                placeholder="Muhit, atmosfera, rahbar uslubi..."
                value={motivation.q2_ideal_env}
                onChange={e => m("q2_ideal_env")(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                <span className="text-primary font-semibold">S3.</span> Eng yaxshi natijangizni ayting?
              </Label>
              <Textarea
                rows={2}
                className="text-xs"
                placeholder="O'zingiz maqtanishingiz mumkin bo'lgan natija..."
                value={motivation.q3_achievement}
                onChange={e => m("q3_achievement")(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                <span className="text-primary font-semibold">S4.</span> 3-5 yildan so'ng kim bo'lishni xohlaysiz?
              </Label>
              <Textarea
                rows={2}
                className="text-xs"
                placeholder="Karyera maqsadi, professional rivojlanish..."
                value={motivation.q4_future_goal}
                onChange={e => m("q4_future_goal")(e.target.value)}
              />
            </div>

            {/* Kiruvchi / Chiquvchi oqim */}
            <div className="border border-border/40 rounded-lg p-3 bg-surface-container-low">
              <Label className="text-xs mb-2 block font-medium">
                Nomzod oqim belgisi (rekruter baholaydi):
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => m("flow_direction")("inflow")}
                  className={`flex-1 py-2 rounded-md text-xs border transition-all flex items-center justify-center gap-1.5 ${
                    motivation.flow_direction === "inflow"
                      ? "bg-green-600/20 border-green-500/60 text-green-300"
                      : "border-border/40 text-on-surface-variant hover:border-green-500/40"
                  }`}
                >
                  <span className="text-base">→</span>
                  <div className="text-left">
                    <div className="font-semibold">Kiruvchi oqim</div>
                    <div className="text-[9px] opacity-70">Kompaniyaga kelmoqchi</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => m("flow_direction")("outflow")}
                  className={`flex-1 py-2 rounded-md text-xs border transition-all flex items-center justify-center gap-1.5 ${
                    motivation.flow_direction === "outflow"
                      ? "bg-red-600/20 border-red-500/60 text-red-300"
                      : "border-border/40 text-on-surface-variant hover:border-red-500/40"
                  }`}
                >
                  <span className="text-base">←</span>
                  <div className="text-left">
                    <div className="font-semibold">Chiquvchi oqim</div>
                    <div className="text-[9px] opacity-70">Hozirgi joydan ketmoqchi</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Motivatsiya darajasi 1-4 */}
            <div>
              <Label className="text-xs mb-2 block font-medium">
                Motivatsiya darajasi (rekruter baholaydi):
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(Array.isArray(MOTIVATION_LEVELS) ? MOTIVATION_LEVELS : []).map(lvl => (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => m("motivation_level")(lvl.level)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      motivation.motivation_level === lvl.level
                        ? lvl.color + " ring-1 ring-current"
                        : "border-border/40 text-on-surface-variant hover:border-border/70"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{lvl.icon}</span>
                      <span className="text-xs font-bold">
                        {lvl.level}. {lvl.label}
                      </span>
                    </div>
                    <p className="text-[9px] leading-snug opacity-80">{lvl.description}</p>
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground bg-surface-container-low rounded p-2">
                <strong>Ko'rsatma:</strong> 4=Burch (eng yuqori), 3=E'tiqod, 2=Manfaat, 1=Pul (eng past)
              </div>
            </div>
          </div>
        )}

        {/* ── BO'LIM 3: Kompetensiya ── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm text-primary">Bo'lim 3: Kompetensiya</h3>
              <Badge variant="outline" className="text-[9px]">3 savol + amaliy topshiriq</Badge>
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                <span className="text-primary font-semibold">K1.</span> Murakkab muammo va qanday hal qilgansiz?
              </Label>
              <Textarea
                rows={3}
                className="text-xs"
                placeholder="Konkret misol keltiring: qanday vaziyat, nima qildi, nima natija?"
                value={competency.q1_problem}
                onChange={e => c("q1_problem")(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                <span className="text-primary font-semibold">K2.</span> Jamoadagi qiyin vaziyat misoli?
              </Label>
              <Textarea
                rows={3}
                className="text-xs"
                placeholder="Konflikt, kelishmovchilik yoki hamkorlik qiyinligi..."
                value={competency.q2_team}
                onChange={e => c("q2_team")(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                <span className="text-primary font-semibold">K3.</span> So'nggi 6 oyda nima o'rgandingiz?
              </Label>
              <Textarea
                rows={2}
                className="text-xs"
                placeholder="Ko'nikma, bilim yoki tajriba..."
                value={competency.q3_growth}
                onChange={e => c("q3_growth")(e.target.value)}
              />
            </div>

            <div className="border border-amber-500/30 rounded-lg p-3 bg-amber-500/5">
              <Label className="text-xs mb-1.5 block font-medium text-amber-300">
                📋 Amaliy topshiriq natijasi
              </Label>
              <Textarea
                rows={3}
                className="text-xs"
                placeholder="Nomzodga berilgan amaliy topshiriq va uning bajarish jarayoni / natijasi..."
                value={competency.practical_task}
                onChange={e => c("practical_task")(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── YAKUNIY XULOSA ── */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm text-primary">Yakuniy xulosa</h3>
              <Badge variant="outline" className="text-[9px]">Umumiy baho + Qaror</Badge>
            </div>

            {/* Umumiy baho jadvali */}
            <div className="border border-border/40 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-surface-container">
                  <tr>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Bo'lim</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Ball (1-10)</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {([
                    {
                      label: "Produktivlik",
                      scoreKey: "productivity_score" as const,
                      noteKey: "productivity_note" as const,
                    },
                    {
                      label: "Motivatsiya",
                      scoreKey: "motivation_score" as const,
                      noteKey: "motivation_note" as const,
                    },
                    {
                      label: "Kompetensiya",
                      scoreKey: "competency_score" as const,
                      noteKey: "competency_note" as const,
                    },
                  ]).map(row => (
                    <tr key={row.label} className="bg-surface-container-low">
                      <td className="px-3 py-2 font-medium">{row.label}</td>
                      <td className="px-3 py-2">
                        <select
                          value={summary[row.scoreKey]}
                          onChange={e => s(row.scoreKey)(Number(e.target.value))}
                          className="w-16 rounded border border-border/40 bg-surface-container text-center text-xs p-1"
                        >
                          {([1,2,3,4,5,6,7,8,9,10]).map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          className="h-7 text-xs"
                          placeholder="Qisqa izoh..."
                          value={summary[row.noteKey]}
                          onChange={e => s(row.noteKey)(e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary/5 font-semibold">
                    <td className="px-3 py-2 text-primary">O'rtacha</td>
                    <td className="px-3 py-2 text-center text-primary text-sm font-bold">{avgScore}</td>
                    <td className="px-3 py-2 text-[10px] text-muted-foreground">
                      {avgScore >= 8 ? "A'lo" : avgScore >= 6 ? "Yaxshi" : avgScore >= 4 ? "O'rta" : "Past"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Xodim turi — avtomatik klassifikatsiya */}
            {(() => {
              const meta = WORKER_TYPE_META[workerType];
              return (
                <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${meta.bg} ${meta.border}`}>
                  <span className="text-2xl">{meta.emoji}</span>
                  <div>
                    <div className={`text-sm font-bold ${meta.color}`}>
                      {meta.emoji} {meta.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{meta.desc}</div>
                  </div>
                  <Badge variant="outline" className={`ml-auto text-[10px] shrink-0 ${meta.color} ${meta.border}`}>
                    Avtomatik
                  </Badge>
                </div>
              );
            })()}

            {/* TOOL TEST natijalari — A-J checkboxlar */}
            <div className="border border-border/40 rounded-lg p-3 bg-surface-container-low">
              <Label className="text-xs mb-2 block font-medium">TOOL TEST natijalari (A-J):</Label>
              <div className="grid grid-cols-5 gap-2">
                {(Array.isArray(TOOL_TRAITS) ? TOOL_TRAITS : []).map(key => (
                  <div key={key} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`tool-${key}`}
                      checked={summary.tool_test_passed[key] ?? false}
                      onCheckedChange={() => toggleToolTest(key)}
                    />
                    <label
                      htmlFor={`tool-${key}`}
                      className="text-xs font-mono font-bold cursor-pointer"
                    >
                      {key}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Belgilanganlar: TOOL TEST da talab darajasini qondirgan sifatlar
              </p>
            </div>

            {/* Yakuniy qaror */}
            <div>
              <Label className="text-xs mb-2 block font-medium">Yakuniy qaror:</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "qabul",      label: "✅ Qabul",      color: "border-green-500/60 bg-green-500/10 text-green-300" },
                  { value: "kutish",     label: "⏳ Kutish",     color: "border-amber-500/60 bg-amber-500/10 text-amber-300" },
                  { value: "rad",        label: "✕ Rad",         color: "border-orange-500/60 bg-orange-500/10 text-orange-300" },
                  { value: "hech_qachon", label: "⛔ Hech qachon", color: "border-red-500/60 bg-red-500/10 text-red-300" },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => s("final_decision")(opt.value)}
                    className={`py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                      summary.final_decision === opt.value
                        ? opt.color + " ring-1 ring-current"
                        : "border-border/40 text-on-surface-variant hover:border-border/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Yakuniy izoh */}
            <div>
              <Label className="text-xs mb-1 block">Yakuniy izoh (ixtiyoriy):</Label>
              <Textarea
                rows={3}
                className="text-xs"
                placeholder="Rekruterning yakuniy fikri, kuzatishlar..."
                value={summary.final_notes}
                onChange={e => s("final_notes")(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between mt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Orqaga
          </Button>

          <div className="flex gap-2">
            {step === STEPS.length - 1 && (
              <Button
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !summary.final_decision}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            )}

            {step < STEPS.length - 1 && (
              <Button size="sm" onClick={() => setStep(s => s + 1)}>
                Keyingi
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
