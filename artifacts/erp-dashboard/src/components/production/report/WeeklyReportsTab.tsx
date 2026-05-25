/**
 * @module WeeklyReportsTab
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar, RefreshCw, ChevronLeft, ChevronRight, BarChart2,
} from "lucide-react";
import { formatNum, getWeekRange } from "./helpers";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

interface WeeklyStat {
  department: string;
  total_qty: number;
  avg_oee: number;
  avg_quality: number;
  total_downtime: number;
}

export function WeeklyReportsTab() {
  const { t } = useTranslation("common");
  const [weekOffset, setWeekOffset] = useState(0);
  const { start, end, label } = getWeekRange(weekOffset);

  const { data, isLoading, refetch } = useQuery<{ stats: WeeklyStat[] }>({
    queryKey: ["/api/production/reports/weekly", start, end],
    queryFn: async () => {
      return await apiRequest('GET', `/api/production/reports/weekly?start=${start}&end=${end}`);
    },
  });

  const stats = data?.stats || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{label}</h3>
          <div className="flex items-center gap-1 ml-2">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setWeekOffset(p => p - 1)} data-testid="button-prev-week"><ChevronLeft className="w-4 h-4" /></Button>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setWeekOffset(0)} data-testid="button-curr-week"><RefreshCw className="w-4 h-4" /></Button>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setWeekOffset(p => p + 1)} data-testid="button-next-week"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" /> {t("refresh")}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          ([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-32 w-full rounded-lg" />)
        ) : stats.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground col-span-full">{t("ushbuHaftaUchunMalumotlarYoq")}</p>
        ) : (
          (Array.isArray(stats) ? stats : []).map((s) => (
            <Card key={s.department} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {s.department}
                  <BarChart2 className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("jamiIshlabChiq")}</span>
                    <span className="font-semibold">{formatNum(s.total_qty)} ta</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("ortachaOee")}</span>
                    <span className="font-semibold text-primary">{Number(s.avg_oee).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("ortachaSifat")}</span>
                    <span className="font-semibold">{Number(s.avg_quality).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-1 mt-1">
                    <span className="text-muted-foreground">{t("toxtashlar")}</span>
                    <span className="font-semibold text-[var(--ep-primary)]">{s.total_downtime} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">{t("batafsilMalumot")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("bolim1")}</TableHead>
                <TableHead className="text-right">{t("haftalikReja")}</TableHead>
                <TableHead className="text-right">{t("amalda")}</TableHead>
                <TableHead className="text-right">{t("bajarilish")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(stats) ? stats : []).map((s) => (
                <TableRow key={s.department} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="pl-4 font-medium">{s.department}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right font-semibold">{formatNum(s.total_qty)}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}
