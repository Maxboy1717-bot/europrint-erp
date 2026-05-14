/**
 * @module AlumniSection
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CheckCircle2, FileText } from "lucide-react";
import { AlumniRecord } from "./types";

interface AlumniSectionProps {
  alumniList: AlumniRecord[];
  alumniStats: { total: number; returned: number; collaborations: number };
}

export function AlumniSection({
  alumniList,
  alumniStats,
}: AlumniSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alumni — Sobiq Xodimlar</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Jami Alumni", v: alumniStats.total, c: "text-[var(--ep-blue)]", i: Users },
          { l: "Qaytgan xodimlar", v: alumniStats.returned, c: "text-[var(--ep-green)]", i: CheckCircle2 },
          { l: "Loyihalardagi ishtirok", v: alumniStats.collaborations, c: "text-[var(--ep-primary)]", i: FileText },
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
        <CardHeader><CardTitle className="text-base">Sobiq xodimlar ro'yxati</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>F.I.SH.</TableHead><TableHead>Oxirgi lavozim</TableHead>
              <TableHead>Bo'shatilgan sana</TableHead><TableHead>Hozirgi ish joyi</TableHead>
              <TableHead>Holati</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {alumniList.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">Alumni ma'lumotlari yo'q</TableCell></TableRow>
              ) : (Array.isArray(alumniList) ? alumniList : []).map((al) => (
                <TableRow key={al.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{al.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{al.lastPosition || "—"}</TableCell>
                  <TableCell>{al.exitDate || "—"}</TableCell>
                  <TableCell>{al.currentEmployer || "—"}</TableCell>
                  <TableCell>
                    {al.isReturned ? <Badge className="bg-green-100 text-[var(--ep-green)] hover:bg-green-100">Qaytgan</Badge> : <Badge variant="outline">Alumni</Badge>}
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
