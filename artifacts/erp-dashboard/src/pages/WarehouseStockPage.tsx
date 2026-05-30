/**
 * @module WarehouseStockPage
 * @description Bitta ombor qoldig'i (/wms/warehouse-stock/:id) — material kartochka bo'yicha joriy stok
 *   + CHIQIM (iste'mol/sarf) amali. P2P qabul (§7.7) tovarni warehouse_stock ga prixod qiladi; bu sahifa
 *   qoldiqni ko'rsatadi va chiqim qiladi. Config-driven toza UI (EP/ui + semantic token + tLabel).
 */
import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Warehouse, ArrowLeft, Package, Minus, Plus, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { warehouseApi, type WarehouseStock, type WarehouseStockLine, type MaterialMovement } from "@/lib/api/warehouse.api";

const MOVEMENT_LABEL: Record<string, string> = {
  RECEIVE: "Kirim",
  ISSUE: "Chiqim",
  INTERNAL_ISSUE: "Ichki chiqim",
  TRANSFER: "Ko'chirish",
  ADJUST: "Tuzatish",
};

function fmtQty(n: number): string {
  const v = Number(n) || 0;
  return v % 1 === 0 ? String(v) : v.toFixed(2);
}

export default function WarehouseStockPage() {
  const params = useParams<{ id?: string }>();
  const id = params.id ?? "";
  const { toast } = useToast();
  const [data, setData] = useState<WarehouseStock | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [opFor, setOpFor] = useState<WarehouseStockLine | null>(null);
  const [opMode, setOpMode] = useState<"issue" | "receive">("issue");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [historyFor, setHistoryFor] = useState<WarehouseStockLine | null>(null);
  const [history, setHistory] = useState<MaterialMovement[] | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoaded(false);
    warehouseApi
      .stock(id)
      .then((d) => setData(d))
      .catch((e) =>
        toast({ title: tLabel("common.warehouseStock.error", "Xato"), description: String((e as Error).message), variant: "destructive" }),
      )
      .finally(() => setLoaded(true));
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openOp = (line: WarehouseStockLine, mode: "issue" | "receive") => {
    setOpFor(line);
    setOpMode(mode);
    setQty("");
    setReason("");
  };

  const submitOp = async () => {
    if (!opFor) return;
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) {
      toast({ title: tLabel("common.warehouseStock.qtyInvalid", "Miqdor musbat bo'lishi kerak"), variant: "destructive" });
      return;
    }
    if (opMode === "issue" && q > opFor.available) {
      toast({ title: tLabel("common.warehouseStock.qtyTooBig", "Mavjud qoldiqdan ko'p"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const body = { materialId: opFor.materialId, quantity: q, unit: opFor.unit, reason: reason || undefined };
      if (opMode === "issue") {
        await warehouseApi.issue(id, body);
        toast({ title: tLabel("common.warehouseStock.issued", "Chiqim bajarildi") });
      } else {
        await warehouseApi.receive(id, body);
        toast({ title: tLabel("common.warehouseStock.received", "Kirim bajarildi") });
      }
      setOpFor(null);
      load();
    } catch (e) {
      toast({ title: tLabel("common.warehouseStock.error", "Xato"), description: String((e as Error).message), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async (line: WarehouseStockLine) => {
    setHistoryFor(line);
    setHistory(null);
    try {
      const m = await warehouseApi.movements(line.materialId);
      setHistory(Array.isArray(m) ? m : []);
    } catch (e) {
      setHistory([]);
      toast({ title: tLabel("common.warehouseStock.error", "Xato"), description: String((e as Error).message), variant: "destructive" });
    }
  };

  const wh = data?.warehouse;
  const rows = Array.isArray(data?.stock) ? data!.stock : [];

  return (
    <div className="space-y-4 p-4">
      <Link href={`/wms/warehouses/${wh?.type ?? ""}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {tLabel("common.warehouseStock.back", "Omborlar")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Warehouse className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">{wh?.name ?? (loaded ? id : "")}</h1>
          {wh?.code && <Badge variant="secondary">{wh.code}</Badge>}
        </div>
        {data && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{tLabel("common.warehouseStock.lines", "Qator")}: {data.lineCount}</span>
            <span>·</span>
            <span>{tLabel("common.warehouseStock.total", "Jami")}: {fmtQty(data.totalQuantity)}</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{tLabel("common.warehouseStock.title", "Ombor qoldig'i")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {tLabel("common.warehouseStock.empty", "Bu omborda qoldiq yo'q")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{tLabel("common.warehouseStock.material", "Material")}</th>
                    <th className="py-2 pr-3 font-medium">{tLabel("common.warehouseStock.code", "Kod")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{tLabel("common.warehouseStock.qty", "Qoldiq")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{tLabel("common.warehouseStock.reserved", "Rezerv")}</th>
                    <th className="py-2 pr-3 text-right font-medium">{tLabel("common.warehouseStock.available", "Mavjud")}</th>
                    <th className="py-2 pr-3 font-medium">{tLabel("common.warehouseStock.unit", "Birlik")}</th>
                    <th className="py-2 pr-0 text-right font-medium">{tLabel("common.warehouseStock.action", "Amal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{r.name}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.kod ?? "—"}</td>
                      <td className="py-2 pr-3 text-right font-medium">{fmtQty(r.quantity)}</td>
                      <td className="py-2 pr-3 text-right text-muted-foreground">{fmtQty(r.reserved)}</td>
                      <td className="py-2 pr-3 text-right">{fmtQty(r.available)}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{r.unit}</td>
                      <td className="py-2 pr-0 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openHistory(r)}>
                            <History className="mr-1 h-3 w-3" />
                            {tLabel("common.warehouseStock.history", "Tarix")}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openOp(r, "receive")}>
                            <Plus className="mr-1 h-3 w-3" />
                            {tLabel("common.warehouseStock.receive", "Kirim")}
                          </Button>
                          <Button size="sm" variant="outline" disabled={r.available <= 0} onClick={() => openOp(r, "issue")}>
                            <Minus className="mr-1 h-3 w-3" />
                            {tLabel("common.warehouseStock.issue", "Chiqim")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={opFor !== null} onOpenChange={(o) => { if (!o) setOpFor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {opMode === "issue"
                ? tLabel("common.warehouseStock.issueTitle", "Material chiqim")
                : tLabel("common.warehouseStock.receiveTitle", "Material kirim")}
            </DialogTitle>
          </DialogHeader>
          {opFor && (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">{opFor.name}</span>
                <span className="ml-2 text-muted-foreground">
                  {tLabel("common.warehouseStock.available", "Mavjud")}: {fmtQty(opFor.available)} {opFor.unit}
                </span>
              </div>
              <div className="space-y-1">
                <Label htmlFor="op-qty">{tLabel("common.warehouseStock.qtyLabel", "Miqdor")}</Label>
                <Input
                  id="op-qty"
                  type="number"
                  min={0}
                  max={opMode === "issue" ? opFor.available : undefined}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder={tLabel("common.warehouseStock.qtyPlaceholder", "Miqdorni kiriting")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="op-reason">{tLabel("common.warehouseStock.reasonLabel", "Sabab (ixtiyoriy)")}</Label>
                <Input
                  id="op-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={tLabel("common.warehouseStock.reasonPlaceholder", "Sababni kiriting")}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpFor(null)} disabled={submitting}>
              {tLabel("common.warehouseStock.cancel", "Bekor qilish")}
            </Button>
            <Button onClick={submitOp} disabled={submitting}>
              {opMode === "issue"
                ? tLabel("common.warehouseStock.confirmIssue", "Chiqim qilish")
                : tLabel("common.warehouseStock.confirmReceive", "Kirim qilish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyFor !== null} onOpenChange={(o) => { if (!o) { setHistoryFor(null); setHistory(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tLabel("common.warehouseStock.historyTitle", "Harakat tarixi")}{historyFor ? ` — ${historyFor.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {history === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : history.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {tLabel("common.warehouseStock.historyEmpty", "Harakat yo'q")}
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {history.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-2 border-b pb-2 text-sm last:border-0">
                  <div>
                    <Badge variant={m.movementType === "RECEIVE" ? "secondary" : "outline"}>
                      {MOVEMENT_LABEL[m.movementType] ?? m.movementType}
                    </Badge>
                    <div className="mt-1 text-muted-foreground">{m.reason || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.performedByName ?? "—"}{m.createdAt ? ` · ${new Date(m.createdAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                  <div className="whitespace-nowrap font-medium">
                    {fmtQty(m.quantity)} {m.unit ?? ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
