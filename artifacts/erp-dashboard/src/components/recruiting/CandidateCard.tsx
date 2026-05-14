/**
 * @module CandidateCard
 * @description React UI component.
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WORKER_TYPE_META } from "@/lib/workerType";
import { SyndromeAnalysis } from "@/components/hr/SyndromeAnalysis";
import { CandidateChecklistSheet, ChecklistProgressBadge, ProbationReviewBadges } from "@/pages/CandidateChecklist";
import { PhoneScriptSheet } from "@/pages/PhoneScriptSheet";
import { CVScreeningGuide } from "@/pages/CVScreeningGuide";
import { ProbationJournalPanel } from "@/components/hr/ProbationJournalPanel";
import {
  User, Phone, Mail, ChevronRight, Briefcase, ChevronDown, ChevronUp,
  Zap, BookOpen, Bot, Star, FileText, Send, Map,
} from "lucide-react";
import {
  type FunnelStage,
  STAGES, NEXT_STAGE, TERMINAL_STAGES,
  DeadlineBadge, AIInterviewDialog, ProbationCompleteButton,
} from "@/components/recruiting/helpers";
import type { PipelineEntry, Vacancy, AIInterviewSession } from "@/components/recruiting/types";

import { useTranslation } from '@/lib/i18n';
export interface CandidateCardProps {
  entry: PipelineEntry;
  stage: typeof STAGES[0];
  aiSessions: AIInterviewSession[];
  vacancyMap: Record<number, Vacancy>;
  expandedCard: number | null;
  setExpandedCard: (id: number | null) => void;
  cpPanelOpen: Set<number>;
  setCpPanelOpen: React.Dispatch<React.SetStateAction<Set<number>>>;
  updateMutation: { mutate: (args: { id: number; funnel_stage: string }) => void; isPending: boolean };
  rejectMutation: { mutate: (id: number) => void; isPending: boolean };
  setInterviewEntry: (e: PipelineEntry | null) => void;
  setJobOfferEntry: (e: PipelineEntry | null) => void;
  setReportEntry: (e: PipelineEntry | null) => void;
  setRoadmapEntry: (e: PipelineEntry | null) => void;
  setPortretVacancy: (v: Vacancy | null) => void;
}

export function CandidateCard({entry, stage, aiSessions, vacancyMap,
  expandedCard, setExpandedCard,
  cpPanelOpen, setCpPanelOpen,
  updateMutation, rejectMutation,
  setInterviewEntry, setJobOfferEntry, setReportEntry, setRoadmapEntry, setPortretVacancy,
}: CandidateCardProps) {
  const { t } = useTranslation('common');
  const vac = entry.vacancy_id ? vacancyMap[entry.vacancy_id] : null;
  const isUrgent = vac?.is_urgent ?? false;
  const [confirmRejectId, setConfirmRejectId] = useState<number | null>(null);

  return (
    <div
      data-testid={`card-candidate-${entry.id}`}
      className={`bg-card rounded-lg p-4 hover-elevate flex flex-col gap-2 shadow-sm ${isUrgent ? "border border-red-500/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span data-testid={`text-candidate-name-${entry.id}`} className="text-sm font-medium leading-tight truncate">{entry.candidate_name}</span>
          <ChecklistProgressBadge pipelineEntryId={entry.id} />
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isUrgent && <Badge className="bg-[var(--ep-red)] text-white text-[9px] px-1 py-0 h-4 gap-0.5"><Zap className="w-2 h-2" />SHOSHILINCH</Badge>}
          <button data-testid={`button-expand-card-${entry.id}`} aria-label={expandedCard === entry.id ? "Portretni yopish" : "Portretni ko'rish"} aria-expanded={expandedCard === entry.id} onClick={() => setExpandedCard(expandedCard === entry.id ? null : entry.id)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            {expandedCard === entry.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {entry.candidate_source && <Badge variant="outline" className="text-xs">{entry.candidate_source}</Badge>}
          <DeadlineBadge daysRemaining={entry.days_remaining} deadlinePercent={entry.deadline_percent} />
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Phone className="w-3 h-3" /><span data-testid={`text-candidate-phone-${entry.id}`}>{entry.candidate_phone}</span>
      </div>
      {entry.candidate_email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" /><span className="truncate">{entry.candidate_email}</span></div>}
      {entry.vacancy_title && (
        <div className="flex items-center gap-1 text-xs text-primary">
          <Briefcase className="w-3 h-3 shrink-0" />
          <span className="truncate">{entry.vacancy_title}</span>
          {entry.vacancy_type && <Badge variant="secondary" className="text-[9px] ml-1">{entry.vacancy_type}</Badge>}
        </div>
      )}

      {(() => {
        const sess = (Array.isArray(aiSessions) ? aiSessions : []).find(s => s.pipeline_entry_id === entry.id || (s.candidate_name && s.candidate_name === entry.candidate_name));
        if (!sess) return null;
        const statusColor: Record<string, string> = { pending: "bg-blue-500/10 text-blue-400", started: "bg-amber-500/10 text-amber-400", completed: "bg-green-500/10 text-green-400", expired: "bg-red-500/10 text-red-400" };
        return <div className={`flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 w-fit ${statusColor[sess.status] || "bg-muted/50 text-muted-foreground"}`}><Bot className="w-2.5 h-2.5" />AI: {sess.overall_score !== null ? `${Math.round(sess.overall_score!)}%` : sess.status}</div>;
      })()}

      {entry.worker_type && (() => {
        const meta = WORKER_TYPE_META[entry.worker_type as keyof typeof WORKER_TYPE_META];
        if (!meta) return null;
        const targetType = vac?.portret?.target_worker_type;
        const isMatch = targetType ? targetType === entry.worker_type : null;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 border font-semibold ${meta.bg} ${meta.color} ${meta.border}`}>{meta.emoji} {meta.label}</span>
            {isMatch === true && <span className="inline-flex items-center gap-0.5 text-[9px] rounded px-1 py-0.5 bg-green-500/10 text-green-400 border border-green-500/30 font-medium">{t("mos1")}</span>}
            {isMatch === false && <span className="inline-flex items-center gap-0.5 text-[9px] rounded px-1 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 font-medium">{t("mosEmas1")}</span>}
          </div>
        );
      })()}

      {entry.recruiter_name && <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><User className="w-2.5 h-2.5" /><span className="truncate">{entry.recruiter_name}</span></div>}

      {(entry.tool_test_score != null || entry.screening_score != null || entry.recommendation || entry.tool_test_results) && (
        <div className="flex flex-col gap-1 pt-1 border-t border-border/30">
          <div className="flex flex-wrap gap-1">
            {entry.screening_score != null && <span className="text-[9px] bg-blue-500/10 text-blue-400 rounded px-1.5 py-0.5 font-medium">AI: {entry.screening_score}%</span>}
            {entry.tool_test_score != null && <span className={`text-[9px] rounded px-1.5 py-0.5 font-medium ${entry.tool_test_score >= 30 ? "bg-green-500/10 text-green-400" : entry.tool_test_score >= -30 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>TOOL TEST: {entry.tool_test_score > 0 ? "+" : ""}{entry.tool_test_score}</span>}
            {entry.recommendation && <span className={`text-[9px] rounded px-1.5 py-0.5 font-semibold uppercase ${entry.recommendation === "qabul" ? "bg-green-500/15 text-green-400" : entry.recommendation === "kutish" ? "bg-amber-500/15 text-amber-400" : entry.recommendation === "rad" ? "bg-orange-500/15 text-orange-400" : "bg-red-500/15 text-red-400"}`}>{entry.recommendation === "qabul" ? "✓ Qabul" : entry.recommendation === "kutish" ? "⏳ Kutish" : entry.recommendation === "rad" ? "✕ Rad" : "⛔ Hech qachon"}</span>}
          </div>
          {entry.tool_test_results && Object.keys(entry.tool_test_results).length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-1 mt-0.5">
              {(["A","B","C","D","E","F","G","H","I","J"]).map(key => {
                const score = entry.tool_test_results?.[key] ?? 0;
                const pct = Math.max(4, (score + 100) / 2);
                const colorBar = score >= 30 ? "bg-green-500" : score >= -30 ? "bg-amber-500" : "bg-red-500";
                const colorTxt = score >= 30 ? "text-green-400" : score >= -30 ? "text-amber-400" : "text-red-400";
                return (
                  <div key={key} className="flex flex-col items-center gap-0.5">
                    <span className={`text-[9px] font-bold font-mono ${colorTxt}`}>{score > 0 ? "+" : ""}{score}</span>
                    <div className="w-full h-5 bg-border/30 rounded-sm overflow-hidden flex items-end"><div className={`w-full rounded-sm transition-all ${colorBar}`} style={{ height: `${pct}%` }} /></div>
                    <span className="text-[8px] text-muted-foreground font-mono">{key}</span>
                  </div>
                );
              })}
            </div>
          )}
          {entry.tool_test_results && Object.keys(entry.tool_test_results).length > 0 && <div className="mt-0.5"><SyndromeAnalysis toolTestResults={entry.tool_test_results} compact /></div>}
        </div>
      )}

      <ProbationReviewBadges pipelineEntryId={entry.id} />
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/20">
        <CandidateChecklistSheet pipelineEntryId={entry.id} candidateName={entry.candidate_name} />
      </div>

      {expandedCard === entry.id && vac?.portret && (
        <div data-testid={`portret-panel-${entry.id}`} className="border border-purple-500/20 rounded-md p-2.5 bg-purple-500/5 flex flex-col gap-2 text-xs">
          <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide">{t("xodimPortreti")}</p>
          {vac.portret?.main_purpose && <div><span className="text-[10px] text-muted-foreground">{t("lavozimMaqsadi")}</span><p className="text-foreground mt-0.5 leading-snug line-clamp-3">{vac.portret.main_purpose}</p></div>}
          {vac.portret?.problem_solved && <div><span className="text-[10px] text-muted-foreground">{t("halQilinadiganMuammo")}</span><p className="text-foreground mt-0.5 leading-snug line-clamp-2">{vac.portret.problem_solved}</p></div>}
          {vac.portret?.reports_to && <div><span className="text-[10px] text-muted-foreground">{t("kimgaHisobotBeradi")}</span><p className="text-foreground mt-0.5">{vac.portret.reports_to}</p></div>}
          {(vac.portret?.age_min ?? vac.portret?.age_max) && <div className="flex gap-3"><span className="text-[10px] text-muted-foreground">{t("yosh")}</span><span className="text-foreground text-[10px]">{vac.portret.age_min}–{vac.portret.age_max}</span></div>}
          {vac.portret?.main_duties && <div><span className="text-[10px] text-muted-foreground">{t("asosiyMajburiyatlar")}</span><p className="text-foreground mt-0.5 leading-snug line-clamp-3">{vac.portret.main_duties}</p></div>}
          {vac.portret?.expected_result && <div><span className="text-[10px] text-muted-foreground">{t("kutilganNatija")}</span><p className="text-foreground mt-0.5 leading-snug line-clamp-2">{vac.portret.expected_result}</p></div>}
          {(vac.portret?.salary_min != null || vac.portret?.salary_max != null) && (
            <div className="flex gap-3 flex-wrap">
              {vac.portret?.salary_min != null && <div><span className="text-[10px] text-muted-foreground">{t("min")}</span><span className="font-semibold text-green-400 ml-1">{Number(vac.portret.salary_min).toLocaleString("uz-UZ")} so'm</span></div>}
              {vac.portret?.salary_max != null && <div><span className="text-[10px] text-muted-foreground">{t("max")}</span><span className="font-semibold text-green-400 ml-1">{Number(vac.portret.salary_max).toLocaleString("uz-UZ")} so'm</span></div>}
            </div>
          )}
          {vac.portret?.danger_candidate && <div><span className="text-[10px] text-red-400 font-medium">{t("xavfliKanditat")}</span><p className="text-muted-foreground mt-0.5 leading-snug line-clamp-2">{vac.portret.danger_candidate}</p></div>}

          {(stage.key === "INTERVIEW_SCHEDULED" || stage.key === "INTERVIEWED") && vac.portret?.candidate_presentation && Object.values(vac.portret.candidate_presentation).some(v => !!v) && (() => {
            const cp = vac.portret?.candidate_presentation ?? {};
            const isOpen = cpPanelOpen.has(entry.id);
            const sinov = ([cp.sinov_maosh_min, cp.sinov_maosh_max]).filter(Boolean).join(" – ");
            const SHARTNOMA_LABELS: Record<string, string> = { unlimited: "Muddatsiz", limited: "Muddatli", gpc: "GPC", ip: "IP" };
            return (
              <div className="border border-sky-500/30 rounded-lg bg-sky-500/5 overflow-hidden">
                <button type="button" onClick={() => setCpPanelOpen((prev: Set<number>) => { const next = new Set(prev); if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id); return next; })} className="w-full flex items-center justify-between px-2.5 py-1.5 text-left hover:bg-[var(--ep-blue)]/90/10 transition-colors">
                  <span className="text-[10px] font-semibold text-sky-400 flex items-center gap-1">💬 Kandidatga aytiladi (IV bo'lim)</span>
                  <span className="text-[10px] text-sky-400">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="px-2.5 pb-2.5 flex flex-col gap-1.5 text-xs border-t border-sky-500/20">
                    {cp.kompaniya_taqdimoti && <div><span className="text-[10px] text-muted-foreground">{t("kompaniya")}</span><p className="text-foreground leading-snug line-clamp-3 mt-0.5">{cp.kompaniya_taqdimoti}</p></div>}
                    {cp.ish_tartibi && <div><span className="text-[10px] text-muted-foreground">{t("ishTartibi")}</span><p className="text-foreground line-clamp-2 mt-0.5">{cp.ish_tartibi}</p></div>}
                    {cp.instrumentlar && <div><span className="text-[10px] text-muted-foreground">{t("instrumentlar")}</span><p className="text-foreground line-clamp-1 mt-0.5">{cp.instrumentlar}</p></div>}
                    {cp.guruh_javob && <div><span className="text-[10px] text-muted-foreground">{t("guruh")}</span><span className="text-foreground ml-1">{cp.guruh_javob}</span></div>}
                    <div className="flex gap-3 flex-wrap">
                      {cp.xizmat_safari && <span className="text-[10px] text-blue-400">Safari: {cp.xizmat_safari === "yes" ? "Ha" : "Yo'q"}</span>}
                      {cp.sinov_muddat && <span className="text-[10px] text-orange-400">Sinov: {cp.sinov_muddat}</span>}
                    </div>
                    {sinov && <div><span className="text-[10px] text-muted-foreground">{t("sinovMaoshi")}</span><span className="text-amber-400 ml-1 text-[10px]">{Number(cp.sinov_maosh_min || 0).toLocaleString("uz-UZ")} – {Number(cp.sinov_maosh_max || 0).toLocaleString("uz-UZ")} so'm</span></div>}
                    {cp.asosiy_maosh && <div><span className="text-[10px] text-muted-foreground">{t("asosiyMaosh")}</span><span className="text-green-400 ml-1">{cp.asosiy_maosh}</span></div>}
                    {cp.martaba && <div><span className="text-[10px] text-muted-foreground">{t("martaba")}</span><p className="text-foreground line-clamp-1 mt-0.5">{cp.martaba}</p></div>}
                    <div className="flex gap-3 flex-wrap">
                      {cp.tatil_kun && <span className="text-[10px] text-purple-400">Ta'til: {cp.tatil_kun}</span>}
                      {cp.ish_rejimi && <span className="text-[10px] text-cyan-400">Grafik: {cp.ish_rejimi}</span>}
                      {cp.shartnoma_tur && <span className="text-[10px] text-indigo-400">Shartnoma: {SHARTNOMA_LABELS[cp.shartnoma_tur] ?? cp.shartnoma_tur}</span>}
                    </div>
                    {cp.sotsial_paket && <div><span className="text-[10px] text-muted-foreground">{t("sotsialPaket")}</span><p className="text-foreground line-clamp-1 mt-0.5">{cp.sotsial_paket}</p></div>}
                    {cp.oqutish && <div><span className="text-[10px] text-muted-foreground">{t("oqitish")}</span><p className="text-foreground line-clamp-1 mt-0.5">{cp.oqutish}</p></div>}
                    {cp.jalb_qiluvchi && <div className="border-t border-sky-500/20 pt-1.5 mt-0.5"><span className="text-[10px] text-sky-400 font-medium">{t("nimaUchunBiz")}</span><p className="text-foreground line-clamp-2 mt-0.5">{cp.jalb_qiluvchi}</p></div>}
                  </div>
                )}
              </div>
            );
          })()}

          {vac.tool_test_requirements?.traits && (
            <div>
              <span className="text-[10px] text-muted-foreground">TOOL TEST talabi vs natija (A-J):</span>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-2 gap-y-1.5 mt-1">
                {(["A","B","C","D","E","F","G","H","I","J"]).map(k => {
                  const req = vac.tool_test_requirements?.traits?.[k] ?? 0;
                  const cand = entry.tool_test_results?.[k] ?? null;
                  const meets = cand !== null ? cand >= req : null;
                  const reqPct = Math.max(0, Math.min(100, ((req + 100) / 200) * 100));
                  const candPct = cand !== null ? Math.max(0, Math.min(100, ((cand + 100) / 200) * 100)) : null;
                  return (
                    <div key={k} className="flex flex-col gap-0.5">
                      <div className="flex justify-between"><span className="text-[8px] font-bold text-purple-300">{k}</span><span className="text-[7px] text-muted-foreground">{req > 0 ? "+" : ""}{req}</span></div>
                      <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div className="absolute top-0 h-full bg-purple-500/60 rounded-full" style={{ left: `${req < 0 ? reqPct : 50}%`, width: `${Math.abs(reqPct - 50)}%` }} />
                        <div className="absolute top-0 h-full w-px bg-white/20" style={{ left: "50%" }} />
                      </div>
                      <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        {cand !== null && <div className={`absolute top-0 h-full rounded-full ${meets ? "bg-green-500/70" : "bg-red-500/70"}`} style={{ left: `${cand < 0 ? candPct! : 50}%`, width: `${cand !== null ? Math.abs(candPct! - 50) : 0}%` }} />}
                        <div className="absolute top-0 h-full w-px bg-white/20" style={{ left: "50%" }} />
                      </div>
                      {cand !== null && <span className={`text-[7px] text-right ${meets ? "text-green-400" : "text-red-400"}`}>{cand > 0 ? "+" : ""}{cand}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button className="text-[10px] text-purple-400 hover:text-purple-300 underline self-start" onClick={() => vac && setPortretVacancy(vac)}>{t("toliqPortretniTahrirlash")}</button>
        </div>
      )}

      {expandedCard === entry.id && !vac?.portret && (
        <div className="border border-border/30 rounded-md p-2.5 text-center text-xs text-muted-foreground">
          Bu vakansiya uchun portret to'ldirilmagan.{" "}
          {vac && <button className="text-purple-400 hover:text-purple-300 underline" onClick={() => setPortretVacancy(vac)}>{t("portretYaratish")}</button>}
        </div>
      )}

      {stage.key === "PROBATION" && <ProbationJournalPanel pipelineEntryId={entry.id} candidateName={entry.candidate_name} probationMonths={vac?.portret?.probation_months ?? 3} />}

      <div className="flex flex-col gap-1 mt-1">
        <div className="flex gap-1">
          {stage.key === "PROBATION" && <ProbationCompleteButton entryId={entry.id} isPending={updateMutation.isPending} onComplete={() => updateMutation.mutate({ id: entry.id, funnel_stage: "SINOV_COMPLETE" })} />}
          {NEXT_STAGE[stage.key] && stage.key !== "PROBATION" && (
            <Button data-testid={`button-advance-${entry.id}`} size="sm" variant="default" className="h-7 text-xs flex-1" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: entry.id, funnel_stage: NEXT_STAGE[stage.key]! })}>
              <ChevronRight className="w-3 h-3 mr-0.5" />{(Array.isArray(STAGES) ? STAGES : []).find(s => s.key === NEXT_STAGE[stage.key])?.label}
            </Button>
          )}
          {!TERMINAL_STAGES.includes(stage.key) && <Button data-testid={`button-reject-${entry.id}`} size="sm" variant="outline" className="h-7 text-xs text-[var(--ep-red)] border-red-500/30" disabled={rejectMutation.isPending} onClick={() => setConfirmRejectId(entry.id)}>✕</Button>}
        </div>
        {stage.key === "OFFER_SENT" && <Button size="sm" variant="outline" className="h-6 text-[10px] text-orange-400 border-orange-500/30 hover:bg-[var(--ep-primary)]/90/10 gap-1" onClick={() => setJobOfferEntry(entry)} data-testid={`button-job-offer-${entry.id}`}><Send className="w-2.5 h-2.5" />{t('jobOffer')}</Button>}
        {(["INTERVIEWED", "OFFER_SENT", "HIRED", "REJECTED"] as FunnelStage[]).includes(stage.key) && <Button size="sm" variant="ghost" className="h-6 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-[var(--ep-blue)]/90/10 gap-1 px-1 border border-blue-500/20" onClick={() => setReportEntry(entry)} data-testid={`button-candidate-report-${entry.id}`}><FileText className="w-2.5 h-2.5" />{t("report")}</Button>}
        {stage.key === "HIRED" && <Button size="sm" variant="outline" className="h-6 text-[10px] text-emerald-400 border-emerald-500/30 hover:bg-[var(--ep-green)]/90/10 gap-1" onClick={() => setRoadmapEntry(entry)} data-testid={`button-roadmap-${entry.id}`}><Map className="w-2.5 h-2.5" />{t("yolXaritasi")}</Button>}
        {vac?.portret && <Button size="sm" variant="ghost" className="h-6 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-[var(--ep-purple)]/90/10 px-1" onClick={() => vac && setPortretVacancy(vac)}><BookOpen className="w-2.5 h-2.5 mr-1" />{t("portretKorish")}</Button>}
        {(stage.key === "INTERVIEW_SCHEDULED" || stage.key === "INTERVIEWED" || stage.key === "TEST_SENT") && <Button size="sm" variant="ghost" data-testid={`button-interview-blank-${entry.id}`} className="h-6 text-[10px] text-teal-400 hover:text-teal-300 hover:bg-[var(--ep-cyan)]/90/10 px-1" onClick={() => setInterviewEntry(entry)}><Star className="w-2.5 h-2.5 mr-1" />{t("suhbatBlanki")}</Button>}
        {stage.key === "PHONE_SCREENING" && <PhoneScriptSheet candidateName={entry.candidate_name} trigger={<Button size="sm" variant="ghost" data-testid={`button-phone-script-${entry.id}`} className="h-6 text-[10px] text-violet-400 hover:text-violet-300 hover:bg-[var(--ep-purple)]/90/10 gap-1 px-1"><Phone className="w-2.5 h-2.5" />{t("skript53")}</Button>} />}
        {(stage.key === "NEW" || stage.key === "QUESTIONNAIRE_SENT") && <CVScreeningGuide candidateName={entry.candidate_name} trigger={<Button size="sm" variant="ghost" data-testid={`button-cv-guide-${entry.id}`} className="h-6 text-[10px] text-teal-400 hover:text-teal-300 hover:bg-[var(--ep-cyan)]/90/10 gap-1 px-1"><FileText className="w-2.5 h-2.5" />{t("cvMezonlari52")}</Button>} />}
        <AIInterviewDialog entry={entry} sessions={aiSessions} />
      </div>
      <ConfirmDialog
        open={confirmRejectId !== null}
        onOpenChange={(open) => { if (!open) setConfirmRejectId(null); }}
        title={t("nomzodniRadEtish")}
        description={`"${entry.candidate_name}" nomzodini rad etishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
        confirmText="Rad etish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmRejectId !== null) rejectMutation.mutate(confirmRejectId); }}
      />
    </div>
  );
}
