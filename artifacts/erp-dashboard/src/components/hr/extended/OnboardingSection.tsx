/**
 * @module OnboardingSection
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle2 } from "lucide-react";
import { HREmployee, ChecklistItem } from "./types";
import { UseMutationResult } from "@tanstack/react-query";

import { useTranslation } from '@/lib/i18n';
interface OnboardingSectionProps {
  empLoading: boolean;
  newEmployees: HREmployee[];
  onboardingChecklists: ChecklistItem[];
  updateChecklist: UseMutationResult<any, any, { id: string; completedItems: number }>;
}

export function OnboardingSection({empLoading,
  newEmployees,
  onboardingChecklists,
  updateChecklist,
}: OnboardingSectionProps) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Yangi Xodim Onboarding</h2>
        <Button data-testid="button-add-onboarding"><Plus className="h-4 w-4 mr-2" />Onboarding Boshlash</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Faol onboarding", v: empLoading ? "..." : newEmployees.length, c: "text-[var(--ep-blue)]" },
          { l: "Bajarildi (bu oy)", v: "0", c: "text-[var(--ep-green)]" },
          { l: "O'rtacha muddati", v: "30 kun", c: "text-[var(--ep-primary)]" },
          { l: "Yangi xodimlar", v: empLoading ? "..." : newEmployees.length, c: "text-primary" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Onboarding Bosqichlari</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Xodim</TableHead><TableHead>Lavozim</TableHead>
              <TableHead>Ishga kirish sanasi</TableHead><TableHead>Bo'lim</TableHead>
              <TableHead>Holati</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {empLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
              ) : newEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                    Faol onboarding jarayonlari mavjud emas
                  </TableCell>
                </TableRow>
              ) : (Array.isArray(newEmployees) ? newEmployees : []).map((emp: HREmployee) => (
                <TableRow key={emp.id} data-testid={`row-onboarding-${emp.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.name || `#${emp.id}`}</TableCell>
                  <TableCell className="text-muted-foreground">{emp.positionName || emp.position || "—"}</TableCell>
                  <TableCell>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                  <TableCell>{emp.departmentName || emp.department || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">Onboarding</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
      {onboardingChecklists.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Onboarding Checklist Holati</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>Xodim</TableHead>
                <TableHead>Bajarilish</TableHead>
                <TableHead>{t('progress')}</TableHead>
                <TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(onboardingChecklists) ? onboardingChecklists : []).map((item: ChecklistItem) => {
                  const completed = item.completedItems ?? 0;
                  const total = item.totalItems ?? 12;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <TableRow key={item.id} data-testid={`row-onboarding-checklist-${item.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{item.fullName || `Xodim #${item.userId}`}</TableCell>
                      <TableCell className="text-sm">{completed}/{total} modda</TableCell>
                      <TableCell className="w-40">
                        <div className="space-y-1">
                          <div className="h-2 bg-muted rounded">
                            <div className="h-2 rounded bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => updateChecklist.mutate({ id: item.id, completedItems: Math.min(total, completed + 1) })}
                          disabled={completed >= total}
                          data-testid={`button-onboarding-inc-${item.id}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />+1
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
