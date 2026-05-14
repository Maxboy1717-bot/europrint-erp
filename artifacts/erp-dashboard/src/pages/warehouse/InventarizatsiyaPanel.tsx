/**
 * @module InventarizatsiyaPanel
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Lang, WarehouseData } from "./warehouse-types";
import { apiRequest } from '@/lib/queryClient';

interface InventarizatsiyaPanelProps {
  lang: Lang;
}

interface InvCount {
  id: string;
  countNumber: string;
  countDate: string;
  warehouseId: number;
  warehouseName: string;
  countType: string;
  status: string;
  totalItems: number;
  countedItems: number;
  varianceItems: number | null;
  totalBookValue: string | null;
  totalCountedValue: string | null;
  totalVariance: string | null;
  assignedToName: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface InvStats {
  total: number;
  completed: number;
  inProgress: number;
  draft: number;
}

const STATUS_CONF: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft:       { label: "Qoralama",    cls: "bg-gray-100 text-gray-700",   icon: ClipboardList },
  in_progress: { label: "Jarayonda",   cls: "bg-blue-100 text-[var(--ep-blue)]",   icon: Clock },
  completed:   { label: "Tugallangan", cls: "bg-emerald-100 text-[var(--ep-green)]", icon: CheckCircle2 },
  cancelled:   { label: "Bekor",       cls: "bg-red-100 text-[var(--ep-red)]",     icon: AlertCircle },
};

const TYPE_LABELS: Record<string, string> = {
  full: "To'liq", partial: "Qisman", cycle: "Sikl", spot: "Nazorat",
};

export function InventarizatsiyaPanel({ lang }: InventarizatsiyaPanelProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");

  const { data: warehouses = [] } = useQuery<WarehouseData[]>({ queryKey: ["/api/warehouse/warehouses"] });

  const { data: stats } = useQuery<InvStats>({
    queryKey: ["/api/warehouse/inventory-counts-stats"],
    queryFn: async () => {
      const r = await apiRequest('GET', "/api/warehouse/inventory-counts-stats");
      if (!r.ok) throw new Error("Stats load error");
      return r.json();
    },
  });

  const { data: invData, isLoading } = useQuery<{ data: InvCount[]; total: number }>({
    queryKey: ["/api/warehouse/inventory-counts", statusFilter, warehouseFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (warehouseFilter) params.set("warehouse_id", warehouseFilter);
      const r = await apiRequest('GET', `/api/warehouse/inventory-counts?${params}`);
      if (!r.ok) throw new Error("Load error");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest('POST', "/api/warehouse/inventory-counts", {
        count_type: "spot",
        count_date: new Date().toISOString(),
      });
      if (!r.ok) throw new Error("Create error");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/inventory-counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/inventory-counts-stats"] });
      toast({ title: lang === "uz" ? "Inventarizatsiya yaratildi" : "Инвентаризация создана" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const counts = invData?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: lang === "uz" ? "Jami" : "Всего", val: stats.total, cls: "text-foreground" },
            { label: lang === "uz" ? "Tugallangan" : "Завершено", val: stats.completed, cls: "text-[var(--ep-green)]" },
            { label: lang === "uz" ? "Jarayonda" : "В процессе", val: stats.inProgress, cls: "text-[var(--ep-blue)]" },
            { label: lang === "uz" ? "Qoralama" : "Черновик", val: stats.draft, cls: "text-muted-foreground" },
          ].map(s => (
            <Card key={s.label} className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.cls}`}>{s.val}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filters + Create button */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-9">
            <SelectValue placeholder={lang === "uz" ? "Barcha statuslar" : "Все статусы"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{lang === "uz" ? "Barchasi" : "Все"}</SelectItem>
            <SelectItem value="draft">{lang === "uz" ? "Qoralama" : "Черновик"}</SelectItem>
            <SelectItem value="in_progress">{lang === "uz" ? "Jarayonda" : "В процессе"}</SelectItem>
            <SelectItem value="completed">{lang === "uz" ? "Tugallangan" : "Завершено"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-9">
            <SelectValue placeholder={lang === "uz" ? "Barcha omborlar" : "Все склады"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{lang === "uz" ? "Barchasi" : "Все"}</SelectItem>
            {(Array.isArray(warehouses) ? warehouses : []).map(wh => (
              <SelectItem key={wh.id} value={String(wh.id)}>{wh.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {lang === "uz" ? "Yangi inventarizatsiya" : "Новая инвентаризация"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[var(--ep-yellow)]" />
            <CardTitle className="text-base">
              {lang === "uz" ? "Inventarizatsiya jadvali" : "Таблица инвентаризации"}
            </CardTitle>
            <Badge variant="outline" className="ml-auto">{invData?.total ?? 0}</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : counts.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">{lang === "uz" ? "Inventarizatsiya topilmadi" : "Инвентаризация не найдена"}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === "uz" ? "Raqam" : "Номер"}</TableHead>
                  <TableHead>{lang === "uz" ? "Sana" : "Дата"}</TableHead>
                  <TableHead>{lang === "uz" ? "Ombor" : "Склад"}</TableHead>
                  <TableHead>{lang === "uz" ? "Tur" : "Тип"}</TableHead>
                  <TableHead>{lang === "uz" ? "Holat" : "Статус"}</TableHead>
                  <TableHead className="text-center">{lang === "uz" ? "Sanaldi" : "Подсчитано"}</TableHead>
                  <TableHead className="text-right">{lang === "uz" ? "Farq" : "Отклонение"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counts.map(inv => {
                  const sConf = STATUS_CONF[inv.status] ?? STATUS_CONF.draft;
                  const SIcon = sConf.icon;
                  const progress = inv.totalItems > 0 ? Math.round((inv.countedItems / inv.totalItems) * 100) : 0;
                  const variance = inv.totalVariance ? Number(inv.totalVariance) : null;
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-sm font-medium">{inv.countNumber}</TableCell>
                      <TableCell className="text-sm">{inv.countDate}</TableCell>
                      <TableCell className="text-sm">{inv.warehouseName || `Ombor #${inv.warehouseId}`}</TableCell>
                      <TableCell className="text-sm">{TYPE_LABELS[inv.countType] ?? inv.countType}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs flex items-center gap-1 w-fit ${sConf.cls}`}>
                          <SIcon className="h-3 w-3" />{sConf.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-medium">{inv.countedItems}/{inv.totalItems}</span>
                          {inv.status === "in_progress" && (
                            <span className="text-xs text-muted-foreground">({progress}%)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {variance !== null ? (
                          <span className={`text-sm font-medium ${variance < 0 ? "text-[var(--ep-red)]" : variance > 0 ? "text-[var(--ep-green)]" : "text-muted-foreground"}`}>
                            {variance > 0 ? "+" : ""}{Number(variance).toLocaleString()} so'm
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
