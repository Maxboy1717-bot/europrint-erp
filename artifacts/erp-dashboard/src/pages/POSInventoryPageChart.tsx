/**
 * @module POSInventoryPageChart
 * @description Chart tab component for POSInventoryPage.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

import { TrendingDown, ArrowUpCircle, ArrowDownCircle, Settings2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { ChartDataPoint, MonthlyRow } from "./POSInventoryPageTypes";
import { useTranslation } from '@/lib/i18n';

interface ChartTabProps {
  chartData: ChartDataPoint[];
  monthlyRows: MonthlyRow[];
}

export function ChartTab({ chartData, monthlyRows }: ChartTabProps) {
  const { t } = useTranslation("common");
  const summaryCards = [
    { key: "in", label: "Umumiy kirim", icon: ArrowUpCircle, color: "text-[var(--ep-green)] bg-green-100" },
    { key: "sale", label: "Sotuv orqali", icon: TrendingDown, color: "text-[var(--ep-purple)] bg-purple-100" },
    { key: "out", label: "Umumiy chiqim", icon: ArrowDownCircle, color: "text-[var(--ep-red)] bg-red-100" },
    { key: "adjustment", label: "Tuzatishlar", icon: Settings2, color: "text-[var(--ep-blue)] bg-blue-100" },
  ] as const;

  return (
    <TabsContent value="chart" className="m-0 p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>14 kunlik inventar harakatlari grafigi</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <p>{t("malumotYoq")}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="in" name="Kirim" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="sale" name="Sotuv" fill="#8b5cf6" radius={[0, 0, 0, 0]} stackId="b" />
                <Bar dataKey="out" name="Chiqim" fill="#ef4444" radius={[0, 0, 0, 0]} stackId="b" />
                <Bar dataKey="adjustment" name="Tuzatish" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="c" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(({ key, label, icon: Icon, color }) => {
          const total = (Array.isArray(monthlyRows) ? monthlyRows : [])
            .filter(r => r.type === key)
            .reduce((s, r) => s + Number(r.qty), 0);
          return (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-xl font-bold">{total.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TabsContent>
  );
}
