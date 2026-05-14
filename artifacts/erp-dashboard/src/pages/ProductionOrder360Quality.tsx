/**
 * @module ProductionOrder360Quality
 * @description React page component. Route-level UI.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STAGE_LABELS: Record<string, string> = {
  incoming: "Kirish nazorat",
  process:  "Jarayon nazorat",
  outgoing: "Chiqish nazorat",
};

function fmt(n: number | null | undefined, d = 0) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: d });
}

export interface DefectType { type: string; count: number; decision?: string }
export interface QcCheck {
  id: string | number;
  checkStage: string;
  failedQty: number;
  checkedQty: number;
  passedQty: number;
  defectTypes?: DefectType[];
  notes?: string;
  checkerName?: string;
  checkedAt?: string;
}

export interface ProductionOrder360QualityProps {
  qcPassRate: number;
  totalChecked?: number;
  totalFailed?: number;
  checks?: QcCheck[];
}

export default function ProductionOrder360Quality({
  qcPassRate,
  totalChecked,
  totalFailed,
  checks,
}: ProductionOrder360QualityProps) {
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">QC o'tish darajasi</p>
            <p className={`text-2xl font-bold mt-0.5 ${qcPassRate >= 95 ? "text-[var(--ep-green)]" : qcPassRate >= 85 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
              {qcPassRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Tekshirilgan</p>
            <p className="text-2xl font-bold mt-0.5">{fmt(totalChecked)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Rad etilgan</p>
            <p className="text-2xl font-bold mt-0.5 text-[var(--ep-red)]">{fmt(totalFailed)}</p>
          </CardContent>
        </Card>
      </div>

      {(checks || []).map((check) => (
        <Card key={check.id}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">
              {STAGE_LABELS[check.checkStage] || check.checkStage}
            </CardTitle>
            <Badge variant={check.failedQty > 0 ? "destructive" : "default"}>
              {check.failedQty > 0 ? `${check.failedQty} rad` : "O'tdi"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Tekshirildi</p>
                <p className="font-bold">{fmt(check.checkedQty)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">O'tdi</p>
                <p className="font-bold text-[var(--ep-green)]">{fmt(check.passedQty)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Rad etildi</p>
                <p className="font-bold text-[var(--ep-red)]">{fmt(check.failedQty)}</p>
              </div>
            </div>

            {check.defectTypes && Array.isArray(check.defectTypes) && check.defectTypes.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Nuqson turlari:</p>
                {check.defectTypes.map((dt, i) => (
                  <div key={`k-${i}`} className="flex items-center justify-between text-xs">
                    <span>{dt.type || "Noma'lum"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{fmt(dt.count)} dona</span>
                      <Badge variant="outline" className="text-xs">{dt.decision || "—"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {check.notes && (
              <p className="mt-2 text-xs text-muted-foreground">{check.notes}</p>
            )}

            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <span>{check.checkerName || "—"}</span>
              {check.checkedAt && <span>· {new Date(check.checkedAt).toLocaleString("uz-UZ")}</span>}
            </div>
          </CardContent>
        </Card>
      ))}

      {(!checks || checks.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            QC nazorat ma'lumotlari yo'q
          </CardContent>
        </Card>
      )}
    </div>
  );
}
