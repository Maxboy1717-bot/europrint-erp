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

interface WeeklyStat {
  department: string;
  total_qty: number;
  avg_oee: number;
  avg_quality: number;
  total_downtime: number;
}

export function WeeklyReportsTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { start, end, label } = getWeekRange(weekOffset);

  const { data, isLoading, refetch } = useQuery<{ stats: WeeklyStat[] }>({
    queryKey: ["/api/production/reports/weekly", start, end],
    queryFn: async () => {
      const r = await fetch(`/api/production/reports/weekly?start=${start}&end=${end}`);
      if (!r.ok) throw new Error("Xato");
      return r.json();
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
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" /> Yangilash</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          ([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-32 w-full" />)
        ) : stats.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground col-span-full">Ushbu hafta uchun ma'lumotlar yo'q</p>
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
                    <span className="text-muted-foreground">Jami ishlab chiq.</span>
                    <span className="font-semibold">{formatNum(s.total_qty)} ta</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">O'rtacha OEE</span>
                    <span className="font-semibold text-primary">{Number(s.avg_oee).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">O'rtacha Sifat</span>
                    <span className="font-semibold">{Number(s.avg_quality).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-1 mt-1">
                    <span className="text-muted-foreground">To'xtashlar</span>
                    <span className="font-semibold text-orange-600">{s.total_downtime} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Batafsil ma'lumot</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Bo'lim</TableHead>
                <TableHead className="text-right">Haftalik reja</TableHead>
                <TableHead className="text-right">Amalda</TableHead>
                <TableHead className="text-right">Bajarilish %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(stats) ? stats : []).map((s) => (
                <TableRow key={s.department}>
                  <TableCell className="pl-4 font-medium">{s.department}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                  <TableCell className="text-right font-semibold">{formatNum(s.total_qty)}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
