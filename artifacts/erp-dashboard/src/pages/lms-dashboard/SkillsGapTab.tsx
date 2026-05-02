import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

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
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />Skills Gap Tahlili</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
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
                <TableRow key={`k-${i}`} data-testid={`row-skills-gap-${i}`}>
                  <TableCell className="font-medium">{row.skill}</TableCell>
                  <TableCell className="text-center">{row.required}/5</TableCell>
                  <TableCell className="text-center font-mono">{row.current}/5</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-mono font-bold ${gapNum > 0.5 ? "text-red-500" : gapNum > 0 ? "text-orange-500" : "text-green-500"}`}>
                      {gapNum > 0 ? `+${gap}` : gap}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.employees > 0 ? <Badge variant="destructive">{row.employees} kishi</Badge> : <Badge variant="secondary">—</Badge>}
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
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
