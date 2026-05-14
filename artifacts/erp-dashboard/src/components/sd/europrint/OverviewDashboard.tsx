/**
 * @module OverviewDashboard
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, Warehouse, Truck, AlertTriangle, DollarSign, ArrowRight } from "lucide-react";
import { fmt, LEAD_STATUS_COLORS, LEAD_STATUS_LABELS } from "./types";

import { useTranslation } from '@/lib/i18n';
export function OverviewDashboard() {
  const { t } = useTranslation('common');
  const { data: overview, isLoading } = useQuery<Record<string, any>>({
    queryKey: ["/api/sd/dashboard/overview"],
  });

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">{t("Yuklanmoqda...")}</div>;

  const stats = [
    { label: "Yangi buyurtmalar (hafta)", value: overview?.newOrders?.count || 0, sub: fmt(overview?.newOrders?.amount || 0) + " so'm", icon: ShoppingCart, color: "text-[var(--ep-blue)]" },
    { label: "Ishlab chiqarishda", value: overview?.inProduction?.count || 0, sub: fmt(overview?.inProduction?.amount || 0) + " so'm", icon: Package, color: "text-[var(--ep-primary)]" },
    { label: "Omborga keldi", value: overview?.inWarehouse?.count || 0, sub: fmt(overview?.inWarehouse?.amount || 0) + " so'm", icon: Warehouse, color: "text-[var(--ep-cyan)]" },
    { label: "Yetkazilmoqda", value: overview?.delivering?.count || 0, sub: "Yo'lda", icon: Truck, color: "text-[var(--ep-green)]" },
    { label: "Debitorlar", value: fmt(overview?.debitors?.amount || 0), sub: `${overview?.debitors?.count || 0} ta to'lov`, icon: AlertTriangle, color: "text-[var(--ep-red)]" },
    { label: "Oylik tushumlar", value: fmt(overview?.monthlyRevenue || 0), sub: fmt(overview?.monthlyCollected || 0) + " yig'ildi", icon: DollarSign, color: "text-[var(--ep-green)]" },
  ];

  const funnel = overview?.leadFunnel || {};
  const funnelOrder = ["new", "working", "quoted", "negotiating", "won", "lost", "frozen"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(Array.isArray(stats) ? stats : []).map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`mt-0.5 ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-xs font-medium mt-0.5">{s.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t('leadFunnel')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(Array.isArray(funnelOrder) ? funnelOrder : []).map(st => (
            <div key={st} className="flex items-center gap-1.5 text-sm">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${LEAD_STATUS_COLORS[st] || ""}`}>
                {LEAD_STATUS_LABELS[st] || st}
              </span>
              <span className="font-bold">{funnel[st] || 0}</span>
              {st !== "frozen" && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
