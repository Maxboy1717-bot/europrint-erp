import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Brain, AlertTriangle, TrendingUp, TrendingDown, Truck, Package,
  Users, Activity, DollarSign, Download, RefreshCw, Factory, BarChart3,
  ShieldAlert, Zap, CheckCircle2, Clock, XCircle,
  type LucideIcon
} from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

interface DirectorDashboard {
  orders?: { month?: number; completed?: number; overdue?: number; inProduction?: number };
  production?: { oee?: number };
  hr?: { attendanceRate?: number; present?: number; total?: number };
  alerts?: { iot?: number; minStock?: number };
  [key: string]: unknown;
}

interface AiStats {
  oee?: number;
  totalOrders?: number;
  overdueOrders?: number;
  attendance?: { rate?: number };
}
interface AiSummaryData {
  summary?: string;
  stats?: AiStats;
}
interface OeeToday {
  avg?: number;
  min?: number;
  max?: number;
  snapshots?: unknown[];
}
interface ProdData {
  orderBreakdown?: Record<string, number>;
  oeeToday?: OeeToday;
  overdueOrders?: ProductionOrder[];
  sessionsToday?: ProductionSession[];
}
interface AttendanceData {
  present?: number;
  attendanceRate?: number;
  absent?: number;
  late?: number;
}
interface HrData {
  employees?: { total?: number };
  attendance?: AttendanceData;
  byDepartment?: HRDepartment[];
}
interface KpiData {
  oeeByEquipment?: KPIEquipment[];
}
interface FinData {
  totalReceivable?: number;
  overdueAmount?: number;
  pendingAmount?: number;
  invoices?: Record<string, { count?: number; amount?: number }>;
}

interface DirectorAlert {
    id?: number | string;
    title?: string;
    severity?: string;
    module?: string;
    message?: string;
    createdAt?: string;
  }
  interface ProductionOrder {
    id: number | string;
    papkaNo?: string;
    status?: string;
    deadline?: string;
    tayyorBolishSanasi?: string;
  }
  interface ProductionSession {
    id?: number | string;
    operatorName?: string;
    machineName?: string;
    startTime?: string;
    equipmentId?: number | string;
    status?: string;
    targetQty?: number;
    producedQty?: number;
    defectQty?: number;
    oee?: number;
  }
  interface HRDepartment {
    department?: string;
    present?: number;
    total?: number;
    count?: number;
  }
  interface KPIEquipment {
    equipmentName?: string;
    equipmentId?: number | string;
    oee?: number | string;
    avgOee?: number;
    avgAvailability?: number;
    avgPerformance?: number;
    avgQuality?: number;
  }

const URL_TAB_MAP: Record<string, string> = {
  "/director/ai-summary": "summary",
  "/director/problem-points": "problems",
  "/director/production": "production",
  "/director/hr-stats": "hr",
  "/director/finance": "finance",
  "/director/kpis": "kpis",
};

function StatCard({ icon: Icon, label, value, sub, color }: { icon: LucideIcon; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${color || "text-primary"}`} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      </div>
      <div className="text-4xl font-bold tracking-tight text-on-surface">{value}</div>
      {sub && <div className="text-xs text-on-surface-variant mt-2">{sub}</div>}
    </div>
  );
}

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "summary": { title: "AI Xulosa", icon: Brain },
  "problems": { title: "Muammolar", icon: AlertTriangle },
  "production": { title: "Ishlab Chiqarish", icon: Factory },
  "hr": { title: "HR / Davomad", icon: Users },
  "finance": { title: "Moliya", icon: DollarSign },
  "kpis": { title: "KPI Monitor", icon: BarChart3 },
};

function exportDirectorSummaryToPDF(aiData: AiSummaryData | undefined, dashboardData: DirectorDashboard | undefined) {
  const date = new Date().toLocaleDateString("uz-UZ");
  const win = window.open("", "_blank");
  if (!win) return;
  const stats: AiStats = aiData?.stats ?? {};
  const orders: NonNullable<DirectorDashboard["orders"]> = dashboardData?.orders ?? {};
  const alerts: NonNullable<DirectorDashboard["alerts"]> = dashboardData?.alerts ?? {};
  const hr: NonNullable<DirectorDashboard["hr"]> = dashboardData?.hr ?? {};
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>Direktor Kunlik Xulosa - ${date}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; color: #222; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 15px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .card { border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
        .card-label { font-size: 11px; color: #666; margin-bottom: 4px; }
        .card-value { font-size: 20px; font-weight: bold; }
        .summary-box { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 14px; margin-bottom: 16px; font-size: 13px; line-height: 1.6; }
        .rec { display: flex; gap: 10px; align-items: flex-start; padding: 8px; background: #f9f9f9; border-radius: 4px; margin-bottom: 6px; font-size: 12px; }
        .badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; white-space: nowrap; }
        .badge-critical { background: #fef2f2; color: #dc2626; }
        .badge-high { background: #fff7ed; color: #ea580c; }
        .badge-medium { background: #f0fdf4; color: #16a34a; }
        .footer { margin-top: 30px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        @media print { body { margin: 15px; } }
      </style>
    </head>
    <body>
      <h1>Europrint — Direktor Kunlik Xulosa</h1>
      <div class="subtitle">Sana: ${date} | Yaratilgan: ${new Date().toLocaleTimeString("uz-UZ")}</div>
      <h2>Asosiy Ko'rsatkichlar</h2>
      <div class="grid">
        <div class="card"><div class="card-label">Oylik buyurtmalar</div><div class="card-value">${orders.month ?? 0} ta</div></div>
        <div class="card"><div class="card-label">Ishlab chiqarishda</div><div class="card-value">${orders.inProduction ?? 0} ta</div></div>
        <div class="card"><div class="card-label">Kechikkan</div><div class="card-value" style="color:${(orders.overdue??0)>0?'#dc2626':'#16a34a'}">${orders.overdue ?? 0} ta</div></div>
        <div class="card"><div class="card-label">OEE o'rtacha</div><div class="card-value">${stats.oee ? stats.oee+'%' : '—'}</div></div>
        <div class="card"><div class="card-label">Davomad</div><div class="card-value">${hr.present ?? 0}/${hr.total ?? 0} (${hr.attendanceRate ?? 0}%)</div></div>
        <div class="card"><div class="card-label">Ogohlantirishlar</div><div class="card-value">${(alerts.iot ?? 0) + (alerts.minStock ?? 0)} ta</div></div>
      </div>
      <h2>AI Xulosa</h2>
      <div class="summary-box">${aiData?.summary || "Ma'lumot mavjud emas."}</div>
      <h2>AI Tavsiyalar</h2>
      ${(orders.overdue||0)>0?`<div class="rec"><span class="badge badge-critical">Kritik</span><span>Kechikkan buyurtmalarni darhol ko'rib chiqing va mijozlarga xabar bering.</span></div>`:''}
      ${((alerts.iot||0)+(alerts.minStock||0))>0?`<div class="rec"><span class="badge badge-high">Yuqori</span><span>IoT va ombor ogohlantirishlariga e'tibor bering — ${(alerts.iot||0)+(alerts.minStock||0)} ta faol signal.</span></div>`:''}
      <div class="rec"><span class="badge badge-medium">O'rta</span><span>OEE ko'rsatkichlarini tahlil qilib, past OEE li stanoqlarni optimallashtirish choralarini ko'ring.</span></div>
      <div class="footer">Ushbu hujjat Europrint ERP tizimi tomonidan avtomatik yaratilgan. Sana: ${date}</div>
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

export default function DirectorExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "summary");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

    const meta = tabMeta[activeTab] || tabMeta["summary"];

  const { data: dashboardData, isLoading: dashLoading, refetch: refetchDash } = useQuery<DirectorDashboard>({
    queryKey: ["/api/director/dashboard"],
  });
  const { data: aiData, isLoading: aiLoading, refetch: refetchAi } = useQuery<AiSummaryData>({
    queryKey: ["/api/director/ai-summary"],
  });
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery<{ alerts?: DirectorAlert[] }>({
    queryKey: ["/api/director/alerts"],
  });
  const { data: prodData, isLoading: prodLoading } = useQuery<ProdData>({
    queryKey: ["/api/director/production"],
    enabled: activeTab === "production",
  });
  const { data: hrData, isLoading: hrLoading } = useQuery<HrData>({
    queryKey: ["/api/director/hr"],
    enabled: activeTab === "hr",
  });
  const { data: finData, isLoading: finLoading } = useQuery<FinData>({
    queryKey: ["/api/director/finance"],
    enabled: activeTab === "finance",
  });
  const { data: kpiData } = useQuery<KpiData>({
    queryKey: ["/api/director/kpis"],
    enabled: activeTab === "kpis",
  });

  const alerts: DirectorAlert[] = alertsData?.alerts || [];
  const criticalAlerts = (Array.isArray(alerts) ? alerts : []).filter(a => a.severity === "critical");
  const highAlerts = (Array.isArray(alerts) ? alerts : []).filter(a => a.severity === "high");

  const kpiList = [
    { name: "Savdo hajmi", value: dashboardData ? `${(dashboardData.orders?.month || 0)} ta` : "...", target: "100 ta", pct: dashboardData ? Math.min(Math.round((dashboardData.orders?.month || 0)), 100) : 0, trend: "up" },
    { name: "Buyurtma bajarish", value: dashboardData ? `${Math.round((dashboardData.orders?.completed || 0) / Math.max(dashboardData.orders?.month || 1, 1) * 100)}%` : "...", target: "95%", pct: dashboardData ? Math.round((dashboardData.orders?.completed || 0) / Math.max(dashboardData.orders?.month || 1, 1) * 100) : 0, trend: "up" },
    { name: "OEE o'rtacha", value: dashboardData?.production?.oee ? `${dashboardData.production.oee}%` : "Ma'lumot yo'q", target: "85%", pct: dashboardData?.production?.oee || 0, trend: "down" },
    { name: "Kechikkan buyurtmalar", value: dashboardData ? `${dashboardData.orders?.overdue || 0} ta` : "...", target: "0 ta", pct: dashboardData?.orders?.overdue === 0 ? 100 : 0, trend: (dashboardData?.orders?.overdue || 0) === 0 ? "up" : "down" },
    { name: "Davomad", value: dashboardData ? `${dashboardData.hr?.attendanceRate || 0}%` : "...", target: "97%", pct: dashboardData?.hr?.attendanceRate || 0, trend: "up" },
    { name: "IoT signallar", value: dashboardData ? `${dashboardData.alerts?.iot || 0} ta` : "...", target: "0", pct: dashboardData?.alerts?.iot === 0 ? 100 : 0, trend: (dashboardData?.alerts?.iot || 0) === 0 ? "up" : "down" },
  ];

  return (
    <div className="flex flex-col h-full bg-surface min-h-screen">
      <div className="border-b border-surface-container px-6 py-4 flex items-center justify-between bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Director <span className="font-bold text-primary">Extended</span>
          </h1>
          {criticalAlerts.length > 0 && (
            <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              <ShieldAlert className="h-3 w-3 mr-1" />{criticalAlerts.length} kritik
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchDash(); refetchAi(); refetchAlerts(); }} data-testid="button-refresh-all" className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6 space-y-6">

          {/* ===================== AI XULOSA ===================== */}
          <TabsContent value="summary" className="mt-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">AI Kunlik Xulosa — {new Date().toLocaleDateString("uz-UZ")}</h2>
              <Button variant="outline" size="sm" onClick={() => exportDirectorSummaryToPDF(aiData, dashboardData)} data-testid="button-export-summary" className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none">
                <Download className="h-3.5 w-3.5 mr-1.5" />PDF
              </Button>
            </div>

            {/* Dashboard stats */}
            {dashLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {([...Array(6)]).map((_, i) => <div key={`k-${i}`} className="h-24 bg-surface-container-lowest animate-pulse rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={Package} label="Oylik buyurtmalar" value={dashboardData?.orders?.month ?? 0} sub={`Bajarildi: ${dashboardData?.orders?.completed ?? 0}`} color="text-primary" />
                <StatCard icon={Factory} label="Ishlab chiqarishda" value={dashboardData?.orders?.inProduction ?? 0} sub="Faol jarayon" color="text-primary" />
                <StatCard icon={AlertTriangle} label="Kechikkan" value={dashboardData?.orders?.overdue ?? 0} sub="Buyurtmalar" color={(dashboardData?.orders?.overdue ?? 0) > 0 ? "text-red-600" : "text-green-600"} />
                <StatCard icon={Zap} label="OEE o'rtacha" value={dashboardData?.production?.oee ? `${dashboardData.production.oee}%` : "—"} sub="Bugungi" color="text-primary" />
                <StatCard icon={Users} label="Davomad" value={`${dashboardData?.hr?.present ?? 0}/${dashboardData?.hr?.total ?? 0}`} sub={`${dashboardData?.hr?.attendanceRate ?? 0}%`} color="text-primary" />
                <StatCard icon={ShieldAlert} label="Ogohlantirishlar" value={(dashboardData?.alerts?.iot ?? 0) + (dashboardData?.alerts?.minStock ?? 0)} sub="IoT + Ombor" color={((dashboardData?.alerts?.iot ?? 0) + (dashboardData?.alerts?.minStock ?? 0)) > 0 ? "text-red-600" : "text-green-600"} />
              </div>
            )}

            {/* AI Xulosa matni */}
            <div className="bg-gradient-to-br from-primary to-primary-dim rounded-xl p-8 text-white ">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/20 flex items-center justify-center shrink-0">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm font-bold uppercase tracking-wider text-white/80">Bugungi holat xulosasi (AI tahlili)</div>
                    {aiLoading ? (
                      <div className="h-20 animate-pulse bg-surface-container-lowest/10 rounded-lg" />
                    ) : (
                      <p className="text-xl font-medium leading-relaxed">
                        {aiData?.summary || "Ma'lumot yuklanmoqda..."}
                      </p>
                    )}
                    {aiData?.stats && (
                      <div className="flex gap-2 flex-wrap mt-4">
                        {aiData.stats.oee && <Badge className="bg-surface-container-lowest/20 text-white border-none rounded-full px-3">OEE: {aiData.stats.oee}%</Badge>}
                        <Badge className="bg-surface-container-lowest/20 text-white border-none rounded-full px-3">Buyurtmalar: {aiData.stats.totalOrders}</Badge>
                        {(aiData.stats.overdueOrders ?? 0) > 0 && <Badge className="bg-red-500 text-white border-none rounded-full px-3">{aiData.stats.overdueOrders} ta kechikkan</Badge>}
                        <Badge className="bg-surface-container-lowest/20 text-white border-none rounded-full px-3">Davomad: {aiData.stats.attendance?.rate}%</Badge>
                      </div>
                    )}
                  </div>
                </div>
            </div>

            {/* AI Tavsiyalar */}
            <div className="bg-surface-container-lowest rounded-xl p-6">
              <h3 className="text-lg font-bold text-on-surface mb-4">AI Tavsiyalar</h3>
              <div className="space-y-3">
                {([
                  { pri: "Kritik", text: "Kechikkan buyurtmalarni darhol ko'rib chiqing va mijozlarga xabar bering.", show: (dashboardData?.orders?.overdue || 0) > 0 },
                  { pri: "Yuqori", text: `IoT va ombor ogohlantirishlariga e'tibor bering — ${(dashboardData?.alerts?.iot || 0) + (dashboardData?.alerts?.minStock || 0)} ta faol signal.`, show: ((dashboardData?.alerts?.iot || 0) + (dashboardData?.alerts?.minStock || 0)) > 0 },
                  { pri: "O'rta", text: "OEE ko'rsatkichlarini tahlil qilib, past OEE li stanoqlarni optimallashtirish choralarini ko'ring.", show: true },
                  { pri: "Past", text: "Har oylik maosh va KPI ballarini yangilash vaqti. HR ga ko'rsatma bering.", show: new Date().getDate() >= 25 },
                ]).filter(r => r.show).map((r, i) => (
                  <div key={`k-${i}`} className="flex items-start gap-3 p-4 rounded-lg bg-surface border-none transition-colors hover:bg-surface-container-low">
                    <Badge className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      r.pri === "Kritik" ? "bg-red-100 text-red-800" :
                      r.pri === "Yuqori" ? "bg-amber-100 text-amber-800" :
                      "bg-primary-container text-on-primary-container"
                    )}>{r.pri}</Badge>
                    <p className="text-sm text-on-surface">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ===================== MUAMMOLAR ===================== */}
          <TabsContent value="problems" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Muammoli Nuqtalar va Ogohlantirishlar</h2>
              <Button variant="outline" size="sm" onClick={() => refetchAlerts()} data-testid="button-refresh-alerts">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
              </Button>
            </div>

            {alertsLoading ? (
              <div className="space-y-3">{([...Array(3)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-4 h-20 animate-pulse bg-muted/30 rounded" /></Card>)}</div>
            ) : alerts.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">Hozircha hech qanday muammo yo'q</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(alerts) ? alerts : []).map((a: DirectorAlert, i: number) => (
                  <Card key={`k-${i}`} className={a.severity === "critical" ? "border-red-300" : a.severity === "high" ? "border-orange-300" : ""} data-testid={`card-alert-${i}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${a.severity === "critical" ? "text-red-600" : a.severity === "high" ? "text-orange-500" : "text-yellow-500"}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">{a.module}</Badge>
                            <Badge variant={a.severity === "critical" ? "destructive" : a.severity === "high" ? "secondary" : "outline"} className="text-xs">{a.severity}</Badge>
                            <span className="text-xs text-muted-foreground">{a.createdAt ? new Date(a.createdAt).toLocaleTimeString("uz-UZ") : ""}</span>
                          </div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                        </div>
                        <Button variant="outline" size="sm" data-testid={`button-resolve-${i}`}>Hal qilish</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===================== ISHLAB CHIQARISH ===================== */}
          <TabsContent value="production" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Ishlab Chiqarish Holati</h2>

            {prodLoading ? (
              <div className="grid grid-cols-3 gap-4">{([...Array(3)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-3 h-16 animate-pulse bg-muted/30 rounded" /></Card>)}</div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(prodData?.orderBreakdown || {}).map(([status, cnt]: [string, number]) => (
                  <StatCard key={status} icon={Package} label={status} value={cnt} color={status === "completed" ? "text-green-600" : status === "production" ? "text-blue-600" : "text-orange-600"} />
                ))}
                {!prodData?.orderBreakdown && <p className="text-muted-foreground col-span-4 text-center py-4">Buyurtmalar yo'q</p>}
              </div>
            )}

            {/* OEE */}
            {prodData?.oeeToday && (
              <Card>
                <CardHeader><CardTitle className="text-base">OEE Bugun</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {([
                      { l: "O'rtacha OEE", v: prodData.oeeToday.avg ?? "—" },
                      { l: "Minimum", v: prodData.oeeToday.min ?? "—" },
                      { l: "Maksimum", v: prodData.oeeToday.max ?? "—" },
                      { l: "Snapshot soni", v: prodData.oeeToday.snapshots?.length ?? 0 },
                    ]).map(s => (
                      <div key={s.l} className="text-center p-3 bg-muted/30 rounded-md">
                        <div className="text-xl font-bold">{s.v}{typeof s.v === "string" && s.v !== "—" ? "%" : ""}</div>
                        <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Kechikkan buyurtmalar */}
            {(prodData?.overdueOrders?.length || 0) > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base text-red-600">Kechikkan Buyurtmalar</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Papka #</TableHead><TableHead>Status</TableHead><TableHead>Muddati</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {prodData?.overdueOrders?.map((o: ProductionOrder) => (
                        <TableRow key={o.id} data-testid={`row-overdue-${o.id}`}>
                          <TableCell className="font-medium">{o.papkaNo}</TableCell>
                          <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                          <TableCell className="text-red-600">{o.tayyorBolishSanasi}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Sessiyalar */}
            {(prodData?.sessionsToday?.length || 0) > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Bugungi Sessiyalar</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Stanoq</TableHead><TableHead>Status</TableHead><TableHead>Maqsad</TableHead><TableHead>Bajarildi</TableHead><TableHead>Brak</TableHead><TableHead>OEE</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {prodData?.sessionsToday?.map((s: ProductionSession) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.equipmentId}</TableCell>
                          <TableCell><Badge variant={s.status === "running" ? "default" : "outline"}>{s.status}</Badge></TableCell>
                          <TableCell>{s.targetQty}</TableCell>
                          <TableCell>{s.producedQty}</TableCell>
                          <TableCell className="text-red-600">{s.defectQty}</TableCell>
                          <TableCell>{s.oee ? `${Number(s.oee).toFixed(1)}%` : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===================== HR ===================== */}
          <TabsContent value="hr" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">HR va Davomad Holati</h2>

            {hrLoading ? (
              <div className="grid grid-cols-3 gap-4">{([...Array(6)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-3 h-16 animate-pulse bg-muted/30 rounded" /></Card>)}</div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Jami xodimlar" value={hrData?.employees?.total ?? 0} sub="Ro'yxatdagi" color="text-primary" />
                  <StatCard icon={CheckCircle2} label="Keldi" value={hrData?.attendance?.present ?? 0} sub={`${hrData?.attendance?.attendanceRate ?? 0}%`} color="text-green-600" />
                  <StatCard icon={XCircle} label="Kelmadi" value={hrData?.attendance?.absent ?? 0} sub="Bugun" color="text-red-600" />
                  <StatCard icon={Clock} label="Kechikkan" value={hrData?.attendance?.late ?? 0} sub="Bugun" color="text-orange-600" />
                </div>

                {(hrData?.byDepartment?.length || 0) > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Bo'limlar bo'yicha</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Bo'lim</TableHead><TableHead>Xodimlar soni</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {hrData?.byDepartment?.map((d: HRDepartment) => (
                            <TableRow key={d.department} data-testid={`row-dept-${d.department}`}>
                              <TableCell className="font-medium">{d.department}</TableCell>
                              <TableCell>{d.count} nafar</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ===================== MOLIYA ===================== */}
          <TabsContent value="finance" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Moliya Holati</h2>

            {finLoading ? (
              <div className="grid grid-cols-3 gap-4">{([...Array(3)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-3 h-16 animate-pulse bg-muted/30 rounded" /></Card>)}</div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <StatCard icon={DollarSign} label="Jami debitorlik" value={`${(finData?.totalReceivable || 0).toLocaleString()} so'm`} sub="To'lanmagan" color="text-orange-600" />
                <StatCard icon={AlertTriangle} label="Muddati o'tgan" value={`${(finData?.overdueAmount || 0).toLocaleString()} so'm`} sub="Overdue" color="text-red-600" />
                <StatCard icon={Clock} label="Kutilayotgan" value={`${(finData?.pendingAmount || 0).toLocaleString()} so'm`} sub="Pending" color="text-yellow-600" />
              </div>
            )}

            {finData?.invoices && (
              <Card>
                <CardHeader><CardTitle className="text-base">Hisob-fakturalar holati</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Soni</TableHead><TableHead>Summa</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {Object.entries(finData.invoices).map(([status, data]: [string, { count?: number; amount?: number }]) => (
                        <TableRow key={status} data-testid={`row-invoice-${status}`}>
                          <TableCell><Badge variant={status === "overdue" ? "destructive" : status === "paid" ? "default" : "outline"}>{status}</Badge></TableCell>
                          <TableCell>{data.count} ta</TableCell>
                          <TableCell>{data.amount?.toLocaleString() || 0} so'm</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===================== KPI MONITOR ===================== */}
          <TabsContent value="kpis" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">KPI Monitoringi</h2>
            <Card>
              <CardContent className="pt-4 space-y-3">
                {(Array.isArray(kpiList) ? kpiList : []).map(kpi => (
                  <div key={kpi.name} className="flex items-center gap-3" data-testid={`row-kpi-${kpi.name.slice(0, 8)}`}>
                    {kpi.trend === "up"
                      ? <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
                      : <TrendingDown className="h-4 w-4 text-red-600 shrink-0" />}
                    <span className="text-sm w-52 shrink-0">{kpi.name}</span>
                    <div className="flex-1 h-2 bg-muted rounded">
                      <div className={`h-2 rounded ${kpi.pct >= 90 ? "bg-green-500" : kpi.pct >= 70 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(kpi.pct, 100)}%` }} />
                    </div>
                    <span className="text-sm font-bold w-32 text-right">{kpi.value}</span>
                    <span className="text-xs text-muted-foreground w-24 text-right">Maqsad: {kpi.target}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* OEE by equipment from kpiData */}
            {(kpiData?.oeeByEquipment?.length ?? 0) > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">OEE Stanoqlar bo'yicha</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Stanoq</TableHead><TableHead>OEE</TableHead><TableHead>Mavjudlik</TableHead><TableHead>Unumdorlik</TableHead><TableHead>Sifat</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {kpiData?.oeeByEquipment?.map((o: KPIEquipment) => (
                        <TableRow key={o.equipmentId} data-testid={`row-oee-${o.equipmentId}`}>
                          <TableCell className="font-medium">{o.equipmentId}</TableCell>
                          <TableCell>
                            <Badge variant={Number(o.avgOee) >= 85 ? "default" : Number(o.avgOee) >= 70 ? "secondary" : "destructive"}>
                              {o.avgOee}%
                            </Badge>
                          </TableCell>
                          <TableCell>{o.avgAvailability}%</TableCell>
                          <TableCell>{o.avgPerformance}%</TableCell>
                          <TableCell>{o.avgQuality}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
