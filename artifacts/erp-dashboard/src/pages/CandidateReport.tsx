/**
 * @module CandidateReport
 * @description React page component. Route-level UI.
 */

import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Printer, Phone, Mail, FileText } from "lucide-react";
import type {
  CandidateDetail, FunnelEntry, ToolTestRecord, ProductivityInterview,
} from "./CandidateReportTypes";
import { CATEGORY_LABELS } from "./CandidateReportTypes";
import { useTranslation } from '@/lib/i18n';
import {
  Section, Section1MainResults, Section2TestResults,
  Section3InterviewResults, Section4Conclusion, Section5RisksAndOpportunities,
} from "./CandidateReportSections";

export default function CandidateReport() {
  const { t } = useTranslation("common");
  const params      = useParams<{ id: string }>();
  const candidateId = Number(params.id);

  const { data: candidateData, isLoading: loadingCandidate } = useQuery<CandidateDetail>({
    queryKey: [`/api/candidates/${candidateId}`],
    queryFn:  () => apiRequest("GET", `/api/candidates/${candidateId}`),
    enabled:  !!candidateId,
  });

  const { data: pipelineData } = useQuery<{ data: FunnelEntry[] }>({
    queryKey: ["/api/hr/recruitment/pipeline"],
    staleTime: 60_000,
  });

  const { data: toolTestData } = useQuery<ToolTestRecord[]>({
    queryKey: [`/api/hr/recruitment/tool-test/candidate/${candidateId}`],
    queryFn:  () => apiRequest("GET", `/api/hr/recruitment/tool-test/candidate/${candidateId}`),
    enabled:  !!candidateId,
  });

  const { data: interviewData } = useQuery<ProductivityInterview[]>({
    queryKey: [`/api/hr/recruitment/productivity-interview/candidate/${candidateId}`],
    queryFn:  () => apiRequest("GET", `/api/hr/recruitment/productivity-interview/candidate/${candidateId}`),
    enabled:  !!candidateId,
  });

  // suppress lint: pipelineData fetched for potential future use
  void pipelineData;

  const candidate      = candidateData;
  const latestToolTest = Array.isArray(toolTestData) ? toolTestData[0] : null;
  const latestInterview = Array.isArray(interviewData) ? interviewData[0] : null;

  const toolTestResults = latestToolTest ? {
    A: latestToolTest.pointA, B: latestToolTest.pointB, C: latestToolTest.pointC,
    D: latestToolTest.pointD, E: latestToolTest.pointE, F: latestToolTest.pointF,
    G: latestToolTest.pointG, H: latestToolTest.pointH, I: latestToolTest.pointI,
    J: latestToolTest.pointJ,
  } : null;

  const recommendation = latestToolTest?.categoryResult ?? "UNKNOWN";
  const recInfo        = CATEGORY_LABELS[recommendation] ?? CATEGORY_LABELS.UNKNOWN;

  const printDate = new Date().toLocaleDateString("uz-UZ", {
    year: "numeric", month: "long", day: "numeric",
  });

  if (loadingCandidate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nomzod topilmadi (ID: {candidateId})
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-8 max-w-4xl mx-auto print:p-6 print:max-w-none">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">{t("kandidatBoyichaYakuniyHisobot")}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>{t("orqaga")}</Button>
          <Button className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />PDF / Chop etish
          </Button>
        </div>
      </div>

      <div className="border-2 border-gray-800 rounded-lg p-6 mb-8 print:border-black">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">YAKUNIY HISOBOT — MATERIAL №55</p>
            <h1 className="ep-h1 text-gray-900">{candidate.fullName}</h1>
            <div className="flex flex-wrap gap-3 mt-2">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Phone className="w-4 h-4" />{candidate.phone}
              </div>
              {candidate.email && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />{candidate.email}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{t("hisobotSanasi")}</p>
            <p className="font-semibold text-gray-800">{printDate}</p>
            <div className="mt-2">
              <span className={`text-sm font-bold px-3 py-1 rounded-full border-2 ${
                recommendation === "FLAGMAN"      ? "border-green-500 text-[var(--ep-green)] bg-green-50"
                : recommendation === "PROCESSNIK" ? "border-blue-500 text-[var(--ep-blue)] bg-blue-50"
                : recommendation === "UNPRODUCTIVE" ? "border-red-500 text-[var(--ep-red)] bg-red-50"
                : "border-gray-400 text-gray-600 bg-gray-50"
              }`}>
                {recInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Section number={1} title={t("asosiyNatijalarVaFaktlar")}>
        <Section1MainResults
          candidate={candidate}
          recInfo={recInfo}
          latestToolTest={latestToolTest}
          latestInterview={latestInterview}
        />
      </Section>

      <Section number={2} title={t("testNatijalariVaTalqin")}>
        <Section2TestResults latestToolTest={latestToolTest} toolTestResults={toolTestResults} />
      </Section>

      <Section number={3} title={t("tavsiyalarTekshiruviNatijalari")}>
        <Section3InterviewResults latestInterview={latestInterview} />
      </Section>

      <Section number={4} title="Xulosa — Qabul / Rad Etish">
        <Section4Conclusion recommendation={recommendation} />
      </Section>

      <Section number={5} title={t("xavfVaImkoniyatlar")}>
        <Section5RisksAndOpportunities toolTestResults={toolTestResults} latestToolTest={latestToolTest} />
      </Section>

      <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-400 print:mt-4">
        <span>{t("europrintErpHrCapitalTizimi")}</span>
        <span>Nomzod ID: {candidateId} | {printDate}</span>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
