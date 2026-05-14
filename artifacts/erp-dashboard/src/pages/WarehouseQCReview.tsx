/**
 * WarehouseQCReview.tsx
 * ERP — QC inspektor uchun ko'rib chiqish sahifasi
 * URL: /wms/qc-review
 *
 * QC kutmoqda statusidagi barcha materiallarni ko'rsatadi, har biri uchun
 * tafsilotli ko'rinish va QABUL / REWORK / CHIQARISH qarorlari.
 */
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, XCircle, Eye } from "lucide-react";

import { useTranslation } from '@/lib/i18n';
interface QcMovement {
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

interface MovementLine {
  id: number;
  material_card_id: number;
  material_name?: string;
  quantity: number;
  unit: string;
}

const STATUS_COLORS: Record<string, string> = {
  karantin:  "bg-amber-100 text-amber-800",
  qc_review: "bg-blue-100 text-blue-800",
  qc_pending:"bg-violet-100 text-violet-800",
};

export default function WarehouseQCReview() {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<QcMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QcMovement | null>(null);
  const [lines, setLines] = useState<MovementLine[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [decision, setDecision] = useState<"QABUL" | "REWORK" | "CHIQARISH" | null>(null);
  const [qcNote, setQcNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiRequest<QcMovement[]>("GET", "/api/pos/wh-features/quarantine");
      setItems(Array.isArray(r) ? r : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const loadLines = async (movement: QcMovement) => {
    setSelected(movement);
    setLines([]);
    setLinesLoading(true);
    setDecision(null);
    setQcNote("");
    try {
      const det = await apiRequest<{ lines?: MovementLine[] }>("GET", `/api/pos/movements/${movement.id}`);
      setLines(det?.lines ?? []);
    } catch { setLines([]); }
    finally { setLinesLoading(false); }
  };

  const submitDecision = async () => {
    if (!selected || !decision) return;
    if (decision === "CHIQARISH" && !confirm("Materialni ta'minotchiga qaytarishga tasdiqlaysizmi?")) return;
    setProcessing(true);
    try {
      await apiRequest("POST", `/api/pos/wh-features/movement/${selected.id}/qc-decision`, {
        decision, qcNote: qcNote || undefined,
      });
      setSelected(null);
      await load();
    } catch (e) {
      alert("Xato: " + String((e as Error).message));
    } finally { setProcessing(false); }
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-8 w-8 text-[var(--ep-blue)]" />
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-semibold">QC INSPEKTOR</div>
          <h1 className="text-2xl font-bold">{t("sifatNazoratiKoribChiqish")}</h1>
          <p className="text-sm text-gray-500">QC qarori kutayotgan materiallar — QABUL / REWORK / CHIQARISH</p>
        </div>
        <Button onClick={load} variant="outline">🔄</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Movements list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              QC navbat ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[70vh] overflow-y-auto">
            {loading && <div className="p-6 text-center text-gray-500">{t("yuklanmoqda")}</div>}
            {!loading && items.length === 0 && (
              <div className="p-6 text-center text-gray-400">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50 text-emerald-400" />
                {t("qcKutayotganHechNarsaYoq")}
              </div>
            )}
            {!loading && items.map(it => (
              <button
                key={it.id}
                onClick={() => loadLines(it)}
                className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                  selected?.id === it.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-mono font-bold text-sm">{it.movementNumber}</div>
                  <Badge className={STATUS_COLORS[it.status] ?? "bg-gray-100"} variant="outline">
                    {it.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600">{it.supplierName ?? "—"}</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span>{it.contractNumber ?? "—"}</span>
                  <span className="ml-auto">
                    {it.hoursInQuarantine >= 48 ? "🔴" : it.hoursInQuarantine >= 24 ? "🟡" : "🟢"}
                    {Math.floor(it.hoursInQuarantine)}h
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Right: Detail + decision */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-gray-400">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <div className="font-semibold">{t("movementTanlang")}</div>
                <div className="text-sm mt-1">{t("chapMenyudanQcKutayotganMovementlardan")}</div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-4">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {selected.movementNumber}
                        <Badge variant="outline">{selected.movementType}</Badge>
                      </CardTitle>
                      <div className="text-sm text-gray-500 mt-1">{selected.supplierName ?? "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{t("karantinda")}</div>
                      <div className="font-bold">
                        {selected.hoursInQuarantine >= 48 ? "🔴" : selected.hoursInQuarantine >= 24 ? "🟡" : "🟢"}
                        {" "}
                        {Math.floor(selected.hoursInQuarantine)} soat
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">{t("shartnoma1")}</div>
                      <div className="font-mono">{selected.contractNumber ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t("quantity")}</div>
                      <div className="font-mono">{selected.quantity ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t("Yaratilgan")}</div>
                      <div>{new Date(selected.createdAt).toLocaleString("uz-UZ")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t("status28")}</div>
                      <Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lines */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-sm">📋 Material qatorlari ({lines.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {linesLoading && <div className="p-4 text-center text-sm text-gray-500">⏳</div>}
                  {!linesLoading && lines.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-400">{t("qatorlarYoq")}</div>
                  )}
                  {!linesLoading && lines.length > 0 && (
                    <div className="ep-table-scroll"><Table>
                      <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow>
                          <TableHead>{t('Material')}</TableHead>
                          <TableHead className="text-right">{t("quantity")}</TableHead>
                          <TableHead>{t("unit")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lines.map(l => (
                          <TableRow key={l.id} className="hover:bg-muted/40 transition-colors">
                            <TableCell>{l.material_name ?? `#${l.material_card_id}`}</TableCell>
                            <TableCell className="text-right font-mono">{Number(l.quantity).toFixed(2)}</TableCell>
                            <TableCell>{l.unit}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table></div>
                  )}
                </CardContent>
              </Card>

              {/* Decision */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">🎯 QC qarori</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      onClick={() => setDecision("QABUL")}
                      variant={decision === "QABUL" ? "default" : "outline"}
                      className={decision === "QABUL" ? "bg-emerald-600 hover:bg-[var(--ep-green)]/90" : ""}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> QABUL
                    </Button>
                    <Button
                      onClick={() => setDecision("REWORK")}
                      variant={decision === "REWORK" ? "default" : "outline"}
                      className={decision === "REWORK" ? "bg-amber-600 hover:bg-[var(--ep-yellow)]/90" : ""}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" /> REWORK
                    </Button>
                    <Button
                      onClick={() => setDecision("CHIQARISH")}
                      variant={decision === "CHIQARISH" ? "default" : "outline"}
                      className={decision === "CHIQARISH" ? "bg-red-600 hover:bg-[var(--ep-red)]/90" : ""}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> CHIQARISH
                    </Button>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">QC izoh (ixtiyoriy)</label>
                    <textarea
                      value={qcNote}
                      onChange={e => setQcNote(e.target.value)}
                      placeholder={t("tekshiruvNatijasiSababQoshimchaIzoh")}
                      className="w-full p-2 border border-gray-200 rounded text-sm"
                      rows={3}
                    />
                  </div>

                  {decision && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-[var(--ep-yellow)] flex-shrink-0 mt-0.5" />
                      <div>
                        <b>{decision}</b> qaroridan keyin:
                        <ul className="mt-1 space-y-0.5 ml-3 list-disc">
                          {decision === "QABUL" && (
                            <>
                              <li>{t("materialRmMainOmborgaAvtomatik")}</li>
                              <li>{t("statusApprovedCompleted")}</li>
                              <li>GL posting avtomatik yaratiladi</li>
                            </>
                          )}
                          {decision === "REWORK" && (
                            <>
                              <li>MES moduliga signal yuboriladi</li>
                              <li>{t("ishlabChiqarishQaytaIshlashUchun")}</li>
                            </>
                          )}
                          {decision === "CHIQARISH" && (
                            <>
                              <li>{t('statusRejected')}</li>
                              <li>{t("taminotchigaQaytarishHujjatiYaratiladi")}</li>
                              <li>{t("moliyaBolimgaXabarBoradi")}</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={submitDecision}
                    disabled={!decision || processing}
                    className="w-full bg-blue-600 hover:bg-[var(--ep-blue)]/90"
                  >
                    {processing ? "⏳ Yuborilmoqda..." : `✅ ${decision ?? "Qaror"}ni tasdiqlash`}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
