/**
 * @module SkillsGapTab
 * @description React page component. Route-level UI.
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface PositionSkillReq {
  skill_name: string;
  skill_category: string;
  required_level: number;
  is_mandatory: boolean;
}

interface EmployeeSkillRow {
  skill_name: string;
  skill_category: string;
  current_level: number;
}

interface GapRow {
  skill_name: string;
  skill_category: string;
  required_level: number;
  avg_current: number;
  gap: number;
  employee_count: number;
  is_mandatory: boolean;
}

function computeGapRows(
  posSkills: PositionSkillReq[],
  empSkills: EmployeeSkillRow[],
): GapRow[] {
  return posSkills.map((ps) => {
    const matching = Array.isArray(empSkills)
      ? empSkills.filter(
          (es) =>
            es.skill_name.toLowerCase().trim() ===
            ps.skill_name.toLowerCase().trim(),
        )
      : [];
    const avg_current =
      matching.length > 0
        ? matching.reduce((sum, es) => sum + (Number(es.current_level) || 0), 0) /
          matching.length
        : 0;
    return {
      skill_name:     ps.skill_name,
      skill_category: ps.skill_category,
      required_level: Number(ps.required_level) || 0,
      avg_current:    Math.round(avg_current * 10) / 10,
      gap:            Math.round((Number(ps.required_level) - avg_current) * 10) / 10,
      employee_count: matching.length,
      is_mandatory:   Boolean(ps.is_mandatory),
    };
  });
}

export function SkillsGapTab() {
  const { t } = useTranslation("common");

  const posSkillsQuery = useQuery<PositionSkillReq[]>({
    queryKey: ['/api/integration/hr-lms/position-skills'],
    queryFn:  () => apiRequest('GET', '/api/integration/hr-lms/position-skills'),
  });

  const empSkillsQuery = useQuery<EmployeeSkillRow[]>({
    queryKey: ['/api/integration/hr-lms/employee-skills'],
    queryFn:  () => apiRequest('GET', '/api/integration/hr-lms/employee-skills'),
  });

  const isLoading = posSkillsQuery.isLoading || empSkillsQuery.isLoading;

  const posSkills = Array.isArray(posSkillsQuery.data) ? posSkillsQuery.data : [];
  const empSkills = Array.isArray(empSkillsQuery.data) ? empSkillsQuery.data : [];

  const gapRows: GapRow[] = isLoading ? [] : computeGapRows(posSkills, empSkills);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/integration/hr-lms/position-skills'] });
          queryClient.invalidateQueries({ queryKey: ['/api/integration/hr-lms/employee-skills'] });
        }}
        className="sr-only"
        aria-label={t("refresh")}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t("skillsGapTahlili")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  {(["Ko'nikma", "Kategoriya", "Talab darajasi", "Mavjud daraja", "Gap", "Holat"]).map(
                    (h) => <TableHead key={h}>{h}</TableHead>,
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  ([...Array(5)]).map((_, i) => (
                    <TableRow key={`sk-${i}`} className="hover:bg-muted/40 transition-colors">
                      {([...Array(6)]).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full rounded-lg" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : gapRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t("malumotMavjudEmas")}
                    </TableCell>
                  </TableRow>
                ) : (
                  gapRows.map((row, i) => {
                    const gapNum  = row.gap;
                    const gapStr  = gapNum > 0 ? `+${gapNum.toFixed(1)}` : gapNum.toFixed(1);
                    const status  = gapNum > 1 ? "critical" : gapNum > 0 ? "gap" : "ok";
                    return (
                      <TableRow
                        key={`k-${i}`}
                        data-testid={`row-skills-gap-${i}`}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="font-medium">{row.skill_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{row.skill_category}</TableCell>
                        <TableCell className="text-center">{row.required_level}/5</TableCell>
                        <TableCell className="text-center font-mono">
                          {row.employee_count > 0 ? `${row.avg_current}/5` : <EPStatusPill tone="neutral">—</EPStatusPill>}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-mono font-bold ${
                              gapNum > 1
                                ? "text-[var(--ep-red)]"
                                : gapNum > 0
                                  ? "text-[var(--ep-primary)]"
                                  : "text-[var(--ep-green)]"
                            }`}
                          >
                            {gapStr}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === "ok"
                                ? "secondary"
                                : status === "gap"
                                  ? "default"
                                  : "destructive"
                            }
                          >
                            {status === "ok" ? "Yaxshi" : status === "gap" ? "Gap bor" : "Kritik"}
                          </Badge>
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
    </>
  );
}
