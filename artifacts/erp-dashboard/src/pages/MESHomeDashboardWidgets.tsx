/**
 * @module MESHomeDashboardWidgets
 * @description Orders/downtime cards, active sessions table, and quick links for MESHomeDashboard.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Factory, AlertTriangle, CheckCircle, Package, Clock,
  ChevronRight, BarChart3, Activity, Timer, TrendingUp,
  ArrowRight, ArrowUpRight, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import type { Session, Downtime, ProductionOrder } from "./MESHomeDashboardTypes";
import { oeeColor, statusInfo, fmt } from "./MESHomeDashboardTypes";
import { SectionTitle } from "./MESHomeDashboardSections";
import { useTranslation } from '@/lib/i18n';

// ─── Orders + Downtimes row ────────────────────────────────────────────────────

export function MesOrdersAndDowntimes({
  inProgressOrders, downtimes, dtLoad,
}: {
  inProgressOrders: ProductionOrder[];
  downtimes: Downtime[];
  dtLoad: boolean;
}) {
  const { t } = useTranslation("common");
  const recentDowntimes = (Array.isArray(downtimes) ? [...downtimes] : [])
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--ep-purple)]" />
              {t("faolBuyurtmalar")}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
              <Link href="/production/orders">{t("Barchasi")}<ChevronRight className="w-3 h-3 ml-0.5" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inProgressOrders.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              {t("hozirFaolBuyurtmaYoq")}
            </div>
          ) : (
            <div className="space-y-2">
              {inProgressOrders?.slice(0, 5).map(o => {
                const pct = o.plannedQuantity > 0 ? Math.round((o.confirmedQuantity / o.plannedQuantity) * 100) : 0;
                return (
                  <div key={o.id} className="flex items-center gap-3" data-testid={`row-order-${o.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-foreground truncate">{o.orderNumber}</p>
                        <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      {o.productName && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{o.productName}</p>}
                    </div>
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                      <Link href={`/production/orders/${o.id}`}><ArrowUpRight className="w-3.5 h-3.5" /></Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--ep-yellow)]" />
              {t("songgiToxtashlar")}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
              <Link href="/mes/downtimes">{t("Barchasi")}<ChevronRight className="w-3 h-3 ml-0.5" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dtLoad ? (
            <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
          ) : recentDowntimes.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              {t("toxtashQaydEtilmagan")}
            </div>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(recentDowntimes) ? recentDowntimes : []).map(d => {
                const mins = d.durationSeconds ? Math.round(d.durationSeconds / 60) : null;
                return (
                  <div key={d.id} className="flex items-start justify-between gap-2 text-sm" data-testid={`row-downtime-${d.id}`}>
                    <div className="flex items-start gap-2 min-w-0">
                      <span className={cn("mt-0.5 w-2 h-2 rounded-full shrink-0", d.isPlanned ? "bg-blue-400" : "bg-red-500")} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{d.reasonDescription || d.reasonCode}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {d.isPlanned ? t("rejalashtirilganHolat") : t("rejalashmaganHolat")}
                          {mins !== null && ` · ${mins} ${t("daqQisqa")}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(d.startedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Active Sessions Table ─────────────────────────────────────────────────────

export function MesActiveSessionsTable({ activeSessions, sessLoad }: { activeSessions: Session[]; sessLoad: boolean }) {
  const { t } = useTranslation("common");
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={Activity} title={t("faolSessiyalar")} sub={t("ishlayotganXodimlar")} />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mes/workers">{t("tayinlashlar")}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
      </div>
      {sessLoad ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : activeSessions.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-muted-foreground">{t("faolSessiyaYoq")}</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">{t("Uskuna")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">{t("Buyurtma")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">{t("status28")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right">{t("ishVaqti")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-muted-foreground text-right">OEE</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(activeSessions) ? activeSessions : []).map((s, i) => {
                const st = statusInfo(s.status);
                const oeeRaw = s.oee != null ? Number(s.oee) : null;
                // oee stored as 0-100 in DB (e.g. 79.9); convert to fraction for oeeColor helper
                const oeeFraction = oeeRaw != null ? (oeeRaw > 1 ? oeeRaw / 100 : oeeRaw) : null;
                const oeeDisplay = oeeRaw != null ? Math.round(oeeRaw > 1 ? oeeRaw : oeeRaw * 100) : null;
                return (
                  <tr key={s.id} className={cn("border-t", i % 2 === 0 ? "" : "bg-muted/20")} data-testid={`row-session-${s.id}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", st.dot)} />
                        <span className="font-medium text-foreground">{s.equipment_name || s.equipment_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{s.session_number || "—"}</td>
                    <td className="px-4 py-2.5"><span className={cn("text-xs font-medium", st.color)}>{st.label}</span></td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Timer className="w-3 h-3" />
                        {fmt(s.running_time_seconds)}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {oeeDisplay !== null && oeeFraction !== null
                        ? <span className={oeeColor(oeeFraction)}>{oeeDisplay}%</span>
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Quick Links ───────────────────────────────────────────────────────────────

export function MesQuickLinks() {
  const { t } = useTranslation("common");
  const links = [
    { label: t("ishMarkazlari"), icon: Factory,      href: "/mes/work-centers",  color: "text-[var(--ep-blue)]" },
    { label: t("qbMahsulotlar"), icon: Package,       href: "/mes/products",       color: "text-[var(--ep-purple)]" },
    { label: t("qbBuyurtmalar"), icon: BarChart3,      href: "/production/orders",  color: "text-[var(--ep-green)]" },
    { label: t("toxtashlar"),    icon: AlertTriangle,  href: "/mes/downtimes",      color: "text-[var(--ep-yellow)]" },
    { label: t("qbXodimlar"),    icon: Users,          href: "/mes/workers",        color: "text-pink-500" },
    { label: t("oeeMonitor"),    icon: TrendingUp,     href: "/mes/oee-monitor",    color: "text-primary" },
  ];

  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("tezkorHavolalar")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Array.isArray(links) ? links : []).map(link => (
          <Link key={link.href} href={link.href}>
            <div className="rounded-xl border p-4 flex flex-col items-center gap-2 text-center hover-elevate cursor-pointer" data-testid={`link-quick-${link.href}`}>
              <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
                <link.icon className={cn("w-4 h-4", link.color)} />
              </div>
              <span className="text-xs font-medium text-foreground">{link.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
