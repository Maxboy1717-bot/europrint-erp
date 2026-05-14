/**
 * @module ProductionOrder360Bom
 * @description React page component. Route-level UI.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function fmt(n: number | null | undefined, d = 0) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: d });
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 }) + " so'm";
}

export interface MaterialComponent {
  id: string | number;
  materialName?: string;
  rawMaterialId?: string | number;
  requiredQuantity?: number;
  issuedQuantity?: number;
  diff?: number;
  unit?: string;
  materialUnit?: string;
  totalPlannedCost?: number;
  totalActualCost?: number;
}

export interface ProductionOrder360BomProps {
  totalPlannedCost?: number;
  totalActualCost?: number;
  components?: MaterialComponent[];
}

export default function ProductionOrder360Bom({
  totalPlannedCost,
  totalActualCost,
  components,
}: ProductionOrder360BomProps) {
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Reja material xarajati</p>
            <p className="text-xl font-bold mt-0.5">{fmtMoney(totalPlannedCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Haqiqiy material xarajati</p>
            <p className={`text-xl font-bold mt-0.5 ${(totalActualCost ?? 0) > (totalPlannedCost ?? 0) ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}`}>
              {fmtMoney(totalActualCost)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {(components || []).map((c) => {
          const pct = (c.requiredQuantity ?? 0) > 0 ? ((c.issuedQuantity ?? 0) / (c.requiredQuantity ?? 1)) * 100 : 0;
          const overuse = Number(c.diff || 0) > 0;
          return (
            <Card key={c.id}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{c.materialName || `Material ${c.rawMaterialId}`}</p>
                    <p className="text-xs text-muted-foreground">{c.unit || c.materialUnit || "—"}</p>
                  </div>
                  {c.diff !== 0 && (
                    <Badge variant={overuse ? "destructive" : "default"} className="shrink-0">
                      {overuse ? "+" : ""}{fmt(c.diff, 2)} ortiqcha
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Sarflash</span>
                    <span>{fmt(c.issuedQuantity, 2)} / {fmt(c.requiredQuantity, 2)}</span>
                  </div>
                  <Progress value={Math.min(110, pct)} className="h-1.5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Reja tannarx</p>
                    <p className="font-medium">{fmtMoney(c.totalPlannedCost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Haqiqiy tannarx</p>
                    <p className={`font-medium ${(c.totalActualCost ?? 0) > (c.totalPlannedCost ?? 0) ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}`}>
                      {fmtMoney(c.totalActualCost)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!components || components.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Material ma'lumotlari yo'q
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
