import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import { InventoryCountData, InventoryCountLineData } from "./types";
import { useInventoryCountTranslations } from "./useInventoryCountTranslations";

interface ItemCountFormProps {
  countDetail: InventoryCountData | undefined;
  isLoading: boolean;
  lineUpdates: Record<string, { countedQuantity: number; reason: string }>;
  onLineChange: (lineId: string, field: "countedQuantity" | "reason", value: string | number) => void;
}

export function ItemCountForm({ countDetail, isLoading, lineUpdates, onLineChange }: ItemCountFormProps) {
  const t = useInventoryCountTranslations();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-2">
          {([...Array(5)]).map((_, i) => (
            <Skeleton key={`k-${i}`} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const isEditable = countDetail?.status === "in_progress";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          {t.table.totalItems}: {countDetail?.lines?.length || 0}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.detail.materialCode}</TableHead>
                <TableHead>{t.detail.materialName}</TableHead>
                <TableHead className="text-right">{t.detail.bookQuantity}</TableHead>
                <TableHead className="text-right">{t.detail.countedQuantity}</TableHead>
                <TableHead className="text-right">{t.detail.variance}</TableHead>
                <TableHead className="text-right">{t.detail.variancePercent}</TableHead>
                <TableHead>{t.detail.reason}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countDetail?.lines?.map((line: InventoryCountLineData) => {
                const localUpdate = lineUpdates[line.id];
                const displayedQuantity = localUpdate?.countedQuantity ?? line.countedQuantity ?? "";
                const displayedReason = localUpdate?.reason ?? line.reason ?? "";
                const variance = line.variance ?? 0;
                const variancePercent = line.variancePercent ?? 0;

                return (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.materialCode}</TableCell>
                    <TableCell>{line.materialName}</TableCell>
                    <TableCell className="text-right font-medium">{line.bookQuantity}</TableCell>
                    <TableCell className="text-right w-[120px]">
                      {isEditable ? (
                        <Input
                          type="number"
                          value={displayedQuantity}
                          onChange={(e) => onLineChange(line.id, "countedQuantity", parseFloat(e.target.value) || 0)}
                          className="text-right"
                          data-testid={`input-qty-${line.id}`}
                        />
                      ) : (
                        line.countedQuantity ?? "-"
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${variance < 0 ? "text-red-500" : variance > 0 ? "text-green-500" : ""}`}>
                      {variance > 0 ? "+" : ""}{variance}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${variance < 0 ? "text-red-500" : variance > 0 ? "text-green-500" : ""}`}>
                      {variancePercent > 0 ? "+" : ""}{variancePercent}%
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Textarea
                          value={displayedReason}
                          onChange={(e) => onLineChange(line.id, "reason", e.target.value)}
                          className="min-h-[40px] resize-none"
                          placeholder={t.detail.reason}
                          data-testid={`input-reason-${line.id}`}
                        />
                      ) : (
                        line.reason || "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
