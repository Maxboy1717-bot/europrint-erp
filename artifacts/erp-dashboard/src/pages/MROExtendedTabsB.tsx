/** @module MROExtendedTabsB @description Facilities-focused tab content components for MROExtended: ExpensesTab, KitchenTab, UniformsTab, OfficeTab, CleaningTab, SanitationTab, BuildingTab. */

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MROEquipment, MROItem, MROBudget } from "./MROExtendedTypes";

// ---- ExpensesTab ----

interface ExpensesTabProps {
  budgets: MROBudget[] | undefined;
}

export function ExpensesTab({ budgets }: ExpensesTabProps) {
  return (
    <TabsContent value="expenses" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">MRO Xarajat Nazorati</h2>
      {budgets ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Array.isArray(budgets) ? budgets : []).slice(0, 6).map((b, i) => {
            const used  = Number(b.usedAmount  ?? 0);
            const total = Number(b.totalAmount ?? 1);
            const pct   = Math.round((used / total) * 100);
            return (
              <Card key={`k-${i}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium">{b.category}</div>
                    <Badge variant={pct >= 90 ? "destructive" : pct >= 70 ? "secondary" : "outline"}>{pct}%</Badge>
                  </div>
                  <div className="h-2 bg-muted rounded mb-2">
                    <div className={`h-2 rounded ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground">{used.toLocaleString()} / {total.toLocaleString()} so'm</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center text-muted-foreground text-sm">Byudjet ma'lumotlari mavjud emas</div>
      )}
    </TabsContent>
  );
}

// ---- KitchenTab ----
export function KitchenTab() {
  return (
    <TabsContent value="kitchen" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Korporativ Oshxona Boshqaruvi</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Bugungi ovqatlanuvchilar", v: "—", c: "text-primary"    },
          { l: "Oylik xarajat",            v: "—", c: "text-[var(--ep-primary)]" },
          { l: "1 kishi narxi",            v: "—", c: "text-[var(--ep-blue)]"   },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Haftalik menyu</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma"]).map((day, i) => (
              <div key={`k-${i}`} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`row-menu-${i}`}>
                <div className="font-medium text-sm">{day}</div>
                <div className="text-sm text-muted-foreground">
                  {["Moshxo'rda + Kompot", "Lag'mon + Choy", "Osh + Salat", "So'p + Non", "Dimlama + Limonad"][i]}
                </div>
                <Badge variant="outline">—</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ---- UniformsTab ----
interface UniformsTabProps {
  ppeItems: MROItem[];
}

export function UniformsTab({ ppeItems }: UniformsTabProps) {
  const items = Array.isArray(ppeItems) ? ppeItems : [];
  return (
    <TabsContent value="uniforms" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Korporativ Forma Boshqaruvi</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "PPE buyumlar soni",      v: items.length,                                                              c: "text-primary"    },
          { l: "Kam zaxira",             v: items.filter((p) => (p.currentStock ?? 0) < (p.minStock ?? 0)).length,    c: "text-[var(--ep-primary)]" },
          { l: "Jami birlik (ombor)",    v: items.reduce((s, p) => s + Number(p.currentStock || 0), 0),               c: "text-[var(--ep-blue)]"   },
          { l: "Min. zaxira bajarilgan", v: items.filter((p) => (p.currentStock ?? 0) >= (p.minStock ?? 0)).length,   c: "text-[var(--ep-green)]"  },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Buyum</TableHead><TableHead>Birlik</TableHead>
              <TableHead>Joriy zaxira</TableHead><TableHead>Min. zaxira</TableHead><TableHead>Holati</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">PPE buyumlari mavjud emas</TableCell></TableRow>
              ) : items.map((r, i) => (
                <TableRow key={r.id} data-testid={`row-uniform-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{r.name || "—"}</TableCell>
                  <TableCell>{r.unit || "—"}</TableCell>
                  <TableCell>{r.currentStock ?? "—"}</TableCell>
                  <TableCell className={(r.currentStock ?? 0) === 0 ? "text-[var(--ep-red)] font-bold" : ""}>{r.minStock ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={(r.currentStock ?? 0) >= (r.minStock ?? 0) ? "default" : (r.currentStock ?? 0) > 0 ? "secondary" : "destructive"}>
                      {(r.currentStock ?? 0) >= (r.minStock ?? 0) ? "Yetarli" : (r.currentStock ?? 0) > 0 ? "Kam" : "Tugagan"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ---- OfficeTab ----
interface OfficeTabProps {
  equipment: MROEquipment[];
}

export function OfficeTab({ equipment }: OfficeTabProps) {
  return (
    <TabsContent value="office" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Ofis Inventar Nazorati</h2>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Uskuna</TableHead><TableHead>Soni</TableHead><TableHead>Holati</TableHead><TableHead>Mas'ul</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {equipment.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Jihozlar ma'lumotlari mavjud emas</TableCell></TableRow>
              ) : (Array.isArray(equipment) ? equipment : []).slice(0, 10).map((r, i) => (
                <TableRow key={r.id} data-testid={`row-office-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{r.name || "—"}</TableCell>
                  <TableCell>1 ta</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "active" ? "default" : r.status === "maintenance" ? "secondary" : "destructive"}>
                      {r.status === "active" ? "Yaxshi" : r.status === "maintenance" ? "Ta'mirlash" : r.status || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.location || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ---- CleaningTab ----
interface CleaningTabProps {
  cleaningSchedule: Record<string, unknown>[];
}

export function CleaningTab({ cleaningSchedule }: CleaningTabProps) {
  const schedule = Array.isArray(cleaningSchedule) ? cleaningSchedule : [];
  return (
    <TabsContent value="cleaning" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Tozalash Xizmati Jadvali</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Jami zonalar", v: `${schedule.length} zona`,                                           c: "text-[var(--ep-green)]"  },
          { l: "Bajarilgan",   v: `${schedule.filter((z) => z.status === "completed").length} zona`,   c: "text-primary"    },
          { l: "Navbatdagi",   v: `${schedule.filter((z) => z.status !== "completed").length} zona`,   c: "text-[var(--ep-primary)]" },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Kunlik tozalash jadvali</CardTitle></CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">Tozalash jadvali mavjud emas</p>
          ) : (
            <div className="space-y-2">
              {schedule.map((r, i) => (
                <div key={String(r.id || i)} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`row-cleaning-${i}`}>
                  <div>
                    <div className="font-medium text-sm">{String(r.area || "—")}</div>
                    <div className="text-xs text-muted-foreground">{String(r.frequency || "—")} — {String(r.responsible || "—")}</div>
                  </div>
                  <Badge variant={r.status === "completed" ? "default" : "outline"}>
                    {r.status === "completed" ? "Bajarildi" : "Kutilmoqda"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ---- SanitationTab ----

export function SanitationTab() {
  return (
    <TabsContent value="sanitation" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Sanitariya va Dezinfeksiya</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Oxirgi tekshiruv",    v: "—", c: "text-[var(--ep-green)]"  },
          { l: "Muvofiqlik darajasi", v: "—", c: "text-primary"    },
          { l: "Muammo zonalar",      v: "—", c: "text-[var(--ep-primary)]" },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
    </TabsContent>
  );
}

// ---- BuildingTab ----

interface BuildingTabProps {
  equipment: MROEquipment[];
}

export function BuildingTab({ equipment }: BuildingTabProps) {
  return (
    <TabsContent value="building" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Bino va Inshoot Inventari</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Binolar soni",     v: "—", c: "text-primary"    },
          { l: "Umumiy maydon",    v: "—", c: "text-[var(--ep-blue)]"   },
          { l: "Ta'mirlash kerak", v: "—", c: "text-[var(--ep-primary)]" },
          { l: "Inventar qiymati", v: "—", c: "text-[var(--ep-green)]"  },
        ]).map((s) => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      {equipment.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Jihozlar ro'yxati</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>Nomi</TableHead><TableHead>Turi</TableHead>
                <TableHead>Joylashuvi</TableHead><TableHead>Holati</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(equipment) ? equipment : []).slice(0, 8).map((eq) => (
                  <TableRow key={eq.id} data-testid={`row-equip-${eq.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell><Badge variant="outline">{eq.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{eq.location || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={eq.status === "active" ? "default" : eq.status === "maintenance" ? "secondary" : "destructive"}>
                        {eq.status === "active" ? "Faol" : eq.status === "maintenance" ? "Ta'mirda" : "Nofaol"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
