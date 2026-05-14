/**
 * TechPPExtendedSections.tsx
 * Tab content section components for TechPPExtended.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { Cpu, Calculator, Plus } from "lucide-react";
import { StatCard, EmptyState } from "./TechPPExtendedDialogs";
import type { TechCard } from "./TechPPExtendedTypes";

import { useTranslation } from '@/lib/i18n';
// ─── Tech: Material Muqobili ──────────────────────────────────────────────────
interface TechMaterialsProps { techCards: TechCard[]; loading: boolean; }
export function TechMaterialsSection({techCards, loading }: TechMaterialsProps) {
  const { t } = useTranslation('common');
  return (
    <TabsContent value="tech-materials" className="mt-0 space-y-4">
      <h2 className="text-2xl font-light tracking-tight text-foreground mb-4">
        Material <span className="font-bold text-primary">Muqobili</span>
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Texnologik kartalar" value={loading ? "..." : techCards.length} sub="Jami kartalar" />
        <StatCard label="Faol kartalar" value="—" />
        <StatCard label="Shu oyda qo'shildi" value="—" />
        <StatCard label="Kutilayotgan" value="—" color="text-[var(--ep-yellow)]" />
      </div>
      <Card className="bg-card rounded-lg border-none shadow-none">
        <CardHeader><CardTitle className="text-[14px] font-semibold text-foreground">Texnologik kartalar ro'yxati</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Karta №</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Mahsulot nomi</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('Material')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Qatlamlar</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Holati</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {techCards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">Ma'lumot kiritilmagan</TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(techCards) ? techCards : []).map((card, i) => (
                    <TableRow key={card.id} data-testid={`row-alt-material-${i}`} className="hover:bg-muted/40 transition-colors border-none">
                      <TableCell className="py-3 px-6 font-medium text-foreground">{card.card_no || "—"}</TableCell>
                      <TableCell className="py-3 px-6 text-foreground">{card.product_name || "—"}</TableCell>
                      <TableCell className="py-3 px-6 text-foreground">{card.material || card.flute_type || "—"}</TableCell>
                      <TableCell className="py-3 px-6 text-foreground">{card.layers ?? "—"}</TableCell>
                      <TableCell className="py-3 px-6">
                        <Badge className={card.papka_order_id
                          ? "bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          : "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        }>
                          {card.papka_order_id ? "Buyurtmaga bog'liq" : "Faol"}
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

// ─── Tech: Stanoq Tanlash ─────────────────────────────────────────────────────
export function TechMachinesSection() {
  return (
    <TabsContent value="tech-machines" className="mt-0 band-y-4 space-y-4">
      <h2 className="text-lg font-semibold">Stanoq Tanlash Wizard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Buyurtma parametrlari</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([{l:"Hajm (mm)", p:"1000x700"},{l:"Tiraj (dona)",p:"5000"},{l:"Bo'yoqlar soni",p:"4"},{l:"Laminatsiya",p:"Yo'q"}]).map(f => (
              <div key={f.l} className="space-y-1"><Label className="text-sm">{f.l}</Label><Input defaultValue={f.p} /></div>
            ))}
            <Button className="w-full mt-2 gap-2" data-testid="button-find-machine">
              <Cpu className="h-4 w-4" />Stanoq Tanlash
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Mos stanoqlar</CardTitle></CardHeader>
          <CardContent><EmptyState message="Ma'lumot kiritilmagan" /></CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

// ─── Tech: Vaqt va Tannarx ────────────────────────────────────────────────────
export function TechTimeSection() {
  return (
    <TabsContent value="tech-time" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Vaqt va Tannarx Kalkulyator</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Kalkulyatsiya</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([{l:"Buyurtma raqami",p:""},{l:"Tiraj",p:""},{l:"Stanoq",p:""},{l:"Bo'yoqlar",p:""}]).map(f => (
              <div key={f.l} className="space-y-1"><Label className="text-sm">{f.l}</Label><Input defaultValue={f.p} /></div>
            ))}
            <Button className="w-full gap-2" data-testid="button-calc-time">
              <Calculator className="h-4 w-4" />Hisoblash
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Natija</CardTitle></CardHeader>
          <CardContent><EmptyState message="Ma'lumot kiritilmagan" /></CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

// ─── Tech: Xarajat Optimizatsiya ──────────────────────────────────────────────
export function TechCostSection() {
  return (
    <TabsContent value="tech-cost" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">AI Xarajat Optimizatsiya</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Potensial tejash" value="—" color="text-[var(--ep-green)]" sub="Joriy oy uchun" />
        <StatCard label="Tasdiqlangan tavsiyalar" value="—" sub="Oxirgi 30 kunda" />
        <StatCard label="Tejangan summa" value="—" color="text-[var(--ep-green)]" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">AI Tavsiyalar</CardTitle></CardHeader>
        <CardContent><EmptyState message="Ma'lumot kiritilmagan" /></CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Tech: Mijoz Talablari ────────────────────────────────────────────────────
export function TechClientsSection() {
  return (
    <TabsContent value="tech-clients" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mijoz Maxsus Talablar</h2>
        <Button data-testid="button-add-req"><Plus className="h-4 w-4 mr-2" />Qo'shish</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Mijoz</TableHead><TableHead>Talab turi</TableHead>
              <TableHead>Tavsif</TableHead><TableHead>Holati</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-[13px] text-muted-foreground">Ma'lumot kiritilmagan</TableCell></TableRow>
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Tech: O'zgarishlar Tarixi ────────────────────────────────────────────────
export function TechHistorySection() {
  return (
    <TabsContent value="tech-history" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Texnik Karta O'zgarishlar Tarixi</h2>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Sana</TableHead><TableHead>Hujjat</TableHead>
              <TableHead>O'zgarish</TableHead><TableHead>Muallif</TableHead><TableHead>Versiya</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">Ma'lumot kiritilmagan</TableCell></TableRow>
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ─── Tech: Parallel Buyurtmalar ───────────────────────────────────────────────
export function TechParallelSection() {
  const { t } = useTranslation('common');
  return (
    <TabsContent value="tech-parallel" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Parallel Buyurtmalar Boshqaruvi</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Faol buyurtmalar" value="—" />
        <StatCard label="Konflikt" value="—" color="text-[var(--ep-red)]" />
        <StatCard label="Optimallashtirish mumkin" value="—" color="text-[var(--ep-green)]" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t('buyurtmalarGantt')}</CardTitle></CardHeader>
        <CardContent><EmptyState message="Ma'lumot kiritilmagan" /></CardContent>
      </Card>
    </TabsContent>
  );
}

// PP sections live in TechPPSections.tsx
export { PpShiftsSection, PpRushSection, PpBottleneckSection, PpDemandSection, PpOeeSection, RemainingPpSections } from "./TechPPSections";
