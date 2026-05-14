/**
 * @module DirectorExtendedDialogs
 * @description StatCard and AI summary tab components for DirectorExtended.
 */

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle, Brain, Download, Factory,
  Package, ShieldAlert, Users, Zap,
  type LucideIcon,
} from "lucide-react";
import type { AiSummaryData, DirectorDashboard } from "./DirectorExtendedTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-card rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${color || "text-primary"}`} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-4xl font-bold tracking-tight text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-2">{sub}</div>}
    </div>
  );
}

export function AiSummaryTab({
  dashboardData,
  dashLoading,
  aiData,
  aiLoading,
  onExport,
}: {
  dashboardData: DirectorDashboard | undefined;
  dashLoading: boolean;
  aiData: AiSummaryData | undefined;
  aiLoading: boolean;
  onExport: () => void;
}) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="summary" className="mt-0 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">AI Kunlik Xulosa — {new Date().toLocaleDateString("uz-UZ")}</h2>
        <Button variant="outline" size="sm" onClick={onExport} data-testid="button-export-summary" className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none">
          <Download className="h-3.5 w-3.5 mr-1.5" />PDF
        </Button>
      </div>

      {dashLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([...Array(6)]).map((_, i) => <div key={`k-${i}`} className="h-24 bg-card animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Package} label={t("oylikBuyurtmalar")} value={dashboardData?.orders?.month ?? 0} sub={`Bajarildi: ${dashboardData?.orders?.completed ?? 0}`} color="text-primary" />
          <StatCard icon={Factory} label={t("ishlabChiqarishda")} value={dashboardData?.orders?.inProduction ?? 0} sub="Faol jarayon" color="text-primary" />
          <StatCard icon={AlertTriangle} label={t("kechikkan")} value={dashboardData?.orders?.overdue ?? 0} sub="Buyurtmalar" color={(dashboardData?.orders?.overdue ?? 0) > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"} />
          <StatCard icon={Zap} label={t("oeeOrtacha")} value={dashboardData?.production?.oee ? `${dashboardData.production.oee}%` : "—"} sub="Bugungi" color="text-primary" />
          <StatCard icon={Users} label={t("davomad")} value={`${dashboardData?.hr?.present ?? 0}/${dashboardData?.hr?.total ?? 0}`} sub={`${dashboardData?.hr?.attendanceRate ?? 0}%`} color="text-primary" />
          <StatCard icon={ShieldAlert} label={t("ogohlantirishlar")} value={(dashboardData?.alerts?.iot ?? 0) + (dashboardData?.alerts?.minStock ?? 0)} sub="IoT + Ombor" color={((dashboardData?.alerts?.iot ?? 0) + (dashboardData?.alerts?.minStock ?? 0)) > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"} />
        </div>
      )}

      <div className="bg-primary rounded-xl p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-card/20 flex items-center justify-center shrink-0">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-3">
            <div className="text-sm font-bold uppercase tracking-wider text-white/80">Bugungi holat xulosasi (AI tahlili)</div>
            {aiLoading ? (
              <div className="h-20 animate-pulse bg-card/10 rounded-lg" />
            ) : (
              <p className="text-xl font-medium leading-relaxed">{aiData?.summary || "Ma'lumot yuklanmoqda..."}</p>
            )}
            {aiData?.stats && (
              <div className="flex gap-2 flex-wrap mt-4">
                {aiData.stats.oee && <Badge className="bg-card/20 text-white border-none rounded-full px-3">OEE: {aiData.stats.oee}%</Badge>}
                <Badge className="bg-card/20 text-white border-none rounded-full px-3">Buyurtmalar: {aiData.stats.totalOrders}</Badge>
                {(aiData.stats.overdueOrders ?? 0) > 0 && <EPStatusPill tone="danger">{aiData.stats.overdueOrders} ta kechikkan</EPStatusPill>}
                <Badge className="bg-card/20 text-white border-none rounded-full px-3">Davomad: {aiData.stats.attendance?.rate}%</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">{t("aiTavsiyalar")}</h3>
        <div className="space-y-3">
          {([
            { pri: "Kritik", text: "Kechikkan buyurtmalarni darhol ko'rib chiqing va mijozlarga xabar bering.", show: (dashboardData?.orders?.overdue || 0) > 0 },
            { pri: "Yuqori", text: `IoT va ombor ogohlantirishlariga e'tibor bering — ${(dashboardData?.alerts?.iot || 0) + (dashboardData?.alerts?.minStock || 0)} ta faol signal.`, show: ((dashboardData?.alerts?.iot || 0) + (dashboardData?.alerts?.minStock || 0)) > 0 },
            { pri: "O'rta", text: "OEE ko'rsatkichlarini tahlil qilib, past OEE li stanoqlarni optimallashtirish choralarini ko'ring.", show: true },
            { pri: "Past", text: "Har oylik maosh va KPI ballarini yangilash vaqti. HR ga ko'rsatma bering.", show: new Date().getDate() >= 25 },
          ]).filter(r => r.show).map((r, i) => (
            <div key={`k-${i}`} className="flex items-start gap-3 p-4 rounded-lg bg-background border-none transition-colors hover:bg-muted/40">
              <Badge className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                r.pri === "Kritik" ? "bg-red-100 text-red-800" :
                r.pri === "Yuqori" ? "bg-amber-100 text-amber-800" :
                "bg-primary/10 text-primary"
              )}>{r.pri}</Badge>
              <p className="text-sm text-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </TabsContent>
  );
}
