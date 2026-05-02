import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer, User, Phone, Mail, Briefcase, CheckCircle, XCircle, AlertTriangle,
  FileText, Star, TrendingUp, Shield, BarChart2, ClipboardCheck, Bot,
} from "lucide-react";
import { SyndromeAnalysis } from "@/components/hr/SyndromeAnalysis";
import { CHECKLIST_ITEMS } from "./CandidateChecklist";

// ─── Tool Test trait labels (A-J) ─────────────────────────────────────────────
const TOOL_TRAIT_LABELS: Record<string, string> = {
  A: "Diqqat",
  B: "Strategiya",
  C: "Nazorat",
  D: "Ishonch",
  E: "Energiya",
  F: "Qat'iyat",
  G: "Himoya",
  H: "Taktika",
  I: "Empatiya",
  J: "Muloqot",
};

const MOTIVATION_LABELS: Record<number, { label: string; icon: string; color: string }> = {
  4: { label: "Burch", icon: "🏛", color: "text-blue-600" },
  3: { label: "E'tiqod", icon: "💎", color: "text-indigo-600" },
  2: { label: "Manfaat", icon: "📈", color: "text-amber-600" },
  1: { label: "Pul", icon: "💰", color: "text-orange-600" },
};

const DECISION_INFO: Record<string, { label: string; color: string; bg: string; border: string }> = {
  qabul:      { label: "QABUL TAVSIYA ETILADI",   color: "text-green-700",  bg: "bg-green-50",  border: "border-green-500" },
  kutish:     { label: "KUTISH / QABUL KUTING",   color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-500" },
  rad:        { label: "RAD ETISH TAVSIYA ETILADI", color: "text-red-700",    bg: "bg-red-50",    border: "border-red-500" },
  hech_qachon:{ label: "HECH QACHON QABUL ETMANG", color: "text-red-900",    bg: "bg-red-100",   border: "border-red-700" },
};

interface ReportData {
  entry_id: number;
  funnel_stage: string;
  candidate_id: number;
  candidate_name: string;
  candidate_phone: string;
  candidate_email?: string | null;
  candidate_source?: string | null;
  vacancy_id?: number | null;
  vacancy_title?: string | null;
  vacancy_type?: string | null;
  recruiter_name?: string | null;
  created_at: string;
  tool_test_score?: number | null;
  tool_test_results?: Record<string, number> | null;
  tool_test_requirements?: { traits?: Record<string, number>; iq_min?: number } | null;
  productivity_score?: number | null;
  motivation_score?: number | null;
  competency_score?: number | null;
  avg_score?: number | null;
  motivation_level?: number | null;
  flow_direction?: string | null;
  tool_test_passed?: Record<string, boolean> | null;
  final_decision?: string | null;
  final_notes_text?: string | null;
  motivation_answers?: Record<string, string> | null;
  competency_answers?: Record<string, string> | null;
  checklist_data?: Record<string, { done: boolean; done_at?: string | null; note?: string }> | null;
  recommendation?: string | null;
  screening_score?: number | null;
  ai_session?: {
    status: string;
    overall_score?: number | null;
    communication_score?: number | null;
    confidence_score?: number | null;
    problem_solving_score?: number | null;
    ai_summary?: string | null;
    recommendation?: string | null;
  } | null;
}

function ScoreRow({ label, score, max = 10, color }: { label: string; score: number | null | undefined; max?: number; color?: string }) {
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

function SectionBlock({ number, title, icon: Icon, children }: {
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid mb-6 print:mb-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[#1a1a2e]/30">
        <div className="w-7 h-7 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center text-xs font-bold shrink-0 print:bg-black">
          {number}
        </div>
        <Icon className="w-4 h-4 text-orange-500" />
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function InfoPair({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1 border-b border-gray-100 last:border-none">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}:</span>
      <span className="text-xs font-medium text-gray-800">{value || "—"}</span>
    </div>
  );
}

export interface CandidateReportDialogProps {
  pipelineEntryId: number;
  candidateName: string;
  open: boolean;
  onClose: () => void;
}

export function CandidateReportDialog({
  pipelineEntryId,
  candidateName,
  open,
  onClose,
}: CandidateReportDialogProps) {
  const { data, isLoading, error } = useQuery<{ data: ReportData }>({
    queryKey: [`/api/hr/recruitment/pipeline/${pipelineEntryId}/report`],
    enabled: open && !!pipelineEntryId,
    staleTime: 60_000,
  });

  const report = data?.data;
  const toolTestResults = report?.tool_test_results ?? {};
  const hasTool = Object.keys(toolTestResults).length > 0;
  const toolPassed = report?.tool_test_passed ?? {};
  const checklistData = report?.checklist_data ?? {};

  const decisionKey = report?.final_decision ?? report?.recommendation ?? null;
  const decisionInfo = decisionKey ? (DECISION_INFO[decisionKey] ?? null) : null;

  const motivLevel = report?.motivation_level ?? null;
  const motivInfo = motivLevel ? MOTIVATION_LABELS[motivLevel] ?? null : null;

  const printDate = new Date().toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white border-b px-6 py-3 print:hidden">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-orange-500" />
              Kandidat Hisoboti — {candidateName}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 border-blue-400 text-blue-600"
                onClick={() => window.print()}
                data-testid="button-print-report"
              >
                <Printer className="w-3 h-3" />
                Chop etish / PDF
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
                Yopish
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-white text-gray-900" id="candidate-report-content">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
              Yuklanmoqda…
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              Ma'lumotni yuklashda xatolik. Qayta urinib ko'ring.
            </div>
          )}

          {!isLoading && !error && report && (
            <>
              {/* ── Report Header ── */}
              <div className="border-2 border-[#1a1a2e] rounded-lg p-5 mb-6 print:border-black">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                      YAKUNIY HISOBOT — HR Capital Material №55
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">{report.candidate_name}</h1>
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        {report.candidate_phone}
                      </div>
                      {report.candidate_email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          {report.candidate_email}
                        </div>
                      )}
                      {report.vacancy_title && (
                        <div className="flex items-center gap-1 text-sm text-blue-700">
                          <Briefcase className="w-3.5 h-3.5" />
                          {report.vacancy_title}
                          {report.vacancy_type && (
                            <Badge variant="outline" className="text-[9px] ml-1">{report.vacancy_type}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {report.recruiter_name && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <User className="w-3 h-3" />
                        Rekruter: {report.recruiter_name}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-gray-400">Hisobot sanasi</p>
                    <p className="text-sm font-semibold text-gray-700">{printDate}</p>
                    {decisionInfo && (
                      <div className={`mt-2 px-3 py-1 rounded border-2 text-xs font-bold ${decisionInfo.bg} ${decisionInfo.border} ${decisionInfo.color}`}>
                        {decisionInfo.label}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Section 1: Asosiy ma'lumotlar + Ball xulosasi ── */}
              <SectionBlock number={1} title="Asosiy Ma'lumotlar va Natijalar" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <InfoPair label="Funnel bosqichi" value={report.funnel_stage} />
                    <InfoPair label="Ariza manbasi" value={report.candidate_source} />
                    {report.avg_score != null && (
                      <InfoPair label="Suhbat o'rtacha ball" value={
                        <span className={`font-bold ${report.avg_score >= 7 ? "text-green-600" : report.avg_score >= 5 ? "text-amber-600" : "text-red-600"}`}>
                          {report.avg_score}/10
                        </span>
                      } />
                    )}
                    {report.tool_test_score != null && (
                      <InfoPair label="TOOL TEST umumiy ball" value={
                        <span className={`font-bold ${report.tool_test_score >= 30 ? "text-green-600" : report.tool_test_score >= -30 ? "text-amber-600" : "text-red-600"}`}>
                          {report.tool_test_score > 0 ? "+" : ""}{report.tool_test_score}
                        </span>
                      } />
                    )}
                    {report.screening_score != null && (
                      <InfoPair label="AI saralash ball" value={`${report.screening_score}%`} />
                    )}
                  </div>
                  <div className="space-y-2 bg-gray-50 rounded-lg p-3 print:bg-white print:border">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Suhbat Ball Xulosasi</p>
                    <ScoreRow label="Produktivlik" score={report.productivity_score} />
                    <ScoreRow label="Motivatsiya" score={report.motivation_score} />
                    <ScoreRow label="Kompetensiya" score={report.competency_score} />
                    {report.avg_score != null && (
                      <div className="pt-1 border-t border-gray-200">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>O'rtacha:</span>
                          <span className={report.avg_score >= 7 ? "text-green-600" : report.avg_score >= 5 ? "text-amber-600" : "text-red-600"}>
                            {report.avg_score}/10
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SectionBlock>

              {/* ── Section 2: TOOL TEST natijalari grafik ── */}
              <SectionBlock number={2} title="TOOL TEST A-J Natijalari" icon={BarChart2}>
                {!hasTool ? (
                  <p className="text-sm text-gray-400 italic">TOOL TEST ma'lumotlari mavjud emas</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {(["A","B","C","D","E","F","G","H","I","J"]).map(key => {
                        const score = toolTestResults[key] ?? 0;
                        const pct = Math.max(4, (score + 100) / 2);
                        const colorBar = score >= 30 ? "bg-green-500" : score >= -30 ? "bg-amber-500" : "bg-red-500";
                        const colorTxt = score >= 30 ? "text-green-700" : score >= -30 ? "text-amber-700" : "text-red-700";
                        const passed = toolPassed?.[key];
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-24 shrink-0">
                              {key}: {TOOL_TRAIT_LABELS[key]}
                              {passed !== undefined && (
                                <span className={`ml-1 font-bold ${passed ? "text-green-500" : "text-red-400"}`}>
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

                    {/* Syndrome analysis */}
                    <div className="mt-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Sindromlar Tahlili</p>
                      <SyndromeAnalysis toolTestResults={toolTestResults} />
                    </div>
                  </div>
                )}
              </SectionBlock>

              {/* ── Section 3: IQ, Liderlik, Takrorlash ── */}
              <SectionBlock number={3} title="IQ, Liderlik va Takrorlash Natijalari" icon={TrendingUp}>
                {/* Three score gauges — IQ (kompetensiya), Liderlik (produktivlik), Takrorlash (motivatsiya) */}
                {(report.competency_score != null || report.productivity_score != null || report.motivation_score != null) ? (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {([
                      { label: "IQ (Kompetensiya)", score: report.competency_score, color: "bg-purple-600", text: "text-purple-700" },
                      { label: "Liderlik (Produktivlik)", score: report.productivity_score, color: "bg-blue-600", text: "text-blue-700" },
                      { label: "Takrorlash (Motivatsiya)", score: report.motivation_score, color: "bg-orange-500", text: "text-orange-700" },
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
                  <p className="text-xs text-gray-400 italic mb-4">Produktivlik suhbati o'tkazilmagan</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {motivInfo && (
                      <div className="mb-3 flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50">
                        <span className="text-2xl">{motivInfo.icon}</span>
                        <div>
                          <p className="text-[10px] text-gray-400">Motivatsiya darajasi</p>
                          <p className={`text-sm font-bold ${motivInfo.color}`}>{motivInfo.label}</p>
                        </div>
                      </div>
                    )}
                    {report.flow_direction && (
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50">
                        <span className="text-lg">{report.flow_direction === "inflow" ? "→" : "←"}</span>
                        <div>
                          <p className="text-[10px] text-gray-400">Oqim yo'nalishi</p>
                          <p className="text-sm font-medium">
                            {report.flow_direction === "inflow" ? "Kiruvchi oqim (kompaniyaga kelmoqchi)" : "Chiquvchi oqim (ketmoqchi)"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {report.motivation_answers && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Motivatsiya savollari</p>
                      {Object.entries(report.motivation_answers).map(([k, v]) => {
                        if (!v) return null;
                        const labels: Record<string, string> = {
                          q1_work_meaning: "Bu ish sizga nima anglatadi?",
                          q2_ideal_env: "Ideal ish muhiti?",
                          q3_achievement: "Eng yaxshi natijangiz?",
                          q4_future_goal: "Kelajak maqsadingiz?",
                        };
                        return (
                          <div key={k} className="text-xs">
                            <span className="text-gray-400">{labels[k] ?? k}: </span>
                            <span className="text-gray-700 italic">"{v}"</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* AI interview section if exists */}
                {report.ai_session && (
                  <div className="mt-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-semibold text-blue-700">AI Suhbat Natijalari</p>
                      <Badge variant="outline" className="text-[9px] ml-auto border-blue-400 text-blue-600">{report.ai_session.status}</Badge>
                    </div>
                    {report.ai_session.overall_score != null && (
                      <div className="text-center mb-2">
                        <span className="text-xl font-bold text-blue-700">{Math.round(report.ai_session.overall_score)}%</span>
                        <span className="text-xs text-gray-400 ml-1">umumiy ball</span>
                      </div>
                    )}
                    {report.ai_session.ai_summary && (
                      <p className="text-xs text-gray-600 italic">"{report.ai_session.ai_summary}"</p>
                    )}
                  </div>
                )}
              </SectionBlock>

              {/* ── Section 4: Tavsiyalar tekshiruvi / Cheklist ── */}
              <SectionBlock number={4} title="Tavsiyalar Tekshiruvi Natijalari (Cheklist)" icon={ClipboardCheck}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {(Array.isArray(CHECKLIST_ITEMS) ? CHECKLIST_ITEMS : []).map(item => {
                    const entry = (checklistData as Record<string, { done: boolean; done_at?: string | null; note?: string }>)[item.key];
                    const done = entry?.done ?? false;
                    return (
                      <div key={item.key} className={`flex items-start gap-1.5 px-2 py-1 rounded text-xs ${done ? "bg-green-50" : "bg-gray-50"}`}>
                        {done ? (
                          <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className={done ? "text-gray-700" : "text-gray-400"}>{item.label}</span>
                          {item.mandatory && !done && (
                            <span className="text-red-400 ml-1 text-[9px] font-bold">*</span>
                          )}
                          {done && entry?.done_at && (
                            <span className="ml-1 text-[9px] text-green-600">
                              {new Date(entry.done_at).toLocaleDateString("uz-UZ")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionBlock>

              {/* ── Section 5: Yakuniy tavsiya ── */}
              <SectionBlock number={5} title="Yakuniy Tavsiya" icon={Star}>
                {decisionInfo ? (
                  <div className={`rounded-lg border-2 p-5 ${decisionInfo.bg} ${decisionInfo.border} print:bg-white`}>
                    <div className="flex items-center gap-3 mb-2">
                      {decisionKey === "qabul" ? (
                        <CheckCircle className="w-7 h-7 text-green-600" />
                      ) : decisionKey === "kutish" ? (
                        <AlertTriangle className="w-7 h-7 text-amber-600" />
                      ) : (
                        <XCircle className="w-7 h-7 text-red-600" />
                      )}
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Yakuniy qaror</p>
                        <p className={`text-lg font-bold ${decisionInfo.color}`}>{decisionInfo.label}</p>
                      </div>
                    </div>
                    {report.final_notes_text && (
                      <p className="text-sm text-gray-700 mt-2 italic">"{report.final_notes_text}"</p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                    <p className="text-sm text-gray-400 italic">Yakuniy tavsiya kiritilmagan</p>
                  </div>
                )}
              </SectionBlock>

              {/* ── Section 6: Xavf va imkoniyatlar ── */}
              <SectionBlock number={6} title="Xavf va Imkoniyatlar" icon={Shield}>
                {/* Free-text notes from interviewer */}
                {report.final_notes_text && (() => {
                  const xulosaLine = report.final_notes_text!.split("\n").find(l => l.startsWith("Xulosa:"));
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
                          <li className="text-gray-400 italic">Kompulsiv ko'rsatkichlar aniqlanmadi</li>
                        )}
                        {report.flow_direction === "outflow" && (
                          <li>• Chiquvchi oqim: nomzod asosan ketmoqchi</li>
                        )}
                        {motivLevel === 1 && (
                          <li>• Motivatsiya: faqat moddiy manfaat (Pul)</li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Test ma'lumotlari yo'q</p>
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
                          <li>• Kiruvchi oqim: kompaniyaga kelmoqchi</li>
                        )}
                        {motivLevel != null && motivLevel >= 3 && (
                          <li>• Motivatsiya: {MOTIVATION_LABELS[motivLevel]?.label} darajasi (yuqori)</li>
                        )}
                        {(Object.entries(toolTestResults) as [string, number][]).filter(([, v]) => v >= 30 && v < 80).length === 0 &&
                         (report.tool_test_score == null || report.tool_test_score < 30) && (
                          <li className="text-gray-400 italic">Belgilangan kuchli tomonlar yo'q</li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Test ma'lumotlari yo'q</p>
                    )}
                  </div>
                </div>
              </SectionBlock>

              {/* Footer */}
              <div className="mt-6 pt-3 border-t border-gray-200 flex justify-between text-[10px] text-gray-400 print:mt-4">
                <span>EuroPrint ERP — HR Capital Tizimi · Material №55</span>
                <span>Kandidat ID: {report.candidate_id} | Pipeline ID: {report.entry_id} | {printDate}</span>
              </div>
            </>
          )}
        </div>

        {/* Print CSS */}
        <style>{`
          @media print {
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
            @page { margin: 1.5cm; }
            [role="dialog"] { max-height: none !important; overflow: visible !important; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
