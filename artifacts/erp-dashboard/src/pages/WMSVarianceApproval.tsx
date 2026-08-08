/**
 * @module WMSVarianceApproval
 * @description Inventarizatsiya tafovutlarini INSON tasdig'i (Batch 5 Item 10). Egasi qarori:
 *   foiz-chegara bo'yicha avto-tasdiq YO'Q — har bir tafovut aniqlanadi/belgilangan, lekin
 *   yopishdan oldin inson tasdiqlaydi. Har tafovutda sabab-kodi bo'lishi shart.
 *   BE: GET /api/wms/inventory-counts, GET :id/variances, PATCH :id/approve.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { ClipboardCheck, ShieldAlert, CheckCircle2 } from "lucide-react";

interface CountRow { id: number; count_number?: string; status: string; warehouse_name?: string | null; variance_items?: number | null; }
interface VarianceLine { id: number; material_id?: number; item_name?: string | null; sku?: string | null; book_quantity?: string; counted_quantity?: string; variance?: string; variance_percent?: string | null; deviation_reason_code?: string | null; missing_reason?: boolean; }

const COUNTS_API = "/api/wms/inventory-counts";

export default function WMSVarianceApproval() {
  const { toast } = useToast();
  const [countId, setCountId] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const countsQ = useQuery<{ items?: CountRow[] }>({
    queryKey: [COUNTS_API, "completed"],
    queryFn: async () => apiRequest("GET", `${COUNTS_API}?status=completed`),
  });
  const counts: CountRow[] = Array.isArray(countsQ.data?.items) ? countsQ.data!.items : [];

  const varQ = useQuery<{ items?: VarianceLine[] }>({
    queryKey: [COUNTS_API, countId, "variances"],
    queryFn: async () => apiRequest("GET", `${COUNTS_API}/${countId}/variances`),
    enabled: !!countId,
  });
  const lines: VarianceLine[] = Array.isArray(varQ.data?.items) ? varQ.data!.items : [];
  const missing = lines.filter(l => l.missing_reason).length;

  const approveM = useMutation({
    mutationFn: async () => apiRequest("PATCH", `${COUNTS_API}/${countId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COUNTS_API] });
      setCountId("");
      toast({ title: tLabel("common.tasdiqlandi", "Tasdiqlandi") });
    },
    onError: (e: unknown) => toast({ title: "Xatolik", description: e instanceof Error ? e.message : tLabel("common.tasdiqlanmadi", "Tasdiqlanmadi"), variant: "destructive" }),
  });

  if (countsQ.isError) return <EPErrorState onRetry={countsQ.refetch} error={countsQ.error} />;

  return (
    <ModulePage
      module="mm"
      title={tLabel("common.tafovutTasdiqlash", "Tafovut Tasdiqlash")}
      subtitle="Inventarizatsiya tafovutlari — inson tasdig'i (avto-tasdiq yo'q)"
      icon={<ClipboardCheck className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="max-w-md">
          <Select value={countId} onValueChange={setCountId}>
            <SelectTrigger data-testid="select-count"><SelectValue placeholder={tLabel("common.inventarizatsiyaTanlang", "Inventarizatsiyani tanlang")} /></SelectTrigger>
            <SelectContent>
              {counts.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.count_number ?? `#${c.id}`}{c.warehouse_name ? ` · ${c.warehouse_name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!countId ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {tLabel("common.inventarizatsiyaTanlangTafovut", "Tafovutlarni ko'rish uchun inventarizatsiyani tanlang.")}
          </CardContent></Card>
        ) : varQ.isLoading ? (
          <Skeleton className="h-56 w-full rounded-lg" />
        ) : lines.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-[var(--ep-green)] mb-4" />
            <p className="text-muted-foreground">{tLabel("common.tafovutYoq", "Tafovut yo'q — tasdiqlashga tayyor.")}</p>
          </CardContent></Card>
        ) : (
          <>
            {missing > 0 && (
              <div className="flex items-center gap-2 text-sm rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                {tLabel("common.sababKerak", "Sabab-kodi kerak")}: <strong>{missing}</strong> {tLabel("common.tafovut", "tafovut")}
              </div>
            )}
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tLabel("common.material", "Material")}</TableHead>
                      <TableHead>{tLabel("common.kitob", "Kitob")}</TableHead>
                      <TableHead>{tLabel("common.sanoq", "Sanoq")}</TableHead>
                      <TableHead>{tLabel("common.tafovut", "Tafovut")}</TableHead>
                      <TableHead>{tLabel("common.sabab", "Sabab")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map(l => (
                      <TableRow key={l.id} data-testid={`variance-row-${l.id}`}>
                        <TableCell className="font-medium">{l.item_name ?? l.sku ?? `#${l.material_id}`}</TableCell>
                        <TableCell className="text-muted-foreground">{l.book_quantity ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{l.counted_quantity ?? "—"}</TableCell>
                        <TableCell className="font-medium">{l.variance ?? "—"}</TableCell>
                        <TableCell>
                          {l.missing_reason
                            ? <Badge variant="destructive">{tLabel("common.sababYoq", "Sabab yo'q")}</Badge>
                            : <span className="text-xs font-mono">{l.deviation_reason_code}</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button
                data-testid="button-approve-count"
                disabled={missing > 0 || approveM.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> {tLabel("common.insonTasdigi", "Inson tasdig'i bilan yopish")}
              </Button>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={tLabel("common.tasdiqlashniTasdiq", "Tasdiqlashni tasdiqlang")}
        description={tLabel("common.tafovutTasdiqTavsif", "Tafovutlar inson tomonidan tasdiqlanadi va inventarizatsiya yopiladi. Bu amalni qaytarib bo'lmaydi.")}
        confirmText={tLabel("common.tasdiqlash", "Tasdiqlash")}
        onConfirm={() => { setConfirmOpen(false); approveM.mutate(); }}
      />
    </ModulePage>
  );
}
