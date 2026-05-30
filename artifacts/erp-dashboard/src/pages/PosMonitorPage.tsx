/**
 * @module PosMonitorPage
 * @description POS Monitor — zavod ombori plansheti sahifasi.
 * Ombor xodimi: kirim, chiqim, P2P qabul + barcode qidirish.
 * Tabs = ombor turlari (warehouseApi.types() dan), har tab omborlar dropdown + qoldiq jadval.
 * Route: /pos-monitor (PosMonitorApp ichida)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { warehouseApi, type WarehouseType, type WarehouseRow } from "@/lib/api/warehouse.api";
import {
  posOperationsApi,
  type PosStockLine,
  type PosWarehouseStock,
  type PosIssueInput,
} from "@/lib/api/pos-operations.api";
import { useHardwareScanner } from "@/pos-monitor/hooks/useHardwareScanner";
import PosBarcodeScanner from "@/pos-monitor/components/PosBarcodeScanner";
import { Link } from "wouter";
import {
  Warehouse,
  Barcode,
  Package,
  Minus,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Camera,
} from "lucide-react";

// ─── Yordamchi funksiyalar ────────────────────────────────────────────────────

function fmtQty(n: number): string {
  const v = Number(n) || 0;
  return v % 1 === 0 ? String(v) : v.toFixed(2);
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
}

// ─── Kirim/Chiqim Dialog ──────────────────────────────────────────────────────

interface IssueDialogProps {
  open: boolean;
  mode: "issue" | "receive";
  warehouseId: number | null;
  line: PosStockLine | null;
  onClose: () => void;
  onSuccess: () => void;
}

function IssueDialog({ open, mode, warehouseId, line, onClose, onSuccess }: IssueDialogProps) {
  const { toast } = useToast();
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Dialog ochildanda field'larni tozala
  useEffect(() => {
    if (open) { setQty(""); setReason(""); }
  }, [open]);

  const handleSubmit = async () => {
    const quantity = parseFloat(qty);
    if (!warehouseId || !line || isNaN(quantity) || quantity <= 0) {
      toast({
        title: tLabel("pos.operations.invalidQty", "Noto'g'ri miqdor"),
        variant: "destructive",
      });
      return;
    }

    const body: PosIssueInput = { materialId: line.materialId, quantity, reason: reason || undefined };
    setSaving(true);
    try {
      if (mode === "issue") {
        await posOperationsApi.issue(warehouseId, body);
      } else {
        await posOperationsApi.receive(warehouseId, body);
      }
      toast({
        title: mode === "issue"
          ? tLabel("pos.operations.issueSuccess", "Chiqim amalga oshirildi")
          : tLabel("pos.operations.receiveSuccess", "Kirim amalga oshirildi"),
      });
      onSuccess();
      onClose();
    } catch (e) {
      toast({
        title: tLabel("pos.operations.opError", "Xatolik"),
        description: String((e as Error).message),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isIssue = mode === "issue";
  const maxQty = isIssue ? (line?.available ?? 0) : undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIssue
              ? <Minus className="h-4 w-4 text-destructive" />
              : <Plus className="h-4 w-4 text-primary" />}
            {isIssue
              ? tLabel("pos.operations.issueTitle", "Chiqim")
              : tLabel("pos.operations.receiveTitle", "Kirim")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium">{line?.name ?? "—"}</p>
            {line?.kod && (
              <p className="text-xs text-muted-foreground font-mono">{line.kod}</p>
            )}
          </div>
          {isIssue && (
            <p className="text-xs text-muted-foreground">
              {tLabel("pos.operations.available", "Mavjud")}:{" "}
              <span className="font-semibold text-foreground">{fmtQty(line?.available ?? 0)}</span>{" "}
              {line?.unit ?? ""}
            </p>
          )}
          <div className="space-y-1">
            <Label htmlFor="pos-qty">
              {tLabel("pos.operations.quantity", "Miqdor")} ({line?.unit ?? ""})
            </Label>
            <Input
              id="pos-qty"
              type="number"
              min="0.001"
              max={maxQty !== undefined ? maxQty : undefined}
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pos-reason">
              {tLabel("pos.operations.reason", "Sabab")} ({tLabel("pos.operations.optional", "ixtiyoriy")})
            </Label>
            <Input
              id="pos-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={tLabel("pos.operations.reasonPlaceholder", "Maqsad yoki izoh...")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {tLabel("pos.operations.cancel", "Bekor")}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={saving || !qty}
            variant={isIssue ? "destructive" : "default"}
          >
            {saving
              ? tLabel("pos.operations.saving", "Saqlanmoqda...")
              : isIssue
                ? tLabel("pos.operations.doIssue", "Chiqim qilish")
                : tLabel("pos.operations.doReceive", "Kirim qilish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── P2P Qabul Dialog ─────────────────────────────────────────────────────────

interface P2PDialogProps {
  open: boolean;
  requestId: number | null;
  requestTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

function P2PDialog({ open, requestId, requestTitle, onClose, onSuccess }: P2PDialogProps) {
  const { toast } = useToast();
  const [chekNumber, setChekNumber] = useState("");
  const [chekAmount, setChekAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setChekNumber(""); setChekAmount(""); }
  }, [open]);

  const handleSubmit = async () => {
    if (!requestId) return;
    setSaving(true);
    try {
      await posOperationsApi.receiveP2P(requestId, {
        chekNumber: chekNumber || undefined,
        chekAmount: chekAmount ? parseFloat(chekAmount) : undefined,
      });
      toast({ title: tLabel("pos.operations.p2pSuccess", "P2P qabul amalga oshirildi") });
      onSuccess();
      onClose();
    } catch (e) {
      toast({
        title: tLabel("pos.operations.opError", "Xatolik"),
        description: String((e as Error).message),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            {tLabel("pos.operations.p2pReceiveTitle", "P2P Qabul")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm">{requestTitle}</p>
          <div className="space-y-1">
            <Label htmlFor="p2p-chek">
              {tLabel("pos.operations.chekNumber", "Chek raqami")}
            </Label>
            <Input
              id="p2p-chek"
              value={chekNumber}
              onChange={(e) => setChekNumber(e.target.value)}
              placeholder="ЧЕК-XXXXXX"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="p2p-amount">
              {tLabel("pos.operations.chekAmount", "Chek summasi (UZS)")}
            </Label>
            <Input
              id="p2p-amount"
              type="number"
              min="0"
              step="any"
              value={chekAmount}
              onChange={(e) => setChekAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {tLabel("pos.operations.cancel", "Bekor")}
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving}>
            {saving
              ? tLabel("pos.operations.saving", "Saqlanmoqda...")
              : tLabel("pos.operations.p2pConfirm", "Qabul qilish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Qoldiq jadvali ──────────────────────────────────────────────────────────

interface StockTableProps {
  rows: PosStockLine[];
  warehouseId: number;
  onIssue: (line: PosStockLine) => void;
  onReceive: (line: PosStockLine) => void;
  searchTerm: string;
}

function StockTable({ rows, warehouseId: _whId, onIssue, onReceive, searchTerm }: StockTableProps) {
  const filtered = rows.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.kod ?? "").toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Package className="h-10 w-10 opacity-40" />
        <p className="text-sm">
          {searchTerm
            ? tLabel("pos.operations.noSearchResults", "Qidiruv natijasi yo'q")
            : tLabel("pos.operations.emptyStock", "Qoldiq yo'q")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">
              {tLabel("pos.operations.material", "Material")}
            </th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">
              {tLabel("pos.operations.qty", "Jami")}
            </th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground">
              {tLabel("pos.operations.available", "Mavjud")}
            </th>
            <th className="text-center px-3 py-2 font-medium text-muted-foreground">
              {tLabel("pos.operations.unit", "Bir.")}
            </th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">
              {tLabel("pos.operations.updated", "Yangilangan")}
            </th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id} className="border-b hover:bg-muted/20 transition-colors">
              <td className="px-3 py-2.5">
                <p className="font-medium leading-tight">{row.name}</p>
                {row.kod && (
                  <p className="text-xs text-muted-foreground font-mono">{row.kod}</p>
                )}
              </td>
              <td className="text-right px-3 py-2.5 tabular-nums hidden sm:table-cell">
                {fmtQty(row.quantity)}
              </td>
              <td className="text-right px-3 py-2.5 tabular-nums">
                <span
                  className={
                    row.available <= 0
                      ? "text-destructive font-semibold"
                      : row.available < 5
                        ? "text-orange-500 font-semibold"
                        : "text-foreground"
                  }
                >
                  {fmtQty(row.available)}
                </span>
              </td>
              <td className="text-center px-3 py-2.5 text-muted-foreground text-xs">
                {row.unit}
              </td>
              <td className="text-right px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                {fmtDate(row.lastUpdatedAt)}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex gap-1.5 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => onReceive(row)}
                  >
                    <Plus className="h-3 w-3 mr-0.5" />
                    {tLabel("pos.operations.receive", "Kirim")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    onClick={() => onIssue(row)}
                    disabled={row.available <= 0}
                  >
                    <Minus className="h-3 w-3 mr-0.5" />
                    {tLabel("pos.operations.issue", "Chiqim")}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── P2P Qabul bo'limi ───────────────────────────────────────────────────────

interface P2PSectionProps {
  warehouseType: string;
  onOpenReceive: (id: number, title: string) => void;
}

function P2PSection({ warehouseType, onOpenReceive }: P2PSectionProps) {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await posOperationsApi.pendingP2P(warehouseType);
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseType]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <CheckCircle className="h-4 w-4 text-primary" />
        {tLabel("pos.operations.noP2P", "Kutilayotgan P2P so'rovlar yo'q")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => {
        const id = typeof req.id === "number" ? req.id : Number(req.id ?? 0);
        const title = String(req.title ?? req.requestNumber ?? `#${id}`);
        const status = String(req.status ?? "pending");
        const created = req.createdAt ? fmtDate(String(req.createdAt)) : "—";

        return (
          <div
            key={id}
            className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-muted/20 transition-colors"
          >
            <Clock className="h-4 w-4 text-orange-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs text-muted-foreground">{created}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">{status}</Badge>
            <Button
              size="sm"
              className="h-7 px-2 text-xs shrink-0"
              onClick={() => onOpenReceive(id, title)}
            >
              {tLabel("pos.operations.p2pAccept", "Qabul")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Asosiy sahifa ────────────────────────────────────────────────────────────

export default function PosMonitorPage() {
  const { toast } = useToast();

  // Sana/vaqt
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Ombor turlari
  const [types, setTypes] = useState<WarehouseType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");

  // Omborlar (aktiv tur uchun)
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

  // Qoldiq
  const [stockData, setStockData] = useState<PosWarehouseStock | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

  // Dialog holatlari
  const [issueDialog, setIssueDialog] = useState<{ open: boolean; mode: "issue" | "receive"; line: PosStockLine | null }>({
    open: false, mode: "issue", line: null,
  });
  const [p2pDialog, setP2pDialog] = useState<{ open: boolean; requestId: number | null; title: string }>({
    open: false, requestId: null, title: "",
  });

  // Barcode qidirish
  const [barcodeValue, setBarcodeValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // P2P reload trigger
  const [p2pReload, setP2pReload] = useState(0);

  // ── Ombor turlari yuklash ───────────────────────────────────────────────────
  useEffect(() => {
    setTypesLoading(true);
    warehouseApi
      .types()
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        // Faqat haqiqiy omborlar mavjud turlar
        const active = rows.filter((t) => t.warehouseCount > 0);
        setTypes(active);
        if (active.length > 0 && !activeTab) {
          setActiveTab(active[0].code);
        }
      })
      .catch((e) =>
        toast({ title: tLabel("pos.operations.typesError", "Ombor turlari yuklanmadi"), description: String((e as Error).message), variant: "destructive" }),
      )
      .finally(() => setTypesLoading(false));
  }, [toast]);

  // ── Aktiv tur omborlari yuklash ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeTab) return;
    setWarehousesLoading(true);
    setSelectedWarehouseId("");
    setStockData(null);
    warehouseApi
      .warehouses(activeTab)
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setWarehouses(rows);
        if (rows.length > 0) {
          setSelectedWarehouseId(String(rows[0].id));
        }
      })
      .catch((e) =>
        toast({ title: tLabel("pos.operations.warehousesError", "Omborlar yuklanmadi"), description: String((e as Error).message), variant: "destructive" }),
      )
      .finally(() => setWarehousesLoading(false));
  }, [activeTab, toast]);

  // ── Tanlangan ombor qoldig'ini yuklash ──────────────────────────────────────
  const loadStock = useCallback(() => {
    if (!selectedWarehouseId) return;
    setStockLoading(true);
    posOperationsApi
      .stock(selectedWarehouseId)
      .then((data) => setStockData(data))
      .catch((e) =>
        toast({ title: tLabel("pos.operations.stockError", "Qoldiq yuklanmadi"), description: String((e as Error).message), variant: "destructive" }),
      )
      .finally(() => setStockLoading(false));
  }, [selectedWarehouseId, toast]);

  useEffect(() => { loadStock(); }, [loadStock]);

  // ── Barcode qidirish ─────────────────────────────────────────────────────────
  const handleBarcodeScan = useCallback(
    (code: string) => {
      if (!code.trim()) return;
      const rows = Array.isArray(stockData?.stock) ? stockData!.stock : [];
      const found = rows.find(
        (r) =>
          (r.kod ?? "").toLowerCase() === code.trim().toLowerCase() ||
          r.name.toLowerCase().includes(code.trim().toLowerCase()),
      );
      if (found) {
        setSearchTerm(code.trim());
        // Avtomatik chiqim dialog ocha
        setIssueDialog({ open: true, mode: "issue", line: found });
      } else {
        setSearchTerm(code.trim());
        toast({
          title: tLabel("pos.operations.barcodeNotFound", "Material topilmadi"),
          description: code,
          variant: "destructive",
        });
      }
    },
    [stockData, toast],
  );

  // ── USB/BT hardware skaner (keyboard wedge + WebHID + Serial) — global ──────
  // Operator klaviatura-emulyatsiya skaner bilan istalgan joyda skanerlaydi;
  // input fokusda bo'lsa pastdagi onKeyDown ishlaydi (ignoreWhileTyping).
  const { status: scannerStatus } = useHardwareScanner({
    onScan: (e) => handleBarcodeScan(e.barcode),
    ignoreWhileTyping: true,
  });

  // ── Dialog yordamchilari ────────────────────────────────────────────────────
  const openIssue = (line: PosStockLine) =>
    setIssueDialog({ open: true, mode: "issue", line });
  const openReceive = (line: PosStockLine) =>
    setIssueDialog({ open: true, mode: "receive", line });
  const closeIssueDialog = () => setIssueDialog((s) => ({ ...s, open: false }));

  const openP2P = (id: number, title: string) =>
    setP2pDialog({ open: true, requestId: id, title });
  const closeP2PDialog = () => setP2pDialog((s) => ({ ...s, open: false }));

  const handleOpSuccess = () => {
    loadStock();
    setP2pReload((n) => n + 1);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const stockRows = Array.isArray(stockData?.stock) ? stockData!.stock : [];
  const activeType = types.find((t) => t.code === activeTab);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sarlavha ── */}
      <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Warehouse className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">
            {tLabel("pos.operations.pageTitle", "POS Monitor")}
          </h1>
        </div>
        <div className="text-sm text-muted-foreground tabular-nums">
          {now.toLocaleDateString("uz-UZ", { weekday: "short", month: "short", day: "numeric" })}
          {" · "}
          {now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-5xl mx-auto">

        {/* ── To'liq operatsiyalar (EXTERNAL_IN 5-bosqich: barcode + karantin + QC + GL + PDF) ── */}
        <div className="flex flex-wrap gap-2">
          <Link href="/pos-monitor/movements/new/kirim" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> {tLabel("pos.operations.fullKirim", "To'liq Kirim (QC+barcode)")}
          </Link>
          <Link href="/pos-monitor/movements/new/chiqim" className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <Minus className="h-4 w-4" /> {tLabel("pos.operations.fullChiqim", "To'liq Chiqim")}
          </Link>
          <Link href="/pos-monitor/quarantine" className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            {tLabel("pos.operations.quarantineQc", "Karantin / QC")}
          </Link>
          <Link href="/pos-monitor/movements" className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            {tLabel("pos.operations.allMovements", "Harakatlar")}
          </Link>
          <Link href="/pos-monitor/reports" className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            {tLabel("pos.operations.reports", "Hisobotlar")}
          </Link>
        </div>

        {/* ── Ombor turlari tablar ── */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {tLabel("pos.operations.warehouseType", "Ombor turi")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-0">
            {typesLoading ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap pb-3">
                {types.map((t) => (
                  <button
                    key={t.code}
                    onClick={() => setActiveTab(t.code)}
                    className={[
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                      activeTab === t.code
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted",
                    ].join(" ")}
                  >
                    {t.nameUz}
                    {t.warehouseCount > 1 && (
                      <span className="ml-1.5 text-xs opacity-70">({t.warehouseCount})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Ombor tanlash + Barcode qidirish ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Ombor dropdown */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              {tLabel("pos.operations.selectWarehouse", "Ombor")}
            </Label>
            {warehousesLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
              >
                {warehouses.length === 0 && (
                  <option value="">{tLabel("pos.operations.noWarehouses", "Ombor yo'q")}</option>
                )}
                {warehouses.map((w) => (
                  <option key={w.id} value={String(w.id)}>
                    {w.name ?? w.code} {w.location ? `— ${w.location}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Barcode qidirish */}
          <div className="space-y-1">
            <Label htmlFor="barcode-input" className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Barcode className="h-3 w-3" />
              {tLabel("pos.operations.barcodeSearch", "Barcode / Qidirish")}
              <span
                className={`ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${scannerStatus === "connected" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                title={tLabel("pos.operations.scannerStatus", "Skaner holati")}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${scannerStatus === "connected" ? "bg-primary" : "bg-muted-foreground"}`} />
                {scannerStatus === "connected"
                  ? tLabel("pos.operations.scannerReady", "Skaner ulangan")
                  : tLabel("pos.operations.scannerWedge", "Klaviatura skaner")}
              </span>
            </Label>
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  id="barcode-input"
                  ref={barcodeRef}
                  className="w-full h-9 rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={tLabel("pos.operations.barcodePlaceholder", "Barcode yoki material nomi...")}
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBarcodeScan(barcodeValue);
                      setBarcodeValue("");
                    }
                  }}
                />
              </div>
              <Button type="button" size="sm" variant="outline" className="h-9 shrink-0" onClick={() => setCameraOpen(true)} title={tLabel("pos.operations.cameraScan", "Kamera skaner")}>
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Qoldiq jadvali ── */}
        <Card>
          <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              {activeType?.nameUz ?? tLabel("pos.operations.stock", "Qoldiq")}
              {stockData && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {stockData.lineCount} {tLabel("pos.operations.lines", "tur")}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Jadval ichida qidirish */}
              {stockRows.length > 5 && (
                <Input
                  className="h-7 text-xs w-36"
                  placeholder={tLabel("pos.operations.filterTable", "Jadvalda qidirish...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={loadStock}
                disabled={stockLoading}
              >
                {stockLoading
                  ? tLabel("pos.operations.loading", "...")
                  : tLabel("pos.operations.refresh", "Yangilash")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stockLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !selectedWarehouseId ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
                <Warehouse className="h-10 w-10 opacity-40" />
                <p className="text-sm">{tLabel("pos.operations.selectWarehouseHint", "Ombor tanlang")}</p>
              </div>
            ) : (
              <StockTable
                rows={stockRows}
                warehouseId={Number(selectedWarehouseId)}
                onIssue={openIssue}
                onReceive={openReceive}
                searchTerm={searchTerm}
              />
            )}
          </CardContent>
        </Card>

        {/* ── P2P Qabul bo'limi ── */}
        {activeTab && (
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                {tLabel("pos.operations.p2pSection", "P2P Qabul")}
                <Badge variant="outline" className="text-xs font-normal text-orange-600 border-orange-300">
                  {tLabel("pos.operations.p2pPending", "Kutilmoqda")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <P2PSection
                key={`p2p-${activeTab}-${p2pReload}`}
                warehouseType={activeTab}
                onOpenReceive={openP2P}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Kirim/Chiqim Dialog ── */}
      <IssueDialog
        open={issueDialog.open}
        mode={issueDialog.mode}
        warehouseId={selectedWarehouseId ? Number(selectedWarehouseId) : null}
        line={issueDialog.line}
        onClose={closeIssueDialog}
        onSuccess={handleOpSuccess}
      />

      {/* ── P2P Qabul Dialog ── */}
      <P2PDialog
        open={p2pDialog.open}
        requestId={p2pDialog.requestId}
        requestTitle={p2pDialog.title}
        onClose={closeP2PDialog}
        onSuccess={handleOpSuccess}
      />

      {/* ── Kamera skaner Dialog (BarcodeDetector/ZXing) ── */}
      <Dialog open={cameraOpen} onOpenChange={(o) => { if (!o) setCameraOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tLabel("pos.operations.cameraScanTitle", "Kamera bilan skanerlash")}</DialogTitle>
          </DialogHeader>
          {cameraOpen && (
            <PosBarcodeScanner
              onDetected={(code) => { handleBarcodeScan(code); setCameraOpen(false); }}
              onClose={() => setCameraOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
