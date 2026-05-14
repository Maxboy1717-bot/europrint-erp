/**
 * @module InventoryTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtQty, fmtDate, fmtNum } from "@/components/wms/helpers";
import type { InventoryData, MaterialBasic } from "@/components/wms/wms-types";
import { useTranslation } from '@/lib/i18n';

interface InventoryTabProps {
  inventory: InventoryData | null | undefined;
  basic: MaterialBasic;
}

export function InventoryTab({ inventory, basic }: InventoryTabProps) {
  const { t } = useTranslation("common");
  if (!inventory) return <div className="text-muted-foreground text-sm py-8 text-center">{t("inventarizatsiyaMalumotlariYoq")}</div>;

  return (
    <div className="space-y-4">
      {inventory.lastCountDate && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("songgiInventarizatsiya")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: "Sana", value: fmtDate(inventory.lastCountDate) },
              { label: "Natija", value: inventory.lastCountResult === "matched" ? "Mos keldi" : "Farq topildi" },
            ]).map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${inventory.lastCountResult === "matched" ? "text-[var(--ep-green)]" : "text-[var(--ep-yellow)]"}`}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Yo'qolgan (12 oy)</p>
          <p className="text-2xl font-bold text-destructive">{fmtQty(inventory.discrepancyAnalysis?.totalLoss12m, basic.unitOfMeasure)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Ortiqcha (12 oy)</p>
          <p className="text-2xl font-bold text-[var(--ep-green)]">{fmtQty(inventory.discrepancyAnalysis?.totalSurplus12m, basic.unitOfMeasure)}</p>
        </CardContent></Card>
      </div>
      {(inventory.history || []).length > 0 ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t("inventarizatsiyaTarixi")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>{(["Sana", "Hujjat №", "Hisob", "Haqiqiy", "Farq", "Holat"]).map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(inventory.history || []).map((c) => (
                    <tr key={c.countId} className="border-b hover-elevate">
                      <td className="px-4 py-2">{fmtDate(c.countDate)}</td>
                      <td className="px-4 py-2 font-mono text-xs">{c.countNumber || "—"}</td>
                      <td className="px-4 py-2">{fmtQty(c.bookQuantity, basic.unitOfMeasure)}</td>
                      <td className="px-4 py-2">{fmtQty(c.countedQuantity, basic.unitOfMeasure)}</td>
                      <td className={`px-4 py-2 font-medium ${fmtNum(c.variance) < 0 ? "text-destructive" : fmtNum(c.variance) > 0 ? "text-[var(--ep-green)]" : ""}`}>
                        {fmtNum(c.variance) !== 0 ? fmtQty(c.variance, basic.unitOfMeasure) : "Mos"}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={c.countStatus === "completed" ? "default" : "secondary"}>{c.countStatus || "—"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">{t("inventarizatsiyaTarixiTopilmadi")}</CardContent></Card>
      )}
    </div>
  );
}
