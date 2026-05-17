/**
 * @module HROnboardingSections
 * @description Section components for HROnboarding (stats, tables, panels).
 * Pure presentation — all data + callbacks flow in via props.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  UserPlus, CheckCircle2, Users, Clock, TrendingUp, FolderOpen, Map, Eye,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { EPStatusPill } from "@/components/ep";
import type {
  ChecklistItem,
  Employee,
  OnboardingRoadmap,
  ViewRoadmapEntry,
} from "./HROnboardingTypes";
import { employeeDisplayName } from "./HROnboardingTypes";
import { EmployeeFolderItems } from "./HROnboardingHelpers";

// ---------------------------------------------------------------------------
// Stats grid
// ---------------------------------------------------------------------------

export function StatsGrid({
  newEmployeesCount,
  checklistsCount,
}: {
  newEmployeesCount: number;
  checklistsCount: number;
}) {
  const stats = [
    { label: "Faol onboarding", value: newEmployeesCount, color: "text-[var(--ep-blue)]", icon: UserPlus },
    { label: "Checklists", value: checklistsCount, color: "text-[var(--ep-green)]", icon: CheckCircle2 },
    { label: "O'rtacha muddat", value: "30 kun", color: "text-[var(--ep-primary)]", icon: Clock },
    { label: "Yangi xodimlar (90 kun)", value: newEmployeesCount, color: "text-primary", icon: Users },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="pt-4 pb-3 flex items-start justify-between">
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
            <s.icon className={`h-5 w-5 ${s.color} opacity-60`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New employees table
// ---------------------------------------------------------------------------

export function NewEmployeesTable({ newEmployees }: { newEmployees: Employee[] }) {
  const { t } = useTranslation("common");
  const rows = Array.isArray(newEmployees) ? newEmployees : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("yangiXodimlarOnboardingJarayonida")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="ep-table-scroll">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{t("xodim1")}</TableHead>
                <TableHead>{t("lavozim1")}</TableHead>
                <TableHead>{t("ishgaKirishSanasi")}</TableHead>
                <TableHead>{t("bolim1")}</TableHead>
                <TableHead>{t("holati")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                    {t("songgi90KundaYangiXodim")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.slice(0, 20).map((emp) => (
                  <TableRow
                    key={emp.id}
                    data-testid={`row-onboarding-${emp.id}`}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-medium">{employeeDisplayName(emp)}</TableCell>
                    <TableCell className="text-muted-foreground">{emp.positionName || emp.position || "—"}</TableCell>
                    <TableCell>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                    <TableCell>{emp.departmentName || emp.department || "—"}</TableCell>
                    <TableCell><EPStatusPill tone="neutral">{t("onboarding")}</EPStatusPill></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Position folder section
// ---------------------------------------------------------------------------

export function PositionFolderSection({ newEmployees }: { newEmployees: Employee[] }) {
  const { t } = useTranslation("common");
  const rows = Array.isArray(newEmployees) ? newEmployees : [];

  return (
    <Card data-testid="section-lavozim-papkasi">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          {t("lavozimPapkasiOnboardingMateriallari")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {t("yangiXodimlargaTayinlanganLavozimPapkasidagi")}
        </p>
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("songgi90KundaYangiXodim1")}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.slice(0, 5).map((emp) => (
              <EmployeeFolderItems key={emp.id} employee={emp} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Onboarding roadmaps table
// ---------------------------------------------------------------------------

export function RoadmapsTable({
  roadmaps,
  onView,
}: {
  roadmaps: OnboardingRoadmap[];
  onView: (entry: ViewRoadmapEntry) => void;
}) {
  const { t } = useTranslation("common");
  const rows = Array.isArray(roadmaps) ? roadmaps : [];

  return (
    <Card data-testid="section-onboarding-roadmaps">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Map className="h-4 w-4 text-[var(--ep-green)]" />
          Yo'l Xaritalari (Material №58)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="px-6 pb-6 pt-2 text-sm text-muted-foreground text-center py-8">
            {t("hozirchaYolXaritasiYaratilmaganRekrutment")}
          </div>
        ) : (
          <div className="ep-table-scroll">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>{t("nomzod")}</TableHead>
                  <TableHead>{t("lavozim1")}</TableHead>
                  <TableHead>{t("bolinma")}</TableHead>
                  <TableHead>{t("nastavnik")}</TableHead>
                  <TableHead>{t("kirishSanasi2")}</TableHead>
                  <TableHead>{t("sinovMuddati")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((rm) => (
                  <TableRow
                    key={rm.id}
                    data-testid={`row-roadmap-${rm.id}`}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-medium">{rm.candidate_name || `#${rm.employee_id || rm.id}`}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {rm.roadmap_data?.lavozim_nomi || rm.vacancy_title || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{rm.roadmap_data?.bolim || "—"}</TableCell>
                    <TableCell>{rm.roadmap_data?.nastavnik_name || rm.nastavnik_name || "—"}</TableCell>
                    <TableCell>
                      {rm.kirish_sanasi ? new Date(rm.kirish_sanasi).toLocaleDateString("uz-UZ") : "—"}
                    </TableCell>
                    <TableCell>
                      {rm.roadmap_data?.sinov_muddat_oy ? (
                        <EPStatusPill tone="neutral">{rm.roadmap_data.sinov_muddat_oy} oy</EPStatusPill>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-[var(--ep-green)]"
                        onClick={() =>
                          onView({
                            id: rm.pipeline_entry_id ?? 0,
                            name: rm.candidate_name || `#${rm.id}`,
                            vacancyTitle: rm.vacancy_title ?? rm.roadmap_data?.lavozim_nomi,
                          })
                        }
                        data-testid={`button-view-roadmap-${rm.id}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t("view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Checklist progress table
// ---------------------------------------------------------------------------

export function ChecklistProgressTable({
  onboardingChecklists,
  checkLoading,
  onIncrement,
  isIncrementing,
}: {
  onboardingChecklists: ChecklistItem[];
  checkLoading: boolean;
  onIncrement: (args: { id: string; completedItems: number }) => void;
  isIncrementing: boolean;
}) {
  const { t } = useTranslation("common");
  const rows = Array.isArray(onboardingChecklists) ? onboardingChecklists : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {t("onboardingChecklistHolati")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="ep-table-scroll">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>{t("xodim1")}</TableHead>
                <TableHead>{t("progress5")}</TableHead>
                <TableHead>{t("progress3")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-[13px] text-muted-foreground">
                    {t("Yuklanmoqda...")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item) => {
                  const completed = item.completedItems ?? 0;
                  const total = item.totalItems ?? 12;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <TableRow
                      key={item.id}
                      data-testid={`row-onboarding-checklist-${item.id}`}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="font-medium">{item.fullName || `Xodim #${item.userId}`}</TableCell>
                      <TableCell className="text-sm">{completed}/{total} modda</TableCell>
                      <TableCell className="w-48">
                        <div className="space-y-1">
                          <div className="h-2 bg-muted rounded">
                            <div className="h-2 rounded bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onIncrement({ id: item.id, completedItems: Math.min(total, completed + 1) })}
                          disabled={completed >= total || isIncrementing}
                          data-testid={`button-onboarding-inc-${item.id}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />+1
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
