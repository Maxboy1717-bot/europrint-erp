/** @module MESExtendedTabsA @description OEE monitoring tab and Downtime reasons tab for the MES Extended page. */

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { type MESMachine, type DowntimeReason } from "./MESExtendedTypes";

// ─── OEE Tab ─────────────────────────────────────────────────────────────────

interface OeeTabProps {
  machines: MESMachine[];
  isLoading: boolean;
}

/** Tab content: OEE — Uskunalar samaradorligi monitoringi */
export function OeeTab({ machines, isLoading }: OeeTabProps) {
  return (
    <TabsContent value="oee" className="mt-0 space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        OEE — Uskunalar samaradorligi monitoringi
      </p>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stanoq</TableHead>
                <TableHead>OEE</TableHead>
                <TableHead>Mavjudlik</TableHead>
                <TableHead>Unumdorlik</TableHead>
                <TableHead>Sifat</TableHead>
                <TableHead>Holati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-[13px] text-muted-foreground">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(machines) ? machines : []).map((m: MESMachine) => (
                  <TableRow key={m.id || m.machineId} data-testid={`row-mes-oee-${m.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{m.name || m.machineName}</TableCell>

                    <TableCell>
                      <span className={`font-bold ${
                        Number(m.oee) >= 85 ? "text-[var(--ep-green)]" :
                        Number(m.oee) >= 70 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"
                      }`}>
                        {Number(m.oee || 0).toFixed(0)}%
                      </span>
                      <div className="w-20 h-1.5 bg-muted rounded mt-1">
                        <div
                          className={`h-1.5 rounded ${
                            Number(m.oee) >= 85 ? "bg-green-500" :
                            Number(m.oee) >= 70 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${m.oee}%` }}
                        />
                      </div>
                    </TableCell>

                    <TableCell>{Number(m.availability || m.avail || 0).toFixed(0)}%</TableCell>
                    <TableCell>{Number(m.performance || m.perf || 0).toFixed(0)}%</TableCell>
                    <TableCell>{Number(m.quality || m.qual || 0).toFixed(0)}%</TableCell>

                    <TableCell>
                      <Badge variant={
                        (m.status === "running" || m.status === "Ishlayapti") ? "default" :
                        (m.status === "maintenance" || m.status?.includes("Ta'mir")) ? "destructive" :
                        "secondary"
                      }>
                        {m.status === "running"      ? "Ishlayapti"  :
                         m.status === "maintenance"  ? "Ta'mirlashda" :
                         m.status || "Noma'lum"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Downtime Reasons Tab ────────────────────────────────────────────────────

interface ReasonsTabProps {
  downtimeReasons: DowntimeReason[];
}

/** Tab content: To'xtash Sabablar Logi */
export function ReasonsTab({ downtimeReasons }: ReasonsTabProps) {
  const reasons = Array.isArray(downtimeReasons) ? downtimeReasons : [];
  const barColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-gray-400"];

  return (
    <TabsContent value="reasons" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">To'xtash Sabablar Logi</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reasons table */}
        <Card>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sabab</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead>Muddat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reasons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-[13px] text-muted-foreground">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-30" />
                      To'xtash sabablar yo'q
                    </TableCell>
                  </TableRow>
                ) : (
                  reasons.slice(0, 10).map((r: DowntimeReason) => (
                    <TableRow key={r.id} data-testid={`row-reason-${r.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{r.name || r.reason}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === "planned" ? "secondary" : "destructive"}>
                          {r.type === "planned" ? "Rejalashtirilgan" : "Rejalashtirilmagan"}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.avgDuration ? `${r.avgDuration} min` : "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>

        {/* Analysis card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sabab tahlili</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reasons.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                To'xtash sabablari qayd etilmagan
              </div>
            ) : (
              reasons.slice(0, 4).map((r: DowntimeReason, i: number) => {
                const pct = r.pct || Math.round(100 / reasons.length);
                return (
                  <div key={r.name || r.id || i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{r.name || r.reason}</span>
                      <span>{r.count || "—"} ta ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded">
                      <div
                        className={`h-2 rounded ${barColors[i % barColors.length]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
