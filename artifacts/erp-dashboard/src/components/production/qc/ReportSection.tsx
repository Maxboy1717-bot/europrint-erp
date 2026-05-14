/**
 * @module ReportSection
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, TrendingDown, Target, Zap } from "lucide-react";

export function ReportSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tahliliy Hisobotlar</h2>
          <p className="text-sm text-muted-foreground">Sifat nazorati bo'yicha yakuniy statistik ko'rsatkichlar</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-[var(--ep-blue)] border-blue-200">
            Haftalik hisobot: 14.10 - 20.10
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { label: "O'rtacha Sifat Bali", value: "94.2", unit: "100 dan", icon: Target, color: "text-[var(--ep-blue)]" },
          { label: "Brak Ulushi", value: "2.1%", unit: "Umumiy massadan", icon: TrendingDown, color: "text-[var(--ep-red)]" },
          { label: "Testlar Soni", value: "156", unit: "Ushbu haftada", icon: BarChart3, color: "text-[var(--ep-blue)]" },
          { label: "KPI Bajarilishi", value: "98.5%", unit: "Maqsad: 95%", icon: Zap, color: "text-[var(--ep-green)]" },
        ]).map((s, i) => (
          <Card key={`k-${i}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <Badge variant="outline" className="text-[10px] font-bold">+1.2%</Badge>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{s.unit}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Sifat Dinamikasi (Oxirgi 7 kun)</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-end justify-between px-4 pb-2">
            {([65, 80, 75, 90, 85, 95, 88]).map((h, i) => (
              <div key={`k-${i}`} className="flex flex-col items-center gap-2 w-full">
                <div className="w-8 bg-primary/10 rounded-t hover:bg-primary/40 transition-colors relative group" style={{ height: `${h * 2}px` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
                </div>
                <span className="text-[10px] text-muted-foreground">{["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"][i]}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top Defekt Turlari</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>Defekt</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {([
                  { name: "Yirtilish", val: 45, color: "bg-red-500" },
                  { name: "Rang nomutanosibligi", val: 25, color: "bg-orange-500" },
                  { name: "Namlik yuqoriligi", val: 15, color: "bg-yellow-500" },
                  { name: "O'lcham xatosi", val: 10, color: "bg-blue-500" },
                  { name: "Boshqa", val: 5, color: "bg-slate-400" },
                ]).map((d, i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs font-medium py-2">{d.name}</TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        {d.val}%
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${d.color}`} style={{ width: `${d.val}%` }} />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
