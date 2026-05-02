import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileSpreadsheet, Eye, RefreshCw, ChevronLeft, ChevronRight,
  Factory, CheckCircle, Clock, AlertCircle, BarChart2,
} from "lucide-react";
import {
  formatNum, formatMoney, pct,
  STATUS_LABELS, PRIORITY_COLORS, TYPE_LABELS,
} from "@/components/production/report/helpers";
import { ShiftReportsTab } from "@/components/production/report/ShiftReportsTab";
import { WeeklyReportsTab } from "@/components/production/report/WeeklyReportsTab";
import { ProductionOrder, PaginationData } from "@/components/production/report/types";

export default function ProductionReportPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery<{ orders: ProductionOrder[]; pagination: PaginationData; stats: { total: number; completed: number; in_progress: number; delayed: number } }>({
    queryKey: ["/api/production/orders", status, page],
    queryFn: async () => {
      const r = await fetch(`/api/production/orders?page=${page}&limit=10${status !== "all" ? `&status=${status}` : ""}`);
      if (!r.ok) throw new Error("Xato");
      return r.json();
    },
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };
  const stats = data?.stats || { total: 0, completed: 0, in_progress: 0, delayed: 0 };

  const statsCards = [
    { label: "Jami Buyurtmalar", value: formatNum(stats.total), icon: Factory, color: "text-blue-600" },
    { label: "Bajarildi", value: formatNum(stats.completed), icon: CheckCircle, color: "text-green-600" },
    { label: "Jarayonda", value: formatNum(stats.in_progress), icon: Clock, color: "text-orange-600" },
    { label: "Kechikkan", value: formatNum(stats.delayed), icon: AlertCircle, color: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ishlab Chiqarish Hisoboti</h1>
            <p className="text-muted-foreground mt-1">Smena va haftalik ish unumdorligi tahlili</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" /> Yangilash</Button>
            <Button onClick={() => navigate("/production/orders/new")} className="bg-primary hover:bg-primary/90">Yangi Buyurtma</Button>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="orders" className="gap-2"><BarChart2 className="w-4 h-4" /> Buyurtmalar</TabsTrigger>
            <TabsTrigger value="shifts" className="gap-2"><Clock className="w-4 h-4" /> Smena Xisoboti</TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2"><FileSpreadsheet className="w-4 h-4" /> Haftalik Tahlil</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Holat" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha holatlar</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => window.open(`/api/production/orders/report/excel?${status !== "all" ? `status=${status}` : ""}`, "_blank")} data-testid="button-export-excel">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Array.isArray(statsCards) ? statsCards : []).map((card) => (
                <Card key={card.label}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>}
                      </div>
                      <card.icon className={`w-5 h-5 ${card.color} mt-0.5`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Raqam</TableHead>
                      <TableHead>Holati</TableHead>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead className="text-right">Reja</TableHead>
                      <TableHead className="text-right">Ishlab chiq.</TableHead>
                      <TableHead className="text-right">Tannarx (reja)</TableHead>
                      <TableHead>Mas'ul</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={`k-${i}`}>{Array.from({ length: 10 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                      ))
                    ) : orders.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-12">Buyurtmalar topilmadi</TableCell></TableRow>
                    ) : (
                      (Array.isArray(orders) ? orders : []).map((order) => {
                        const st = STATUS_LABELS[order.status] || { label: order.status, variant: "secondary" as const };
                        const completion = order.plannedQuantity > 0 ? pct(Number(order.confirmedQuantity || 0), order.plannedQuantity) : 0;
                        return (
                          <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/production/orders/${order.id}`)} data-testid={`row-order-${order.id}`}>
                            <TableCell className="pl-4 font-mono text-sm font-medium"><span className={PRIORITY_COLORS[order.priority] || ""}>{order.orderNumber}</span></TableCell>
                            <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                            <TableCell className="max-w-36 truncate text-sm">{order.productName || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{TYPE_LABELS[order.productionType || ""] || order.productionType || "—"}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{formatNum(order.plannedQuantity)}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              <span className={completion >= 100 ? "text-green-600 font-semibold" : completion >= 50 ? "text-yellow-600" : ""}>{formatNum(order.confirmedQuantity)}</span>
                              <span className="text-xs text-muted-foreground ml-1">({completion}%)</span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">{formatMoney(order.plannedCost)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-28 truncate">{order.responsibleName || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{order.plannedStartDate || "—"}</TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/production/orders/${order.id}`); }} data-testid={`button-view-${order.id}`}><Eye className="w-4 h-4" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Jami: {pagination.total} ta buyurtma</p>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} data-testid="button-prev-page"><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="text-sm text-muted-foreground">{page} / {pagination.pages}</span>
                  <Button size="icon" variant="outline" disabled={page >= pagination.pages} onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} data-testid="button-next-page"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shifts"><ShiftReportsTab /></TabsContent>
          <TabsContent value="weekly"><WeeklyReportsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
