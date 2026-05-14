/**
 * WarehouseQuarantine.tsx
 * ERP — Karantindagi materiallar sahifasi.
 * QC inspektor uchun QABUL / REWORK / CHIQARISH qarorlari.
 */
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldCheck, AlertTriangle } from "lucide-react";

interface QuarantineItem {
  id: number;
  movementNumber: string;
  movementType: string;
  status: string;
  createdAt: string;
  hoursInQuarantine: number;
  supplierName: string | null;
  contractNumber: string | null;
  quantity: number | null;
  qcResult: string | null;
}

function severityColor(hours: number): { bg: string; label: string } {
  if (hours >= 48) return { bg: "bg-red-100 text-red-800 border-red-300",       label: "Kechiktirilgan" };
  if (hours >= 24) return { bg: "bg-amber-100 text-amber-800 border-amber-300", label: "Diqqat" };
  return { bg: "bg-emerald-100 text-emerald-800 border-emerald-300",            label: "Yangi" };
}

export default function WarehouseQuarantine() {
  const [items, setItems] = useState<QuarantineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiRequest<QuarantineItem[]>("GET", "/api/pos/wh-features/quarantine");
      setItems(Array.isArray(r) ? r : []);
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  async function qcDecide(id: number, decision: "QABUL" | "REWORK" | "CHIQARISH") {
    const note = prompt(`QC izoh (ixtiyoriy):`) ?? undefined;
    if (decision === "CHIQARISH" && !confirm("Ta'minotchiga qaytarishni tasdiqlaysizmi?")) return;
    setProcessing(id);
    try {
      await apiRequest("POST", `/api/pos/wh-features/movement/${id}/qc-decision`, { decision, qcNote: note });
      await load();
    } catch (e) {
      alert("Xato: " + String((e as Error).message));
    } finally { setProcessing(null); }
  }

  const stats = {
    total: items.length,
    expired: items.filter(i => i.hoursInQuarantine >= 48).length,
    pending: items.filter(i => !i.qcResult).length,
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="h-8 w-8 text-[var(--ep-yellow)]" />
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-semibold">KARANTIN</div>
          <h1 className="text-2xl font-bold">Karantindagi materiallar</h1>
          <p className="text-sm text-gray-500">QC inspektor qarori kutmoqda — 48 soatdan oshgan harakatlar avtomatik eskalatsiya qilinadi</p>
        </div>
        <Button onClick={load} variant="outline">🔄 Yangilash</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-xs text-gray-500">Jami karantinda</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-[var(--ep-yellow)]">{stats.pending}</div>
            <div className="text-xs text-gray-500">QC qarori kutmoqda</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-[var(--ep-red)]">{stats.expired}</div>
            <div className="text-xs text-gray-500">48+ soat kechiktirilgan</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--ep-blue)]" />
            <CardTitle className="text-base">Karantin ro'yxati</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && <div className="p-10 text-center text-gray-500">⏳ Yuklanmoqda...</div>}

          {!loading && items.length === 0 && (
            <div className="p-10 text-center text-gray-500">
              <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Karantinda hech narsa yo'q
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hujjat</TableHead>
                  <TableHead>Ta'minotchi</TableHead>
                  <TableHead>Shartnoma</TableHead>
                  <TableHead className="text-right">Miqdor</TableHead>
                  <TableHead>Soat</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>QC Qarori</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(it => {
                  const sev = severityColor(it.hoursInQuarantine);
                  return (
                    <TableRow key={it.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono font-semibold">{it.movementNumber}</TableCell>
                      <TableCell>{it.supplierName ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{it.contractNumber ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono">{it.quantity?.toFixed(2) ?? "—"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${sev.bg}`}>
                          {Math.floor(it.hoursInQuarantine)}h · {sev.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{it.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {it.qcResult ? (
                          <Badge className={
                            it.qcResult === "QABUL" ? "bg-emerald-500" :
                            it.qcResult === "REWORK" ? "bg-amber-500" : "bg-red-500"
                          }>{it.qcResult}</Badge>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="sm" variant="default" className="bg-emerald-600 hover:bg-[var(--ep-green)]/90 text-xs px-2 py-1 h-7"
                              disabled={processing === it.id}
                              onClick={() => void qcDecide(it.id, "QABUL")}
                            >
                              ✅ QABUL
                            </Button>
                            <Button
                              size="sm" variant="default" className="bg-amber-600 hover:bg-[var(--ep-yellow)]/90 text-xs px-2 py-1 h-7"
                              disabled={processing === it.id}
                              onClick={() => void qcDecide(it.id, "REWORK")}
                            >
                              🔄 REWORK
                            </Button>
                            <Button
                              size="sm" variant="default" className="bg-red-600 hover:bg-[var(--ep-red)]/90 text-xs px-2 py-1 h-7"
                              disabled={processing === it.id}
                              onClick={() => void qcDecide(it.id, "CHIQARISH")}
                            >
                              ❌ CHIQARISH
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      {/* Eslatma */}
      <Card className="mt-4 bg-amber-50 border-amber-200">
        <CardContent className="pt-6 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] flex-shrink-0" />
          <div className="text-sm">
            <div className="font-semibold">QC qarorlari nima qiladi:</div>
            <ul className="mt-1 space-y-1 text-xs">
              <li>✅ <b>QABUL</b> → material avtomatik <b>RM-MAIN</b> omborga ko'chiriladi va GL posting yaratiladi</li>
              <li>🔄 <b>REWORK</b> → MES moduliga signal yuboriladi (qayta ishlash kerak)</li>
              <li>❌ <b>CHIQARISH</b> → ta'minotchiga qaytarish hujjati yaratiladi, status='rejected'</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
