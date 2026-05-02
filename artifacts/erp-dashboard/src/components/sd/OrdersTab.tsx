import { SdOrdersData } from "./sd-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, BarChart2, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { KpiCard, fmtMoney, fmtDate, fmtNum } from "./helpers";

export function OrdersTab({ orders }: { orders: SdOrdersData }) {
  if (!orders) return <div className="text-muted-foreground text-sm py-8 text-center">Buyurtma ma'lumotlari yo'q</div>;

  const trend = (orders.monthlyTrend || []).map((r) => ({
    month: String(r.month || "").slice(5),
    summa: Math.round(fmtNum(r.total_amount) / 1_000_000),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={FileText} label="Jami buyurtmalar" value={String(orders.totalCount || 0)} />
        <KpiCard icon={DollarSign} label="Jami summa" value={fmtMoney(orders.totalAmount)} />
        <KpiCard icon={BarChart2} label="O'rtacha buyurtma" value={fmtMoney(orders.averageOrderAmount)} />
        <KpiCard icon={Calendar} label="Mijozlik davri" value={`${orders.monthsAsCustomer || 0} oy`}
          sub={orders.firstOrderDate ? `${fmtDate(orders.firstOrderDate)} dan` : undefined} />
      </div>

      {trend.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Oylik trend (mln UZS)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} M UZS`]} />
                <Bar dataKey="summa" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {(orders.recentOrders || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">So'nggi buyurtmalar</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    {(["Sana", "Buyurtma №", "Summa", "Holat"]).map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(orders.recentOrders || []).map((o) => (
                    <tr key={o.id} className="border-b hover-elevate">
                      <td className="px-4 py-2">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-2 font-mono text-xs">{o.order_number || String(o.id || "").slice(0, 8)}</td>
                      <td className="px-4 py-2">{fmtMoney(o.total_amount)}</td>
                      <td className="px-4 py-2">
                        <Badge variant={["completed", "delivered"].includes(o.status) ? "default" : o.status === "cancelled" ? "destructive" : "secondary"}>
                          {o.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
