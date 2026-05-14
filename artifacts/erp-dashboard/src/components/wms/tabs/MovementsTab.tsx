/**
 * @module MovementsTab
 * @description React UI component.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { fmtQty, fmtDate } from "@/components/wms/helpers";
import { safeArray } from "@/lib/queryClient";
import { KpiCard } from "@/components/wms/tabs/KpiCard";
import type { MovementsData, MaterialBasic, MovementRecord, MonthlyTrendRecord } from "@/components/wms/wms-types";

interface MovementsTabProps {
  movements: MovementsData | null | undefined;
  basic: MaterialBasic;
}

export function MovementsTab({ movements, basic }: MovementsTabProps) {
  const [filter, setFilter] = useState("all");
  if (!movements) return <div className="text-muted-foreground text-sm py-8 text-center">Harakat ma'lumotlari yo'q</div>;

  const recent = safeArray<MovementRecord>(movements.recent).filter(t => filter === "all" || t.transactionType === filter);
  const monthlyData = safeArray<MonthlyTrendRecord>(movements.monthlyTrend).map(m => ({
    month: String(m.month).slice(5), kirim: m.totalIn, chiqim: m.totalOut,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={TrendingUp} label="30 kun kirim" value={fmtQty(movements.last30Days?.totalIn, basic.unitOfMeasure)} color="text-[var(--ep-green)]" />
        <KpiCard icon={TrendingDown} label="30 kun chiqim" value={fmtQty(movements.last30Days?.totalOut, basic.unitOfMeasure)} color="text-[var(--ep-red)]" />
        <KpiCard icon={RefreshCw} label="Aylanma" value={movements.last30Days?.turnoverDays !== null ? `${movements.last30Days?.turnoverDays} kun` : "Noma'lum"} sub="zaxira necha kunda aylandi" />
      </div>

      {monthlyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">12 oylik trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="kirim" name="Kirim" fill="hsl(142 76% 36%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="chiqim" name="Chiqim" fill="hsl(0 84% 60%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm">So'nggi harakatlar</CardTitle>
            <div className="flex gap-1">
              {([["all", "Barchasi"], ["kirim", "Kirim"], ["chiqim", "Chiqim"]]).map(([v, l]) => (
                <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} onClick={() => setFilter(v)} className="text-xs h-7 px-2">{l}</Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>{(["Sana", "Tur", "Miqdor", "Qoldiq (oldin)", "Qoldiq (keyin)", "Hujjat №"]).map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Ma'lumot yo'q</td></tr>
                ) : (Array.isArray(recent) ? recent : []).map((t) => (
                  <tr key={t.id} className="border-b hover-elevate">
                    <td className="px-4 py-2">{fmtDate(t.transactionDate)}</td>
                    <td className="px-4 py-2">
                      <Badge className={t.transactionType === "kirim" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}>
                        {t.transactionType === "kirim" ? "Kirim" : t.transactionType === "chiqim" ? "Chiqim" : t.transactionType}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 font-medium">{fmtQty(t.quantity, basic.unitOfMeasure)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{t.balanceBefore !== null ? fmtQty(t.balanceBefore, basic.unitOfMeasure) : "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{t.balanceAfter !== null ? fmtQty(t.balanceAfter, basic.unitOfMeasure) : "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs">{t.documentNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
