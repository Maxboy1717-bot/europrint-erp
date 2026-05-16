/**
 * @module WorkTabSections
 * @description Info-card section components rendered inside WorkTab:
 * OperatorProductionBlock (live machine stats), CurrentWorkplaceCard
 * (position / department / experience), and CkpAttestationCard (KPI codes and
 * attestation metadata).  None of these components own dialog state.
 */

import { Link } from "wouter";
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Briefcase, Target, Settings, Activity, Gauge, Wrench } from "lucide-react";
import type {
  Employee,
  OrgStructureAssignment,
  TranslationFn,
} from "./WorkTabTypes";

// ─── Operator production stats block ─────────────────────────────────────────

interface OperatorProductionBlockProps {
  employeeId: string | number;
}

export function OperatorProductionBlock({ employeeId, }: OperatorProductionBlockProps) {
  const { t } = useTranslation("common");
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/hr/employees/operator-stats", employeeId],
    queryFn: () =>
      apiRequest("GET", `/api/hr/employees/${employeeId}/operator-stats`),
    enabled: !!employeeId,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
          <div className="h-20 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.error) return null;

  const oee = stats.today_oee ?? 0;
  const oeeColor =
    oee >= 85 ? "text-[var(--ep-green)]" : oee >= 70 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";
  const produced = stats.today_produced ?? 0;
  const target = stats.today_target ?? 0;
  const defects = stats.today_defects ?? 0;
  const withinTarget = produced >= target;
  const defectRate =
    produced > 0 ? ((defects / produced) * 100).toFixed(2) : "0.00";

  return (
    <Card
      className="border-blue-200 bg-blue-50/30 dark:border-blue-800/40 dark:bg-blue-950/10"
      data-testid="card-operator-production"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-5 w-5 text-[var(--ep-blue)]" />
          Ishlab Chiqarish Ma&apos;lumotlari
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{t("dastgoh2")}</p>
            <p className="font-semibold flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-[var(--ep-blue)]" />
              {stats.machine_name || "—"}
              {stats.machine_id && (
                <span className="text-xs text-muted-foreground">
                  (ID: {stats.machine_id})
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{t("smena")}</p>
            <p className="font-semibold">{stats.shift_type || "—"}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{t("bugungiOee")}</p>
            <p className={`text-2xl font-bold ${oeeColor}`}>{oee.toFixed(1)}%</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{t("Bajarildi")}</p>
            <p className="font-semibold flex items-center gap-1">
              <Activity className="h-4 w-4 text-[var(--ep-green)]" />
              {produced.toLocaleString()} dona
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{t("nuqsonli")}</p>
            <p className="font-semibold flex items-center gap-1 text-[var(--ep-red)]">
              <span>❌</span>
              {defects} dona ({defectRate}%)
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{t("meAposYorHolat")}</p>
            <p className="font-semibold flex items-center gap-1">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              {target.toLocaleString()} dona/kun
            </p>
            <p className={`text-xs font-medium ${withinTarget ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
              {withinTarget ? "✅ Me'yor ichida" : "⚠️ Me'yordan past"}
            </p>
          </div>
        </div>
        {stats.last_report_date && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            So&apos;nggi hisobot: {stats.last_report_date}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Current workplace card ───────────────────────────────────────────────────

interface CurrentWorkplaceCardProps {
  employee: Employee;
  t: TranslationFn & ((key: string) => string);
  tCommon: TranslationFn;
  orgStructureData:
    | { primary: OrgStructureAssignment; all: OrgStructureAssignment[] }
    | undefined;
  calculateWorkExperience: () => string;
}

export function CurrentWorkplaceCard({
  employee,
  t,
  tCommon,
  orgStructureData,
  calculateWorkExperience,
}: CurrentWorkplaceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          {t("currentWorkplace")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("position")}</p>
            {orgStructureData?.primary ? (
              <Link href="/org-structure/hierarchy">
                <p className="font-medium text-primary underline cursor-pointer hover:text-primary/80">
                  {orgStructureData.primary.positionName ||
                    orgStructureData.primary.functionName}
                </p>
              </Link>
            ) : (
              <Link href="/org-structure/hierarchy">
                <p className="font-medium text-muted-foreground underline cursor-pointer hover:text-foreground">
                  {tCommon("notSpecified")}
                </p>
              </Link>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("department")}</p>
            {orgStructureData?.primary ? (
              <Link href="/org-structure/hierarchy">
                <p className="font-medium text-primary underline cursor-pointer hover:text-primary/80">
                  {orgStructureData.primary.departmentName}
                </p>
              </Link>
            ) : (
              <Link href="/org-structure/hierarchy">
                <p className="font-medium text-muted-foreground underline cursor-pointer hover:text-foreground">
                  {tCommon("notSpecified")}
                </p>
              </Link>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("hireDate")}</p>
            <p className="font-medium">
              {employee.hireDate || tCommon("notSpecified")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("experience")}</p>
            <p className="font-medium">{calculateWorkExperience()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("shift")}</p>
            <p className="font-medium">
              {employee.shift || tCommon("notSpecified")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("manager")}</p>
            <p className="font-medium">
              {employee.manager?.fullName || tCommon("notSpecified")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── CKP & attestation card ───────────────────────────────────────────────────

interface CkpAttestationCardProps {
  employee: Employee;
  t: TranslationFn & ((key: string) => string);
  tCommon: TranslationFn;
}

export function CkpAttestationCard({
  employee,
  t,
  tCommon,
}: CkpAttestationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t("ckpAndAttestation")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("ckpCode")}</p>
            <p className="font-medium">
              {employee.ckpCode || tCommon("notSpecified")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("hierarchyLevel")}</p>
            <p className="font-medium">
              {employee.hierarchyLevel || tCommon("notSpecified")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("attestationDate")}</p>
            <p className="font-medium">
              {employee.attestationDate || tCommon("notSpecified")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("role")}</p>
            <Badge variant="outline">{employee.role}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
