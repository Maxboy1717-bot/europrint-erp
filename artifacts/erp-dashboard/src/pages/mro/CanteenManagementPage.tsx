/**
 * @module CanteenManagementPage
 * @description Oshxona boshqaruvi: stats + kunlik yozuvlar ro'yxati + yangi yozuv forma.
 * Route: /mro/kitchen
 * GET /api/mro/canteen/stats + GET /api/mro/canteen/logs + POST /api/mro/canteen/logs
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Utensils, Users, Package, DollarSign, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CanteenStats {
  totalMealsToday: number;
  totalEmployeesServed: number;
  costToday: number;
  costPerMeal: number;
  topMeals: Array<{ name: string; count: number }>;
  consumption: Array<{ ingredientName: string; quantity: number; unit: string; consumed: number }>;
}

interface CanteenLog {
  id: number;
  log_date: string;
  meal_name: string;
  portion_count: number | null;
  cost_per_portion: string | number | null;
  total_cost: string | number | null;
  employees_served: number | null;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function fmtCost(v: string | number | null): string {
  if (v == null) return "—";
  const n = Number(v);
  return isNaN(n) ? "—" : `${n.toLocaleString("uz-UZ")} so'm`;
}

// ── Create Log Dialog ──────────────────────────────────────────────────────────

function CreateLogDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mealName, setMealName]         = useState("");
  const [logDate, setLogDate]           = useState(todayStr());
  const [portionCount, setPortionCount] = useState("");
  const [costPerPortion, setCostPerPortion] = useState("");
  const [employeesServed, setEmployeesServed] = useState("");

  const mutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiRequest<CanteenLog>("POST", "/api/mro/canteen/logs", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mro/canteen/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mro/canteen/stats"] });
      toast({ title: "Oshxona yozuvi saqlandi" });
      setMealName(""); setPortionCount(""); setCostPerPortion(""); setEmployeesServed("");
      onClose();
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  function handleSubmit() {
    if (!mealName.trim()) {
      toast({ title: "Ovqat nomi majburiy", variant: "destructive" });
      return;
    }
    const pc = parseInt(portionCount, 10);
    const cpp = parseFloat(costPerPortion);
    const es = parseInt(employeesServed, 10);
    const dto: Record<string, unknown> = {
      meal_name: mealName.trim(),
      log_date: logDate || todayStr(),
    };
    if (!isNaN(pc) && pc >= 0) dto.portion_count = pc;
    if (!isNaN(cpp) && cpp >= 0) {
      dto.cost_per_portion = cpp;
      if (!isNaN(pc) && pc >= 0) dto.total_cost = pc * cpp;
    }
    if (!isNaN(es) && es >= 0) dto.employees_served = es;
    mutation.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi oshxona yozuvi</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Ovqat nomi *</Label>
            <Input placeholder="Masalan: Tushlik, Nonushta..." value={mealName}
              onChange={(e) => setMealName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Sana</Label>
            <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Porsiya soni</Label>
              <Input type="number" min="0" placeholder="0" value={portionCount}
                onChange={(e) => setPortionCount(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>1 porsiya narxi (so'm)</Label>
              <Input type="number" min="0" placeholder="0" value={costPerPortion}
                onChange={(e) => setCostPerPortion(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Xizmat ko'rsatilgan xodimlar</Label>
            <Input type="number" min="0" placeholder="0" value={employeesServed}
              onChange={(e) => setEmployeesServed(e.target.value)} />
          </div>
          {portionCount && costPerPortion && !isNaN(parseInt(portionCount, 10)) && !isNaN(parseFloat(costPerPortion)) && (
            <p className="text-xs text-muted-foreground">
              Umumiy xarajat: {(parseInt(portionCount, 10) * parseFloat(costPerPortion)).toLocaleString("uz-UZ")} so'm
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending || !mealName.trim()}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CanteenManagementPage() {
  const { t } = useTranslation('mro' as 'admin');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: statsData, isLoading: statsLoading } = useQuery<CanteenStats>({
    queryKey: ["/api/mro/canteen/stats"],
    queryFn: () => apiRequest<CanteenStats>("GET", "/api/mro/canteen/stats"),
  });

  const { data: logsData, isLoading: logsLoading } = useQuery<CanteenLog[]>({
    queryKey: ["/api/mro/canteen/logs"],
    queryFn: () => apiRequest<CanteenLog[]>("GET", "/api/mro/canteen/logs"),
  });

  const topMeals = Array.isArray(statsData?.topMeals) ? statsData.topMeals : [];
  const consumption = Array.isArray(statsData?.consumption) ? statsData.consumption : [];
  const logs: CanteenLog[] = Array.isArray(logsData) ? logsData : [];

  return (
    <DedicatedPageShell
      title={t('canteen.title', "Oshxona Boshqaruvi")}
      description={t('canteen.description', "Korxona oshxonasi — bugungi ovqatlar va xodimlar xizmati")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('canteen.mealsToday', "Bugungi ovqatlar")} value={statsData?.totalMealsToday ?? 0} icon={<Utensils className="h-4 w-4" />} />
        <KpiCard label={t('canteen.employeesServed', "Xizmat ko'rsatilgan")} value={statsData?.totalEmployeesServed ?? 0} icon={<Users className="h-4 w-4" />} />
        <KpiCard label={t('canteen.costToday', "Bugungi xarajat")} value={`${(statsData?.costToday ?? 0).toLocaleString()} UZS`} icon={<DollarSign className="h-4 w-4" />} variant="default" />
        <KpiCard label={t('canteen.costPerMeal', "Ovqat narxi")} value={`${(statsData?.costPerMeal ?? 0).toLocaleString()} UZS`} icon={<DollarSign className="h-4 w-4" />} variant="default" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title={t('canteen.topMeals', "Mashhur ovqatlar")}>
          {statsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : topMeals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('canteen.noMeals', "Bugun ovqat yo'q")}</p>
          ) : (
            <div className="space-y-2">
              {topMeals.map((m) => (
                <div key={m.name} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{m.name}</span>
                  <Badge variant="outline">{m.count} porsiya</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={t('canteen.consumption', "Sarflangan masalliqlar")}>
          {statsLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : consumption.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('canteen.noConsumption', "Sarf yo'q")}</p>
          ) : (
            <div className="space-y-2">
              {consumption.map((c) => (
                <div key={c.ingredientName} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[var(--ep-primary)]" />
                    <span>{c.ingredientName}</span>
                  </div>
                  <span className="text-sm">
                    <strong>{c.consumed}</strong> / {c.quantity} {c.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Logs section with create button */}
      <Section title="Kunlik yozuvlar">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{logs.length} ta yozuv</p>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Yangi yozuv
          </Button>
        </div>
        {logsLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Yozuvlar yo'q.</p>
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} className="mt-2 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Birinchi yozuvni qo'shing
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">Sana</th>
                  <th className="text-left p-2">Ovqat nomi</th>
                  <th className="text-right p-2">Porsiya</th>
                  <th className="text-right p-2">Xodimlar</th>
                  <th className="text-right p-2">Umumiy xarajat</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/20">
                    <td className="p-2 text-muted-foreground text-xs">{log.log_date}</td>
                    <td className="p-2 font-medium">{log.meal_name}</td>
                    <td className="p-2 tabular-nums text-right">{log.portion_count ?? "—"}</td>
                    <td className="p-2 tabular-nums text-right">{log.employees_served ?? "—"}</td>
                    <td className="p-2 tabular-nums text-right">{fmtCost(log.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <CreateLogDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </DedicatedPageShell>
  );
}
