/**
 * @module QCAIAnalysisTab
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from '@/lib/queryClient';
import { EPStatusPill, EPLoader } from "@/components/ep";

interface QcMaterialTest {
  id: string;
  batchNumber?: string;
  testCategory: string;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  aiAnalysis?: Record<string, unknown> | null;
  aiConfidenceScore?: number;
}

const categoryLabels: Record<string, string> = {
  physical: "Fizik xususiyatlar",
  mechanical: "Mexanik mustahkamlik",
  printability: "Chop etish sifati",
  chemical: "Kimyoviy ko'rsatkichlar",
  environmental: "Muhit chidamliligi",
  logistics: "Logistika testlari",
  visual: "Vizual sifat",
};

function getRiskBadge(riskLevel: string | undefined) {
  const { t } = useTranslation("common");
  switch (riskLevel) {
    case "low": return <Badge variant="success">{t("low")}</Badge>;
    case "medium": return <Badge variant="warning">{t("medium")}</Badge>;
    case "high": return <Badge variant="error">{t("high")}</Badge>;
    default: return <EPStatusPill tone="neutral">{riskLevel || "—"}</EPStatusPill>;
  }
}

export function QCAIAnalysisTab() {
  const { t } = useTranslation("common");
  const { t: tCommon } = useTranslation('common');

  const { data: testsData, isLoading: testsLoading } = useQuery<QcMaterialTest[]>({
    queryKey: ["/api/qc/tests/recent"],
    queryFn: async () => {
      const res = (await apiRequest('GET', "/api/qc/tests/recent?limit=20")) as unknown as Response;
      if (!res.ok) return [];
      return res.json();
    }
  });

  const tests = testsData || [];

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {t("aiTahliliNatijalari")}
          </CardTitle>
          <CardDescription>{t("sifatTestlariBoyichaSuniyIntellekt")}</CardDescription>
        </CardHeader>
        <CardContent>
          {testsLoading ? (
            <div className="flex items-center justify-center py-8">
              <EPLoader className="w-6 h-6" />
            </div>
          ) : (Array.isArray(tests) ? tests : []).filter(t => t.aiAnalysis).length === 0 ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">{tCommon('noData')}</div>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(tests) ? tests : []).filter(t => t.aiAnalysis).map(test => (
                <div key={test.id} className="p-4 rounded-lg border space-y-3" data-testid={`ai-result-${test.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{test.batchNumber || "N/A"}</div>
                      <div className="text-sm text-muted-foreground">
                        {categoryLabels[test.testCategory] || test.testCategory}
                      </div>
                    </div>
                    {getRiskBadge((test.aiAnalysis as Record<string, unknown>)?.riskLevel as string)}
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" />
                      <span>{test.passedCount} {tCommon('approved')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-[var(--ep-yellow)]" />
                      <span>{test.warningCount} {tCommon('warning')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-[var(--ep-red)]" />
                      <span>{test.failedCount} {tCommon('rejected')}</span>
                    </div>
                  </div>

                  {test.aiConfidenceScore && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">{tCommon('percentage')}: </span>
                      <span className="font-medium">{test.aiConfidenceScore.toFixed(1)}%</span>
                    </div>
                  )}

                  {Array.isArray((test.aiAnalysis as Record<string, unknown>)?.recommendations) && ((test.aiAnalysis as Record<string, string[]>).recommendations).length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-1">{tCommon('notes')}:</div>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {((test.aiAnalysis as Record<string, string[]>).recommendations).map((rec: string, i: number) => (
                          <li key={`k-${i}`}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tCommon('total')}</CardTitle>
          <CardDescription>{t("umumiySifatKorsatkichlari")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-[var(--ep-green)] dark:text-green-400">
                {(Array.isArray(tests) ? tests : []).reduce((sum, t) => sum + t.passedCount, 0)}
              </div>
              <div className="text-sm text-[var(--ep-green)] dark:text-green-300">{tCommon('approved')}</div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-[var(--ep-yellow)] dark:text-yellow-400">
                {(Array.isArray(tests) ? tests : []).reduce((sum, t) => sum + t.warningCount, 0)}
              </div>
              <div className="text-sm text-[var(--ep-yellow)] dark:text-yellow-300">{tCommon('warning')}</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-[var(--ep-red)] dark:text-red-400">
                {(Array.isArray(tests) ? tests : []).reduce((sum, t) => sum + t.failedCount, 0)}
              </div>
              <div className="text-sm text-[var(--ep-red)] dark:text-red-300">{tCommon('rejected')}</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-[var(--ep-blue)] dark:text-blue-400">
                {tests.length}
              </div>
              <div className="text-sm text-[var(--ep-blue)] dark:text-blue-300">{tCommon('total')}</div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="text-sm font-medium">{tCommon('priority')}</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{tCommon('low')}</span>
                <Badge variant="success">
                  {(Array.isArray(tests) ? tests : []).filter(t => (t.aiAnalysis as Record<string, unknown>)?.riskLevel === "low").length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{tCommon('medium')}</span>
                <Badge variant="warning">
                  {(Array.isArray(tests) ? tests : []).filter(t => (t.aiAnalysis as Record<string, unknown>)?.riskLevel === "medium").length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{tCommon('high')}</span>
                <Badge variant="error">
                  {(Array.isArray(tests) ? tests : []).filter(t => (t.aiAnalysis as Record<string, unknown>)?.riskLevel === "high").length}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
