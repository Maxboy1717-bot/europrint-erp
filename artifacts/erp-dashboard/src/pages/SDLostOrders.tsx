/**
 * @module SDLostOrders
 * @description Yo'qotilgan buyurtmalar (sabab-katalogi) + Reklamatsiyalar (SLA-timer).
 *   Backend already existed (sd-lost-orders-reclamations.controller.ts) with zero FE
 *   consumer — this page wires GET/POST/PATCH /api/sd/lost-orders + /api/sd/reclamations.
 *   Pattern: SDDeliveries.tsx asosida qurilgan (closes SB0608/SB0609).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { TrendingDown, AlertTriangle, FolderOpen, Plus, CheckCircle2 } from "lucide-react";

import {
  EPPageHeader, EPKpiCard, EPErrorState,
  EPSkeletonKpiRow, EPSkeletonTable, EPEmptyState, EPStatusPill,
} from "@/components/ep";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LostOrderRow {
  id: number;
  sales_order_id: number | null;
  customer_id: number | null;
  reason_code: string;
  reason_text: string | null;
  lost_amount: string | null;
  competitor_name: string | null;
  lost_date: string;
  created_at: string;
}

type ReclamationStatus = "open" | "investigating" | "resolved" | "rejected";

interface ReclamationRow {
  id: number;
  reclamation_number: string;
  sales_order_id: number | null;
  customer_id: number | null;
  category: string;
  description: string;
  status: ReclamationStatus;
  resolution_text: string | null;
  sla_deadline: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOST_REASON_CODES = ["price", "deadline", "competitor", "quality", "other"] as const;

const LOST_REASON_LABELS: Record<string, string> = {
  price: tLabel("sd.lostReasonPrice", "Narx"),
  deadline: tLabel("sd.lostReasonDeadline", "Muddat"),
  competitor: tLabel("sd.lostReasonCompetitor", "Raqobatchi"),
  quality: tLabel("sd.lostReasonQuality", "Sifat"),
  other: tLabel("sd.lostReasonOther", "Boshqa"),
};

const RECLAMATION_STATUSES: ReclamationStatus[] = ["open", "investigating", "resolved", "rejected"];

const RECLAMATION_STATUS_LABELS: Record<string, string> = {
  open: tLabel("sd.reclOpen", "Ochiq"),
  investigating: tLabel("sd.reclInvestigating", "Tekshirilmoqda"),
  resolved: tLabel("sd.reclResolved", "Hal qilindi"),
  rejected: tLabel("sd.reclRejected", "Rad etildi"),
};

type EPStatusToneType = "success" | "warning" | "danger" | "info" | "brand" | "neutral";

const RECLAMATION_TONES: Record<string, EPStatusToneType> = {
  open: "danger",
  investigating: "warning",
  resolved: "success",
  rejected: "neutral",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (s: string | null | undefined): string => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return s;
  }
};

const fmtMoney = (v: string | number | null | undefined): string => {
  const n = Number(v ?? 0);
  if (!n) return "—";
  return n.toLocaleString("uz-UZ");
};

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v as T[] : []);

// ─── Component ────────────────────────────────────────────────────────────────

export default function SDLostOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"lost" | "reclamations">("lost");

  // ── Lost-order create dialog ──
  const [lostOpen, setLostOpen] = useState(false);
  const [lostForm, setLostForm] = useState({
    salesOrderId: "", customerId: "", reasonCode: "price" as string,
    reasonText: "", lostAmount: "", competitorName: "",
  });

  // ── Reclamation create dialog ──
  const [reclOpen, setReclOpen] = useState(false);
  const [reclForm, setReclForm] = useState({
    salesOrderId: "", customerId: "", category: "", description: "", slaDeadline: "",
  });

  // ── Reclamation resolve dialog ──
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; id?: number }>({ open: false });
  const [resolveStatus, setResolveStatus] = useState<ReclamationStatus>("investigating");
  const [resolutionText, setResolutionText] = useState("");

  // ── Queries ──
  const lostQuery = useQuery<LostOrderRow[]>({
    queryKey: ["/api/sd/lost-orders"],
    queryFn: () => apiRequest("GET", "/api/sd/lost-orders"),
  });
  const reclQuery = useQuery<ReclamationRow[]>({
    queryKey: ["/api/sd/reclamations"],
    queryFn: () => apiRequest("GET", "/api/sd/reclamations"),
  });

  const lostOrders = asArray<LostOrderRow>(lostQuery.data);
  const reclamations = asArray<ReclamationRow>(reclQuery.data);

  const totalLostAmount = lostOrders.reduce((sum, r) => sum + Number(r.lost_amount ?? 0), 0);
  const openReclamations = reclamations.filter((r) => r.status === "open" || r.status === "investigating").length;

  // ── Mutations ──
  const createLostMutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) => apiRequest("POST", "/api/sd/lost-orders", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/lost-orders"] });
      toast({ title: tLabel("sd.lostOrderCreated", "Yo'qotilgan buyurtma qayd etildi") });
      setLostForm({ salesOrderId: "", customerId: "", reasonCode: "price", reasonText: "", lostAmount: "", competitorName: "" });
      setLostOpen(false);
    },
    onError: (err: Error) =>
      toast({ title: tLabel("sd.error", "Xatolik"), description: err.message, variant: "destructive" }),
  });

  const createReclMutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) => apiRequest("POST", "/api/sd/reclamations", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/reclamations"] });
      toast({ title: tLabel("sd.reclamationCreated", "Reklamatsiya qayd etildi") });
      setReclForm({ salesOrderId: "", customerId: "", category: "", description: "", slaDeadline: "" });
      setReclOpen(false);
    },
    onError: (err: Error) =>
      toast({ title: tLabel("sd.error", "Xatolik"), description: err.message, variant: "destructive" }),
  });

  const resolveReclMutation = useMutation({
    mutationFn: ({ id, status, resolutionText: text }: { id: number; status: ReclamationStatus; resolutionText: string }) =>
      apiRequest("PATCH", `/api/sd/reclamations/${id}/resolve`, { status, resolutionText: text || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/reclamations"] });
      toast({ title: tLabel("sd.reclamationUpdated", "Reklamatsiya yangilandi") });
      setResolveDialog({ open: false });
      setResolutionText("");
    },
    onError: (err: Error) =>
      toast({ title: tLabel("sd.error", "Xatolik"), description: err.message, variant: "destructive" }),
  });

  function handleCreateLost() {
    if (!lostForm.reasonCode) return;
    const dto: Record<string, unknown> = { reasonCode: lostForm.reasonCode };
    if (lostForm.salesOrderId.trim()) dto.salesOrderId = Number(lostForm.salesOrderId.trim());
    if (lostForm.customerId.trim()) dto.customerId = Number(lostForm.customerId.trim());
    if (lostForm.reasonText.trim()) dto.reasonText = lostForm.reasonText.trim();
    if (lostForm.lostAmount.trim()) dto.lostAmount = Number(lostForm.lostAmount.trim());
    if (lostForm.competitorName.trim()) dto.competitorName = lostForm.competitorName.trim();
    createLostMutation.mutate(dto);
  }

  function handleCreateRecl() {
    if (!reclForm.description.trim()) return;
    const dto: Record<string, unknown> = { description: reclForm.description.trim() };
    if (reclForm.salesOrderId.trim()) dto.salesOrderId = Number(reclForm.salesOrderId.trim());
    if (reclForm.customerId.trim()) dto.customerId = Number(reclForm.customerId.trim());
    if (reclForm.category.trim()) dto.category = reclForm.category.trim();
    if (reclForm.slaDeadline) dto.slaDeadline = reclForm.slaDeadline;
    createReclMutation.mutate(dto);
  }

  const openResolveDialog = (r: ReclamationRow) => {
    setResolveStatus(r.status === "open" ? "investigating" : r.status);
    setResolutionText(r.resolution_text ?? "");
    setResolveDialog({ open: true, id: r.id });
  };

  const isLoading = tab === "lost" ? lostQuery.isLoading : reclQuery.isLoading;
  const isError = tab === "lost" ? lostQuery.isError : reclQuery.isError;

  // ── Render ──
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between gap-3">
        <EPPageHeader
          title={tLabel("sd.lostOrdersPage", "Yo'qotilgan buyurtmalar va Reklamatsiyalar")}
          subtitle={`${lostOrders.length} ${tLabel("sd.totalLost", "ta yo'qotilgan")} · ${reclamations.length} ${tLabel("sd.totalRecl", "ta reklamatsiya")}`}
        />
        <Button
          size="sm"
          onClick={() => (tab === "lost" ? setLostOpen(true) : setReclOpen(true))}
          className="gap-1.5 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          {tab === "lost"
            ? tLabel("sd.newLostOrder", "Yo'qotish qayd etish")
            : tLabel("sd.newReclamation", "Reklamatsiya qayd etish")}
        </Button>
      </div>

      {/* KPI row */}
      {(lostQuery.isLoading || reclQuery.isLoading) ? (
        <EPSkeletonKpiRow count={3} />
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <EPKpiCard
            label={tLabel("sd.kpiLostCount", "Yo'qotilgan buyurtmalar")}
            value={lostOrders.length}
            icon={TrendingDown}
            iconBg="sd"
            enterDelayMs={0}
          />
          <EPKpiCard
            label={tLabel("sd.kpiLostAmount", "Yo'qotilgan summa")}
            staticValue={fmtMoney(totalLostAmount)}
            icon={TrendingDown}
            iconBg="var(--ep-red)"
            enterDelayMs={60}
          />
          <EPKpiCard
            label={tLabel("sd.kpiOpenRecl", "Ochiq reklamatsiyalar")}
            value={openReclamations}
            icon={AlertTriangle}
            iconBg="warning"
            enterDelayMs={120}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <Button variant={tab === "lost" ? "default" : "outline"} size="sm" onClick={() => setTab("lost")}>
          {tLabel("sd.tabLostOrders", "Yo'qotilgan buyurtmalar")}
        </Button>
        <Button variant={tab === "reclamations" ? "default" : "outline"} size="sm" onClick={() => setTab("reclamations")}>
          {tLabel("sd.tabReclamations", "Reklamatsiyalar")}
        </Button>
      </div>

      {isError ? (
        <EPErrorState
          onRetry={() => (tab === "lost" ? lostQuery.refetch() : reclQuery.refetch())}
          error={tab === "lost" ? lostQuery.error : reclQuery.error}
        />
      ) : isLoading ? (
        <EPSkeletonTable rows={6} cols={6} />
      ) : tab === "lost" ? (
        lostOrders.length === 0 ? (
          <EPEmptyState
            icon={FolderOpen}
            title={tLabel("sd.noLostOrders", "Yo'qotilgan buyurtmalar yo'q")}
            description={tLabel("sd.noLostOrdersHint", "Hali qayd etilmagan")}
          />
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tLabel("sd.colSalesOrder", "Buyurtma #")}</TableHead>
                  <TableHead>{tLabel("sd.colReason", "Sabab")}</TableHead>
                  <TableHead>{tLabel("sd.colCompetitor", "Raqobatchi")}</TableHead>
                  <TableHead>{tLabel("sd.colLostAmount", "Yo'qotilgan summa")}</TableHead>
                  <TableHead>{tLabel("sd.colLostDate", "Sana")}</TableHead>
                  <TableHead>{tLabel("sd.colNotes", "Izoh")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lostOrders.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.sales_order_id ?? "—"}</TableCell>
                    <TableCell>
                      <EPStatusPill tone="danger">
                        {LOST_REASON_LABELS[r.reason_code] ?? r.reason_code}
                      </EPStatusPill>
                    </TableCell>
                    <TableCell className="text-sm">{r.competitor_name ?? "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{fmtMoney(r.lost_amount)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{fmtDate(r.lost_date)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate">{r.reason_text ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : reclamations.length === 0 ? (
        <EPEmptyState
          icon={FolderOpen}
          title={tLabel("sd.noReclamations", "Reklamatsiyalar yo'q")}
          description={tLabel("sd.noReclamationsHint", "Hali qayd etilmagan")}
        />
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tLabel("sd.colReclNumber", "Raqam")}</TableHead>
                <TableHead>{tLabel("sd.colSalesOrder", "Buyurtma #")}</TableHead>
                <TableHead>{tLabel("sd.colCategory", "Kategoriya")}</TableHead>
                <TableHead>{tLabel("sd.colDescription", "Tavsif")}</TableHead>
                <TableHead>{tLabel("sd.colReclStatus", "Holat")}</TableHead>
                <TableHead>{tLabel("sd.colSlaDeadline", "SLA muddat")}</TableHead>
                <TableHead className="text-right">{tLabel("sd.colActions", "Amallar")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reclamations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-sm">{r.reclamation_number}</TableCell>
                  <TableCell className="text-sm">{r.sales_order_id ?? "—"}</TableCell>
                  <TableCell className="text-sm">{r.category || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate">{r.description}</TableCell>
                  <TableCell>
                    <EPStatusPill tone={RECLAMATION_TONES[r.status] ?? "neutral"}>
                      {RECLAMATION_STATUS_LABELS[r.status] ?? r.status}
                    </EPStatusPill>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{fmtDate(r.sla_deadline)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {r.status !== "resolved" && r.status !== "rejected" ? (
                        <Button variant="ghost" size="sm" onClick={() => openResolveDialog(r)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          {tLabel("sd.resolve", "Hal qilish")}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Create lost-order dialog ── */}
      <Dialog open={lostOpen} onOpenChange={(o) => { if (!o) setLostOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tLabel("sd.newLostOrderTitle", "Yo'qotilgan buyurtma qayd etish")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.salesOrderId", "Buyurtma ID")}</Label>
              <Input
                placeholder="Masalan: 56"
                value={lostForm.salesOrderId}
                onChange={(e) => setLostForm({ ...lostForm, salesOrderId: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.customerId", "Mijoz ID")}</Label>
              <Input
                placeholder="Masalan: 16"
                value={lostForm.customerId}
                onChange={(e) => setLostForm({ ...lostForm, customerId: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.reasonCode", "Sabab")}</Label>
              <Select value={lostForm.reasonCode} onValueChange={(v) => setLostForm({ ...lostForm, reasonCode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOST_REASON_CODES.map((c) => (
                    <SelectItem key={c} value={c}>{LOST_REASON_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.competitorName", "Raqobatchi nomi")}</Label>
              <Input
                value={lostForm.competitorName}
                onChange={(e) => setLostForm({ ...lostForm, competitorName: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.lostAmount", "Yo'qotilgan summa")}</Label>
              <Input
                type="number"
                value={lostForm.lostAmount}
                onChange={(e) => setLostForm({ ...lostForm, lostAmount: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.reasonText", "Izoh")}</Label>
              <Textarea
                rows={3}
                value={lostForm.reasonText}
                onChange={(e) => setLostForm({ ...lostForm, reasonText: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostOpen(false)} disabled={createLostMutation.isPending}>
              {tLabel("sd.cancel", "Bekor")}
            </Button>
            <Button onClick={handleCreateLost} disabled={createLostMutation.isPending}>
              {createLostMutation.isPending ? tLabel("sd.saving", "Saqlanmoqda...") : tLabel("sd.save", "Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create reclamation dialog ── */}
      <Dialog open={reclOpen} onOpenChange={(o) => { if (!o) setReclOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tLabel("sd.newReclamationTitle", "Reklamatsiya qayd etish")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.salesOrderId", "Buyurtma ID")}</Label>
              <Input
                placeholder="Masalan: 56"
                value={reclForm.salesOrderId}
                onChange={(e) => setReclForm({ ...reclForm, salesOrderId: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.customerId", "Mijoz ID")}</Label>
              <Input
                placeholder="Masalan: 16"
                value={reclForm.customerId}
                onChange={(e) => setReclForm({ ...reclForm, customerId: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.category", "Kategoriya")}</Label>
              <Input
                placeholder={tLabel("sd.categoryPlaceholder", "Masalan: sifat, yetkazish")}
                value={reclForm.category}
                onChange={(e) => setReclForm({ ...reclForm, category: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.slaDeadline", "SLA muddat")}</Label>
              <Input
                type="date"
                value={reclForm.slaDeadline}
                onChange={(e) => setReclForm({ ...reclForm, slaDeadline: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.description", "Tavsif")} *</Label>
              <Textarea
                rows={3}
                value={reclForm.description}
                onChange={(e) => setReclForm({ ...reclForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReclOpen(false)} disabled={createReclMutation.isPending}>
              {tLabel("sd.cancel", "Bekor")}
            </Button>
            <Button onClick={handleCreateRecl} disabled={createReclMutation.isPending || !reclForm.description.trim()}>
              {createReclMutation.isPending ? tLabel("sd.saving", "Saqlanmoqda...") : tLabel("sd.save", "Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Resolve reclamation dialog ── */}
      <Dialog open={resolveDialog.open} onOpenChange={(o) => { if (!o) setResolveDialog({ open: false }); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tLabel("sd.resolveReclamation", "Reklamatsiyani hal qilish")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{tLabel("sd.newStatus", "Yangi holat")}</Label>
              <Select value={resolveStatus} onValueChange={(v) => setResolveStatus(v as ReclamationStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECLAMATION_STATUSES.filter((s) => s !== "open").map((s) => (
                    <SelectItem key={s} value={s}>{RECLAMATION_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recl-resolution">{tLabel("sd.resolutionText", "Yechim tavsifi")}</Label>
              <Textarea
                id="recl-resolution"
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder={tLabel("sd.resolutionPlaceholder", "Qanday hal qilindi...")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog({ open: false })}>
              {tLabel("sd.cancel", "Bekor")}
            </Button>
            <Button
              onClick={() => {
                if (resolveDialog.id != null) {
                  resolveReclMutation.mutate({ id: resolveDialog.id, status: resolveStatus, resolutionText });
                }
              }}
              disabled={resolveReclMutation.isPending}
            >
              {resolveReclMutation.isPending ? tLabel("sd.saving", "Saqlanmoqda...") : tLabel("sd.save", "Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
