/**
 * @module MovementsTab
 * @description React UI component.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { KpiCard } from "./KpiCard";
import { fmtQty, fmtDate, type MovementsInfo, type BasicInfo } from "./types";
import { useTranslation } from '@/lib/i18n';

export function MovementsTab({ movements, basic }: { movements: MovementsInfo; basic: BasicInfo }) {
  const { t } = useTranslation("common");
  const [filter, setFilter] = useState("all");
  const rawRecent = movements?.recent;
  const rawMonthly = movements?.monthlyTrend;
  const recent = (Array.isArray(rawRecent) ? rawRecent : []).filter(t => filter === "all" || t.transactionType === filter);
  const monthlyData = (Array.isArray(rawMonthly) ? rawMonthly : []).map(m => ({ month: String(m.month).slice(5), kirim: m.totalIn, chiqim: m.totalOut }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard icon={TrendingUp} label="30 kun kirim" value={fmtQty(movements.last30Days?.totalIn, basic.unitOfMeasure)} color="text-[var(--ep-green)]" />
        <KpiCard icon={TrendingDown} label="30 kun chiqim" value={fmtQty(movements.last30Days?.totalOut, basic.unitOfMeasure)} color="text-[var(--ep-red)]" />
        <KpiCard icon={RefreshCw} label={t("aylanma")}
          value={movements.last30Days?.turnoverDays != null ? `${movements.last30Days.turnoverDays} kun` : "Noma'lum"} />
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
            <CardTitle className="text-sm">{t("songgiHarakatlar")}</CardTitle>
            <div className="flex gap-1">
              {([["all", "Barchasi"], ["kirim", "Kirim"], ["chiqim", "Chiqim"]]).map(([v, l]) => (
                <Button key={v} size="sm" variant={filter === v ? "default" : "outline"}
                  onClick={() => setFilter(v)} className="text-xs h-7 px-2">{l}</Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>{(["Sana", "Tur", "Miqdor", "Qoldiq (oldin)", "Qoldiq (keyin)", "Hujjat №"]).map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">{t("malumotYoq")}</td></tr>
              ) : (Array.isArray(recent) ? recent : []).map(t => (
                <tr key={t.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-2">{fmtDate(t.transactionDate)}</td>
                  <td className="px-4 py-2">
                    <Badge className={t.transactionType === "kirim" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}>
                      {t.transactionType === "kirim" ? "Kirim" : t.transactionType === "chiqim" ? "Chiqim" : t.transactionType}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 font-medium">{fmtQty(t.quantity, basic.unitOfMeasure)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.balanceBefore != null ? fmtQty(t.balanceBefore, basic.unitOfMeasure) : "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.balanceAfter != null ? fmtQty(t.balanceAfter, basic.unitOfMeasure) : "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{t.documentNumber || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
