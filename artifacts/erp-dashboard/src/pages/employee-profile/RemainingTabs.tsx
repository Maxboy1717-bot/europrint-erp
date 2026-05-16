/**
 * @module RemainingTabs
 * @description Barrel and orchestrator for the remaining Employee Profile tabs.
 * SafetyTab and DocumentsTab are defined here (they are small enough to stay).
 * DisciplineTab, LearningTab and all shared types/constants are re-exported from
 * their dedicated modules so that every consumer continues to use this single
 * import path.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HardHat, FileText } from "lucide-react";
import type { SafetyViolation } from "./profile-types";
import type { SafetyTabProps } from "./RemainingTabsTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Re-exports — consumers can still `import { DisciplineTab } from "./RemainingTabs"`
// ---------------------------------------------------------------------------

export { DisciplineTab } from "./RemainingTabsDiscipline";
export { LearningTab }   from "./RemainingTabsLearning";
export type { DisciplineTabProps, LearningTabProps, SafetyTabProps } from "./RemainingTabsTypes";
export { COMPLAINT_TYPE_LABELS, SEVERITY_LABELS, STATUS_LABELS } from "./RemainingTabsTypes";

// ---------------------------------------------------------------------------
// SafetyTab
// ---------------------------------------------------------------------------

export function SafetyTab({ loadingSafety, safetyViolations }: SafetyTabProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      {loadingSafety ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <>
          <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  safetyViolations && safetyViolations.length > 0
                    ? 'bg-red-100 text-[var(--ep-red)]'
                    : 'bg-green-100 text-[var(--ep-green)]'
                }`}>
                  <HardHat className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("xavfsizlikHolati")}</p>
                  {safetyViolations && safetyViolations.length > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-[var(--ep-red)]">
                        {safetyViolations.length} buzilish
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(Array.isArray(safetyViolations) ? safetyViolations : [])
                          .filter(v => !v.resolved).length} ta hal qilinmagan
                      </p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-[var(--ep-green)]">{t("xavfsizlikBuzilmagan")}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardHat className="h-5 w-5" />
                {t("xavfsizlikQoidalariBuzilishi")}
              </CardTitle>
              <CardDescription>{t("aiKameraOrqaliAniqlanganBuzilishlar")}</CardDescription>
            </CardHeader>
            <CardContent>
              {safetyViolations && safetyViolations.length > 0 ? (
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>{t("camera")}</TableHead>
                      <TableHead>{t("status28")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(safetyViolations) ? safetyViolations : []).map((violation: SafetyViolation) => (
                      <TableRow key={violation.id} data-testid={`row-violation-${violation.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          {violation.createdAt
                            ? new Date(violation.createdAt).toLocaleString('uz-UZ')
                            : "-"}
                        </TableCell>
                        <TableCell>{violation.violationType || "-"}</TableCell>
                        <TableCell>{violation.cameraName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={violation.resolved ? "default" : "destructive"}>
                            {violation.resolved ? "Hal qilindi" : "Ochiq"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              ) : (
                <div className="text-center py-12">
                  <HardHat className="h-16 w-16 mx-auto text-[var(--ep-green)] mb-4" />
                  <p className="text-lg font-medium text-[var(--ep-green)]">{t("xavfsizlikBuzilmagan")}</p>
                  <p className="text-muted-foreground">
                    {t("buXodimdaXavfsizlikQoidalariBuzilishi")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DocumentsTab
// ---------------------------------------------------------------------------

export function DocumentsTab() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("hujjatlar")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t("hujjatlarYuklanmagan")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
