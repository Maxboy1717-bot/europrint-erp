/**
 * @module SecurityExtendedSectionsB
 * @description VisitorsSection and AttendanceSection components for SecurityExtended.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, CheckCircle, Plus, Users } from "lucide-react";
import {
  type SecurityVisitor,
  type AttendanceRecord,
  type DailySummary,
} from "./SecurityExtendedTypes";

// ─── VisitorsSection ──────────────────────────────────────────────────────

interface VisitorsSectionProps {
  visitors: SecurityVisitor[];
  visitorsLoading: boolean;
  activeVisitors: SecurityVisitor[];
  onRefetch: () => void;
  onAddVisitor: () => void;
}

export function VisitorsSection({ visitors, visitorsLoading, activeVisitors, onRefetch, onAddVisitor }: VisitorsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Mehmonlar Jurnali</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefetch} className="bg-muted/60 text-foreground hover:bg-muted border-none rounded-lg px-4 font-medium">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
          </Button>
          <Button size="sm" onClick={onAddVisitor} data-testid="button-add-visitor" className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-none">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Mehmon Ro'yxatdan O'tkazish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Bugun jami", v: visitors.length, c: "text-primary" },
          { l: "Hozir ichkarida", v: activeVisitors.length, c: "text-[var(--ep-green)]" },
          { l: "Chiqib ketgan", v: visitors.length - activeVisitors.length, c: "text-muted-foreground" },
        ]).map(s => (
          <div key={s.l} className="bg-card rounded-lg p-5 border border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.l}</p>
            <p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <Card className="bg-card border-border shadow-none">
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                {["Ism", "Tashkilot", "Mezbon", "Maqsad", "Kelish", "Holati"].map((h, idx) => (
                  <TableHead key={h} className={`bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 ${idx === 0 ? "rounded-l-lg" : idx === 5 ? "rounded-r-lg" : ""}`}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitorsLoading ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-6 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell>
                </TableRow>
              ) : visitors.length === 0 ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />Bugun mehmon yo'q
                  </TableCell>
                </TableRow>
              ) : (Array.isArray(visitors) ? visitors : []).slice(0, 15).map((v: SecurityVisitor) => (
                <TableRow key={v.id} data-testid={`row-visitor-${v.id}`} className="border-none hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium px-6 text-foreground">{v.name}</TableCell>
                  <TableCell className="text-sm px-6 text-foreground">{v.company || "—"}</TableCell>
                  <TableCell className="text-sm px-6 text-foreground">{v.host || "—"}</TableCell>
                  <TableCell className="text-sm px-6 text-foreground max-w-[150px] truncate">{v.purpose || "—"}</TableCell>
                  <TableCell className="text-xs px-6 text-muted-foreground">
                    {v.entryTime ? new Date(v.entryTime).toLocaleTimeString("uz-UZ") : v.createdAt ? new Date(v.createdAt).toLocaleTimeString("uz-UZ") : "—"}
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge className={v.exitTime ? "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                      {v.exitTime ? "Chiqdi" : "Ichkarida"}
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

// ─── AttendanceSection ────────────────────────────────────────────────────

interface AttendanceSectionProps {
  attendanceRecords: AttendanceRecord[];
  attendanceLoading: boolean;
  dailySummary: DailySummary | undefined;
}

export function AttendanceSection({ attendanceRecords, attendanceLoading, dailySummary }: AttendanceSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Xodimlar Davomati (Bugun)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Hozir ishda", v: dailySummary?.present ?? (Array.isArray(attendanceRecords) ? attendanceRecords.filter((r: AttendanceRecord) => r.checkIn && !r.checkOut).length : 0), c: "text-[var(--ep-green)]" },
          { l: "Kechikkan", v: dailySummary?.late ?? (Array.isArray(attendanceRecords) ? attendanceRecords.filter((r: AttendanceRecord) => r.isLate).length : 0), c: "text-[var(--ep-yellow)]" },
          { l: "Yo'qolgan", v: dailySummary?.absent ?? 0, c: "text-[var(--ep-red)]" },
          { l: "Ta'tilda", v: dailySummary?.onLeave ?? 0, c: "text-primary" },
        ]).map(s => (
          <div key={s.l} className="bg-card rounded-lg p-5 border border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.l}</p>
            <p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <Card className="bg-card border-border shadow-none">
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                {["Xodim", "Kirish", "Chiqish", "Ishlagan vaqt", "Holati"].map((h, idx) => (
                  <TableHead key={h} className={`bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 ${idx === 0 ? "rounded-l-lg" : idx === 4 ? "rounded-r-lg" : ""}`}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLoading ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">Yuklanmoqda...</TableCell>
                </TableRow>
              ) : !Array.isArray(attendanceRecords) || attendanceRecords.length === 0 ? (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30 text-[var(--ep-green)]" />
                    Bugungi davomat ma'lumotlari yo'q
                  </TableCell>
                </TableRow>
              ) : (Array.isArray(attendanceRecords) ? attendanceRecords : []).slice(0, 15).map((r: AttendanceRecord, i: number) => {
                const checkIn = r.checkIn ? new Date(r.checkIn) : null;
                const checkOut = r.checkOut ? new Date(r.checkOut) : null;
                const hours = checkIn && checkOut ? ((checkOut.getTime() - checkIn.getTime()) / 3_600_000).toFixed(1) : null;
                return (
                  <TableRow key={r.id ?? i} data-testid={`row-att-${r.id ?? i}`} className="border-none hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium px-6 text-foreground">{r.userId || r.employeeName || `#${r.id}`}</TableCell>
                    <TableCell className="text-sm px-6 text-foreground">{checkIn ? checkIn.toLocaleTimeString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm px-6 text-foreground">{checkOut ? checkOut.toLocaleTimeString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm px-6 text-muted-foreground">{hours ? `${hours} soat` : "Ishda"}</TableCell>
                    <TableCell className="px-6">
                      <Badge className={r.isLate ? "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                        {r.isLate ? "Kechikkan" : "O'z vaqtida"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
