/**
 * @module ProductionOrder360Cost
 * @description React page component. Route-level UI.
 */

import { Coins, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useTranslation } from '@/lib/i18n';
function fmt(n: number | null | undefined, d = 0) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: d });
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 }) + " so'm";
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: React.ReactNode; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color || ""}`}>{value}</p>
          </div>
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color || "text-muted-foreground"}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

export interface CostComponent {
  id: string | number;
  materialName?: string;
  rawMaterialId?: string | number;
  issuedQuantity?: number;
  unit?: string;
  materialUnit?: string;
  totalActualCost?: number;
  totalPlannedCost?: number;
}

export interface ProductionOrder360CostProps {
  plannedCost?: number;
  actualCost?: number;
  variance?: number;
  variancePct?: number;
  materialCost?: number;
  components?: CostComponent[];
}

export default function ProductionOrder360Cost({plannedCost,
  actualCost,
  variance,
  variancePct,
  materialCost,
  components,
}: ProductionOrder360CostProps) {
  const { t } = useTranslation('common');
  const v = variance ?? 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <KpiCard icon={Coins} label="Reja tannarx" value={fmtMoney(plannedCost)} color="text-muted-foreground" />
        <KpiCard
          icon={v > 0 ? TrendingUp : TrendingDown}
          label="Haqiqiy tannarx"
          value={fmtMoney(actualCost)}
          color={v > 0 ? "text-[var(--ep-red)]" : v < 0 ? "text-[var(--ep-green)]" : "text-muted-foreground"}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tannarx tahlili</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          <InfoRow label="Reja tannarx" value={fmtMoney(plannedCost)} />
          <InfoRow label="Haqiqiy tannarx" value={fmtMoney(actualCost)} />
          <InfoRow
            label="Og'ish"
            value={
              <span className={v > 0 ? "text-[var(--ep-red)]" : v < 0 ? "text-[var(--ep-green)]" : ""}>
                {v > 0 ? "+" : ""}
                {fmtMoney(variance)}
                {" "}
                ({v > 0 ? "+" : ""}{variancePct}%)
              </span>
            }
          />
          <InfoRow label={t('materialXarajati')} value={fmtMoney(materialCost)} />
        </CardContent>
      </Card>

      {(components?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Material xarajatlar tafsiloti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(components || []).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.materialName || c.rawMaterialId}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{fmt(c.issuedQuantity, 2)} {c.unit || c.materialUnit}</span>
                    <span className={`font-medium ${(c.totalActualCost ?? 0) > (c.totalPlannedCost ?? 0) ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}`}>
                      {fmtMoney(c.totalActualCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
