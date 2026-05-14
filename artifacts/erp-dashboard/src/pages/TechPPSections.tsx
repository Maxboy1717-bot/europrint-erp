/**
 * TechPPSections.tsx
 * PP (Production Planning) tab content sections for TechPPExtended.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { Zap } from "lucide-react";
import { StatCard, EmptyState } from "./TechPPExtendedDialogs";
import type { ProductionOrder, OeeData, ShiftRequirement } from "./TechPPExtendedTypes";
import { REMAINING_PP_TABS, REMAINING_TAB_TITLES } from "./TechPPExtendedTypes";
import { EPStatusPill } from "@/components/ep";

// ─── PP: Smena Boshqaruvi ─────────────────────────────────────────────────────
interface PpShiftsProps { shifts: ShiftRequirement[]; loading: boolean; }
export function PpShiftsSection({ shifts, loading }: PpShiftsProps) {
  return (
    <TabsContent value="pp-shifts" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Smena Boshqaruvi</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          {l:"1-smena (06-14)", type:"MORNING", c:"text-[var(--ep-green)]"},
          {l:"2-smena (14-22)", type:"AFTERNOON", c:"text-[var(--ep-blue)]"},
          {l:"Tungi (22-06)", type:"NIGHT", c:"text-[var(--ep-purple)]"},
          {l:"Muammolar", type:null, c:"text-[var(--ep-red)]"},
        ]).map(s => {
          const count = s.type ? (Array.isArray(shifts) ? shifts : []).filter(sh => sh.shiftType === s.type && sh.isActive).length : 0;
          return (
            <Card key={s.l}><CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${s.c}`}>{loading ? "..." : (s.type ? count : "—")}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
            </CardContent></Card>
          );
        })}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Bugungi smena</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>Bo'lim</TableHead><TableHead>Smena turi</TableHead>
                <TableHead>Kerakli xodimlar</TableHead><TableHead>Holati</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {shifts.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-[13px] text-muted-foreground">Ma'lumot kiritilmagan</TableCell></TableRow>
                ) : (
                  (Array.isArray(shifts) ? shifts : []).map((s, i) => (
                    <TableRow key={s.id} data-testid={`row-shift-${i}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{s.department || "—"}</TableCell>
                      <TableCell>{s.shiftType || "—"}</TableCell>
                      <TableCell>{s.requiredCount ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Faol" : "Nofaol"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── PP: Rush Orders ──────────────────────────────────────────────────────────
interface PpRushProps { rushOrders: ProductionOrder[]; loading: boolean; }
export function PpRushSection({ rushOrders, loading }: PpRushProps) {
  return (
    <TabsContent value="pp-rush" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rush Order Boshqaruvi</h2>
        <Button variant="destructive" data-testid="button-add-rush"><Zap className="h-4 w-4 mr-2" />Rush Qo'shish</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Faol rush" value={loading ? "..." : rushOrders.length} color="text-[var(--ep-red)]" />
        <StatCard label="Bugun yakunlanadigan" value="—" color="text-[var(--ep-primary)]" />
        <StatCard label="O'rtacha kechikish" value="—" />
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{([1, 2]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>Buyurtma</TableHead><TableHead>Mijoz</TableHead>
                <TableHead>Muddati</TableHead><TableHead>Ustuvorlik</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rushOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-[13px] text-muted-foreground">Ma'lumot kiritilmagan</TableCell></TableRow>
                ) : (
                  (Array.isArray(rushOrders) ? rushOrders : []).map((r, i) => (
                    <TableRow key={r.id} data-testid={`row-rush-${i}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{r.orderNumber || r.id}</TableCell>
                      <TableCell>{r.clientName || r.productName || "—"}</TableCell>
                      <TableCell className="text-[var(--ep-primary)] font-medium">
                        {r.plannedEndDate ? new Date(r.plannedEndDate).toLocaleDateString("uz-UZ") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.priority === "urgent" ? "destructive" : "secondary"}>
                          {r.priority === "urgent" ? "Kritik" : "Yuqori"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── PP: Bottleneck ───────────────────────────────────────────────────────────
export function PpBottleneckSection() {
  return (
    <TabsContent value="pp-bottleneck" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Bottleneck Tahlili</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Muammoli nuqtalar</CardTitle></CardHeader>
          <CardContent><EmptyState message="Ma'lumot kiritilmagan" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">AI Tavsiyalar</CardTitle></CardHeader>
          <CardContent><EmptyState message="Ma'lumot kiritilmagan" /></CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

// ─── PP: Demand Forecast ──────────────────────────────────────────────────────
export function PpDemandSection() {
  return (
    <TabsContent value="pp-demand" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">AI Demand Forecasting</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Keyingi oy prognoz" value="—" color="text-[var(--ep-green)]" />
        <StatCard label="Model aniqligi" value="—" color="text-[var(--ep-blue)]" />
        <StatCard label="Prognoz davri" value="—" />
        <StatCard label="Oxirgi yangilanish" value="—" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Mahsulot kategoriyalari prognozi</CardTitle></CardHeader>
        <CardContent><EmptyState message="Ma'lumot kiritilmagan" /></CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── PP: OEE Monitor ──────────────────────────────────────────────────────────
interface PpOeeProps { oeeData: OeeData | undefined; loading: boolean; }
export function PpOeeSection({ oeeData, loading }: PpOeeProps) {
  return (
    <TabsContent value="pp-oee" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">OEE Monitor (Real-time)</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="O'rtacha OEE" value={loading ? "..." : `${oeeData?.overall?.oee ?? "—"}%`} color="text-[var(--ep-blue)]" />
        <StatCard label="Mavjudlik" value={loading ? "..." : `${oeeData?.overall?.availability ?? "—"}%`} color="text-[var(--ep-green)]" />
        <StatCard label="Unumdorlik" value={loading ? "..." : `${oeeData?.overall?.performance ?? "—"}%`} color="text-[var(--ep-primary)]" />
        <StatCard label="Sifat" value={loading ? "..." : `${oeeData?.overall?.quality ?? "—"}%`} color="text-[var(--ep-purple)]" />
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>Stanoq</TableHead><TableHead>OEE</TableHead><TableHead>Mavjud</TableHead>
                <TableHead>Unumd.</TableHead><TableHead>Sifat</TableHead><TableHead>Seanslari</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(!oeeData?.byMachine || oeeData.byMachine.length === 0) ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-[13px] text-muted-foreground">Ma'lumot kiritilmagan</TableCell></TableRow>
                ) : (
                  oeeData.byMachine?.map((r, i) => (
                    <TableRow key={r.machineId} data-testid={`row-oee-${i}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{r.machineName}</TableCell>
                      <TableCell><span className={`font-bold ${r.oee>=80?"text-[var(--ep-green)]":r.oee>=70?"text-[var(--ep-yellow)]":"text-[var(--ep-red)]"}`}>{r.oee}%</span></TableCell>
                      <TableCell>{r.availability}%</TableCell>
                      <TableCell>{r.performance}%</TableCell>
                      <TableCell>{r.quality}%</TableCell>
                      <TableCell><EPStatusPill tone="neutral">{r.sessions}</EPStatusPill></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Remaining PP tabs (generic empty-state pattern) ─────────────────────────
export function RemainingPpSections() {
  return (
    <>
      {(Array.from(REMAINING_PP_TABS)).map(tab => (
        <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
          <h2 className="text-lg font-semibold">{REMAINING_TAB_TITLES[tab]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Faol jarayonlar" value="—" />
            <StatCard label="Bajarilgan" value="—" color="text-[var(--ep-green)]" />
            <StatCard label="Kechikmoqda" value="—" color="text-[var(--ep-red)]" />
          </div>
          <Card>
            <CardContent className="pt-4"><EmptyState message="Ma'lumot kiritilmagan" /></CardContent>
          </Card>
        </TabsContent>
      ))}
    </>
  );
}
