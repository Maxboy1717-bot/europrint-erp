import { SdGrowthData } from "./sd-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { KpiCard, fmtMoney, fmtNum } from "./helpers";

export function GrowthTab({ growth }: { growth: SdGrowthData }) {
  if (!growth) return <div className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yuklanmadi</div>;

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard icon={DollarSign} label={`${currentYear - 1} yil`} value={fmtMoney(growth.lastYearTotal)} />
        <KpiCard icon={DollarSign} label={`${currentYear} (hozirgacha)`} value={fmtMoney(growth.thisYearTotal)} />
        <KpiCard icon={Target} label="Yil prognozi" value={fmtMoney(growth.projectedThisYear)}
          sub={`${growth.growthRate >= 0 ? "+" : ""}${growth.growthRate}% o'zgarish`} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {growth.growthRate >= 0
              ? <TrendingUp className="h-8 w-8 text-green-600" />
              : <TrendingDown className="h-8 w-8 text-red-600" />}
            <div>
              <p className="font-medium">{growth.growthRate >= 0 ? "O'sish tendensiyasi" : "Pasayish tendensiyasi"}</p>
              <p className="text-sm text-muted-foreground">
                O'tgan yilga nisbatan{" "}
                <span className={growth.growthRate >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                  {growth.growthRate >= 0 ? "+" : ""}{growth.growthRate}%
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(growth.riskSignals || []).length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />Xavf signallari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(growth.riskSignals || []).map((s: string, i: number) => (
                <li key={`k-${i}`} className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="h-3 w-3 shrink-0" />{s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(growth.yearlyTrend || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Yillik trend (mln UZS)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(growth.yearlyTrend || []).map((r) => ({
                yil: r.year, summa: Math.round(fmtNum(r.total) / 1_000_000),
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="yil" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v} M UZS`]} />
                <Bar dataKey="summa" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
