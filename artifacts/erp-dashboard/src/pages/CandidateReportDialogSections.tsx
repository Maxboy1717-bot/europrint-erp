/**
 * @module CandidateReportDialogSections
 * @description Shared primitives and sections 1–3 for CandidateReportDialog.
 * Sections 4–6 live in CandidateReportDialogSections2.tsx.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Bot, User, BarChart2, TrendingUp } from "lucide-react";
import { SyndromeAnalysis } from "@/components/hr/SyndromeAnalysis";
import type { ReportData } from "./CandidateReportDialogTypes";
import { useTranslation } from '@/lib/i18n';
import {
  TOOL_TRAIT_LABELS, MOTIVATION_LABELS, MOTIVATION_ANSWER_LABELS,
} from "./CandidateReportDialogTypes";

// Re-exports from second section file
export { Section4Checklist, Section5Decision, Section6Risks } from "./CandidateReportDialogSections2";

// ─── Shared primitives ────────────────────────────────────────────────────────

export function ScoreRow({ label, score, max = 10, color }: { label: string; score: number | null | undefined; max?: number; color?: string; }) {
  const { t } = useTranslation('common');
  if (score == null) return null;
  const pct = (score / max) * 100;
  const c = color ?? (pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500");
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SectionBlock({ number, title, icon: Icon, children }: {
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid mb-6 print:mb-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-primary/30">
        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 print:bg-black">
          {number}
        </div>
        <Icon className="w-4 h-4 text-[var(--ep-primary)]" />
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function InfoPair({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1 border-b border-gray-100 last:border-none">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}:</span>
      <span className="text-xs font-medium text-gray-800">{value || "—"}</span>
    </div>
  );
}

// ─── Section 1: Basic info + score summary ────────────────────────────────────

export function Section1BasicInfo({ report }: { report: ReportData }) {
  return (
    <SectionBlock number={1} title={t("asosiyMalumotlarVaNatijalar")} icon={User}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <InfoPair label={"Funnel bosqichi"} value={report.funnel_stage} />
          <InfoPair label={t("arizaManbasi")} value={report.candidate_source} />
          {report.avg_score != null && (
            <InfoPair label={t("suhbatOrtachaBall")} value={
              <span className={`font-bold ${report.avg_score >= 7 ? "text-[var(--ep-green)]" : report.avg_score >= 5 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
                {report.avg_score}/10
              </span>
            } />
          )}
          {report.tool_test_score != null && (
            <InfoPair label="TOOL TEST umumiy ball" value={
              <span className={`font-bold ${report.tool_test_score >= 30 ? "text-[var(--ep-green)]" : report.tool_test_score >= -30 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
                {report.tool_test_score > 0 ? "+" : ""}{report.tool_test_score}
              </span>
            } />
          )}
          {report.screening_score != null && (
            <InfoPair label={t("aiSaralashBall")} value={`${report.screening_score}%`} />
          )}
        </div>
        <div className="space-y-2 bg-gray-50 rounded-lg p-3 print:bg-white print:border">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">{t("suhbatBallXulosasi")}</p>
          <ScoreRow label={t("produktivlik")} score={report.productivity_score} />
          <ScoreRow label={t("motivatsiya")} score={report.motivation_score} />
          <ScoreRow label={t("kompetensiya")} score={report.competency_score} />
          {report.avg_score != null && (
            <div className="pt-1 border-t border-gray-200">
              <div className="flex justify-between text-xs font-semibold">
                <span>{t("ortacha")}</span>
                <span className={report.avg_score >= 7 ? "text-[var(--ep-green)]" : report.avg_score >= 5 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}>
                  {report.avg_score}/10
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionBlock>
  );
}

// ─── Section 2: Tool test A–J results ────────────────────────────────────────

export function Section2ToolTest({ report }: { report: ReportData }) {
  const toolTestResults = report.tool_test_results ?? {};
  const hasTool = Object.keys(toolTestResults).length > 0;
  const toolPassed = report.tool_test_passed ?? {};

  return (
    <SectionBlock number={2} title={t("toolTestAJNatijalari")} icon={BarChart2}>
      {!hasTool ? (
        <p className="text-sm text-gray-400 italic">{t("toolTestMalumotlariMavjudEmas")}</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(["A","B","C","D","E","F","G","H","I","J"]).map(key => {
              const score = toolTestResults[key] ?? 0;
              const pct = Math.max(4, (score + 100) / 2);
              const colorBar = score >= 30 ? "bg-green-500" : score >= -30 ? "bg-amber-500" : "bg-red-500";
              const colorTxt = score >= 30 ? "text-[var(--ep-green)]" : score >= -30 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";
              const passed = toolPassed?.[key];
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24 shrink-0">
                    {key}: {TOOL_TRAIT_LABELS[key]}
                    {passed !== undefined && (
                      <span className={`ml-1 font-bold ${passed ? "text-[var(--ep-green)]" : "text-red-400"}`}>
                        {passed ? " ✓" : " ✗"}
                      </span>
                    )}
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colorBar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs font-bold w-9 text-right ${colorTxt}`}>
                    {score > 0 ? "+" : ""}{score}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">{t("sindromlarTahlili")}</p>
            <SyndromeAnalysis toolTestResults={toolTestResults} />
          </div>
        </div>
      )}
    </SectionBlock>
  );
}

// ─── Section 3: IQ, Leadership, Repetition ───────────────────────────────────

export function Section3Scores({ report }: { report: ReportData }) {
  const motivLevel = report.motivation_level ?? null;
  const motivInfo = motivLevel ? MOTIVATION_LABELS[motivLevel] ?? null : null;

  return (
    <SectionBlock number={3} title={t("iqLiderlikVaTakrorlashNatijalari")} icon={TrendingUp}>
      {(report.competency_score != null || report.productivity_score != null || report.motivation_score != null) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {([
            { label: "IQ (Kompetensiya)", score: report.competency_score, color: "bg-purple-600", text: "text-[var(--ep-purple)]" },
            { label: "Liderlik (Produktivlik)", score: report.productivity_score, color: "bg-blue-600", text: "text-[var(--ep-blue)]" },
            { label: "Takrorlash (Motivatsiya)", score: report.motivation_score, color: "bg-orange-500", text: "text-[var(--ep-primary)]" },
          ]).map(({ label, score, color, text }) => (
            <div key={label} className="rounded-lg border border-gray-200 p-3 bg-white text-center">
              <p className="text-[10px] text-gray-400 mb-1">{label}</p>
              {score != null ? (
                <>
                  <p className={`text-2xl font-bold ${text}`}>{score}<span className="text-xs font-normal text-gray-400">/10</span></p>
                  <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${score * 10}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-300 italic mt-1">—</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic mb-4">{t("produktivlikSuhbatiOtkazilmagan")}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {motivInfo && (
            <div className="mb-3 flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-2xl">{motivInfo.icon}</span>
              <div>
                <p className="text-[10px] text-gray-400">{t("motivatsiyaDarajasi")}</p>
                <p className={`text-sm font-bold ${motivInfo.color}`}>{motivInfo.label}</p>
              </div>
            </div>
          )}
          {report.flow_direction && (
            <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-lg">{report.flow_direction === "inflow" ? "→" : "←"}</span>
              <div>
                <p className="text-[10px] text-gray-400">{t("oqimYonalishi")}</p>
                <p className="text-sm font-medium">
                  {report.flow_direction === "inflow" ? "Kiruvchi oqim (kompaniyaga kelmoqchi)" : "Chiquvchi oqim (ketmoqchi)"}
                </p>
              </div>
            </div>
          )}
        </div>
        {report.motivation_answers && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t("motivatsiyaSavollari")}</p>
            {Object.entries(report.motivation_answers).map(([k, v]) => {
              if (!v) return null;
              return (
                <div key={k} className="text-xs">
                  <span className="text-gray-400">{MOTIVATION_ANSWER_LABELS[k] ?? k}: </span>
                  <span className="text-gray-700 italic">"{v}"</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {report.ai_session && (
        <div className="mt-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
          <div className="flex items-center gap-1.5 mb-2">
            <Bot className="w-4 h-4 text-[var(--ep-blue)]" />
            <p className="text-xs font-semibold text-[var(--ep-blue)]">{t("aiSuhbatNatijalari")}</p>
            <Badge variant="outline" className="text-[9px] ml-auto border-blue-400 text-[var(--ep-blue)]">{report.ai_session.status}</Badge>
          </div>
          {report.ai_session.overall_score != null && (
            <div className="text-center mb-2">
              <span className="text-xl font-bold text-[var(--ep-blue)]">{Math.round(report.ai_session.overall_score)}%</span>
              <span className="text-xs text-gray-400 ml-1">umumiy ball</span>
            </div>
          )}
          {report.ai_session.ai_summary && (
            <p className="text-xs text-gray-600 italic">"{report.ai_session.ai_summary}"</p>
          )}
        </div>
      )}
    </SectionBlock>
  );
}
