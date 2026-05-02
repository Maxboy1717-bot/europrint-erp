import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, TrendingDown, Award, Clock, RefreshCw } from "lucide-react";
import type { DisciplineRecord } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface DisciplineTabProps {
  disciplineRecords: DisciplineRecord[];
  warningsCount: number;
  penaltiesSum: number;
  rewardsSum: number;
  lateArrivals: number;
}

export function DisciplineTab({ disciplineRecords, warningsCount, penaltiesSum, rewardsSum, lateArrivals }: DisciplineTabProps) {
  const stats = [
    { label: "Ogohlantirishlar", value: warningsCount, Icon: AlertTriangle, accent: "text-yellow-600" },
    { label: "Jarima (so'm)", value: penaltiesSum.toLocaleString(), Icon: TrendingDown, accent: "text-red-600" },
    { label: "Mukofot (so'm)", value: rewardsSum.toLocaleString(), Icon: Award, accent: "text-green-600" },
    { label: "Kech Kelish", value: lateArrivals, Icon: Clock, accent: "text-orange-600" },
  ];

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Array.isArray(stats) ? stats : []).map((item, i) => (
          <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{item.label}</p>
            <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{item.value}</p>
            <div className="flex items-center gap-2 mt-2">
              <item.Icon className={`w-3.5 h-3.5 ${item.accent}`} />
              <span className="text-xs text-on-surface-variant">Bu oy</span>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Intizom Yozuvlari
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Tur</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Xodim</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Miqdor</TableHead>
                <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplineRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-on-surface-variant text-sm">Intizom yozuvlari yo'q</TableCell>
                </TableRow>
              ) : (Array.isArray(disciplineRecords) ? disciplineRecords : []).slice(0, 10).map((rec, idx) => (
                <TableRow key={idx} className="hover:bg-surface-container-low transition-colors">
                  <TableCell className="px-6">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      rec.type === "warning" ? "bg-amber-100 text-amber-800" :
                      rec.type === "penalty" ? "bg-red-100 text-red-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {rec.type === "warning" ? "Ogohlantirish" : rec.type === "penalty" ? "Jarima" : "Mukofot"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-on-surface px-6">{(rec as DisciplineRecord & { userId?: string | number }).userId || "—"}</TableCell>
                  <TableCell className="text-sm text-on-surface-variant px-6">
                    {rec.amount ? rec.amount.toLocaleString() + " so'm" : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-on-surface-variant px-6">
                    {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString("uz-UZ") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
