/**
 * @module CandidateReportDialogSections2
 * @description Sections 4–6 (Checklist, Decision, Risks) for CandidateReportDialog.
 */

import { CheckCircle, XCircle, AlertTriangle, Star, Shield, ClipboardCheck } from "lucide-react";
import { CHECKLIST_ITEMS } from "./CandidateChecklist";
import { SectionBlock } from "./CandidateReportDialogSections";
import type { ReportData } from "./CandidateReportDialogTypes";
import { TOOL_TRAIT_LABELS, MOTIVATION_LABELS, DECISION_INFO } from "./CandidateReportDialogTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Section 4: Checklist ─────────────────────────────────────────────────────

export function Section4Checklist({ report }: { report: ReportData }) {
  const { t } = useTranslation("common");
  const checklistData = report.checklist_data ?? {};
  return (
    <SectionBlock number={4} title="Tavsiyalar Tekshiruvi Natijalari (Cheklist)" icon={ClipboardCheck}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {(Array.isArray(CHECKLIST_ITEMS) ? CHECKLIST_ITEMS : []).map(item => {
          const entry = (checklistData as Record<string, { done: boolean; done_at?: string | null; note?: string }>)[item.key];
          const done = entry?.done ?? false;
          return (
            <div key={item.key} className={`flex items-start gap-1.5 px-2 py-1 rounded text-xs ${done ? "bg-green-50" : "bg-gray-50"}`}>
              {done ? (
                <CheckCircle className="w-3 h-3 text-[var(--ep-green)] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
              )}
              <div>
                <span className={done ? "text-gray-700" : "text-gray-400"}>{item.label}</span>
                {item.mandatory && !done && (
                  <span className="text-red-400 ml-1 text-[9px] font-bold">*</span>
                )}
                {done && entry?.done_at && (
                  <span className="ml-1 text-[9px] text-[var(--ep-green)]">
                    {new Date(entry.done_at).toLocaleDateString("uz-UZ")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionBlock>
  );
}

// ─── Section 5: Final recommendation ─────────────────────────────────────────

export function Section5Decision({ report }: { report: ReportData }) {
  const decisionKey = report.final_decision ?? report.recommendation ?? null;
  const decisionInfo = decisionKey ? (DECISION_INFO[decisionKey] ?? null) : null;
  return (
    <SectionBlock number={5} title={t("yakuniyTavsiya")} icon={Star}>
      {decisionInfo ? (
        <div className={`rounded-lg border-2 p-5 ${decisionInfo.bg} ${decisionInfo.border} print:bg-white`}>
          <div className="flex items-center gap-3 mb-2">
            {decisionKey === "qabul" ? (
              <CheckCircle className="w-7 h-7 text-[var(--ep-green)]" />
            ) : decisionKey === "kutish" ? (
              <AlertTriangle className="w-7 h-7 text-[var(--ep-yellow)]" />
            ) : (
              <XCircle className="w-7 h-7 text-[var(--ep-red)]" />
            )}
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("yakuniyQaror")}</p>
              <p className={`text-lg font-bold ${decisionInfo.color}`}>{decisionInfo.label}</p>
            </div>
          </div>
          {report.final_notes_text && (
            <p className="text-sm text-gray-700 mt-2 italic">"{report.final_notes_text}"</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <p className="text-sm text-gray-400 italic">{t("yakuniyTavsiyaKiritilmagan")}</p>
        </div>
      )}
    </SectionBlock>
  );
}

// ─── Section 6: Risks and opportunities ──────────────────────────────────────

export function Section6Risks({ report }: { report: ReportData }) {
  const toolTestResults = report.tool_test_results ?? {};
  const hasTool = Object.keys(toolTestResults).length > 0;
  const motivLevel = report.motivation_level ?? null;

  return (
    <SectionBlock number={6} title={t("xavfVaImkoniyatlar")} icon={Shield}>
      {report.final_notes_text && (() => {
        const xulosaLine = report.final_notes_text.split("\n").find(l => l.startsWith("Xulosa:"));
        return xulosaLine ? (
          <div className="mb-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Rekruter xulosasi (erkin matn)</p>
            <p className="text-sm text-gray-700 italic">"{xulosaLine.replace(/^Xulosa:\s*/, "")}"</p>
          </div>
        ) : null;
      })()}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-amber-200 rounded-lg p-3 bg-amber-50 print:bg-white">
          <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Xavf omillari (TOOL TEST tahlili)
          </p>
          {hasTool ? (
            <ul className="text-xs text-gray-700 space-y-1">
              {(Object.entries(toolTestResults) as [string, number][])
                .filter(([, v]) => Math.abs(v) >= 80)
                .map(([k, v]) => (
                  <li key={k}>• {TOOL_TRAIT_LABELS[k]} ({k}) kompulsiv: {v > 0 ? "+" : ""}{v}</li>
                ))}
              {report.tool_test_score != null && report.tool_test_score < -30 && (
                <li>• TOOL TEST umumiy ball past: {report.tool_test_score}</li>
              )}
              {(Object.entries(toolTestResults) as [string, number][]).filter(([, v]) => Math.abs(v) >= 80).length === 0 &&
               (report.tool_test_score == null || report.tool_test_score >= -30) && (
                <li className="text-gray-400 italic">{t("kompulsivKorsatkichlarAniqlanmadi")}</li>
              )}
              {report.flow_direction === "outflow" && (
                <li>{t("chiquvchiOqimNomzodAsosanKetmoqchi")}</li>
              )}
              {motivLevel === 1 && (
                <li>• Motivatsiya: faqat moddiy manfaat (Pul)</li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 italic">{t("testMalumotlariYoq")}</p>
          )}
        </div>
        <div className="border border-green-200 rounded-lg p-3 bg-green-50 print:bg-white">
          <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Imkoniyatlar (TOOL TEST tahlili)
          </p>
          {hasTool ? (
            <ul className="text-xs text-gray-700 space-y-1">
              {(Object.entries(toolTestResults) as [string, number][])
                .filter(([, v]) => v >= 30 && v < 80)
                .map(([k, v]) => (
                  <li key={k}>• {TOOL_TRAIT_LABELS[k]} ({k}) kuchli: +{v}</li>
                ))}
              {report.tool_test_score != null && report.tool_test_score >= 30 && (
                <li>• TOOL TEST umumiy ball yuqori: +{report.tool_test_score}</li>
              )}
              {report.flow_direction === "inflow" && (
                <li>{t("kiruvchiOqimKompaniyagaKelmoqchi")}</li>
              )}
              {motivLevel != null && motivLevel >= 3 && (
                <li>• Motivatsiya: {MOTIVATION_LABELS[motivLevel]?.label} darajasi (yuqori)</li>
              )}
              {(Object.entries(toolTestResults) as [string, number][]).filter(([, v]) => v >= 30 && v < 80).length === 0 &&
               (report.tool_test_score == null || report.tool_test_score < 30) && (
                <li className="text-gray-400 italic">{t("belgilanganKuchliTomonlarYoq")}</li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 italic">{t("testMalumotlariYoq")}</p>
          )}
        </div>
      </div>
    </SectionBlock>
  );
}
