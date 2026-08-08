/**
 * @module CandidateReportSectionsExtra
 * @description Sections 4 and 5 for CandidateReport (conclusion and risks/opportunities).
 */

import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { ToolTestRecord } from "./CandidateReportTypes";
import { CATEGORY_LABELS, TOOL_TEST_TRAIT_LABELS } from "./CandidateReportTypes";
import { useTranslation } from '@/lib/i18n';

export function Section4Conclusion({ recommendation }: { recommendation: string }) {
  const { t } = useTranslation("common");
  const recInfo = CATEGORY_LABELS[recommendation] ?? CATEGORY_LABELS.UNKNOWN;
  return (
    <div className={`rounded-lg border-2 p-6 ${
      recommendation === "FLAGMAN"        ? "border-green-500 bg-green-50"
      : recommendation === "PROCESSNIK"  ? "border-blue-500 bg-blue-50"
      : recommendation === "UNPRODUCTIVE" ? "border-red-500 bg-red-50"
      : "border-gray-300 bg-gray-50"
    } print:border-gray-800 print:bg-white`}>
      <div className="flex items-center gap-3 mb-3">
        {recommendation === "FLAGMAN" ? (
          <CheckCircle className="w-8 h-8 text-[var(--ep-green)]" />
        ) : recommendation === "UNPRODUCTIVE" ? (
          <XCircle className="w-8 h-8 text-[var(--ep-red)]" />
        ) : (
          <AlertTriangle className="w-8 h-8 text-[var(--ep-yellow)]" />
        )}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t("yakuniyQaror")}</p>
          <p className={`text-2xl font-bold ${
            recommendation === "FLAGMAN"        ? "text-[var(--ep-green)]"
            : recommendation === "PROCESSNIK"  ? "text-[var(--ep-blue)]"
            : recommendation === "UNPRODUCTIVE" ? "text-[var(--ep-red)]"
            : "text-gray-700"
          }`}>
            {recommendation === "FLAGMAN"        ? t("qabulTavsiyaEtiladi")
              : recommendation === "PROCESSNIK"  ? t("qabulOperatsionLavozim")
              : recommendation === "UNPRODUCTIVE" ? t("radEtishTavsiyaEtiladi")
              : t("qabulHolatiAniqlanmagan")}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700">
        {recommendation === "FLAGMAN"
          ? t("flagmanTavsifi")
          : recommendation === "PROCESSNIK"
          ? t("processnikTavsifi")
          : recommendation === "UNPRODUCTIVE"
          ? t("unproductiveTavsifi")
          : t("unknownTavsifi")}
      </p>
    </div>
  );
}

export function Section5RisksAndOpportunities({
  toolTestResults,
  latestToolTest,
}: {
  toolTestResults: Record<string, number> | null;
  latestToolTest: ToolTestRecord | null;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-amber-200 rounded-lg p-4 bg-amber-50 print:bg-white print:border-amber-400">
        <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {t("xavfOmillari")}
        </p>
        {toolTestResults ? (
          <ul className="text-sm text-gray-700 space-y-1">
            {(Object.entries(toolTestResults) as [string, number][])
              .filter(([, v]) => Math.abs(v) >= 80)
              .map(([k, v]) => (
                <li key={k}>• {TOOL_TEST_TRAIT_LABELS[k]} ({k}) {t("kompulsivDaraja")}: {v > 0 ? "+" : ""}{v}</li>
              ))}
            {latestToolTest && latestToolTest.totalScore < -30 && (
              <li>• {t("umumiyBallPast")}: {latestToolTest.totalScore}</li>
            )}
            {(Object.entries(toolTestResults) as [string, number][])
              .filter(([, v]) => Math.abs(v) >= 80).length === 0 &&
             (!latestToolTest || latestToolTest.totalScore >= -30) && (
              <li className="text-gray-500 italic">{t("kompulsivKorsatkichlarAniqlanmadi")}</li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">{t("malumotYoq")}</p>
        )}
      </div>
      <div className="border border-green-200 rounded-lg p-4 bg-green-50 print:bg-white print:border-green-400">
        <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {t("imkoniyatlar")}
        </p>
        {toolTestResults ? (
          <ul className="text-sm text-gray-700 space-y-1">
            {(Object.entries(toolTestResults) as [string, number][])
              .filter(([, v]) => v >= 30 && v < 80)
              .map(([k, v]) => (
                <li key={k}>• {TOOL_TEST_TRAIT_LABELS[k]} ({k}) {t("kuchliLabel")}: +{v}</li>
              ))}
            {latestToolTest && latestToolTest.totalScore >= 30 && (
              <li>• {t("umumiyBallYuqori")}: +{latestToolTest.totalScore}</li>
            )}
            {(Object.entries(toolTestResults) as [string, number][])
              .filter(([, v]) => v >= 30 && v < 80).length === 0 &&
             (!latestToolTest || latestToolTest.totalScore < 30) && (
              <li className="text-gray-500 italic">{t("belgilanganKuchliTomonlarYoq")}</li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">{t("malumotYoq")}</p>
        )}
      </div>
    </div>
  );
}
