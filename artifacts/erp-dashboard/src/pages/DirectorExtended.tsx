/**
 * @module DirectorExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import {
  AlertTriangle, BarChart3, Brain, DollarSign,
  Factory, RefreshCw, ShieldAlert, Users,
  type LucideIcon,
} from "lucide-react";
import type {
  AiSummaryData, DirectorAlert, DirectorDashboard,
  FinData, HrData, KpiData, KpiListItem, ProdData,
} from "./DirectorExtendedTypes";
import { URL_TAB_MAP, escHtml } from "./DirectorExtendedTypes";
import { EPPageHeader } from "@/components/ep";
import {
  AiSummaryTab, FinanceTab, HrTab, KpisTab,
  ProblemsTab, ProductionTab,
} from "./DirectorExtendedSections";
import { useTranslation } from "@/lib/i18n";

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  summary: { title: "AI Xulosa", icon: Brain },
  problems: { title: "Muammolar", icon: AlertTriangle },
  production: { title: "Ishlab Chiqarish", icon: Factory },
  hr: { title: "HR / Davomad", icon: Users },
  finance: { title: "Moliya", icon: DollarSign },
  kpis: { title: "KPI Monitor", icon: BarChart3 },
};

function exportDirectorSummaryToPDF(
  aiData: AiSummaryData | undefined,
  dashboardData: DirectorDashboard | undefined
) {
  const date = new Date().toLocaleDateString("uz-UZ");
  const win = window.open("", "_blank");
  if (!win) return;
  const stats = aiData?.stats ?? {};
  const orders = dashboardData?.orders ?? {};
  const alerts = dashboardData?.alerts ?? {};
  const hr = dashboardData?.hr ?? {};
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Direktor Kunlik Xulosa - ${escHtml(date)}</title>
    <style>body{font-family:Arial,sans-serif;margin:30px;color:#222}
    h1{font-size:20px;margin-bottom:4px}h2{font-size:15px;margin-top:24px;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px}
    .subtitle{color:#666;font-size:12px;margin-bottom:20px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
    .card{border:1px solid #ddd;border-radius:6px;padding:12px}.card-label{font-size:11px;color:#666;margin-bottom:4px}
    .card-value{font-size:20px;font-weight:bold}.summary-box{background:#f0f4ff;border:1px solid #c7d2fe;border-radius:6px;padding:14px;margin-bottom:16px;font-size:13px;line-height:1.6}
    .rec{display:flex;gap:10px;align-items:flex-start;padding:8px;background:#f9f9f9;border-radius:4px;margin-bottom:6px;font-size:12px}
    .badge{padding:2px 8px;border-radius:12px;font-size:10px;font-weight:bold;white-space:nowrap}
    .badge-critical{background:#fef2f2;color:#dc2626}.badge-high{background:#fff7ed;color:#ea580c}.badge-medium{background:#f0fdf4;color:#16a34a}
    .footer{margin-top:30px;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:10px}
    @media print{body{margin:15px}}</style></head><body>
    <h1>{t("europrintDirektorKunlikXulosa")}</h1>
    <div class="subtitle">Sana: ${escHtml(date)} | Yaratilgan: ${escHtml(new Date().toLocaleTimeString("uz-UZ"))}</div>
    <h2>{t("asosiyKorsatkichlar")}</h2>
    <div class="grid">
      <div class="card"><div class="card-label">{t("oylikBuyurtmalar")}</div><div class="card-value">${escHtml(orders.month ?? 0)} ta</div></div>
      <div class="card"><div class="card-label">{t("ishlabChiqarishda")}</div><div class="card-value">${escHtml(orders.inProduction ?? 0)} ta</div></div>
      <div class="card"><div class="card-label">{t("kechikkan")}</div><div class="card-value" style="color:${(orders.overdue ?? 0) > 0 ? "#dc2626" : "#16a34a"}">${escHtml(orders.overdue ?? 0)} ta</div></div>
      <div class="card"><div class="card-label">{t("oeeOrtacha")}</div><div class="card-value">${stats.oee ? escHtml(stats.oee) + "%" : "—"}</div></div>
      <div class="card"><div class="card-label">{t("davomad")}</div><div class="card-value">${escHtml(hr.present ?? 0)}/${escHtml(hr.total ?? 0)} (${escHtml(hr.attendanceRate ?? 0)}%)</div></div>
      <div class="card"><div class="card-label">{t("ogohlantirishlar")}</div><div class="card-value">${escHtml((alerts.iot ?? 0) + (alerts.minStock ?? 0))} ta</div></div>
    </div>
    <h2>{t("aiXulosa")}</h2>
    <div class="summary-box">${escHtml(aiData?.summary || "Ma'lumot mavjud emas.")}</div>
    <h2>{t("aiTavsiyalar")}</h2>
    ${(orders.overdue || 0) > 0 ? `<div class="rec"><span class="badge badge-critical">{t("kritik")}</span><span>{t("kechikkanBuyurtmalarniDarholKoribChiqing")}</span></div>` : ""}
    ${((alerts.iot || 0) + (alerts.minStock || 0)) > 0 ? `<div class="rec"><span class="badge badge-high">{t("high")}</span><span>IoT va ombor ogohlantirishlariga e'tibor bering — ${escHtml((alerts.iot || 0) + (alerts.minStock || 0))} ta faol signal.</span></div>` : ""}
    <div class="rec"><span class="badge badge-medium">{t("medium")}</span><span>{t("oeeKorsatkichlariniTahlilQilibPast")}</span></div>
    <div class="footer">Ushbu hujjat Europrint ERP tizimi tomonidan avtomatik yaratilgan. Sana: ${escHtml(date)}</div>
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

export default function DirectorExtended() {
  const { t } = useTranslation('director');
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

  const alerts: DirectorAlert[] = Array.isArray(alertsData?.alerts) ? alertsData.alerts : [];
  const criticalAlerts = alerts.filter(a => a.severity === "critical");

  const kpiList: KpiListItem[] = [
    { name: "Savdo hajmi", value: dashboardData ? `${dashboardData.orders?.month || 0} ta` : "...", target: "100 ta", pct: dashboardData ? Math.min(Math.round(dashboardData.orders?.month || 0), 100) : 0, trend: "up" },
    { name: "Buyurtma bajarish", value: dashboardData ? `${Math.round((dashboardData.orders?.completed || 0) / Math.max(dashboardData.orders?.month || 1, 1) * 100)}%` : "...", target: "95%", pct: dashboardData ? Math.round((dashboardData.orders?.completed || 0) / Math.max(dashboardData.orders?.month || 1, 1) * 100) : 0, trend: "up" },
    { name: "OEE o'rtacha", value: dashboardData?.production?.oee ? `${dashboardData.production.oee}%` : "Ma'lumot yo'q", target: "85%", pct: dashboardData?.production?.oee || 0, trend: "down" },
    { name: "Kechikkan buyurtmalar", value: dashboardData ? `${dashboardData.orders?.overdue || 0} ta` : "...", target: "0 ta", pct: dashboardData?.orders?.overdue === 0 ? 100 : 0, trend: (dashboardData?.orders?.overdue || 0) === 0 ? "up" : "down" },
    { name: "Davomad", value: dashboardData ? `${dashboardData.hr?.attendanceRate || 0}%` : "...", target: "97%", pct: dashboardData?.hr?.attendanceRate || 0, trend: "up" },
    { name: "IoT signallar", value: dashboardData ? `${dashboardData.alerts?.iot || 0} ta` : "...", target: "0", pct: dashboardData?.alerts?.iot === 0 ? 100 : 0, trend: (dashboardData?.alerts?.iot || 0) === 0 ? "up" : "down" },
  ];

  return (
    <div className="flex flex-col">
      <div className="border-b border-surface-container px-6 py-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('directorExtended')}</b></>}
        title={t('directorExtended')}
      />
          {criticalAlerts.length > 0 && (
            <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              <ShieldAlert className="h-3 w-3 mr-1" />{criticalAlerts.length} kritik
            </Badge>
          )}
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => { refetchDash(); refetchAi(); refetchAlerts(); }}
          data-testid="button-refresh-all"
          className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <AiSummaryTab
            dashboardData={dashboardData}
            dashLoading={dashLoading}
            aiData={aiData}
            aiLoading={aiLoading}
            onExport={() => exportDirectorSummaryToPDF(aiData, dashboardData)}
          />
          <ProblemsTab alerts={alerts} alertsLoading={alertsLoading} onRefresh={refetchAlerts} />
          <ProductionTab prodData={prodData} prodLoading={prodLoading} />
          <HrTab hrData={hrData} hrLoading={hrLoading} />
          <FinanceTab finData={finData} finLoading={finLoading} />
          <KpisTab kpiList={kpiList} kpiData={kpiData} />
        </div>
      </Tabs>
    </div>
  );
}

// suppress unused import for tabMeta icon usage via meta
void meta;
