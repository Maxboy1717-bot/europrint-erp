/**
 * @module helpers
 * @description React UI component.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, CheckCircle, ChevronDown, ChevronUp, BookOpen, ArrowRight, Radio,
  Bot, Star, MessageSquare, Copy, ExternalLink, Send, Globe, RefreshCcw,
} from "lucide-react";
import { MarketAnalysisBadge } from "@/components/hr/LaborMarketSheet";
import type { Vacancy, PipelineEntry, AIInterviewSession, FunnelStage } from "@/components/recruiting/types";
import { useTranslation } from '@/lib/i18n';

export type { FunnelStage };

export const STAGES: { key: FunnelStage; label: string; accent: string }[] = [
  { key: "NEW",                label: "Yangi ariza",           accent: "bg-blue-500"    },
  { key: "QUESTIONNAIRE_SENT", label: "Anketa Yuborildi",      accent: "bg-cyan-500"    },
  { key: "PHONE_SCREENING",    label: "Telefon Suhbat",        accent: "bg-violet-500"  },
  { key: "INTERVIEW_SCHEDULED",label: "Suhbat Rejalandi",      accent: "bg-indigo-500"  },
  { key: "INTERVIEWED",        label: "Suhbat O'tdi",          accent: "bg-teal-500"    },
  { key: "TEST_SENT",          label: "Test Yuborildi",        accent: "bg-amber-500"   },
  { key: "REFERENCES",         label: "Tavsiyalar Tekshiruvi", accent: "bg-sky-500"     },
  { key: "OFFER_SENT",         label: "Taklif Yuborildi",      accent: "bg-orange-500"  },
  { key: "HIRED",              label: "Qabul qilindi",         accent: "bg-green-500"   },
  { key: "PROBATION",          label: "Sinov Davri",           accent: "bg-emerald-500" },
  { key: "SINOV_COMPLETE",     label: "Sinov Yakunlandi",      accent: "bg-lime-500"    },
  { key: "REJECTED",           label: "Rad etildi",            accent: "bg-red-500"     },
];

export const NEXT_STAGE: Partial<Record<FunnelStage, FunnelStage>> = {
  NEW: "QUESTIONNAIRE_SENT",
  QUESTIONNAIRE_SENT: "PHONE_SCREENING",
  PHONE_SCREENING: "INTERVIEW_SCHEDULED",
  INTERVIEW_SCHEDULED: "INTERVIEWED",
  INTERVIEWED: "TEST_SENT",
  TEST_SENT: "REFERENCES",
  REFERENCES: "OFFER_SENT",
  OFFER_SENT: "HIRED",
  HIRED: "PROBATION",
  PROBATION: "SINOV_COMPLETE",
};

export const TERMINAL_STAGES: FunnelStage[] = ["SINOV_COMPLETE", "REJECTED"];

export const HC_PHASES = [
  { num: 1, id: "PORTRET",      label: "PORTRET",      color: "bg-purple-500",  desc: "Vakansiya profili yaratish, xodim portreti to'ldirish", stages: [] as FunnelStage[] },
  { num: 2, id: "UPAKOVKA",     label: "UPAKOVKA",     color: "bg-blue-500",    desc: "Vakansiyani e'lon qilish, kanallarni faollashtirish",  stages: [] as FunnelStage[] },
  { num: 3, id: "OQIM",         label: "OQIM",         color: "bg-cyan-500",    desc: "Nomzodlar oqimini boshqarish (bosqich 1–3)",          stages: ["NEW","QUESTIONNAIRE_SENT","PHONE_SCREENING"] as FunnelStage[] },
  { num: 4, id: "BAHOLASH",     label: "BAHOLASH",     color: "bg-amber-500",   desc: "Suhbat, test va baholash (bosqich 4–6)",              stages: ["INTERVIEW_SCHEDULED","INTERVIEWED","TEST_SENT"] as FunnelStage[] },
  { num: 5, id: "KIRITISH",     label: "KIRITISH",     color: "bg-orange-500",  desc: "Tavsiyalar tekshiruvi va taklif (bosqich 7–8)",       stages: ["REFERENCES","OFFER_SENT"] as FunnelStage[] },
  { num: 6, id: "KUCHAYTIRISH", label: "KUCHAYTIRISH", color: "bg-emerald-600", desc: "Ishga qabul, sinov davri va yakunlash (bosqich 9–11)",stages: ["HIRED","PROBATION","SINOV_COMPLETE"] as FunnelStage[] },
];

export function getPhaseForStage(stage: FunnelStage) {
  const { t } = useTranslation("common");
  return HC_PHASES.find(p => p.stages.includes(stage));
}

export const CHANNEL_COLORS: Record<string, string> = {
  HH_UZ: "bg-red-500", UZJOB: "bg-blue-500", MYJOB: "bg-green-500",
  OLX_UZ: "bg-teal-500", TELEGRAM: "bg-sky-500", INSTAGRAM: "bg-pink-500",
  LINKEDIN: "bg-indigo-500", FACEBOOK: "bg-blue-700",
};

export const CHANNEL_LABELS: Record<string, string> = {
  LINKEDIN: "LinkedIn", HH_UZ: "HH.uz", UZJOB: "UZjob", MYJOB: "MyJob",
  OLX_UZ: "OLX.uz", TELEGRAM: "Telegram", INSTAGRAM: "Instagram", FACEBOOK: "Facebook",
};

export const CHANNEL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  posted:     { label: "E'lon berildi", color: "bg-green-500/15 text-green-400 border-green-500/40" },
  pending:    { label: "Ждёт",          color: "bg-amber-500/15 text-amber-400 border-amber-500/40" },
  not_posted: { label: "Berilmadi",     color: "bg-muted/50 text-muted-foreground border-border/40" },
};

export const ALL_CHANNELS = ["LINKEDIN", "HH_UZ", "UZJOB", "MYJOB", "OLX_UZ", "TELEGRAM"];

export function DeadlineBadge({ daysRemaining, deadlinePercent }: { daysRemaining: number | null | undefined; deadlinePercent: number | null | undefined }) {
  if (daysRemaining === null || daysRemaining === undefined) return null;
  const pct = (deadlinePercent ?? 0) / 100;
  const color = pct < 0.5
    ? "bg-green-500/15 text-green-400 border-green-500/40"
    : pct < 0.8
    ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
    : "bg-red-500/15 text-red-400 border-red-500/40";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      <Clock className="w-2.5 h-2.5" />
      {daysRemaining}k qoldi
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number | string; color?: string;
}) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 flex items-center gap-3 min-w-[130px]">
      <div className={`p-2 rounded-lg ${color ?? "bg-primary/10"}`}>
        <Icon className={`w-5 h-5 ${color ? "text-white" : "text-primary"}`} />
      </div>
      <div>
        <div className="text-xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function HCMethodologyBanner() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(p => !p)}
        className="mb-2 gap-2 border-purple-500/30 text-purple-400 hover:bg-[var(--ep-purple)]/90/10"
        data-testid="button-toggle-hc-methodology"
      >
        <BookOpen className="w-4 h-4" />
        HR Capital 7-Bosqich Metodologiyasi
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </Button>
      {open && (
        <div className="bg-muted/60 rounded-xl p-4 border border-purple-500/20">
          <p className="text-xs text-muted-foreground mb-3">
            {t("rekrutmentJarayoniHrCapitalMetodologiyasining")}
          </p>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(HC_PHASES) ? HC_PHASES : []).map((phase, i) => (
              <div key={phase.id} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${phase.color}/20 border border-current/20`}>
                  <div className={`w-5 h-5 rounded-full ${phase.color} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                    {phase.num}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{phase.label}</div>
                    <div className="text-[9px] text-muted-foreground leading-tight max-w-[120px]">{phase.desc}</div>
                  </div>
                </div>
                {i < HC_PHASES.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(Array.isArray(STAGES) ? STAGES : []).filter(s => s.key !== "REJECTED").map(stage => {
              const phase = getPhaseForStage(stage.key);
              return (
                <span key={stage.key} className="inline-flex items-center gap-1 text-[10px] bg-muted/40 rounded px-1.5 py-0.5 border border-border/40">
                  <div className={`w-1.5 h-1.5 rounded-full ${stage.accent}`} />
                  {stage.label}
                  {phase && <span className="text-muted-foreground">→ {phase.label}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChannelDots({ channels }: { channels: Record<string, { active: boolean }> | null | undefined }) {
  if (!channels) return null;
  const active = Object.entries(channels).filter(([, v]) => v.active);
  if (!active.length) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Radio className="w-3 h-3 text-muted-foreground" />
      {(Array.isArray(active) ? active : []).map(([key]) => (
        <div key={key} className={`w-2 h-2 rounded-full ${CHANNEL_COLORS[key] ?? "bg-gray-400"}`} title={key} />
      ))}
    </div>
  );
}

export function ChannelStatusPanel({ vacancy, onUpdate }: { vacancy: Vacancy; onUpdate?: () => void }) {
  const { toast } = useToast();
  const channels = vacancy.channels ?? {};

  const updateChannelMutation = useMutation({
    mutationFn: ({ channel, status }: { channel: string; status: string }) =>
      apiRequest("POST", `/api/hr/recruitment/vacancies/${vacancy.id}/channel-status`, { channel, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] });
      toast({ title: "Kanal holati yangilandi" });
      onUpdate?.();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const announceOnTelegramMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/hr/recruitment/vacancies/${vacancy.id}/telegram-announce`, {}),
    onSuccess: (data: { ok?: boolean; message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] });
      toast({ title: data?.ok ? "Telegram kanaliga e'lon yuborildi!" : "E'lon yuborilmadi", description: data?.message ?? "" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const notifyAlumniMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/hr/recruitment/vacancies/${vacancy.id}/alumni-notify`, {}),
    onSuccess: (data: { message?: string }) => {
      toast({ title: `Alumni bildirishnomasi`, description: data?.message ?? "Yuborildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <div className="border border-border/40 rounded-lg p-3 bg-muted/20 space-y-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-primary" />{t("kanalHolatlari")}
        </p>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1 border-sky-500/40 text-sky-400 hover:bg-[var(--ep-blue)]/90/10"
            onClick={() => announceOnTelegramMutation.mutate()} disabled={announceOnTelegramMutation.isPending}
            data-testid={`button-telegram-announce-${vacancy.id}`}>
            <Send className="w-2.5 h-2.5" />{t("telegram")}
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1 border-indigo-500/40 text-indigo-400 hover:bg-[var(--ep-blue)]/90/10"
            onClick={() => notifyAlumniMutation.mutate()} disabled={notifyAlumniMutation.isPending}
            data-testid={`button-alumni-notify-${vacancy.id}`}>
            <RefreshCcw className="w-2.5 h-2.5" />{t("alumni")}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {(Array.isArray(ALL_CHANNELS) ? ALL_CHANNELS : []).map(ch => {
          const chData = channels[ch] as { active?: boolean; status?: string } | undefined;
          const status = chData?.status ?? (chData?.active ? "posted" : "not_posted");
          const statusInfo = CHANNEL_STATUS_LABELS[status] ?? CHANNEL_STATUS_LABELS.not_posted;
          return (
            <div key={ch} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${CHANNEL_COLORS[ch] ?? "bg-gray-400"}`} />
                <span className="text-xs text-foreground">{CHANNEL_LABELS[ch] ?? ch}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] border rounded-full px-2 py-0.5 ${statusInfo.color}`}>{statusInfo.label}</span>
                <Select value={status} onValueChange={newStatus => updateChannelMutation.mutate({ channel: ch, status: newStatus })}>
                  <SelectTrigger className="h-5 text-[10px] w-24 px-1.5 border-border/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posted">{t("elonBerildi")}</SelectItem>
                    <SelectItem value="pending">Ждёт</SelectItem>
                    <SelectItem value="not_posted">{t("berilmadi")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScoreBar({ label, score }: { label: string; score: number | null }) {
  if (score === null || score === undefined) return null;
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{Math.round(score)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function AIInterviewDialog({ entry, sessions }: { entry: PipelineEntry; sessions: AIInterviewSession[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [recruiterNotes, setRecruiterNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const entrySession = (Array.isArray(sessions) ? sessions : []).find(
    s => s.pipeline_entry_id === entry.id ||
        (s.candidate_name && s.candidate_name === entry.candidate_name)
  );

  const createSessionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/hr-v2/ai-interview/sessions", {
      candidate_name: entry.candidate_name,
      candidate_language: "uz",
      pipeline_entry_id: entry.id,
      candidate_id: entry.candidate_id,
      vacancy_id: entry.vacancy_id,
    }),
    onSuccess: (data: { interview_link?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/ai-interview/sessions"] });
      const link = data?.interview_link || "";
      if (link) {
        navigator.clipboard.writeText(link).catch(() => {});
        toast({ title: "Havola yaratildi", description: "Havola clipboard ga nusxalandi" });
      } else {
        toast({ title: "Sessiya yaratildi" });
      }
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/hr/ai-interview/session/${entrySession?.id}/review`, { recruiter_notes: recruiterNotes, recommendation }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/ai-interview/sessions"] });
      toast({ title: "Izoh saqlandi" });
      setOpen(false);
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const statusColor: Record<string, string> = {
    pending: "bg-blue-500/15 text-blue-400 border-blue-500/40",
    started: "bg-amber-500/15 text-amber-400 border-amber-500/40",
    completed: "bg-green-500/15 text-green-400 border-green-500/40",
    expired: "bg-red-500/15 text-red-400 border-red-500/40",
  };
  const statusLabel: Record<string, string> = {
    pending: "Kutilmoqda", started: "Jarayonda", completed: "Yakunlandi", expired: "Muddati tugagan",
  };

  const baseUrl = window.location.origin;
  const interviewLink = entrySession ? `${baseUrl}/ai-interview/${entrySession.token}` : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-indigo-500/30 text-indigo-400" data-testid={`button-ai-interview-${entry.id}`}>
          <Bot className="w-3 h-3" />{t("aiIntervyu")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            AI Intervyu — {entry.candidate_name}
          </DialogTitle>
        </DialogHeader>
        {!entrySession ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{t("nomzodUchunAiIntervyuSessiyasi")}</p>
            <Button onClick={() => createSessionMutation.mutate()} disabled={createSessionMutation.isPending} className="w-full gap-2" data-testid={`button-create-ai-session-${entry.id}`}>
              <Bot className="w-4 h-4" />
              {createSessionMutation.isPending ? "Yaratilmoqda..." : "AI Intervyu Havolasini Yaratish"}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between gap-2">
              <Badge className={`${statusColor[entrySession.status] || "bg-muted text-muted-foreground"} border text-xs`}>
                {statusLabel[entrySession.status] || entrySession.status}
              </Badge>
              <span className="text-xs text-muted-foreground">Muddati: {new Date(entrySession.expires_at).toLocaleString("uz")}</span>
            </div>
            {interviewLink && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground">{t("intervyuHavolasi")}</p>
                <div className="flex gap-2">
                  <Input readOnly value={interviewLink} className="text-xs h-9 flex-1" />
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => { navigator.clipboard.writeText(interviewLink).catch(() => {}); toast({ title: "Nusxalandi!" }); }}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => window.open(interviewLink, "_blank")}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
            {entrySession.status === "completed" && (
              <>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />{t("aiBaholashNatijalari")}
                  </h4>
                  {entrySession.overall_score !== null && (
                    <div className="text-center py-2 bg-primary/10 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{Math.round(entrySession.overall_score!)}%</div>
                      <div className="text-xs text-muted-foreground">{t("umumiyBall")}</div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <ScoreBar label={t("muloqot")} score={entrySession.communication_score} />
                    <ScoreBar label={t("ishonch")} score={entrySession.confidence_score} />
                    <ScoreBar label={t("muammoYechish")} score={entrySession.problem_solving_score} />
                    <ScoreBar label={t("tanaTili")} score={entrySession.body_language_score} />
                    <ScoreBar label={t("hissiyHolat")} score={entrySession.emotional_state_score} />
                    <ScoreBar label={t("professionalizm")} score={entrySession.professional_appearance_score} />
                  </div>
                </div>
                {entrySession.ai_summary && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">AI xulosasi:</p>
                    <p className="text-sm bg-muted/30 rounded-lg p-3">{entrySession.ai_summary}</p>
                  </div>
                )}
                {entrySession.transcript && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> {t("transkriptsiyaKorish")}
                    </summary>
                    <pre className="mt-2 bg-muted/30 rounded-lg p-3 whitespace-pre-wrap text-[11px] max-h-40 overflow-y-auto">{entrySession.transcript}</pre>
                  </details>
                )}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-semibold">{t("rekruterIzohi")}</h4>
                  {entrySession.recruiter_notes && (
                    <p className="text-xs bg-amber-500/10 rounded-lg p-2 text-amber-300">{entrySession.recruiter_notes}</p>
                  )}
                  <Textarea placeholder={t("rekruterIzohiYozing")} value={recruiterNotes || entrySession.recruiter_notes || ""} onChange={e => setRecruiterNotes(e.target.value)} className="text-sm min-h-[80px]" data-testid={`textarea-recruiter-notes-${entry.id}`} />
                  <Select value={recommendation || entrySession.recommendation || ""} onValueChange={setRecommendation}>
                    <SelectTrigger className="text-sm h-9" data-testid={`select-recommendation-${entry.id}`}>
                      <SelectValue placeholder={t("tavsiyaTanlang")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hire">{t("qabulQilishTavsiyaEtiladi")}</SelectItem>
                      <SelectItem value="maybe">{t("koribChiqishMumkin")}</SelectItem>
                      <SelectItem value="reject">{t("radEtishTavsiyaEtiladi")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
        <DialogFooter>
          {entrySession?.status === "completed" && (
            <Button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending} data-testid={`button-save-review-${entry.id}`}>
              {reviewMutation.isPending ? "Saqlanmoqda..." : "Izohni Saqlash"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>{t("close2")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VacancyMarketBadge({ vacancyId }: { vacancyId: number }) {
  const { data } = useQuery<{ data: { employer_market?: { market_heat?: string } } | null }>({
    queryKey: [`/api/hr/recruitment/vacancies/${vacancyId}/market-analysis`],
    staleTime: 120_000,
  });
  const heat = data?.data?.employer_market?.market_heat as "hot" | "medium" | "cold" | undefined;
  if (!heat) return null;
  return <div className="mt-1"><MarketAnalysisBadge heat={heat} /></div>;
}

export function ProbationCompleteButton({ entryId, onComplete, isPending }: { entryId: number; onComplete: () => void; isPending: boolean }) {
  const { data } = useQuery<{ data: { checklist_data: Record<string, { done: boolean }> } }>({
    queryKey: [`/api/hr/recruitment/pipeline/${entryId}/checklist`],
    staleTime: 30_000,
  });
  const day90Done = data?.data?.checklist_data?.day_90_review?.done ?? false;
  return (
    <Button
      data-testid={`button-sinov-complete-${entryId}`}
      size="sm"
      variant="default"
      className="h-7 text-xs flex-1 bg-lime-600 hover:bg-[var(--ep-green)]/90 disabled:opacity-40"
      disabled={isPending || !day90Done}
      title={!day90Done ? "90-kun baholash to'ldirilishi shart" : undefined}
      onClick={onComplete}
    >
      <CheckCircle className="w-3 h-3 mr-0.5" />
      {day90Done ? "Sinov Yakunlandi" : "90-kun baholash kerak"}
    </Button>
  );
}
