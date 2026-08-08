/**
 * @module PPQueue
 * @description Stanok navbati (EP-PP-085 "Очеред", Batch 5 Item 4). Bitta work_center tanlanadi,
 *   uning ishlab-chiqarish buyurtmalari operator ko'radigan navbat raqami bo'yicha ko'rsatiladi;
 *   yuqori/past tugmalari bilan qayta tartiblanadi va real saqlanadi (/api/pp/orders/queue/reorder).
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { ListOrdered, ChevronUp, ChevronDown, Save, Flame } from "lucide-react";

interface WorkCenter { id: string | number; name: string; }
interface QueueOrder {
  id: number;
  order_number: string;
  product_name?: string | null;
  status: string;
  priority: number;
  is_urgent: boolean;
  queue_sequence: number | null;
}

export default function PPQueue() {
  const { toast } = useToast();
  const [wcId, setWcId] = useState<string>("");
  const [ordered, setOrdered] = useState<QueueOrder[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data: wcRaw } = useQuery<WorkCenter[] | { data?: WorkCenter[] }>({
    queryKey: ["/api/pp/work-centers"],
    queryFn: async () => apiRequest("GET", "/api/pp/work-centers"),
  });
  const workCenters: WorkCenter[] = Array.isArray(wcRaw) ? wcRaw : (wcRaw?.data ?? []);

  const { data: qRaw, isLoading, isError, error, refetch } = useQuery<{ data?: QueueOrder[] }>({
    queryKey: ["/api/pp/orders/queue", wcId],
    queryFn: async () => apiRequest("GET", `/api/pp/orders/queue/${wcId}`),
    enabled: !!wcId,
  });

  useEffect(() => {
    const list = Array.isArray(qRaw?.data) ? qRaw!.data : [];
    setOrdered(list);
    setDirty(false);
  }, [qRaw]);

  const reorderMutation = useMutation({
    mutationFn: async () =>
      apiRequest("PATCH", "/api/pp/orders/queue/reorder", {
        workCenterId: wcId,
        orderedIds: ordered.map(o => o.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pp/orders/queue", wcId] });
      setDirty(false);
      toast({ title: tLabel("common.navbatSaqlandi", "Navbat saqlandi") });
    },
    onError: () => toast({ title: "Xatolik", description: tLabel("common.navbatSaqlanmadi", "Navbat saqlanmadi"), variant: "destructive" }),
  });

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= ordered.length) return;
    const next = [...ordered];
    [next[idx], next[j]] = [next[j], next[idx]];
    setOrdered(next);
    setDirty(true);
  };

  if (isError) return <EPErrorState onRetry={refetch} error={error} />;

  return (
    <ModulePage
      module="pp"
      title="Stanok Navbati"
      subtitle="EP-PP-085 «Очеред» — operator ko'radigan navbat raqami"
      icon={<ListOrdered className="h-5 w-5" />}
      actions={
        <Button
          data-testid="button-save-queue"
          disabled={!dirty || reorderMutation.isPending || !wcId}
          onClick={() => reorderMutation.mutate()}
        >
          <Save className="h-4 w-4 mr-1" /> {tLabel("common.navbatniSaqlash", "Navbatni saqlash")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="max-w-sm">
          <Select value={wcId} onValueChange={setWcId}>
            <SelectTrigger data-testid="select-work-center">
              <SelectValue placeholder={tLabel("common.stanokniTanlang", "Stanokni tanlang")} />
            </SelectTrigger>
            <SelectContent>
              {workCenters.map(w => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!wcId ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {tLabel("common.stanokniTanlangNavbat", "Navbatni ko'rish uchun stanokni tanlang.")}
          </CardContent></Card>
        ) : isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : ordered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {tLabel("common.navbatBosh", "Bu stanokda navbatga qo'yilgan buyurtma yo'q.")}
          </CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {ordered.map((o, idx) => (
                <div key={o.id} data-testid={`queue-row-${o.id}`} className="flex items-center gap-3 p-3">
                  <div className="h-8 w-8 rounded-full bg-[var(--mod-pp,#6366f1)]/10 flex items-center justify-center font-semibold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{o.order_number}</span>
                      {o.is_urgent && <Badge variant="destructive" className="text-xs gap-1"><Flame className="h-3 w-3" /> ZARUR</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{o.product_name ?? "—"} · {o.status}</p>
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <Button size="icon" variant="ghost" className="h-6 w-6" data-testid={`up-${o.id}`}
                      disabled={idx === 0} onClick={() => move(idx, -1)}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" data-testid={`down-${o.id}`}
                      disabled={idx === ordered.length - 1} onClick={() => move(idx, 1)}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ModulePage>
  );
}
