/**
 * @module SkillsGapTab
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

const SKILLS_GAP_DATA = [
  { skill: "Mashina boshqarish (Gofrokarton)", required: 4, current: 3.2, employees: 8, status: "gap" },
  { skill: "Sifat nazorati (QC)", required: 4, current: 4.1, employees: 0, status: "ok" },
  { skill: "Xavfsizlik qoidalari", required: 5, current: 3.8, employees: 12, status: "critical" },
  { skill: "Ombor boshqaruvi (WMS)", required: 3, current: 2.9, employees: 3, status: "gap" },
  { skill: "Elektr xavfsizligi", required: 4, current: 4.5, employees: 0, status: "ok" },
  { skill: "Brakni aniqlash", required: 4, current: 3.5, employees: 6, status: "gap" },
  { skill: "Yangi mashinalar boshqaruvi", required: 3, current: 1.8, employees: 15, status: "critical" },
  { skill: "Inventarizatsiya qoidalari", required: 3, current: 3.2, employees: 0, status: "ok" },
];

export function SkillsGapTab() {
  const { t } = useTranslation("common");
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />{t("skillsGapTahlili")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              {(["Ko'nikma", "Talab darajasi", "Mavjud daraja", "Gap", "Ta'lim zarur xodimlar", "Holat"]).map(h => <TableHead key={h}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(SKILLS_GAP_DATA) ? SKILLS_GAP_DATA : []).map((row, i) => {
              const gap = (row.required - row.current).toFixed(1);
              const gapNum = parseFloat(gap);
              return (
                <TableRow key={`k-${i}`} data-testid={`row-skills-gap-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{row.skill}</TableCell>
                  <TableCell className="text-center">{row.required}/5</TableCell>
                  <TableCell className="text-center font-mono">{row.current}/5</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-mono font-bold ${gapNum > 0.5 ? "text-[var(--ep-red)]" : gapNum > 0 ? "text-[var(--ep-primary)]" : "text-[var(--ep-green)]"}`}>
                      {gapNum > 0 ? `+${gap}` : gap}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.employees > 0 ? <EPStatusPill tone="danger">{row.employees} kishi</EPStatusPill> : <EPStatusPill tone="neutral">—</EPStatusPill>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "ok" ? "secondary" : row.status === "gap" ? "default" : "destructive"}>
                      {row.status === "ok" ? "Yaxshi" : row.status === "gap" ? "Gap bor" : "Kritik"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
    </>
  );
}
