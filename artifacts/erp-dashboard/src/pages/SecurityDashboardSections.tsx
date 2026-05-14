/**
 * @module SecurityDashboardSections
 * @description Attendance log and visitor list tab-content sections for the
 * Security Dashboard. Data and callbacks are provided by the parent
 * orchestrator; these components contain no server-state of their own.
 */

import { ScanLine, Eye, AlertTriangle, CheckCircle, Plus, LogIn, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import type { AttendanceRecord, Visitor } from "./SecurityDashboardTypes";

import { EPLoader } from "@/components/ep";
/** Shared table-header cell class used across all security tables. */
const TH = "bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6";

// ---------------------------------------------------------------------------
// Attendance log (Tab 1 — "overview")
// ---------------------------------------------------------------------------

interface AttendanceTabProps {
  records: AttendanceRecord[] | undefined;
  isLoading: boolean;
}

export function AttendanceTab({ records, isLoading }: AttendanceTabProps) {
  return (
    <TabsContent value="overview" className="space-y-4 mt-6">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <ScanLine className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Bugungi Kirish Jurnali</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><EPLoader className="w-6 h-6" /></div>
        ) : !records?.length ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">Bugun kirish jurnali yo'q</div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className={`${TH} rounded-l-lg`}>Xodim</TableHead>
                <TableHead className={TH}>Turi</TableHead>
                <TableHead className={TH}>Vaqt</TableHead>
                <TableHead className={TH}>Usul</TableHead>
                <TableHead className={TH}>Joy</TableHead>
                <TableHead className={`${TH} rounded-r-lg`}>Holat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(records) ? records : []).slice(0, 30).map((r) => {
                let rowClass = "border-none hover:bg-muted/40 transition-colors";
                if (r.isAnomaly) rowClass += " bg-red-50 border-l-4 border-error";
                else if (r.type === "entry") rowClass += " bg-green-50 border-l-4 border-green-500";
                else rowClass += " bg-muted/40 border-l-4 border-border";

                return (
                  <TableRow key={r.id} data-testid={`row-attendance-${r.id}`} className={rowClass}>
                    <TableCell className="font-medium px-6 text-foreground">{r.employeeName}</TableCell>
                    <TableCell className="px-6">
                      <Badge className={r.type === "entry"
                        ? "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                        : "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                        {r.type === "entry" ? <LogIn className="w-3 h-3 mr-1" /> : <LogOut className="w-3 h-3 mr-1" />}
                        {r.type === "entry" ? "Kirdi" : "Chiqdi"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm px-6 text-muted-foreground">
                      {new Date(r.timestamp).toLocaleTimeString("uz-UZ")}
                    </TableCell>
                    <TableCell className="px-6">
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground rounded-full">
                        {r.method === "rfid" ? "RFID" : r.method === "face" ? "Yuz" : r.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm px-6 text-muted-foreground">{r.location || "Asosiy kirish"}</TableCell>
                    <TableCell className="px-6">
                      {r.isAnomaly ? (
                        <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none">
                          <AlertTriangle className="w-3 h-3 mr-1" />Anomaliya
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none">
                          <CheckCircle className="w-3 h-3 mr-1" />Normal
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </div>
    </TabsContent>
  );
}

// ---------------------------------------------------------------------------
// Visitors (Tab 2)
// ---------------------------------------------------------------------------

interface VisitorsTabProps {
  visitors: Visitor[];
  isLoading: boolean;
  onAdd: () => void;
  onExit: (id: string) => void;
  exitPending: boolean;
}

export function VisitorsTab({ visitors, isLoading, onAdd, onExit, exitPending }: VisitorsTabProps) {
  return (
    <TabsContent value="visitors" className="space-y-4">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />Tashrifchilar
            </h2>
            <p className="text-sm text-muted-foreground">Hozirda zavodda bo'lgan tashrifchilar</p>
          </div>
          <Button onClick={onAdd} data-testid="button-add-visitor">
            <Plus className="w-4 h-4 mr-2" />Yangi Tashrif
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><EPLoader className="w-6 h-6" /></div>
        ) : !visitors.length ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">Tashrifchilar yo'q</div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className={`${TH} rounded-l-lg`}>Ismi</TableHead>
                <TableHead className={TH}>Kompaniya</TableHead>
                <TableHead className={TH}>Maqsad</TableHead>
                <TableHead className={TH}>Mezboni</TableHead>
                <TableHead className={TH}>Kirdi</TableHead>
                <TableHead className={TH}>Holat</TableHead>
                <TableHead className={`${TH} rounded-r-lg`}></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.map((v) => (
                <TableRow key={v.id} data-testid={`row-visitor-${v.id}`} className="border-none hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium px-6 text-foreground">{v.fullName}</TableCell>
                  <TableCell className="px-6 text-foreground">{v.company}</TableCell>
                  <TableCell className="px-6 text-foreground">{v.purpose}</TableCell>
                  <TableCell className="px-6 text-foreground">{v.hostEmployeeName}</TableCell>
                  <TableCell className="text-sm px-6 text-muted-foreground">
                    {new Date(v.enteredAt).toLocaleTimeString("uz-UZ")}
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge variant={!v.exitedAt ? "default" : "secondary"}>
                      {!v.exitedAt ? "Ichkarida" : "Chiqdi"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6">
                    {!v.exitedAt && (
                      <Button size="sm" variant="outline"
                        data-testid={`button-exit-visitor-${v.id}`}
                        onClick={() => onExit(v.id)}
                        disabled={exitPending}>
                        <LogOut className="w-3 h-3 mr-1" />Chiqdi
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </div>
    </TabsContent>
  );
}
