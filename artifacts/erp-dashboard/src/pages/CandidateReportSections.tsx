/**
 * @module CandidateReportSections
 * @description Section and helper components for CandidateReport.
 */

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { SyndromeAnalysis } from "@/components/hr/SyndromeAnalysis";
import { IQScaleChart } from "@/components/hr/IQScaleChart";
import type {
  ToolTestRecord, ProductivityInterview, CandidateDetail,
} from "./CandidateReportTypes";
import { CATEGORY_LABELS, TOOL_TEST_TRAIT_LABELS } from "./CandidateReportTypes";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from '@/lib/i18n/tLabel';
export function Section({
  title, children, number,
}: {
  title: string;
  children: React.ReactNode;
  number: number;
}) {
  const { t } = useTranslation("common");
  return (
    <section className="break-inside-avoid mb-8">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-primary/30">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 print:bg-black print:text-white">
          {number}
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-border/30">
      <span className="text-sm text-muted-foreground w-48 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}

export function Section1MainResults({
  candidate,
  recInfo,
  latestToolTest,
  latestInterview,
}: {
  candidate: CandidateDetail;
  recInfo: { label: string; color: string };
  latestToolTest: ToolTestRecord | null;
  latestInterview: ProductivityInterview | null;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <InfoRow label={tLabel('common.CandidateReportSections.manbaKanal', "Manba (kanal)")} value={candidate.source} />
        <InfoRow label={t("status28")} value={candidate.status} />
        <InfoRow label={t("Izoh")} value={candidate.notes} />
      </div>
      <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t("umumiyBaholash")}</p>
        <div className={`text-2xl font-bold ${recInfo.color}`}>{recInfo.label}</div>
        {latestToolTest && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">{t("toolTestUmumiyBall")}</p>
            <p className="text-lg font-bold">{latestToolTest.totalScore > 0 ? "+" : ""}{latestToolTest.totalScore}</p>
          </div>
        )}
        {latestInterview && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">{t("produktivlikIntervyusi")}</p>
            <p className="text-lg font-bold">{latestInterview.overallScore}/10</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Section2TestResults({
  latestToolTest,
  toolTestResults,
}: {
  latestToolTest: ToolTestRecord | null;
  toolTestResults: Record<string, number> | null;
}) {
  const { t } = useTranslation("common");
  if (!latestToolTest) {
    return <p className="text-sm text-gray-500 italic">{t("toolTestOtkazilmagan")}</p>;
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">{t("testSanasi")}</p>
          <p className="text-sm font-medium">
            {new Date(latestToolTest.testDate).toLocaleDateString("uz-UZ")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">{t("umumiyBall")}</p>
          <p className={`text-lg font-bold ${latestToolTest.totalScore >= 30 ? "text-[var(--ep-green)]" : latestToolTest.totalScore >= -30 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
            {latestToolTest.totalScore > 0 ? "+" : ""}{latestToolTest.totalScore}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t("aJKorsatkichlar")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(["A","B","C","D","E","F","G","H","I","J"]).map((key) => {
            const score = (latestToolTest[`point${key}` as keyof ToolTestRecord] as number) ?? 0;
            const pct = Math.max(4, (score + 100) / 2);
            const colorBar = score >= 30 ? "bg-green-500" : score >= -30 ? "bg-amber-500" : "bg-red-500";
            const colorTxt = score >= 30 ? "text-[var(--ep-green)]" : score >= -30 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20 shrink-0">
                  {key}: {TOOL_TEST_TRAIT_LABELS[key]}
                </span>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colorBar}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${colorTxt}`}>
                  {score > 0 ? "+" : ""}{score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {latestToolTest.iqScore != null && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t("iqNatijasi")}</p>
          <IQScaleChart iq={latestToolTest.iqScore} />
        </div>
      )}

      {latestToolTest.positionMatchScore != null && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Lavozimga moslik ({latestToolTest.positionMatchNotes})</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${latestToolTest.positionMatchScore >= 70 ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${latestToolTest.positionMatchScore}%` }}
              />
            </div>
            <span className="font-bold text-sm">{latestToolTest.positionMatchScore}%</span>
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t("sindromlarTahlili")}</p>
        <SyndromeAnalysis toolTestResults={toolTestResults} />
      </div>
    </div>
  );
}

export function Section3InterviewResults({
  latestInterview,
}: {
  latestInterview: ProductivityInterview | null;
}) {
  const { t } = useTranslation("common");
  if (!latestInterview) {
    return <p className="text-sm text-gray-500 italic">{t("produktivlikIntervyusiOtkazilmagan")}</p>;
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">{t("intervyuSanasi")}</p>
          <p className="text-sm font-medium">
            {new Date(latestInterview.conductedAt).toLocaleDateString("uz-UZ")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">{t("umumiyBall")}</p>
          <p className={`text-lg font-bold ${latestInterview.overallScore >= 7 ? "text-[var(--ep-green)]" : latestInterview.overallScore >= 5 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
            {latestInterview.overallScore}/10
          </p>
        </div>
      </div>
      {latestInterview.hasConcreteResults !== undefined && (
        <div className="flex items-center gap-2">
          {latestInterview.hasConcreteResults
            ? <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" />
            : <XCircle className="w-4 h-4 text-[var(--ep-red)]" />
          }
          <span className="text-sm">{t("aniqNatijalargaEga")}</span>
        </div>
      )}
      {latestInterview.canWorkIndependently !== undefined && (
        <div className="flex items-center gap-2">
          {latestInterview.canWorkIndependently
            ? <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" />
            : <XCircle className="w-4 h-4 text-[var(--ep-red)]" />
          }
          <span className="text-sm">{t("mustaqilIshlashQobiliyati")}</span>
        </div>
      )}
    </div>
  );
}

// Section4Conclusion and Section5RisksAndOpportunities are in CandidateReportSectionsExtra.tsx
export { Section4Conclusion, Section5RisksAndOpportunities } from "./CandidateReportSectionsExtra";
