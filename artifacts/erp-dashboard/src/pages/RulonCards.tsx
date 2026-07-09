/**
 * @module RulonCards
 * @description WMS Rulon qog'oz karta — ro'yxat + yangi rulon qo'shish.
 * Route: /wms/rulon-cards
 * GET /api/wms/rulon-cards + POST /api/wms/rulon-cards
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Package, Pencil, Plus, RefreshCw, Ruler, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLL_TYPES = ["kraft", "test_liner", "fluting", "white", "makulatura"] as const;
type RollType = (typeof ROLL_TYPES)[number];

const ROLL_TYPE_LABELS: Record<RollType, string> = {
  kraft:       "Kraft",
  test_liner:  "Test Liner",
  fluting:     "Fluting",
  white:       "Oq",
  makulatura:  "Makulatura",
};

const STATUS_CFG: Record<string, { label: string; variant: string }> = {
  full:    { label: "To'liq",    variant: "bg-green-100 text-green-800" },
  opened:  { label: "Ochilgan", variant: "bg-yellow-100 text-yellow-800" },
  remnant: { label: "Qoldiq",   variant: "bg-red-100 text-red-800" },
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface RulonCard {
  id: number;
  rollCode: string | null;
  widthMm: number;
  grammageGsm: number;
  initialWeightKg: string | number;
  currentWeightKg: string | number | null;
  estimatedLengthM: string | number | null;
  rollType: RollType;
  supplier: string | null;
  status: string;
  storageZone: string | null;
}

interface ListResp {
  items: RulonCard[];
  total: number;
}

// ── Create Dialog ──────────────────────────────────────────────────────────────

function CreateRulonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [rollType, setRollType]             = useState<string>("kraft");
  const [widthMm, setWidthMm]               = useState("");
  const [grammageGsm, setGrammageGsm]       = useState("");
  const [initialWeightKg, setInitialWt]     = useState("");
  const [supplier, setSupplier]             = useState("");
  const [rollCode, setRollCode]             = useState("");

  const mutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiRequest("POST", "/api/wms/rulon-cards", dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/wms/rulon-cards"] });
      toast({ title: "Rulon kartasi qo'shildi" });
      setRollType("kraft"); setWidthMm(""); setGrammageGsm(""); setInitialWt(""); setSupplier(""); setRollCode("");
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  function handleSubmit() {
    const w  = parseInt(widthMm, 10);
    const g  = parseInt(grammageGsm, 10);
    const wt = parseFloat(initialWeightKg);
    if (!rollType) { toast({ title: "Tur tanlanmadi", variant: "destructive" }); return; }
    if (isNaN(w) || w < 100 || w > 2800) {
      toast({ title: "Kenglik: 100–2800 mm", variant: "destructive" }); return;
    }
    if (isNaN(g) || g < 40 || g > 600) {
      toast({ title: "Gramaj: 40–600 gsm", variant: "destructive" }); return;
    }
    if (isNaN(wt) || wt <= 0) {
      toast({ title: "Og'irlik majburiy (kg)", variant: "destructive" }); return;
    }
    const dto: Record<string, unknown> = { rollType, widthMm: w, grammageGsm: g, initialWeightKg: wt };
    if (rollCode.trim())  dto.rollCode = rollCode.trim();
    if (supplier.trim())  dto.supplier = supplier.trim();
    mutation.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Yangi rulon kartasi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Rulon turi *</Label>
            <Select value={rollType} onValueChange={setRollType}>
              <SelectTrigger data-testid="select-roll-type">
                <SelectValue placeholder="Tur tanlang" />
              </SelectTrigger>
              <SelectContent>
                {ROLL_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{ROLL_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rc-width">Kenglik (mm) *</Label>
              <Input
                id="rc-width" type="number" min={100} max={2800}
                placeholder="1200"
                value={widthMm}
                onChange={e => setWidthMm(e.target.value)}
                data-testid="input-width-mm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rc-gsm">Gramaj (g/m²) *</Label>
              <Input
                id="rc-gsm" type="number" min={40} max={600}
                placeholder="120"
                value={grammageGsm}
                onChange={e => setGrammageGsm(e.target.value)}
                data-testid="input-gsm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rc-weight">Boshlang'ich og'irlik (kg) *</Label>
            <Input
              id="rc-weight" type="number" step="0.001" min={0.001}
              placeholder="500"
              value={initialWeightKg}
              onChange={e => setInitialWt(e.target.value)}
              data-testid="input-weight-kg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rc-code">Rulon kodi (ixtiyoriy)</Label>
            <Input
              id="rc-code"
              placeholder="R-2026-001"
              value={rollCode}
              onChange={e => setRollCode(e.target.value)}
              data-testid="input-roll-code"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rc-supplier">Yetkazib beruvchi (ixtiyoriy)</Label>
            <Input
              id="rc-supplier"
              placeholder="Yetkazib beruvchi nomi"
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
              data-testid="input-supplier"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            data-testid="btn-submit-rulon"
          >
            Qo'shish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Update Weight Dialog ───────────────────────────────────────────────────────

function UpdateWeightDialog({ item, open, onClose }: { item: RulonCard | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [kg, setKg] = useState("");

  useEffect(() => {
    if (item) setKg(Number(item.currentWeightKg ?? item.initialWeightKg).toFixed(1));
  }, [item]);

  const mutation = useMutation({
    mutationFn: (currentWeightKg: number) =>
      apiRequest("PATCH", `/api/wms/rulon-cards/${item!.id}/weight`, { currentWeightKg }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/wms/rulon-cards"] });
      toast({ title: "Og'irlik yangilandi" });
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  function handleSubmit() {
    const w = parseFloat(kg);
    if (isNaN(w) || w < 0) { toast({ title: "Og'irlik 0 kg yoki undan katta bo'lishi kerak", variant: "destructive" }); return; }
    mutation.mutate(w);
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle>Og'irlikni yangilash — {item?.rollCode ?? `R-${item?.id}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="upd-weight">Joriy og'irlik (kg)</Label>
            <Input
              id="upd-weight" type="number" step="0.1" min={0}
              placeholder="400"
              value={kg}
              onChange={e => setKg(e.target.value)}
              data-testid="input-current-weight"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending} data-testid="btn-save-weight">
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Change Status Dialog ───────────────────────────────────────────────────────

function ChangeStatusDialog({ item, open, onClose }: { item: RulonCard | null; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("");

  useEffect(() => { if (item) setStatus(item.status); }, [item]);

  const mutation = useMutation({
    mutationFn: (s: string) =>
      apiRequest("PATCH", `/api/wms/rulon-cards/${item!.id}/status`, { status: s }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/wms/rulon-cards"] });
      toast({ title: "Holat yangilandi" });
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>Holat o'zgartirish — {item?.rollCode ?? `R-${item?.id}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger data-testid="select-rulon-status">
              <SelectValue placeholder="Holat tanlang" />
            </SelectTrigger>
            <SelectContent>
              {(["full", "opened", "remnant"] as const).map(s => (
                <SelectItem key={s} value={s}>{STATUS_CFG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button
            onClick={() => mutation.mutate(status)}
            disabled={mutation.isPending || !status}
            data-testid="btn-save-status"
          >
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function RulonCards() {
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [weightItem, setWeightItem]     = useState<RulonCard | null>(null);
  const [statusItem, setStatusItem]     = useState<RulonCard | null>(null);

  const { data, isLoading } = useQuery<ListResp>({
    queryKey: ["/api/wms/rulon-cards"],
    queryFn:  () => apiRequest("GET", "/api/wms/rulon-cards?limit=50"),
  });

  const items:   RulonCard[] = Array.isArray(data?.items) ? data.items : [];
  const total                = data?.total ?? 0;
  const fullCnt              = items.filter(r => r.status === "full").length;
  const openedCnt            = items.filter(r => r.status === "opened").length;

  return (
    <DedicatedPageShell
      title="Rulon Kartalar"
      description="WMS — qog'oz rulonlari pasporti, og'irlik va uzunlik nazorati"
      actions={
        <Button onClick={() => setDialogOpen(true)} data-testid="btn-add-rulon">
          <Plus className="h-4 w-4 mr-1.5" /> Yangi rulon
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Jami rulon"   value={total}     icon={<Package className="h-4 w-4" />} />
        <KpiCard label="To'liq"       value={fullCnt}   icon={<Ruler   className="h-4 w-4" />} />
        <KpiCard label="Ochilgan"     value={openedCnt} icon={<Scale   className="h-4 w-4" />} />
      </div>

      <Section title="Rulon kartalar ro'yxati">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Rulon kartalar yo'q. "Yangi rulon" tugmasini bosing.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide font-semibold">
                  <th className="text-left py-2 px-4">Kod</th>
                  <th className="text-left py-2 pr-4">Turi</th>
                  <th className="text-right py-2 pr-4">Kenglik (mm)</th>
                  <th className="text-right py-2 pr-4">Gramaj (gsm)</th>
                  <th className="text-right py-2 pr-4">Og'irlik (kg)</th>
                  <th className="text-left py-2 pr-4">Yetkazuvchi</th>
                  <th className="text-left py-2 pr-4">Holat</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => {
                  const s = STATUS_CFG[r.status] ?? { label: r.status, variant: "bg-gray-100 text-gray-700" };
                  return (
                    <tr
                      key={r.id}
                      className="border-b hover:bg-muted/40 transition-colors"
                      data-testid={`row-rulon-${r.id}`}
                    >
                      <td className="py-2 pr-4 font-mono text-xs">
                        {r.rollCode ?? `R-${r.id}`}
                      </td>
                      <td className="py-2 pr-4">
                        {ROLL_TYPE_LABELS[r.rollType] ?? r.rollType}
                      </td>
                      <td className="py-2 pr-4 text-right">{r.widthMm}</td>
                      <td className="py-2 pr-4 text-right">{r.grammageGsm}</td>
                      <td className="py-2 pr-4 text-right">
                        {Number(r.currentWeightKg ?? r.initialWeightKg).toFixed(1)}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {r.supplier ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge className={s.variant}>{s.label}</Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            title="Og'irlikni yangilash"
                            onClick={() => setWeightItem(r)}
                            data-testid={`btn-weight-${r.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            title="Holat o'zgartirish"
                            onClick={() => setStatusItem(r)}
                            data-testid={`btn-status-${r.id}`}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <CreateRulonDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      <UpdateWeightDialog
        item={weightItem}
        open={weightItem !== null}
        onClose={() => setWeightItem(null)}
      />

      <ChangeStatusDialog
        item={statusItem}
        open={statusItem !== null}
        onClose={() => setStatusItem(null)}
      />
    </DedicatedPageShell>
  );
}
