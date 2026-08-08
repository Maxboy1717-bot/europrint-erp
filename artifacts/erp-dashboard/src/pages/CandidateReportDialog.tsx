/**
 * @module CandidateReportDialog
 * @description React page component. Route-level UI.
 * Orchestrates query, report header, and all report sections.
 */

import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Phone, Mail, Briefcase, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CandidateReportDialogProps, ReportData } from "./CandidateReportDialogTypes";
import { DECISION_INFO } from "./CandidateReportDialogTypes";
import { useTranslation } from '@/lib/i18n';
import {
  Section1BasicInfo,
  Section2ToolTest,
  Section3Scores,
  Section4Checklist,
  Section5Decision,
  Section6Risks,
} from "./CandidateReportDialogSections";

export type { CandidateReportDialogProps };

export function CandidateReportDialog({
  pipelineEntryId,
  candidateName,
  open,
  onClose,
}: CandidateReportDialogProps) {
  const { t } = useTranslation("common");
  const { data, isLoading, error } = useQuery<{ data: ReportData }>({
    queryKey: [`/api/hr/recruitment/pipeline/${pipelineEntryId}/report`],
    enabled: open && !!pipelineEntryId,
    staleTime: 60_000,
  });

  const report = data?.data;
  const decisionKey = report?.final_decision ?? report?.recommendation ?? null;
  const decisionInfo = decisionKey ? (DECISION_INFO[decisionKey] ?? null) : null;
  const printDate = new Date().toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Sticky toolbar */}
        <DialogHeader className="sticky top-0 z-10 bg-white border-b px-6 py-3 print:hidden">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-[var(--ep-primary)]" />
              Kandidat Hisoboti — {candidateName}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                size="sm" variant="outline"
                className="h-7 text-xs gap-1 border-blue-400 text-[var(--ep-blue)]"
                onClick={() => window.print()}
                data-testid="button-print-report"
              >
                <Printer className="w-3 h-3" />
                Chop etish / PDF
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
                {t("close2")}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-white text-gray-900" id="candidate-report-content">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
              {t("yuklanmoqda1")}
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-[var(--ep-red)]">
              {t("malumotniYuklashdaXatolikQaytaUrinib")}
            </div>
          )}

          {!isLoading && !error && report && (
            <>
              {/* Report header */}
              <div className="border-2 border-[var(--ep-text)] rounded-lg p-5 mb-6 print:border-black">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                      {t("yakuniyHisobotHrCapitalMaterial")}
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
                        <div className="flex items-center gap-1 text-sm text-[var(--ep-blue)]">
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
                    <p className="text-[10px] text-gray-400">{t("hisobotSanasi")}</p>
                    <p className="text-sm font-semibold text-gray-700">{printDate}</p>
                    {decisionInfo && (
                      <div className={`mt-2 px-3 py-1 rounded border-2 text-xs font-bold ${decisionInfo.bg} ${decisionInfo.border} ${decisionInfo.color}`}>
                        {decisionInfo.label}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Report sections */}
              <Section1BasicInfo report={report} />
              <Section2ToolTest report={report} />
              <Section3Scores report={report} />
              <Section4Checklist report={report} />
              <Section5Decision report={report} />
              <Section6Risks report={report} />

              {/* Footer */}
              <div className="mt-6 pt-3 border-t border-gray-200 flex justify-between text-[10px] text-gray-400 print:mt-4">
                <span>{t("europrintErpHrCapitalTizimi1")}</span>
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
