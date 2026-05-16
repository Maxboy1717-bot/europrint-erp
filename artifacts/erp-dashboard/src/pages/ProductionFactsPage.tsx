/**
 * @module ProductionFactsPage
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
import { Factory, Plus, Search, Package } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface ProductionFact {
  id: string | number;
  product_name?: string;
  productName?: string;
  order_number?: string;
  orderNumber?: string;
  planned_qty?: number;
  plannedQty?: number;
  actual_qty?: number;
  actualQty?: number;
  defect_qty?: number;
  defectQty?: number;
  shift?: string;
  operator?: string;
  production_date?: string;
  productionDate?: string;
  status?: string;
  notes?: string;
}

export default function ProductionFactsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    product_name: "", order_number: "", planned_qty: "",
    actual_qty: "", defect_qty: "0", shift: "", operator: "", notes: "",
  });

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<ProductionFact[] | { data?: ProductionFact[] }>({
    queryKey: ["/api/production-facts"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/production-facts");
    },
  });

  const facts: ProductionFact[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: ProductionFact[] })?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      return await apiRequest("POST", "/api/production-facts", {
        ...dto,
        planned_qty: dto.planned_qty ? parseInt(dto.planned_qty, 10) : 0,
        actual_qty:  dto.actual_qty  ? parseInt(dto.actual_qty,  10) : 0,
        defect_qty:  dto.defect_qty  ? parseInt(dto.defect_qty,  10) : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-facts"] });
      toast({ title: "Ishlab chiqarish fakti qo'shildi" });
      setShowCreate(false);
      setForm({ product_name: "", order_number: "", planned_qty: "", actual_qty: "", defect_qty: "0", shift: "", operator: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Fakt qo'shishda xatolik", variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  const filtered = facts.filter(f => {
    const name = (f.product_name ?? f.productName ?? "").toLowerCase();
    const order = (f.order_number ?? f.orderNumber ?? "").toLowerCase();
    return name.includes(search.toLowerCase()) || order.includes(search.toLowerCase());
  });

  return (
    <ModulePage
      module="production"
      title={t("ishlabChiqarishFaktlari")}
      icon={<Factory className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-fact">
          <Plus className="h-4 w-4 mr-2" />
          {t("faktQoshish")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("mahsulotYokiBuyurtmaQidirish")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-facts"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-56 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "Qidiruv natijasi topilmadi" : "Ishlab chiqarish faktlari yo'q"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(f => {
              const name    = f.product_name ?? f.productName ?? "—";
              const orderNo = f.order_number ?? f.orderNumber;
              const planned = f.planned_qty  ?? f.plannedQty ?? 0;
              const actual  = f.actual_qty   ?? f.actualQty  ?? 0;
              const defects = f.defect_qty   ?? f.defectQty  ?? 0;
              const date    = f.production_date ?? f.productionDate;
              const efficiency = planned > 0 ? Math.round((actual / planned) * 100) : null;
              return (
                <Card key={f.id} className="hover:shadow-md transition-shadow" data-testid={`card-fact-${f.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                        {orderNo && <span>#{orderNo}</span>}
                        <span>Reja: {planned}</span>
                        <span>Haqiqat: {actual}</span>
                        {defects > 0 && <span className="text-destructive">Brak: {defects}</span>}
                        {f.operator && <span>Operator: {f.operator}</span>}
                        {f.shift && <span>Smena: {f.shift}</span>}
                        {date && <span>{new Date(date).toLocaleDateString("uz-UZ")}</span>}
                      </div>
                    </div>
                    {efficiency !== null && (
                      <Badge
                        variant={efficiency >= 100 ? "default" : efficiency >= 80 ? "secondary" : "destructive"}
                        className="text-xs shrink-0"
                      >
                        {efficiency}%
                      </Badge>
                    )}
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
            <DialogTitle className="text-[18px] font-semibold">{t("yangiIshlabChiqarishFakti")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("mahsulotNomi1")}</Label>
                <Input
                  value={form.product_name}
                  onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                  placeholder={t("mahsulotNomi")}
                  data-testid="input-fact-product"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("buyurtma4")}</Label>
                <Input
                  value={form.order_number}
                  onChange={e => setForm(f => ({ ...f, order_number: e.target.value }))}
                  placeholder="ORD-001"
                  data-testid="input-fact-order"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("rejaDona")}</Label>
                <Input
                  type="number"
                  value={form.planned_qty}
                  onChange={e => setForm(f => ({ ...f, planned_qty: e.target.value }))}
                  placeholder="100"
                  data-testid="input-fact-planned"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("haqiqatDona")}</Label>
                <Input
                  type="number"
                  value={form.actual_qty}
                  onChange={e => setForm(f => ({ ...f, actual_qty: e.target.value }))}
                  placeholder="95"
                  data-testid="input-fact-actual"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("brakDona")}</Label>
                <Input
                  type="number"
                  value={form.defect_qty}
                  onChange={e => setForm(f => ({ ...f, defect_qty: e.target.value }))}
                  placeholder="0"
                  data-testid="input-fact-defects"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("smena")}</Label>
                <Input
                  value={form.shift}
                  onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}
                  placeholder="1-smena"
                  data-testid="input-fact-shift"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Operator")}</Label>
                <Input
                  value={form.operator}
                  onChange={e => setForm(f => ({ ...f, operator: e.target.value }))}
                  placeholder={t("ismFamilya")}
                  data-testid="input-fact-operator"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Izoh")}</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={t("qoshimchaIzoh")}
                rows={2}
                data-testid="input-fact-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => { if (form.product_name.trim()) createMutation.mutate(form); }}
              disabled={!form.product_name.trim() || createMutation.isPending}
              data-testid="button-confirm-create-fact"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
