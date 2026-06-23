/**
 * @module MaterialUnitPriceConfig
 * @description CONFIG-MEXANIZM: material_cards.unit_price inline-edit. Real PATCH endpoint.
 * Route: /wms/material-unit-price
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MaterialCard {
  id: number | string;
  name: string;
  sku?: string;
  unit?: string;
  unitPrice?: number | null;
}

export default function MaterialUnitPriceConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: rawData, isLoading } = useQuery<MaterialCard[]>({
    queryKey: ["/api/material-cards"],
  });

  const materials: MaterialCard[] = Array.isArray(rawData) ? rawData : [];

  const patchMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      apiRequest<{ id: number; name: string; unitPrice: number }>(
        "PATCH",
        `/api/material-cards/${id}/unit-price`,
        { unit_price: price },
      ),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-cards"] });
      toast({ title: "Narx saqlandi" });
      setEditValues((prev) => { const next = { ...prev }; delete next[vars.id]; return next; });
      setSavingId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
      setSavingId(null);
    },
  });

  function handleSave(id: string | number) {
    const key = String(id);
    const raw = editValues[key];
    if (raw === undefined || raw.trim() === "") return;
    const price = Number(raw.replace(",", "."));
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: "Noto'g'ri narx", variant: "destructive" });
      return;
    }
    setSavingId(key);
    patchMutation.mutate({ id: key, price });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, id: string | number) {
    if (e.key === "Enter") handleSave(id);
    if (e.key === "Escape") setEditValues((prev) => { const next = { ...prev }; delete next[String(id)]; return next; });
  }

  const withPrice = materials.filter((m) => m.unitPrice != null).length;
  const withoutPrice = materials.length - withPrice;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Material Narxlari</h1>
          <p className="text-sm text-muted-foreground">
            Har bir material uchun birlik narxini belgilash (WMS → GL hisoblash uchun)
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Jami materiallar</p>
            <p className="text-2xl font-bold">{isLoading ? "—" : materials.length}</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Narxi bor</p>
            <p className="text-2xl font-bold text-[var(--ep-green)]">{isLoading ? "—" : withPrice}</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Narxsiz</p>
            <p className="text-2xl font-bold text-[var(--ep-red)]">{isLoading ? "—" : withoutPrice}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Narxlarni Tahrirlash</CardTitle>
          <p className="text-xs text-muted-foreground">
            Narx maydonini bosing, qiymat kiriting va Enter yoki "Saqlash" tugmasini bosing.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 w-8">#</TableHead>
                  <TableHead>Material nomi</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>O'lchov</TableHead>
                  <TableHead className="w-40">Narx (so'm)</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
                {!isLoading && materials.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Materiallar topilmadi
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && materials.map((m, idx) => {
                  const key = String(m.id);
                  const isEditing = editValues[key] !== undefined;
                  const isSaving = savingId === key;
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/40">
                      <TableCell className="pl-4 text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{m.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{m.sku || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.unit || "—"}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            autoFocus
                            type="number"
                            min={0}
                            step={100}
                            className="h-8 w-36 text-sm"
                            value={editValues[key]}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
                            onKeyDown={(e) => handleKeyDown(e, m.id)}
                            disabled={isSaving}
                          />
                        ) : (
                          <button
                            className="text-sm tabular-nums hover:underline cursor-pointer text-left w-full"
                            onClick={() => setEditValues((prev) => ({
                              ...prev,
                              [key]: m.unitPrice != null ? String(m.unitPrice) : "",
                            }))}
                          >
                            {m.unitPrice != null ? (
                              <span className="font-medium">
                                {Number(m.unitPrice).toLocaleString("uz-UZ")} so'm
                              </span>
                            ) : (
                              <Badge variant="warning" className="text-xs">Belgilanmagan</Badge>
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing && (
                          <Button
                            size="sm"
                            className="h-7 px-2 gap-1 text-xs"
                            disabled={isSaving || !editValues[key]?.trim()}
                            onClick={() => handleSave(m.id)}
                          >
                            <Save className="h-3 w-3" />
                            {isSaving ? "..." : "Saqlash"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
