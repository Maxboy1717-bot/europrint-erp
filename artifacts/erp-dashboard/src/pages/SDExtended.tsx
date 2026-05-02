import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard, Target, Package, Banknote,
  TrendingUp, Users, AlertCircle, CheckCircle2,
  Clock, DollarSign, BarChart3, type LucideIcon
} from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

interface CrmDeal {
  id: number;
  stage: string;
  expectedRevenue?: number | string;
  assignedTo?: number;
}

interface UserRecord {
  id: number;
  role: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

interface PapkaOrder {
  id: number;
  status: string;
  clientName?: string;
  amount?: number;
  dueDate?: string;
  advancePercent?: number;
  papkaNo?: string;
  mijozNomi?: string;
  mahsulotNomi?: string;
  sana?: string;
  items?: PapkaOrder[];
  data?: PapkaOrder[];
  orders?: PapkaOrder[];
}

interface RentalRecord {
  id: string;
  orderId?: string;
  clientName?: string;
  orderNumber?: string;
  areaM2?: number | string;
  startDate?: string;
  endDate?: string;
  dailyRate?: number | string;
  totalAmount?: number | string;
  billed?: boolean;
}

const routeTabMap: Record<string, string> = {
  "/sd/manager-panel": "manager",
  "/sd/quota-dashboard": "quota",
  "/sd/warehouse-rental": "rental",
  "/sd/advance-control": "advance",
};

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "manager": { title: "Menejer Paneli", icon: LayoutDashboard },
  "quota": { title: "Kvota Dashboard", icon: Target },
  "rental": { title: "Ombor Ijara", icon: Package },
  "advance": { title: "Avans Nazorat", icon: Banknote },
};

export default function SDExtended() {
  const [location] = useLocation();
  const defaultTab = routeTabMap[location] || "manager";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = routeTabMap[location];
    if (tab) setActiveTab(tab);
  }, [location]);

    const meta = tabMeta[activeTab] || tabMeta["manager"];

  const { data: deals = [] } = useQuery<CrmDeal[]>({ queryKey: ["/api/crm/deals"] });
  const { data: _papkaRaw } = useQuery<PapkaOrder[] | PapkaOrder>({ queryKey: ["/api/papka-orders"] });
  const papkaOrders: PapkaOrder[] = Array.isArray(_papkaRaw)
    ? _papkaRaw
    : ((_papkaRaw as PapkaOrder)?.items ?? (_papkaRaw as PapkaOrder)?.data ?? (_papkaRaw as PapkaOrder)?.orders ?? []);
  const { data: users = [] } = useQuery<UserRecord[]>({ queryKey: ["/api/users"] });
  const { data: rentalData = [], isLoading: rentalLoading } = useQuery<RentalRecord[]>({
    queryKey: ["/api/sd/active-rentals"]
  });

  const managers = (Array.isArray(users) ? users : []).filter((u: UserRecord) => ["manager", "sales_manager"].includes(u.role));

  const wonDeals = (Array.isArray(deals) ? deals : []).filter((d: CrmDeal) => d.stage === "won");
  const totalRevenue = (Array.isArray(wonDeals) ? wonDeals : []).reduce((s: number, d: CrmDeal) => s + (Number(d.expectedRevenue) || 0), 0);

  const managerStats = (Array.isArray(managers) ? managers : []).map((m: UserRecord) => {
    const mDeals = (Array.isArray(deals) ? deals : []).filter((d: CrmDeal) => d.assignedTo === m.id);
    const mWon = (Array.isArray(mDeals) ? mDeals : []).filter((d: CrmDeal) => d.stage === "won");
    const mRevenue = (Array.isArray(mWon) ? mWon : []).reduce((s: number, d: CrmDeal) => s + (Number(d.expectedRevenue) || 0), 0);
    const quota = 50000000;
    return {
      name: m.fullName || `${m.firstName} ${m.lastName}`,
      totalDeals: mDeals.length,
      wonDeals: mWon.length,
      revenue: mRevenue,
      quota,
      progress: Math.min(100, (mRevenue / quota) * 100),
    };
  });

  const advanceOrders = (Array.isArray(papkaOrders) ? papkaOrders : []).filter((o: PapkaOrder) =>
    ["approved", "ready_for_planning"].includes(o.status)
  );

  return (
    <div className="p-6 space-y-8 bg-surface min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            {meta?.title?.split(' ')[0]} <span className="font-bold text-primary">{meta?.title?.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-on-surface-variant mt-1">Sotuv moduli kengaytirilgan boshqaruv paneli</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
          {Object.entries(tabMeta).map(([tab, data]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <data.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{data.title}</span>
            </button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-0">
        
        {/* ── MENEJER PANELI ── */}
        <TabsContent value="manager" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-surface-container-lowest border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Jami bitimlar</p>
                    <p className="text-3xl font-bold tracking-tight text-on-surface">{deals.length}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-surface-container-lowest border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Yutilgan bitimlar</p>
                    <p className="text-3xl font-bold tracking-tight text-primary">{wonDeals.length}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-surface-container-lowest border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Jami daromad</p>
                    <p className="text-3xl font-bold tracking-tight text-on-surface">{(totalRevenue / 1_000_000).toFixed(1)}M</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-surface-container-lowest border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Menejerlar soni</p>
                    <p className="text-3xl font-bold tracking-tight text-on-surface">{managers.length}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-surface-container-lowest border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-surface-container-low/50">
              <CardTitle className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Menejer ko'rsatkichlari</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {managerStats.length === 0 ? (
                <p className="text-center text-on-surface-variant py-12 italic">Menejer ma'lumotlari topilmadi</p>
              ) : (
                <div className="space-y-8">
                  {(Array.isArray(managerStats) ? managerStats : []).map((m, i) => (
                    <div key={`k-${i}`} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-on-surface">{m.name}</span>
                        <span className="text-sm font-medium text-on-surface-variant">
                          <span className="text-on-surface">{(m.revenue / 1_000_000).toFixed(1)}M</span> / {(m.quota / 1_000_000).toFixed(0)}M so'm
                        </span>
                      </div>
                      <Progress value={m.progress} className="h-2.5 bg-surface-container-high" />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                             {m.wonDeals} yutilgan
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
                             <div className="w-1.5 h-1.5 rounded-full bg-surface-container-high" />
                             {m.totalDeals} jami bitim
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-none ${
                          m.progress >= 100 ? "bg-primary text-white" : 
                          m.progress >= 70 ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant"
                        }`}>
                          {m.progress.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── KVOTA DASHBOARD ── */}
        <TabsContent value="quota" className="space-y-4 mt-0">
          <Card className="bg-surface-container-lowest border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-surface-container-low/50">
              <CardTitle className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />Kvota bajarilishi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-outline-variant hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Menejer</TableHead>
                    <TableHead className="text-right text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Kvota (so'm)</TableHead>
                    <TableHead className="text-right text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Haqiqiy</TableHead>
                    <TableHead className="text-right text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Farq</TableHead>
                    <TableHead className="text-right text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">%</TableHead>
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managerStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-on-surface-variant py-12 italic">Ma'lumot yo'q</TableCell>
                    </TableRow>
                  ) : (Array.isArray(managerStats) ? managerStats : []).map((m, i) => (
                    <TableRow key={`k-${i}`} className="border-outline-variant hover:bg-surface-container-low/50">
                      <TableCell className="font-bold text-on-surface py-4">{m.name}</TableCell>
                      <TableCell className="text-right font-medium text-on-surface py-4">{(m.quota / 1_000_000).toFixed(0)}M</TableCell>
                      <TableCell className="text-right font-bold text-primary py-4">{(m.revenue / 1_000_000).toFixed(1)}M</TableCell>
                      <TableCell className={`text-right font-medium py-4 ${m.revenue < m.quota ? "text-orange-500" : "text-primary"}`}>
                        {m.revenue < m.quota ? `-${((m.quota - m.revenue) / 1_000_000).toFixed(1)}M` : "+"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-on-surface py-4">{m.progress.toFixed(0)}%</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className={`rounded-full px-3 border-none text-[10px] font-bold ${
                          m.progress >= 100 ? "bg-primary text-white" : 
                          m.progress >= 70 ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant"
                        }`}>
                          {m.progress >= 100 ? "Bajarildi" : m.progress >= 70 ? "Yaqin" : "Orqada"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── OMBOR IJARA ── */}
        <TabsContent value="rental" className="space-y-4 mt-0">
          <Card className="bg-surface-container-lowest border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-surface-container-low/50">
              <CardTitle className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />Faol ijara shartnomalari
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-outline-variant hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Mijoz</TableHead>
                    <TableHead className="text-right text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Maydon (m²)</TableHead>
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Boshlanish</TableHead>
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Tugash</TableHead>
                    <TableHead className="text-right text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Oylik (so'm)</TableHead>
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">To'lov</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentalLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`k-${i}`}>
                        <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : rentalData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-on-surface-variant py-12 italic">
                        Faol ijara shartnomalari mavjud emas
                      </TableCell>
                    </TableRow>
                  ) : (Array.isArray(rentalData) ? rentalData : []).map((r, i) => (
                    <TableRow key={`k-${i}`} className="border-outline-variant hover:bg-surface-container-low/50">
                      <TableCell className="font-bold text-on-surface py-4">
                        {r.clientName || r.orderNumber || r.orderId || "Mijoz nomi yo'q"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-on-surface py-4">{r.areaM2}</TableCell>
                      <TableCell className="text-sm text-on-surface-variant py-4">{r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-sm text-on-surface-variant py-4">{r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-right font-bold text-primary py-4">
                        {r.totalAmount 
                          ? `${(Number(r.totalAmount) / 1000).toFixed(0)}K` 
                          : `${((Number(r.areaM2 || 0) * Number(r.dailyRate || 0) * 30) / 1000).toFixed(0)}K`}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className={`rounded-full px-3 border-none text-[10px] font-bold ${
                          r.billed ? "bg-primary text-white" : "bg-orange-500/10 text-orange-500"
                        }`}>
                          {r.billed ? "To'langan" : "Kutilmoqda"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-6 bg-surface-container-low/30 border-t border-outline-variant/30">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Jami maydon</span>
                    <span className="text-lg font-bold text-on-surface">
                      {(rentalData ?? []).reduce((s, r) => s + Number(r.areaM2 || 0), 0)} m²
                    </span>
                  </div>
                  <div className="w-px h-8 bg-outline-variant" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Jami tushum</span>
                    <span className="text-lg font-bold text-primary">
                      {((Array.isArray(rentalData) ? rentalData : []).reduce((s, r) => {
                        const amount = r.totalAmount 
                          ? Number(r.totalAmount) 
                          : (Number(r.areaM2 || 0) * Number(r.dailyRate || 0) * 30);
                        return s + amount;
                      }, 0) / 1_000_000).toFixed(1)}M so'm/oy
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 70% AVANS NAZORAT ── */}
        <TabsContent value="advance" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="bg-surface-container-lowest border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Avans kutilayotgan</p>
                  <p className="text-3xl font-bold tracking-tight text-on-surface">{advanceOrders.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-surface-container-lowest border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Kritik (muddati o'tgan)</p>
                  <p className="text-3xl font-bold tracking-tight text-red-500">0</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-surface-container-lowest border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Bajarilgan avanslar</p>
                  <p className="text-3xl font-bold tracking-tight text-primary">0</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-surface-container-lowest border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-surface-container-low/50">
              <CardTitle className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">70% Avans kutilayotgan buyurtmalar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-outline-variant hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Papka №</TableHead>
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Mijoz</TableHead>
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Mahsulot</TableHead>
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Holat</TableHead>
                    <TableHead className="text-xs font-bold text-on-surface-variant uppercase tracking-wider h-12">Sana</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advanceOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-on-surface-variant py-12 italic">
                        Avans kutilayotgan buyurtmalar yo'q
                      </TableCell>
                    </TableRow>
                  ) : (Array.isArray(advanceOrders) ? advanceOrders : []).slice(0, 20).map((o: PapkaOrder) => (
                    <TableRow key={o.id} className="border-outline-variant hover:bg-surface-container-low/50">
                      <TableCell className="font-mono text-xs font-bold text-primary py-4">{o.papkaNo}</TableCell>
                      <TableCell className="font-bold text-on-surface py-4">{o.mijozNomi}</TableCell>
                      <TableCell className="text-sm text-on-surface py-4">{o.mahsulotNomi}</TableCell>
                      <TableCell className="py-4">
                         <Badge variant="secondary" className="bg-surface-container-high text-on-surface-variant border-none text-[10px] font-bold rounded-full">
                           {o.status}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-on-surface-variant py-4">{o.sana || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
