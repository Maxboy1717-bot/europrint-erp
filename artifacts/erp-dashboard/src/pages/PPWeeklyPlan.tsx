/**
 * @module PPWeeklyPlan
 * @description Haftalik ishlab-chiqarish rejasi (EP-PP-110, Batch 5 Item 14). Tanlangan haftaning
 *   7 kuni (Dush–Yak) bo'ylab buyurtmalar planned_start_date bo'yicha ustunlarga joylashadi.
 *   Buyurtmani boshqa kunga ko'chirish (reschedule) real saqlaydi. BE: GET /api/pp/orders/weekly/:weekStart,
 *   PATCH /api/pp/orders/:id/reschedule.
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { CalendarDays, ChevronLeft, ChevronRight, Flame } from "lucide-react";

interface PlanOrder {
  id: number;
  order_number: string;
  product_name?: string | null;
  status: string;
  is_urgent?: boolean;
  planned_start_date: string;
  quantity?: number | null;
}

const DOW = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];

// ISO date-only helpers (local, no tz drift — treat as plain YYYY-MM-DD).
function pad(n: number) { return String(n).padStart(2, "0"); }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function mondayOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Mon=0..Sun=6
  x.setDate(x.getDate() - dow);
  return x;
}
function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const x = new Date(y, m - 1, d);
  x.setDate(x.getDate() + n);
  return toISO(x);
}

const STATUS_TONE: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

export default function PPWeeklyPlan() {
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState<string>(() => toISO(mondayOf(new Date())));

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const { data, isLoading, isError, error, refetch } = useQuery<{ data?: PlanOrder[] }>({
    queryKey: ["/api/pp/orders/weekly", weekStart],
    queryFn: async () => apiRequest("GET", `/api/pp/orders/weekly/${weekStart}`),
  });
  const orders: PlanOrder[] = Array.isArray(data?.data) ? data!.data : [];

  const byDay = useMemo(() => {
    const m: Record<string, PlanOrder[]> = {};
    days.forEach(d => { m[d] = []; });
    orders.forEach(o => { if (m[o.planned_start_date]) m[o.planned_start_date].push(o); });
    return m;
  }, [orders, days]);

  const rescheduleM = useMutation({
    mutationFn: async (v: { id: number; date: string }) =>
      apiRequest("PATCH", `/api/pp/orders/${v.id}/reschedule`, { plannedStartDate: v.date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pp/orders/weekly"] });
      toast({ title: tLabel("common.kochirildi", "Ko'chirildi") });
    },
    onError: () => toast({ title: "Xatolik", description: tLabel("common.kochirilmadi", "Ko'chirilmadi"), variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch} error={error} />;

  return (
    <ModulePage
      module="pp"
      title="Haftalik Reja"
      subtitle="EP-PP-110 — haftalik ishlab-chiqarish rejasi"
      icon={<CalendarDays className="h-5 w-5" />}
      actions={
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" data-testid="week-prev" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium whitespace-nowrap">{weekStart} … {addDays(weekStart, 6)}</span>
          <Button size="icon" variant="outline" data-testid="week-next" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" data-testid="week-today" onClick={() => setWeekStart(toISO(mondayOf(new Date())))}>{tLabel("common.buHafta", "Bu hafta")}</Button>
        </div>
      }
    >
      {isLoading ? (
        <Skeleton className="h-72 w-full rounded-lg" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {days.map((d, i) => (
            <Card key={d} className="min-h-[140px]">
              <CardContent className="p-2">
                <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-between">
                  <span>{DOW[i]}</span>
                  <span className="tabular-nums">{d.slice(5)}</span>
                </div>
                <div className="space-y-2">
                  {byDay[d].length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/60 text-center py-2">—</p>
                  ) : byDay[d].map(o => (
                    <div key={o.id} data-testid={`plan-order-${o.id}`} className="rounded-md border p-2 bg-card">
                      <div className="flex items-center gap-1 justify-between">
                        <span className="text-xs font-medium truncate">{o.order_number}</span>
                        {o.is_urgent && <Flame className="h-3 w-3 text-destructive shrink-0" />}
                      </div>
                      {o.product_name && <p className="text-[11px] text-muted-foreground truncate">{o.product_name}</p>}
                      <Badge className={`mt-1 text-[10px] ${STATUS_TONE[o.status] ?? ""}`}>{o.status}</Badge>
                      <Select value={d} onValueChange={(nd) => { if (nd !== d) rescheduleM.mutate({ id: o.id, date: nd }); }}>
                        <SelectTrigger data-testid={`move-${o.id}`} className="h-6 mt-1.5 text-[10px]">
                          <SelectValue placeholder={tLabel("common.kochirish", "Ko'chirish")} />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((td, ti) => <SelectItem key={td} value={td} className="text-xs">{DOW[ti]} {td.slice(5)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
