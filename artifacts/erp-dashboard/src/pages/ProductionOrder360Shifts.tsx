/**
 * @module ProductionOrder360Shifts
 * @description React page component. Route-level UI.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function fmt(n: number | null | undefined, d = 0) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: d });
}

function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}s ${m}d`;
  return `${m} daqiqa`;
}

export interface ShiftSession {
  id: string | number;
  sessionNumber: string;
  workerName?: string;
  workerId?: string | number;
  status: string;
  oee?: number | null;
  targetQuantity?: number;
  actualQuantity?: number;
  defects?: number;
  defectQuantity?: number;
  availability?: number | null;
  performance?: number | null;
  quality?: number | null;
  startedAt?: string;
  endedAt?: string;
}

export interface Downtime {
  reasonDescription?: string;
  reasonCode?: string;
  eventType?: string;
  durationSeconds?: number | null;
  startedAt?: string;
  isPlanned?: boolean;
}

export interface ProductionOrder360ShiftsProps {
  sessions?: ShiftSession[];
  downtimes?: Downtime[];
  totalRunningHours?: number;
  totalStoppedHours?: number;
}

export default function ProductionOrder360Shifts({
  sessions,
  downtimes,
  totalRunningHours,
  totalStoppedHours,
}: ProductionOrder360ShiftsProps) {
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Smenalar soni</p>
            <p className="text-2xl font-bold mt-0.5">{sessions?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Ishlagan vaqt</p>
            <p className="text-2xl font-bold mt-0.5 text-[var(--ep-green)]">{totalRunningHours}s</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">To'xtash vaqti</p>
            <p className="text-2xl font-bold mt-0.5 text-[var(--ep-yellow)]">{totalStoppedHours}s</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {(sessions || []).map((sess) => (
          <Card key={sess.id}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-mono text-sm font-medium">{sess.sessionNumber}</p>
                  <p className="text-xs text-muted-foreground">{sess.workerName || sess.workerId || "—"}</p>
                </div>
                <Badge variant={sess.status === "completed" ? "default" : sess.status === "running" ? "secondary" : "outline"}>
                  {sess.status === "completed" ? "Tugatildi" : sess.status === "running" ? "Ishlayapti" : sess.status}
                </Badge>
              </div>

              {sess.oee != null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">OEE</span>
                    <span className="font-medium">{fmt(Number(sess.oee) * 100, 1)}%</span>
                  </div>
                  <Progress value={Number(sess.oee) * 100} className="h-1.5" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Reja</p>
                  <p className="font-semibold">{fmt(sess.targetQuantity)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ishlab chiq.</p>
                  <p className="font-semibold text-[var(--ep-green)]">{fmt(sess.actualQuantity)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nosoz</p>
                  <p className="font-semibold text-[var(--ep-primary)]">{fmt(sess.defectQuantity)}</p>
                </div>
              </div>

              {(sess.availability != null || sess.performance != null || sess.quality != null) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-xs border-t pt-2">
                  <div>
                    <p className="text-muted-foreground">A (mavjudlik)</p>
                    <p className="font-medium">{fmt(Number(sess.availability) * 100, 1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">P (unumdorlik)</p>
                    <p className="font-medium">{fmt(Number(sess.performance) * 100, 1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Q (sifat)</p>
                    <p className="font-medium">{fmt(Number(sess.quality) * 100, 1)}%</p>
                  </div>
                </div>
              )}

              {(sess.startedAt || sess.endedAt) && (
                <p className="text-xs text-muted-foreground mt-2">
                  {sess.startedAt ? new Date(sess.startedAt).toLocaleString("uz-UZ") : "—"}
                  {" — "}
                  {sess.endedAt ? new Date(sess.endedAt).toLocaleString("uz-UZ") : "davom etmoqda"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {(!sessions || sessions.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Smenalar ma'lumoti yo'q
            </CardContent>
          </Card>
        )}
      </div>

      {(downtimes?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">To'xtash sabablari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {downtimes?.map((dt, i) => (
              <div key={`k-${i}`} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{dt.reasonDescription || dt.reasonCode || "Sabab ko'rsatilmagan"}</p>
                  <p className="text-xs text-muted-foreground">
                    {dt.isPlanned ? "Rejalashtirilgan" : "Rejalashtirilmagan"} ·{" "}
                    {dt.startedAt ? new Date(dt.startedAt).toLocaleTimeString("uz-UZ") : "—"}
                  </p>
                </div>
                <Badge variant={dt.isPlanned ? "secondary" : "destructive"}>
                  {dt.durationSeconds ? fmtTime(Number(dt.durationSeconds)) : "—"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
