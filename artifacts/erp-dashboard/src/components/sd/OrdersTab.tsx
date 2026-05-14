/**
 * @module OrdersTab
 * @description React UI component.
 */

import { SdOrdersData } from "./sd-types";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, BarChart2, Calendar, ShoppingCart } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { KpiCard, fmtMoney, fmtDate, fmtNum } from "./helpers";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  completed: { label: "Bajarildi", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" },
  delivered: { label: "Yetkazildi", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" },
  cancelled: { label: "Bekor", cls: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200" },
  pending: { label: "Kutilmoqda", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" },
  processing: { label: "Jarayonda", cls: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200" },
  draft: { label: "Qoralama", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

export function OrdersTab({ orders }: { orders: SdOrdersData }) {
  if (!orders) return <div className="text-muted-foreground text-sm py-8 text-center">Buyurtma ma'lumotlari yo'q</div>;

  // Handle both direct arrays and wrapped objects
  const totalCount = orders.totalCount ?? (Array.isArray(orders) ? (orders as unknown[]).length : 0);
  const totalAmount = orders.totalAmount ?? orders.totalRevenue ?? 0;
  const avgAmount = orders.averageOrderAmount ?? orders.avgOrderValue ?? (totalCount > 0 ? Number(totalAmount) / totalCount : 0);
  const monthsAs = orders.monthsAsCustomer ?? 0;
  const recentOrders = orders.recentOrders || (Array.isArray(orders) ? orders : []);

  const trend = (orders.monthlyTrend || []).map((r) => ({
    month: String(r.month || "").slice(5),
    summa: Math.round(fmtNum(r.total_amount) / 1_000_000),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={ShoppingCart} label="Jami buyurtmalar" value={String(totalCount)}
          gradient="" />
        <KpiCard icon={DollarSign} label="Jami summa" value={fmtMoney(totalAmount)}
          gradient="" />
        <KpiCard icon={BarChart2} label="O'rtacha buyurtma" value={fmtMoney(avgAmount)}
          gradient="" />
        <KpiCard icon={Calendar} label="Mijozlik davri" value={`${monthsAs} oy`}
          sub={orders.firstOrderDate ? `${fmtDate(orders.firstOrderDate)} dan` : undefined}
          gradient="" />
      </div>

      {trend.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">Oylik trend (mln UZS)</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} M UZS`]} />
                <Bar dataKey="summa" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {recentOrders.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">So'nggi buyurtmalar</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {["Sana", "Buyurtma №", "Summa", "Holat"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const st = STATUS_MAP[o.status] || { label: o.status, cls: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 text-xs">{fmtDate(o.created_at || o.createdAt)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {o.order_number || o.orderNumber || String(o.id || "").slice(0, 8)}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{fmtMoney(o.total_amount || o.totalAmount)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
