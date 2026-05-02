import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Lang } from "./warehouse-types";

interface InventarizatsiyaPanelProps {
  lang: Lang;
}

interface InventoryItem {
  id: string;
  binCode?: string;
  location?: string;
  materialCode?: string;
  materialName?: string;
  expectedQty?: number;
  unit?: string;
  row?: string;
  shelf?: string;
  level?: string;
  zone?: { name?: string };
}

export function InventarizatsiyaPanel({ lang }: InventarizatsiyaPanelProps) {
  const { toast } = useToast();
  const [actuals, setActuals] = useState<Record<string, string>>({});

  const { data: binsRaw = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/warehouse/bins"]
  });

  const inventoryItems = (Array.isArray(binsRaw) ? binsRaw : []).map(bin => ({
    id: bin.id,
    location: bin.binCode || bin.location || `${bin.row || ""}${bin.shelf || ""}${bin.level || ""}`,
    materialCode: bin.materialCode || "—",
    materialName: bin.materialName || `Bin: ${bin.binCode || bin.id}`,
    expectedQty: bin.expectedQty ?? 0,
    unit: bin.unit || "dona",
  }));

  const counted = Object.keys(actuals).filter(k => actuals[k] !== "").length;

  function handleSave() {
    const adjustments = (Array.isArray(inventoryItems) ? inventoryItems : []).map(item => {
      const actual = parseFloat(actuals[item.id] || "0");
      return { ...item, actualQty: actual, diff: actual - item.expectedQty };
    });
    const negAdjustments = (Array.isArray(adjustments) ? adjustments : []).filter(a => a.diff < 0).length;
    const posAdjustments = (Array.isArray(adjustments) ? adjustments : []).filter(a => a.diff > 0).length;
    toast({
      title: lang === "uz" ? "Inventarizatsiya saqlandi" : "Инвентаризация сохранена",
      description: lang === "uz"
        ? `${negAdjustments} kamayish, ${posAdjustments} oshish`
        : `${negAdjustments} убывание, ${posAdjustments} прибавление`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">
              {lang === "uz" ? "Inventarizatsiya" : "Инвентаризация"}
            </CardTitle>
            <Badge variant="outline">{counted}/{inventoryItems.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActuals({})}
              data-testid="btn-reset-inventory"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {lang === "uz" ? "Tozalash" : "Очистить"}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={counted === 0}
              data-testid="btn-save-inventory"
            >
              {lang === "uz" ? "Saqlash" : "Сохранить"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3, 4]).map(i => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">
              {lang === "uz" ? "Ombor binklari mavjud emas" : "Ячейки склада не найдены"}
            </p>
            <p className="text-sm mt-1 opacity-70">
              {lang === "uz"
                ? "Inventarizatsiya uchun avval ombor binklari qo'shilishi kerak"
                : "Для инвентаризации сначала добавьте ячейки склада"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "uz" ? "Joylashuv" : "Расположение"}</TableHead>
                <TableHead>{lang === "uz" ? "Kod" : "Код"}</TableHead>
                <TableHead>{lang === "uz" ? "Material" : "Материал"}</TableHead>
                <TableHead>{lang === "uz" ? "Kutilgan" : "Ожидаемое"}</TableHead>
                <TableHead>{lang === "uz" ? "Haqiqiy" : "Фактическое"}</TableHead>
                <TableHead>{lang === "uz" ? "Farq" : "Разница"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(inventoryItems) ? inventoryItems : []).map(item => {
                const actual = actuals[item.id];
                const actualNum = actual !== undefined && actual !== "" ? parseFloat(actual) : null;
                const diff = actualNum !== null ? actualNum - item.expectedQty : null;
                return (
                  <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                    <TableCell className="font-mono">{item.location}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.materialCode}</TableCell>
                    <TableCell>{item.materialName}</TableCell>
                    <TableCell>{item.expectedQty} {item.unit}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={actuals[item.id] || ""}
                        onChange={e => setActuals(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-24 h-8"
                        placeholder="0"
                        data-testid={`input-inventory-${item.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      {diff !== null ? (
                        <Badge
                          className={diff < 0
                            ? "bg-red-500/20 text-red-400 border-red-500/40"
                            : diff > 0
                              ? "bg-green-500/20 text-green-400 border-green-500/40"
                              : "bg-gray-500/20 text-on-surface-variant border-gray-500/40"
                          }
                        >
                          {diff > 0 ? "+" : ""}{diff} {item.unit}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
