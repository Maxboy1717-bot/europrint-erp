import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Cpu, GitBranch, Clock, DollarSign, Users, History, Copy,
  Zap, TrendingUp, AlertTriangle, BarChart3, Target, Calendar,
  Activity, RefreshCw, Brain, Package, Plus, Calculator,
  type LucideIcon
} from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

const URL_TAB_MAP: Record<string, string> = {
  "/tech/material-alternatives": "tech-materials",
  "/tech/machine-selection": "tech-machines",
  "/tech/time-cost": "tech-time",
  "/tech/cost-optimization": "tech-cost",
  "/tech/client-requirements": "tech-clients",
  "/tech/change-history": "tech-history",
  "/tech/parallel-orders": "tech-parallel",
  "/pp/shift-management": "pp-shifts",
  "/pp/parallel-processes": "pp-parallel",
  "/pp/rush-orders": "pp-rush",
  "/pp/bottleneck": "pp-bottleneck",
  "/pp/demand-forecast": "pp-demand",
  "/pp/what-if": "pp-whatif",
  "/pp/delivery-calculator": "pp-delivery",
  "/pp/energy-optimization": "pp-energy",
  "/pp/oee-monitor": "pp-oee",
  "/pp/kpi-deviation": "pp-kpi",
  "/pp/realtime-progress": "pp-realtime",
};

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "tech-materials": { title: "Material Muqobili",     icon: Package },
  "tech-machines":  { title: "Stanoq Tanlash",        icon: Cpu },
  "tech-time":      { title: "Vaqt va Tannarx",       icon: Clock },
  "tech-cost":      { title: "Xarajat Optimizatsiya", icon: DollarSign },
  "tech-clients":   { title: "Mijoz Talablari",       icon: Users },
  "tech-history":   { title: "O'zgarishlar Tarixi",   icon: History },
  "tech-parallel":  { title: "Parallel Buyurtmalar",  icon: Copy },
  "pp-shifts":      { title: "Smena Boshqaruvi",      icon: Calendar },
  "pp-parallel":    { title: "Parallel Jarayonlar",   icon: GitBranch },
  "pp-rush":        { title: "Rush Order",            icon: Zap },
  "pp-bottleneck":  { title: "Bottleneck",            icon: AlertTriangle },
  "pp-demand":      { title: "Demand Forecast",       icon: TrendingUp },
  "pp-whatif":      { title: "What-if Tahlil",        icon: Brain },
  "pp-delivery":    { title: "Yetkazish Kalk.",       icon: Calculator },
  "pp-energy":      { title: "Energiya Optim.",       icon: Zap },
  "pp-oee":         { title: "OEE Monitor",           icon: Activity },
  "pp-kpi":         { title: "KPI Og'ish",            icon: Target },
  "pp-realtime":    { title: "Real-time Monitor",     icon: RefreshCw },
};

interface TechCard {
  id: string;
  card_no?: string;
  product_name?: string;
  material?: string;
  flute_type?: string;
  layers?: number;
  notes?: string;
  papka_order_id?: string | null;
  created_at?: string;
}

interface ProductionOrder {
  id: string;
  orderNumber?: string;
  priority?: string;
  plannedEndDate?: string;
  status?: string;
  productName?: string;
  salesOrderId?: string;
  clientName?: string;
}

interface OeeData {
  overall: {
    oee: number;
    availability: number;
    performance: number;
    quality: number;
  };
  byMachine: Array<{
    machineId: string;
    machineName: string;
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    sessions: number;
  }>;
}

interface ShiftRequirement {
  id: string;
  department?: string;
  shiftType?: string;
  requiredCount?: number;
  isActive?: boolean;
}

export default function TechPPExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "tech-materials");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);
  const meta = tabMeta[activeTab] || tabMeta["tech-materials"];

  const { data: orders = [], isLoading: ordersLoading } = useQuery<ProductionOrder[]>({ queryKey: ["/api/pp/production-orders"] });
  const { data: techCards = [], isLoading: techCardsLoading } = useQuery<TechCard[]>({ queryKey: ["/api/technology-cards"] });
  const { data: oeeData, isLoading: oeeLoading } = useQuery<OeeData>({ queryKey: ["/api/mes/oee"] });
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<ShiftRequirement[]>({ queryKey: ["/api/integration/shifts"] });

  const rushOrders = (Array.isArray(orders) ? orders : []).filter(o => o.priority === "high" || o.priority === "urgent");

  const techTabs = [
    { v: "tech-materials", label: "Material Muqobili", icon: Package },
    { v: "tech-machines", label: "Stanoq Tanlash", icon: Cpu },
    { v: "tech-time", label: "Vaqt va Tannarx", icon: Clock },
    { v: "tech-cost", label: "Xarajat Optimizatsiya", icon: DollarSign },
    { v: "tech-clients", label: "Mijoz Talablari", icon: Users },
    { v: "tech-history", label: "O'zgarishlar Tarixi", icon: History },
    { v: "tech-parallel", label: "Parallel Buyurtmalar", icon: Copy },
  ];
  const ppTabs = [
    { v: "pp-shifts", label: "Smena Boshqaruvi", icon: Calendar },
    { v: "pp-parallel", label: "Parallel Jarayonlar", icon: GitBranch },
    { v: "pp-rush", label: "Rush Order", icon: Zap },
    { v: "pp-bottleneck", label: "Bottleneck", icon: AlertTriangle },
    { v: "pp-demand", label: "Demand Forecast", icon: TrendingUp },
    { v: "pp-whatif", label: "What-if Tahlil", icon: Brain },
    { v: "pp-delivery", label: "Yetkazish Kalk.", icon: Calculator },
    { v: "pp-energy", label: "Energiya Optim.", icon: Zap },
    { v: "pp-oee", label: "OEE Monitor", icon: Activity },
    { v: "pp-kpi", label: "KPI Og'ish", icon: Target },
    { v: "pp-realtime", label: "Real-time", icon: RefreshCw },
  ];

  const StatCard = ({ label, value, sub, color = "text-primary" }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <Card><CardContent className="pt-4 pb-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </CardContent></Card>
  );

  const EmptyState = ({ message = "Ma'lumot kiritilmagan" }: { message?: string }) => (
    <div className="text-center py-10 text-muted-foreground text-sm">{message}</div>
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="border-b border-outline-variant px-6 py-3 flex items-center gap-3 bg-surface-container-lowest">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Cpu className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-light tracking-tight text-on-surface">
          Texnolog <span className="font-bold text-primary">BOM/Routing</span> va AI Rejalashtirish
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-outline-variant px-4 overflow-x-auto bg-surface-container-low">
          <div className="flex flex-col gap-0">
            <div className="flex gap-0 border-b border-outline-variant/30 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-3 py-2.5 shrink-0 flex items-center">TEXNOLOG:</span>
              {(Array.isArray(techTabs) ? techTabs : []).map(t => (
                <button
                  key={t.v}
                  onClick={() => setActiveTab(t.v)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2",
                    activeTab === t.v ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:text-on-surface"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-0 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-3 py-2.5 shrink-0 flex items-center">AI PP:</span>
              {(Array.isArray(ppTabs) ? ppTabs : []).map(t => (
                <button
                  key={t.v}
                  onClick={() => setActiveTab(t.v)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2",
                    activeTab === t.v ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:text-on-surface"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <ModuleSectionHeader
            moduleName="Texnolog / PP"
            moduleColor="text-primary"
            sectionTitle={meta?.title || ""}
            icon={meta?.icon || (() => null)}
          />

          {/* TECH: Material Muqobili — real tech cards */}
          <TabsContent value="tech-materials" className="mt-0 space-y-4">
            <h2 className="text-2xl font-light tracking-tight text-on-surface mb-4">
              Material <span className="font-bold text-primary">Muqobili</span>
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Texnologik kartalar" value={techCardsLoading ? "..." : techCards.length} sub="Jami kartalar" />
              <StatCard label="Faol kartalar" value="—" />
              <StatCard label="Shu oyda qo'shildi" value="—" />
              <StatCard label="Kutilayotgan" value="—" color="text-amber-600" />
            </div>
            <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
              <CardHeader><CardTitle className="text-lg text-on-surface">Texnologik kartalar ro'yxati</CardTitle></CardHeader>
              <CardContent className="p-0">
                {techCardsLoading ? (
                  <div className="p-6 space-y-3">
                    {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Karta №</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Mahsulot nomi</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Material</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Qatlamlar</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holati</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {techCards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Ma'lumot kiritilmagan
                          </TableCell>
                        </TableRow>
                      ) : (
                        (Array.isArray(techCards) ? techCards : []).map((card, i) => (
                          <TableRow key={card.id} data-testid={`row-alt-material-${i}`} className="hover:bg-surface-container-low transition-colors border-none">
                            <TableCell className="py-3 px-6 font-medium text-on-surface">{card.card_no || "—"}</TableCell>
                            <TableCell className="py-3 px-6 text-on-surface">{card.product_name || "—"}</TableCell>
                            <TableCell className="py-3 px-6 text-on-surface">{card.material || card.flute_type || "—"}</TableCell>
                            <TableCell className="py-3 px-6 text-on-surface">{card.layers ?? "—"}</TableCell>
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
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TECH: Stanoq Tanlash — empty results state */}
          <TabsContent value="tech-machines" className="mt-0 band-y-4 space-y-4">
            <h2 className="text-lg font-semibold">Stanoq Tanlash Wizard</h2>
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Buyurtma parametrlari</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {([{l:"Hajm (mm)", p:"1000x700"},{l:"Tiraj (dona)",p:"5000"},{l:"Bo'yoqlar soni",p:"4"},{l:"Laminatsiya",p:"Yo'q"}]).map(f => (
                    <div key={f.l} className="space-y-1"><Label className="text-sm">{f.l}</Label><Input defaultValue={f.p} /></div>
                  ))}
                  <Button className="w-full mt-2" data-testid="button-find-machine"><Cpu className="h-4 w-4 mr-2" />Stanoq Tanlash</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Mos stanoqlar</CardTitle></CardHeader>
                <CardContent>
                  <EmptyState message="Ma'lumot kiritilmagan" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TECH: Vaqt va Tannarx — empty results state */}
          <TabsContent value="tech-time" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Vaqt va Tannarx Kalkulyator</h2>
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Kalkulyatsiya</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {([{l:"Buyurtma raqami",p:""},{l:"Tiraj",p:""},{l:"Stanoq",p:""},{l:"Bo'yoqlar",p:""}]).map(f => (
                    <div key={f.l} className="space-y-1"><Label className="text-sm">{f.l}</Label><Input defaultValue={f.p} /></div>
                  ))}
                  <Button className="w-full" data-testid="button-calc-time"><Calculator className="h-4 w-4 mr-2" />Hisoblash</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Natija</CardTitle></CardHeader>
                <CardContent>
                  <EmptyState message="Ma'lumot kiritilmagan" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TECH: Xarajat Optimizatsiya — empty states */}
          <TabsContent value="tech-cost" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">AI Xarajat Optimizatsiya</h2>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Potensial tejash" value="—" color="text-green-600" sub="Joriy oy uchun" />
              <StatCard label="Tasdiqlangan tavsiyalar" value="—" sub="Oxirgi 30 kunda" />
              <StatCard label="Tejangan summa" value="—" color="text-green-600" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">AI Tavsiyalar</CardTitle></CardHeader>
              <CardContent>
                <EmptyState message="Ma'lumot kiritilmagan" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TECH: Mijoz Talablari */}
          <TabsContent value="tech-clients" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mijoz Maxsus Talablar</h2>
              <Button data-testid="button-add-req"><Plus className="h-4 w-4 mr-2" />Qo'shish</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Mijoz</TableHead><TableHead>Talab turi</TableHead>
                    <TableHead>Tavsif</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Ma'lumot kiritilmagan
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TECH: O'zgarishlar Tarixi */}
          <TabsContent value="tech-history" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Texnik Karta O'zgarishlar Tarixi</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Sana</TableHead><TableHead>Hujjat</TableHead>
                    <TableHead>O'zgarish</TableHead><TableHead>Muallif</TableHead><TableHead>Versiya</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Ma'lumot kiritilmagan
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TECH: Parallel Buyurtmalar */}
          <TabsContent value="tech-parallel" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Parallel Buyurtmalar Boshqaruvi</h2>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Faol buyurtmalar" value="—" />
              <StatCard label="Konflikt" value="—" color="text-red-600" />
              <StatCard label="Optimallashtirish mumkin" value="—" color="text-green-600" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Buyurtmalar Gantt</CardTitle></CardHeader>
              <CardContent>
                <EmptyState message="Ma'lumot kiritilmagan" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* PP: Smena — real shifts API */}
          <TabsContent value="pp-shifts" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Smena Boshqaruvi</h2>
            <div className="grid grid-cols-4 gap-4">
              {([
                {l:"1-smena (06-14)", type:"MORNING", c:"text-green-600"},
                {l:"2-smena (14-22)", type:"AFTERNOON", c:"text-blue-600"},
                {l:"Tungi (22-06)", type:"NIGHT", c:"text-purple-600"},
                {l:"Muammolar", type:null, c:"text-red-600"},
              ]).map(s => {
                const count = s.type ? (Array.isArray(shifts) ? shifts : []).filter(sh => sh.shiftType === s.type && sh.isActive).length : 0;
                return (
                  <Card key={s.l}><CardContent className="pt-4 pb-3">
                    <div className={`text-2xl font-bold ${s.c}`}>{shiftsLoading ? "..." : (s.type ? count : "—")}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                  </CardContent></Card>
                );
              })}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Bugungi smena</CardTitle></CardHeader>
              <CardContent>
                {shiftsLoading ? (
                  <div className="space-y-3">
                    {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Bo'lim</TableHead><TableHead>Smena turi</TableHead><TableHead>Kerakli xodimlar</TableHead><TableHead>Holati</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {shifts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Ma'lumot kiritilmagan
                          </TableCell>
                        </TableRow>
                      ) : (
                        (Array.isArray(shifts) ? shifts : []).map((s, i) => (
                          <TableRow key={s.id} data-testid={`row-shift-${i}`}>
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
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PP: Rush — real production orders filtered by priority */}
          <TabsContent value="pp-rush" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Rush Order Boshqaruvi</h2>
              <Button variant="destructive" data-testid="button-add-rush"><Zap className="h-4 w-4 mr-2" />Rush Qo'shish</Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Faol rush" value={ordersLoading ? "..." : rushOrders.length} color="text-red-600" />
              <StatCard label="Bugun yakunlanadigan" value="—" color="text-orange-600" />
              <StatCard label="O'rtacha kechikish" value="—" />
            </div>
            <Card>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="p-6 space-y-3">
                    {([1, 2]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Buyurtma</TableHead><TableHead>Mijoz</TableHead><TableHead>Muddati</TableHead><TableHead>Ustuvorlik</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {rushOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Ma'lumot kiritilmagan
                          </TableCell>
                        </TableRow>
                      ) : (
                        (Array.isArray(rushOrders) ? rushOrders : []).map((r, i) => (
                          <TableRow key={r.id} data-testid={`row-rush-${i}`}>
                            <TableCell className="font-medium">{r.orderNumber || r.id}</TableCell>
                            <TableCell>{r.clientName || r.productName || "—"}</TableCell>
                            <TableCell className="text-orange-600 font-medium">
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
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PP: Bottleneck — empty state */}
          <TabsContent value="pp-bottleneck" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Bottleneck Tahlili</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Muammoli nuqtalar</CardTitle></CardHeader>
                <CardContent>
                  <EmptyState message="Ma'lumot kiritilmagan" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">AI Tavsiyalar</CardTitle></CardHeader>
                <CardContent>
                  <EmptyState message="Ma'lumot kiritilmagan" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PP: Demand Forecast — empty state */}
          <TabsContent value="pp-demand" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">AI Demand Forecasting</h2>
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Keyingi oy prognoz" value="—" color="text-green-600" />
              <StatCard label="Model aniqligi" value="—" color="text-blue-600" />
              <StatCard label="Prognoz davri" value="—" />
              <StatCard label="Oxirgi yangilanish" value="—" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Mahsulot kategoriyalari prognozi</CardTitle></CardHeader>
              <CardContent>
                <EmptyState message="Ma'lumot kiritilmagan" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* PP: OEE Monitor — real OEE data */}
          <TabsContent value="pp-oee" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">OEE Monitor (Real-time)</h2>
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="O'rtacha OEE" value={oeeLoading ? "..." : `${oeeData?.overall?.oee ?? "—"}%`} color="text-blue-600" />
              <StatCard label="Mavjudlik" value={oeeLoading ? "..." : `${oeeData?.overall?.availability ?? "—"}%`} color="text-green-600" />
              <StatCard label="Unumdorlik" value={oeeLoading ? "..." : `${oeeData?.overall?.performance ?? "—"}%`} color="text-orange-600" />
              <StatCard label="Sifat" value={oeeLoading ? "..." : `${oeeData?.overall?.quality ?? "—"}%`} color="text-purple-600" />
            </div>
            <Card>
              <CardContent className="p-0">
                {oeeLoading ? (
                  <div className="p-6 space-y-3">
                    {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Stanoq</TableHead><TableHead>OEE</TableHead><TableHead>Mavjud</TableHead><TableHead>Unumd.</TableHead><TableHead>Sifat</TableHead><TableHead>Seanslari</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(!oeeData?.byMachine || oeeData.byMachine.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Ma'lumot kiritilmagan
                          </TableCell>
                        </TableRow>
                      ) : (
                        oeeData.byMachine?.map((r, i) => (
                          <TableRow key={r.machineId} data-testid={`row-oee-${i}`}>
                            <TableCell className="font-medium">{r.machineName}</TableCell>
                            <TableCell><span className={`font-bold ${r.oee>=80?"text-green-600":r.oee>=70?"text-yellow-600":"text-red-600"}`}>{r.oee}%</span></TableCell>
                            <TableCell>{r.availability}%</TableCell>
                            <TableCell>{r.performance}%</TableCell>
                            <TableCell>{r.quality}%</TableCell>
                            <TableCell><Badge variant="secondary">{r.sessions}</Badge></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Remaining PP tabs — empty states, no fake data */}
          {(["pp-parallel","pp-whatif","pp-delivery","pp-energy","pp-kpi","pp-realtime"]).map(tab => (
            <TabsContent key={tab} value={tab} className="mt-0 space-y-4">
              <h2 className="text-lg font-semibold">
                {tab === "pp-parallel" ? "Parallel Jarayonlar Monitoringi" :
                 tab === "pp-whatif" ? "What-if Stsenariy Tahlili" :
                 tab === "pp-delivery" ? "Yetkazish Muddati Kalkulyatori" :
                 tab === "pp-energy" ? "Energiya Optimizatsiya" :
                 tab === "pp-kpi" ? "KPI va Og'ish Tahlili" : "Real-time Progress"}
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Faol jarayonlar" value="—" />
                <StatCard label="Bajarilgan" value="—" color="text-green-600" />
                <StatCard label="Kechikmoqda" value="—" color="text-red-600" />
              </div>
              <Card>
                <CardContent className="pt-4">
                  <EmptyState message="Ma'lumot kiritilmagan" />
                </CardContent>
              </Card>
            </TabsContent>
          ))}

        </div>
      </Tabs>
    </div>
  );
}
