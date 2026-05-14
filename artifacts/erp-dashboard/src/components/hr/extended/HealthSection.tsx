/**
 * @module HealthSection
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HeartPulse, CheckCircle2, ShieldAlert } from "lucide-react";
import { HealthCheckup } from "./types";

interface HealthSectionProps {
  healthCheckups: HealthCheckup[];
  healthStats: { totalExamined: number; totalEmployees: number; scheduled: number; highSick: number };
}

export function HealthSection({
  healthCheckups,
  healthStats,
}: HealthSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sog'liq Nazorati va Tibbiy Ko'rik</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Ko'rikdan o'tdi", v: `${healthStats.totalExamined}/${healthStats.totalEmployees}`, c: "text-[var(--ep-blue)]", i: CheckCircle2 },
          { l: "Navbatdagi ko'rik", v: healthStats.scheduled, c: "text-[var(--ep-green)]", i: HeartPulse },
          { l: "Yuqori kasallik", v: healthStats.highSick, c: "text-[var(--ep-red)]", i: ShieldAlert },
          { l: "Oylik tahlil", v: "Norma", c: "text-primary", i: HeartPulse },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3 flex items-start justify-between">
            <div>
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
            </div>
            <s.i className={`h-5 w-5 ${s.c} mt-1`} />
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Bo'limlar bo'yicha ko'rik holati</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Bo'lim</TableHead><TableHead>Jami xodim</TableHead>
              <TableHead>O'tganlar</TableHead><TableHead>Oxirgi sana</TableHead>
              <TableHead>Holati</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {healthCheckups.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">Tibbiy ko'rik ma'lumotlari yo'q</TableCell></TableRow>
              ) : (Array.isArray(healthCheckups) ? healthCheckups : []).map((h) => (
                <TableRow key={h.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{h.departmentName}</TableCell>
                  <TableCell>{h.totalEmployees || "—"}</TableCell>
                  <TableCell>{h.examinedCount || 0}</TableCell>
                  <TableCell>{h.lastCheckupDate || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={h.status === "completed" ? "default" : "secondary"}>
                      {h.status === "completed" ? "Yakunlangan" : "Kutilmoqda"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
