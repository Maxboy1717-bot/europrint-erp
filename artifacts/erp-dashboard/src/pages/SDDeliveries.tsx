/**
 * @module SDDeliveries
 * @description Yetkazib berish ro'yxati — status boshqaruv, KPI tiles.
 *   Pattern: SDCustomers.tsx asosida qurilgan.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { tLabel } from "@/lib/i18n/tLabel";
import { Truck, Package, CheckCircle, FolderOpen, Plus } from "lucide-react";

import {
  EPPageHeader, EPKpiCard, EPErrorState,
  EPSkeletonKpiRow, EPSkeletonTable, EPEmptyState, EPStatusPill,
} from "@/components/ep";
import { Pagination } from "@/components/Pagination";

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

type DeliveryStatus = "PICKING" | "PACKING" | "GOODS_ISSUE" | "COMPLETED";

interface DeliveryRow {
  id: number;
  deliveryNumber: string;
  salesOrderId: number | null;
  status: DeliveryStatus;
  weightKg: number | null;
  volumeM3: number | null;
  driverName: string | null;
  driverPhone: string | null;
  scheduledDate: string | null;
  actualDeliveryDate: string | null;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PICKING:    tLabel("sd.deliveryPicking",    "Tanlash"),
  PACKING:    tLabel("sd.deliveryPacking",    "Qadoqlash"),
  GOODS_ISSUE: tLabel("sd.deliveryGoodsIssue", "Jo'natish"),
  COMPLETED:  tLabel("sd.deliveryCompleted",  "Yetkazildi"),
};

type EPStatusToneType = "success" | "warning" | "danger" | "info" | "brand" | "neutral";

const STATUS_TONES: Record<string, EPStatusToneType> = {
  PICKING:     "info",
  PACKING:     "warning",
  GOODS_ISSUE: "brand",
  COMPLETED:   "success",
};

const ALL_DELIVERY_STATUSES: DeliveryStatus[] = [
  "PICKING", "PACKING", "GOODS_ISSUE", "COMPLETED",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (s: string | null | undefined): string => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("uz-UZ", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch {
    return s;
  }
};

const fmtNum = (n: number | null | undefined, suffix = ""): string => {
  if (n == null) return "—";
  return `${n}${suffix}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SDDeliveries() {
  const { t } = useTranslation("sd");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── State ──
  const [statusTab, setStatusTab] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    deliveryId?: number;
  }>({ open: false });
  const [newStatus, setNewStatus] = useState<DeliveryStatus>("PICKING");
  const [statusNotes, setStatusNotes] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    driverName: "",
    vehicleNumber: "",
    plannedGoodsMovementDate: "",
    salesOrderId: "",
  });

  // ── Queries ──
  const deliveriesQuery = useQuery<DeliveryRow[] | { data: DeliveryRow[] }>({
    queryKey: ["/api/sd/deliveries", { statusTab, page, pageSize }],
    queryFn: () => {
      const p = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      });
      if (statusTab !== "all") p.set("status", statusTab);
      return apiRequest("GET", `/api/sd/deliveries?${p}`);
    },
  });

  // ── Derived data ──
  const rawDeliveries = deliveriesQuery.data;
  const deliveries: DeliveryRow[] = Array.isArray(rawDeliveries)
    ? rawDeliveries
    : Array.isArray((rawDeliveries as { data: DeliveryRow[] } | undefined)?.data)
      ? (rawDeliveries as { data: DeliveryRow[] }).data
      : [];

  const totalItems = deliveries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // KPI counts
  const inTransit = deliveries.filter(
    (d) => d.status === "GOODS_ISSUE" || d.status === "PACKING" || d.status === "PICKING",
  ).length;
  const completed = deliveries.filter((d) => d.status === "COMPLETED").length;

  // ── Mutation ──
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: number;
      status: DeliveryStatus;
      notes: string;
    }) =>
      apiRequest("PATCH", `/api/sd/deliveries/${id}/status`, {
        status,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/deliveries"] });
      toast({
        title: tLabel("sd.deliveryStatusUpdated", "Holat yangilandi"),
      });
      setStatusDialog({ open: false });
      setStatusNotes("");
    },
    onError: (err: Error) =>
      toast({
        title: tLabel("sd.error", "Xatolik"),
        description: err.message,
        variant: "destructive",
      }),
  });

  const createMutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiRequest<{ data: DeliveryRow }>("POST", "/api/sd/deliveries", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/deliveries"] });
      toast({ title: tLabel("sd.deliveryCreated", "Yetkazma yaratildi") });
      setCreateForm({ driverName: "", vehicleNumber: "", plannedGoodsMovementDate: "", salesOrderId: "" });
      setCreateOpen(false);
    },
    onError: (err: Error) =>
      toast({ title: tLabel("sd.error", "Xatolik"), description: err.message, variant: "destructive" }),
  });

  function handleCreateSubmit() {
    const dto: Record<string, unknown> = {};
    if (createForm.driverName.trim())             dto.driverName = createForm.driverName.trim();
    if (createForm.vehicleNumber.trim())           dto.vehicleNumber = createForm.vehicleNumber.trim();
    if (createForm.plannedGoodsMovementDate)       dto.plannedGoodsMovementDate = createForm.plannedGoodsMovementDate;
    if (createForm.salesOrderId.trim())            dto.salesOrderId = createForm.salesOrderId.trim();
    createMutation.mutate(dto);
  }

  // ── Open status dialog ──
  const openStatusDialog = (delivery: DeliveryRow) => {
    setNewStatus(delivery.status);
    setStatusNotes("");
    setStatusDialog({ open: true, deliveryId: delivery.id });
  };

  // ── Render ──
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between gap-3">
        <EPPageHeader
          title={tLabel("sd.deliveriesPage", "Yetkazib berish")}
          subtitle={`${totalItems} ${tLabel("sd.totalDeliveries", "ta yetkazma")}`}
        />
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" />
          {tLabel("sd.newDelivery", "Yangi yetkazma")}
        </Button>
      </div>

      {/* KPI row */}
      {deliveriesQuery.isLoading ? (
        <EPSkeletonKpiRow count={3} />
      ) : !deliveriesQuery.isError && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <EPKpiCard
            label={tLabel("sd.kpiTotalDeliveries", "Jami")}
            value={totalItems}
            icon={Package}
            iconBg="sd"
            enterDelayMs={0}
          />
          <EPKpiCard
            label={tLabel("sd.kpiInTransit", "Yetkazilmoqda")}
            value={inTransit}
            icon={Truck}
            iconBg="primary"
            enterDelayMs={60}
          />
          <EPKpiCard
            label={tLabel("sd.kpiCompleted", "Yetkazildi")}
            value={completed}
            icon={CheckCircle}
            iconBg="var(--ep-green)"
            enterDelayMs={120}
          />
        </div>
      )}

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusTab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => { setStatusTab("all"); setPage(1); }}
        >
          {tLabel("sd.allStatuses", "Barchasi")}
        </Button>
        {ALL_DELIVERY_STATUSES.map((s) => (
          <Button
            key={s}
            variant={statusTab === s ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusTab(s); setPage(1); }}
          >
            {STATUS_LABELS[s] ?? s}
          </Button>
        ))}
      </div>

      {/* Error */}
      {deliveriesQuery.isError ? (
        <EPErrorState
          onRetry={() => deliveriesQuery.refetch()}
          error={deliveriesQuery.error}
        />
      ) : (
        <>
          {/* Table */}
          {deliveriesQuery.isLoading ? (
            <EPSkeletonTable rows={8} cols={8} />
          ) : deliveries.length === 0 ? (
            <EPEmptyState
              icon={FolderOpen}
              title={tLabel("sd.noDeliveries", "Yetkazmalar yo'q")}
              description={tLabel("sd.noDeliveriesHint", "Hali yetkazma mavjud emas")}
            />
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tLabel("sd.colDeliveryNumber",  "Raqam")}</TableHead>
                    <TableHead>{tLabel("sd.colSalesOrder",      "Buyurtma #")}</TableHead>
                    <TableHead>{tLabel("sd.colDeliveryStatus",  "Holat")}</TableHead>
                    <TableHead>{tLabel("sd.colWeight",          "Og'irlik (kg)")}</TableHead>
                    <TableHead>{tLabel("sd.colVolume",          "Hajm (m³)")}</TableHead>
                    <TableHead>{tLabel("sd.colDriver",          "Haydovchi")}</TableHead>
                    <TableHead>{tLabel("sd.colScheduledDate",   "Rej. sana")}</TableHead>
                    <TableHead className="text-right">
                      {tLabel("sd.colActions", "Amallar")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-sm">
                        {d.deliveryNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.salesOrderId ?? "—"}
                      </TableCell>
                      <TableCell>
                        <EPStatusPill tone={STATUS_TONES[d.status] ?? "neutral"}>
                          {STATUS_LABELS[d.status] ?? d.status}
                        </EPStatusPill>
                      </TableCell>
                      <TableCell className="text-sm">
                        {fmtNum(d.weightKg, " kg")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {fmtNum(d.volumeM3, " m³")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.driverName ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {fmtDate(d.scheduledDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStatusDialog(d)}
                          >
                            {tLabel("sd.updateStatus", "Holatni yangilash")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* ── Create delivery dialog ── */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tLabel("sd.newDeliveryTitle", "Yangi yetkazma")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.salesOrderId", "Buyurtma ID")}</Label>
              <Input
                placeholder="Masalan: 56"
                value={createForm.salesOrderId}
                onChange={(e) => setCreateForm({ ...createForm, salesOrderId: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.driverName", "Haydovchi ismi")}</Label>
              <Input
                placeholder="Masalan: Ismoilov Sherzod"
                value={createForm.driverName}
                onChange={(e) => setCreateForm({ ...createForm, driverName: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.vehicleNumber", "Avtomobil raqami")}</Label>
              <Input
                placeholder="Masalan: 01 A 123 BC"
                value={createForm.vehicleNumber}
                onChange={(e) => setCreateForm({ ...createForm, vehicleNumber: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{tLabel("sd.plannedDate", "Rejalashtirilgan sana")}</Label>
              <Input
                type="date"
                value={createForm.plannedGoodsMovementDate}
                onChange={(e) => setCreateForm({ ...createForm, plannedGoodsMovementDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              {tLabel("sd.cancel", "Bekor")}
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending
                ? tLabel("sd.saving", "Saqlanmoqda...")
                : tLabel("sd.save", "Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Status update dialog ── */}
      <Dialog
        open={statusDialog.open}
        onOpenChange={(o) => {
          if (!o) setStatusDialog({ open: false });
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {tLabel("sd.updateDeliveryStatus", "Holatni yangilash")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Status select */}
            <div className="flex flex-col gap-1.5">
              <Label>{tLabel("sd.newStatus", "Yangi holat")}</Label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as DeliveryStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_DELIVERY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delivery-notes">
                {tLabel("sd.notes", "Izoh")}
              </Label>
              <Textarea
                id="delivery-notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder={tLabel("sd.notesPlaceholder", "Ixtiyoriy izoh...")}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialog({ open: false })}
            >
              {tLabel("sd.cancel", "Bekor")}
            </Button>
            <Button
              onClick={() => {
                if (statusDialog.deliveryId != null) {
                  updateStatusMutation.mutate({
                    id: statusDialog.deliveryId,
                    status: newStatus,
                    notes: statusNotes,
                  });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending
                ? tLabel("sd.saving", "Saqlanmoqda...")
                : tLabel("sd.save", "Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
