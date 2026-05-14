/**
 * @module ProductionOrder360Equipment
 * @description React page component. Route-level UI.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function fmt(n: number | null | undefined, d = 0) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: d });
}

export interface EquipItem { id: string | number; name?: string; equipmentType?: string; location?: string; status?: string }
export interface EquipSession { equipmentId: string | number; actualQuantity?: number | null; oee?: number | null }

export interface ProductionOrder360EquipmentProps {
  list?: EquipItem[];
  sessions?: EquipSession[];
}

export default function ProductionOrder360Equipment({ list, sessions }: ProductionOrder360EquipmentProps) {
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
      {(list || []).map((equip) => {
        const equipSessions = (sessions || []).filter((s) => s.equipmentId === equip.id);
        const totalProd = equipSessions.reduce((a, s) => a + Number(s.actualQuantity || 0), 0);
        const withOee = equipSessions.filter((s) => s.oee != null);
        const oeeAvg = withOee.length > 0
          ? withOee.reduce((a, s) => a + Number(s.oee), 0) / withOee.length
          : null;

        return (
          <Card key={equip.id}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">{equip.name || equip.id}</CardTitle>
                <p className="text-xs text-muted-foreground">{equip.equipmentType || "—"} · {equip.location || "—"}</p>
              </div>
              <Badge variant={equip.status === "active" ? "default" : "secondary"}>
                {equip.status || "—"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Smenalar</p>
                  <p className="font-bold">{equipSessions.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Jami ishlab chiq.</p>
                  <p className="font-bold">{fmt(totalProd)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">O'rtacha OEE</p>
                  <p className={`font-bold ${oeeAvg != null && oeeAvg >= 0.85 ? "text-[var(--ep-green)]" : oeeAvg != null && oeeAvg >= 0.65 ? "text-[var(--ep-yellow)]" : "text-muted-foreground"}`}>
                    {oeeAvg != null ? `${fmt(oeeAvg * 100, 1)}%` : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {(!list || list.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Uskuna ma'lumotlari yo'q
          </CardContent>
        </Card>
      )}
    </div>
  );
}
