/**
 * @module PosInventoryCountsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface InventoryCount {
  id: string | number;
  count_number?: string;
  countNumber?: string;
  warehouse_id?: string | number;
  warehouseId?: string | number;
  warehouse_name?: string;
  warehouseName?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  approved_at?: string;
  approvedAt?: string;
  total_items?: number;
  totalItems?: number;
  variance_count?: number;
  varianceCount?: number;
  notes?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft:     { label: "Qoralama",    variant: "outline"   },
  in_progress:{ label: "Jarayonda", variant: "secondary" },
  pending:   { label: "Kutilmoqda", variant: "secondary"  },
  approved:  { label: "Tasdiqlandi", variant: "default"  },
  rejected:  { label: "Rad etildi", variant: "destructive" },
};

const QUERY_KEY = ["/api/pos/inventory-counts"];

export default function PosInventoryCountsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate]     = useState(false);
  const [form, setForm] = useState({ warehouse_id: "", notes: "" });

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<
    InventoryCount[] | { data?: InventoryCount[] }
  >({
    queryKey: [...QUERY_KEY, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return await apiRequest("GET", `/api/pos/inventory-counts?${params}`);
    },
  });

  const counts: InventoryCount[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: InventoryCount[] })?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      return await apiRequest("POST", "/api/pos/inventory-counts", dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Inventarizatsiya boshlandi" });
      setShowCreate(false);
      setForm({ warehouse_id: "", notes: "" });
    },
    onError: () => toast({ title: "Xatolik", description: "Yaratishda muammo", variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <ModulePage
      module="pos"
      title={t("inventarizatsiyalar")}
      icon={<ClipboardCheck className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-count">
          <Plus className="h-4 w-4 mr-2" />
          {t("yangiInventarizatsiya1")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-1.5 flex-wrap">
          {["all", "draft", "in_progress", "pending", "approved", "rejected"].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter(s)}
              data-testid={`filter-${s}`}
            >
              {s === "all" ? "Barchasi" : (STATUS_MAP[s]?.label ?? s)}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-44 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : counts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("inventarizatsiyalarTopilmadi")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {counts.map(c => {
              const status   = c.status ?? "draft";
              const sc       = STATUS_MAP[status] ?? STATUS_MAP.draft;
              const whName   = c.warehouse_name ?? c.warehouseName ?? `Sklad ${c.warehouse_id ?? c.warehouseId ?? ""}`;
              const num      = c.count_number ?? c.countNumber;
              const items    = c.total_items ?? c.totalItems;
              const variance = c.variance_count ?? c.varianceCount;
              const createdAt = c.created_at ?? c.createdAt;
              return (
                <Card key={c.id} className="hover:shadow-md transition-shadow" data-testid={`card-count-${c.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{whName}</p>
                        {num && <span className="font-mono text-xs text-muted-foreground">#{num}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {items !== undefined && <span>Pozitsiyalar: {items}</span>}
                        {variance !== undefined && variance > 0 && (
                          <span className="text-destructive">Farq: {variance}</span>
                        )}
                        {createdAt && <span>{new Date(createdAt).toLocaleDateString("uz-UZ")}</span>}
                        {c.notes && <span className="italic">{c.notes}</span>}
                      </div>
                    </div>
                    <Badge variant={sc.variant} className="text-xs shrink-0">{sc.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiInventarizatsiya1")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("skladId")}</Label>
              <Input
                value={form.warehouse_id}
                onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}
                placeholder={t("skladId1")}
                data-testid="input-count-warehouse"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Izoh")}</Label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={t("inventarizatsiyaSababi")}
                data-testid="input-count-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => { if (form.warehouse_id) createMutation.mutate(form); }}
              disabled={!form.warehouse_id || createMutation.isPending}
              data-testid="button-confirm-create-count"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Boshlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
