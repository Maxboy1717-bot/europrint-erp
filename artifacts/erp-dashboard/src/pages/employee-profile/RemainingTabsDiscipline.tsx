/**
 * @module RemainingTabsDiscipline
 * @description DisciplineTab component for the Employee Profile page.
 * Renders the discipline history stats row and immutable log table; delegates
 * customer-complaints and assessment-skip sections to RemainingTabsDisciplineExtras.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, AlertCircle, Award, Lock, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { DisciplineRecord } from "./profile-types";
import type { DisciplineTabProps } from "./RemainingTabsTypes";
import { CustomerComplaintsCard, AssessmentSkipsCard } from "./RemainingTabsDisciplineExtras";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// DisciplineTab
// ---------------------------------------------------------------------------

export function DisciplineTab({ tCommon, loadingDiscipline, disciplineData, disciplineStats, customerComplaints, loadingComplaints, assessmentSkips, loadingSkips, }: DisciplineTabProps) {
  const { t } = useTranslation("common");
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })}
        className="sr-only"
        aria-label={t("refresh")}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>

      <div className="space-y-6">
        {loadingDiscipline ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("ogohlantirishlar")}</p>
                      <p className="text-3xl font-bold text-[var(--ep-yellow)]">{disciplineStats.warnings}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-[var(--ep-yellow)]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="from-red-500/10 to-red-600/10 border-red-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("jarimalar")}</p>
                      <p className="text-3xl font-bold text-[var(--ep-red)]">{disciplineStats.penalties}</p>
                      {disciplineStats.totalPenaltyAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {disciplineStats.totalPenaltyAmount.toLocaleString()} so'm
                        </p>
                      )}
                    </div>
                    <AlertTriangle className="h-8 w-8 text-[var(--ep-red)]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="from-green-500/10 to-green-600/10 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("mukofotlar")}</p>
                      <p className="text-3xl font-bold text-[var(--ep-green)]">{disciplineStats.rewards}</p>
                      {disciplineStats.totalRewardAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {disciplineStats.totalRewardAmount.toLocaleString()} so'm
                        </p>
                      )}
                    </div>
                    <Award className="h-8 w-8 text-[var(--ep-green)]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Immutable discipline log */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t("intizomTarixi")}
                    </CardTitle>
                    <CardDescription>{t("ogohlantirishJarimaVaMukofotlar")}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-md px-2.5 py-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{t("ozgarmasJurnalOchiribBolmaydi")}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {disciplineData && disciplineData.length > 0 ? (
                  <div className="ep-table-scroll"><Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead>{t("type")}</TableHead>
                        <TableHead>{t("sabab")}</TableHead>
                        <TableHead>{t("summa")}</TableHead>
                        <TableHead>{t("bergan")}</TableHead>
                        <TableHead>{t("status28")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(disciplineData) ? disciplineData : []).map((record: DisciplineRecord) => (
                        <TableRow key={record.id} data-testid={`row-discipline-${record.id}`} className="hover:bg-muted/40 transition-colors">
                          <TableCell>
                            {record.createdAt
                              ? new Date(record.createdAt).toLocaleDateString('uz-UZ')
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {record.type === "warning" && <EPStatusPill tone="warning">{t("warning")}</EPStatusPill>}
                            {record.type === "penalty" && <EPStatusPill tone="danger">{t("jarima")}</EPStatusPill>}
                            {record.type === "reward"  && <EPStatusPill tone="success">{t("mukofot")}</EPStatusPill>}
                          </TableCell>
                          <TableCell className="max-w-[200px]">{record.reason || "-"}</TableCell>
                          <TableCell>
                            {record.amount ? (
                              <span className={
                                record.type === "reward"  ? "text-[var(--ep-green)]" :
                                record.type === "penalty" ? "text-[var(--ep-red)]" : ""
                              }>
                                {record.amount.toLocaleString()} so'm
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{record.givenByName || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Lock className="h-3 w-3" />
                              <span>{t("yozildi")}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{tCommon('noData')}</p>
                )}
              </CardContent>
            </Card>

            {/* Delegated sub-cards */}
            <CustomerComplaintsCard
              customerComplaints={customerComplaints}
              loadingComplaints={loadingComplaints}
            />
            <AssessmentSkipsCard
              assessmentSkips={assessmentSkips}
              loadingSkips={loadingSkips}
            />
          </>
        )}
      </div>
    </>
  );
}
