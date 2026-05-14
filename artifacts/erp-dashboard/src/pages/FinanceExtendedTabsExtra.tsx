/**
 * @module FinanceExtendedTabsExtra
 * @description Tax, TaxCalendar and RiskAI tab sections for FinanceExtended page.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, CheckCircle, AlertTriangle } from "lucide-react";
import type { TaxCalendarItem } from "./FinanceExtendedTypes";

interface TaxTabProps {
  taxItems: TaxCalendarItem[];
  taxLoading: boolean;
}

export function TaxTab({ taxItems, taxLoading }: TaxTabProps) {
  return (
    <TabsContent value="tax" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ichki Soliqlar Boshqaruvi</h2>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />Export
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Ushbu oy jami", v: "—", c: "text-[var(--ep-red)]" },
          { l: "To'langan", v: "—", c: "text-[var(--ep-green)]" },
          { l: "Kutilayotgan", v: "—", c: "text-[var(--ep-primary)]" },
          { l: "Muddati o'tgan", v: "—", c: "text-muted-foreground" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          {taxLoading ? (
            <div className="p-4 space-y-2">{([...Array(4)]).map((_,i)=><Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg"/>)}</div>
          ) : taxItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Soliq qoidalari kiritilmagan. Administrator tomonidan qo'shilishi kerak.
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>Soliq turi</TableHead><TableHead>Davr</TableHead>
                <TableHead>Muddat</TableHead><TableHead>Stavka</TableHead><TableHead>Holati</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(taxItems) ? taxItems : []).map((t, i) => (
                  <TableRow key={t.id || i} data-testid={`row-tax-${i}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.period}</TableCell>
                    <TableCell className="text-muted-foreground">{t.due}</TableCell>
                    <TableCell className="font-medium">{t.rate}%</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "To'langan" ? "default" : "secondary"}>
                        {t.status === "To'langan" ? (
                          <><CheckCircle className="h-3 w-3 mr-0.5" />{t.status}</>
                        ) : t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export function TaxCalendarTab() {
  return (
    <TabsContent value="taxcal" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">Soliq Muddatlari Kalendari</h2>
      <div className="space-y-3">
        {([
          { month: "Aprel 2026", tasks: [
            { date: "15 aprel", tax: "INPS va MHTM to'lovi", done: false },
            { date: "20 aprel", tax: "QQS deklaratsiyasi topshirish", done: false },
            { date: "25 aprel", tax: "Foyda solig'i to'lovi", done: false },
            { date: "30 aprel", tax: "Yillik hisobot (I chorak)", done: false },
          ]},
          { month: "Mart 2026", tasks: [
            { date: "15 mart", tax: "INPS va MHTM to'lovi", done: true },
            { date: "20 mart", tax: "QQS deklaratsiyasi", done: true },
            { date: "25 mart", tax: "Foyda solig'i to'lovi", done: true },
          ]},
        ]).map((month, mi) => (
          <Card key={mi}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{month.month}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {(Array.isArray(month.tasks) ? month.tasks : []).map((task, ti) => (
                <div key={ti} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0" data-testid={`row-taxcal-${mi}-${ti}`}>
                  {task.done ? (
                    <CheckCircle className="h-4 w-4 text-[var(--ep-green)] shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)] shrink-0" />
                  )}
                  <span className="text-sm font-medium w-20 shrink-0">{task.date}</span>
                  <span className="text-sm text-muted-foreground">{task.tax}</span>
                  <Badge variant={task.done ? "default" : "outline"} className="ml-auto">
                    {task.done ? "Bajarildi" : "Kutilmoqda"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  );
}

export function RiskAITab() {
  return (
    <TabsContent value="risk" className="mt-0 space-y-4">
      <h2 className="text-lg font-semibold">AI Moliyaviy Risk Tahlili</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Umumiy risk bali", v: "—", c: "text-[var(--ep-primary)]", note: "" },
          { l: "Likvidlik nisbati", v: "—", c: "text-[var(--ep-green)]", note: "" },
          { l: "Qarzdorlik nisbati", v: "—", c: "text-[var(--ep-green)]", note: "" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
            <div className="text-xs font-medium mt-1">{s.note}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">AI Risk Bashoratlari</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([
            { risk: "Pul oqimi tanqisligi", prob: 35, impact: "Yuqori", action: "Debitor qayta ko'rib chiqish kerak" },
            { risk: "Kreditor muddatlari o'tishi", prob: 28, impact: "O'rta", action: "Yetkazuvchilarga muddatlarni uzaytirish so'rash" },
            { risk: "Valyuta kursi xavfi", prob: 20, impact: "Past", action: "USD/UZS kuzatuvini kuchaytirish" },
          ]).map((r, i) => (
            <div key={`k-${i}`} className="p-3 rounded-md bg-muted/50 space-y-2" data-testid={`row-risk-${i}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{r.risk}</div>
                <div className="flex gap-2 items-center">
                  <Badge variant={r.impact === "Yuqori" ? "destructive" : r.impact === "O'rta" ? "secondary" : "outline"}>
                    {r.impact}
                  </Badge>
                  <span className="text-sm font-bold">{r.prob}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded">
                <div
                  className={`h-1.5 rounded ${r.prob >= 50 ? "bg-red-500" : r.prob >= 25 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${r.prob}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Tavsiya: </span>{r.action}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
