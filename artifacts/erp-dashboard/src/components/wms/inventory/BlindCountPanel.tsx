/**
 * @module BlindCountPanel
 * @description W3-COUNT — ko'r-sanoq (blind count) + og'ish-sabab + muzlatish-zona
 *   ADDITIVE paneli. Mavjud InventoryCount forma/jadvali O'ZGARMAYDI (Q-46) — bu
 *   alohida karta sifatida sahifa oxiriga qo'shiladi.
 *
 *   Vizyon: sanoqchi tizim-miqdorini KO'RMASDAN haqiqiy qoldiqni kiritadi (xolislik);
 *   system≠counted bo'lsa og'ish-sabab MAJBURIY; inventarizatsiya vaqtida zona/material
 *   MUZLATILADI (chiqim bloklanadi).
 *
 *   BE: POST /api/wms/count-lines, GET /api/wms/count-deviation-reasons,
 *       GET/POST /api/wms/freeze-zones, PATCH /api/wms/freeze-zones/:id/release
 *   Token: EP (var(--ep-*)) — Ombor ilovasi.
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EyeOff, Eye, Snowflake, Plus, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPSkeletonTable, EPEmptyState } from "@/components/ep";
import {
  wmsCountApi,
  type CountDeviationReason,
  type FreezeZone,
} from "@/lib/api/wms-count";
import type { InventoryCountData, WarehouseData } from "./types";

interface BlindCountPanelProps {
  counts: InventoryCountData[];
  warehouses: WarehouseData[];
}

const DEVIATION_QK = ["/api/wms/count-deviation-reasons"];
const FREEZE_QK = ["/api/wms/freeze-zones"];

export function BlindCountPanel({ counts, warehouses }: BlindCountPanelProps) {
  const { toast } = useToast();

  // ── Ko'r-sanoq (blind count) holati ───────────────────────────────────────
  const [blindMode, setBlindMode] = useState(true);
  const [lineCountId, setLineCountId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [systemQty, setSystemQty] = useState("");
  const [countedQty, setCountedQty] = useState("");
  const [deviationReason, setDeviationReason] = useState("");
  const [lineNotes, setLineNotes] = useState("");

  // ── Muzlatish-zona holati ─────────────────────────────────────────────────
  const [freezeWarehouseId, setFreezeWarehouseId] = useState("");
  const [freezeMaterialId, setFreezeMaterialId] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [releaseId, setReleaseId] = useState<number | null>(null);

  const safeCounts = Array.isArray(counts) ? counts : [];
  const safeWarehouses = Array.isArray(warehouses) ? warehouses : [];

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: reasonsData, isLoading: reasonsLoading } = useQuery({
    queryKey: DEVIATION_QK,
    queryFn: () => wmsCountApi.deviationReasons(),
  });
  const reasons: CountDeviationReason[] = Array.isArray(reasonsData?.items)
    ? reasonsData!.items
    : [];

  const {
    data: freezeData,
    isLoading: freezeLoading,
  } = useQuery({
    queryKey: FREEZE_QK,
    queryFn: () => wmsCountApi.freezeZones({ status: "active" }),
  });
  const freezes: FreezeZone[] = Array.isArray(freezeData?.items) ? freezeData!.items : [];

  // ── system≠counted bo'lsa sabab majburiy (FE oldindan tekshiradi) ─────────
  const sysNum = Number(systemQty);
  const cntNum = Number(countedQty);
  const hasDeviation =
    systemQty !== "" && countedQty !== "" && Number.isFinite(sysNum) && Number.isFinite(cntNum)
      ? sysNum !== cntNum
      : false;
  const deviationRequiredMissing = hasDeviation && !deviationReason;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const recordLineMutation = useMutation({
    mutationFn: () =>
      wmsCountApi.recordCountLine({
        count_id: lineCountId,
        material_id: materialId,
        system_qty: sysNum,
        counted_qty: cntNum,
        deviation_reason_code: deviationReason || null,
        notes: lineNotes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/inventory-counts"] });
      toast({ title: "Sanoq qatori saqlandi" });
      setMaterialId("");
      setSystemQty("");
      setCountedQty("");
      setDeviationReason("");
      setLineNotes("");
    },
    onError: (e: Error) =>
      toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const freezeMutation = useMutation({
    mutationFn: () =>
      wmsCountApi.freezeZone({
        warehouse_id: freezeWarehouseId,
        material_id: freezeMaterialId || null,
        reason: freezeReason || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FREEZE_QK });
      toast({ title: "Zona muzlatildi" });
      setFreezeMaterialId("");
      setFreezeReason("");
    },
    onError: (e: Error) =>
      toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const releaseMutation = useMutation({
    mutationFn: (id: number) => wmsCountApi.releaseFreezeZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FREEZE_QK });
      toast({ title: "Muzlatish bo'shatildi" });
    },
    onError: (e: Error) =>
      toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const canSubmitLine =
    !!lineCountId && !!materialId && countedQty !== "" && !deviationRequiredMissing;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {blindMode ? (
              <EyeOff className="h-4 w-4 text-[var(--ep-blue)]" />
            ) : (
              <Eye className="h-4 w-4 text-[var(--ep-blue)]" />
            )}
            Ko'r-sanoq (blind count) + muzlatish
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="blind-toggle" className="text-sm text-muted-foreground">
              {blindMode ? "Tizim-miqdori yashirilgan" : "Tizim-miqdori ko'rinadi"}
            </Label>
            <Switch id="blind-toggle" checked={blindMode} onCheckedChange={setBlindMode} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Count-line yozish formasi ─────────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Sanoq sessiyasi</Label>
            <Select value={lineCountId} onValueChange={setLineCountId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sessiyani tanlang" />
              </SelectTrigger>
              <SelectContent>
                {safeCounts.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.countNumber} · {c.warehouseName ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Material ID</Label>
            <Input
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              placeholder="Material #"
              inputMode="numeric"
              className="h-9"
            />
          </div>

          {/* Tizim-miqdori — ko'r-sanoq rejimida YASHIRILADI (xolislik). */}
          {!blindMode && (
            <div className="space-y-1">
              <Label className="text-xs">Tizim miqdori</Label>
              <Input
                value={systemQty}
                onChange={(e) => setSystemQty(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                className="h-9"
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Sanalgan miqdor</Label>
            <Input
              value={countedQty}
              onChange={(e) => setCountedQty(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="h-9"
            />
          </div>

          {/* Og'ish-sabab — system≠counted bo'lsa majburiy. Blind rejimda ham
              ko'rsatamiz, chunki BE og'ishni o'zi aniqlaydi va sabab so'raydi. */}
          <div className="space-y-1">
            <Label className="text-xs">
              Og'ish sababi{deviationRequiredMissing ? " (majburiy)" : ""}
            </Label>
            <Select value={deviationReason} onValueChange={setDeviationReason}>
              <SelectTrigger
                className={`h-9 ${deviationRequiredMissing ? "border-[var(--ep-red)]" : ""}`}
              >
                <SelectValue placeholder={reasonsLoading ? "Yuklanmoqda…" : "Sababni tanlang"} />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Izoh</Label>
            <Input
              value={lineNotes}
              onChange={(e) => setLineNotes(e.target.value)}
              placeholder="Ixtiyoriy"
              className="h-9"
            />
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-muted-foreground">
            {blindMode
              ? "Ko'r-sanoq: tizim-miqdorini ko'rmasdan haqiqiy qoldiqni kiriting."
              : "Tizim-miqdori ko'rinmoqda — og'ish avtomatik hisoblanadi."}
          </p>
          <Button
            onClick={() => recordLineMutation.mutate()}
            disabled={!canSubmitLine || recordLineMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Sanoq qatorini saqlash
          </Button>
        </div>

        {/* ── Muzlatish-zona sub-paneli ─────────────────────────────────── */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-[var(--ep-blue)]" />
            <h3 className="text-sm font-semibold">Muzlatilgan zonalar</h3>
            <Badge variant="secondary">{freezes.length}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Ombor</Label>
              <Select value={freezeWarehouseId} onValueChange={setFreezeWarehouseId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Omborni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {safeWarehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Material ID (ixtiyoriy)</Label>
              <Input
                value={freezeMaterialId}
                onChange={(e) => setFreezeMaterialId(e.target.value)}
                placeholder="Bo'sh = butun zona"
                inputMode="numeric"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sabab</Label>
              <Input
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="Ixtiyoriy"
                className="h-9"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => freezeMutation.mutate()}
                disabled={!freezeWarehouseId || freezeMutation.isPending}
              >
                <Lock className="w-4 h-4 mr-2" />
                Muzlatish
              </Button>
            </div>
          </div>

          {freezeLoading ? (
            <EPSkeletonTable rows={3} />
          ) : freezes.length === 0 ? (
            <EPEmptyState
              icon={Snowflake}
              title="Muzlatish yo'q"
              description="Aktiv muzlatilgan zona yo'q"
              variant="inline"
            />
          ) : (
            <div className="space-y-2">
              {freezes.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {f.warehouse_name ?? `Ombor #${f.warehouse_id}`}
                      {f.material_id != null && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {f.material_name ?? `material #${f.material_id}`}
                        </span>
                      )}
                      {f.material_id == null && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          butun zona
                        </Badge>
                      )}
                    </div>
                    {f.reason && (
                      <div className="text-xs text-muted-foreground truncate">{f.reason}</div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReleaseId(f.id)}
                    disabled={releaseMutation.isPending}
                  >
                    <Unlock className="w-4 h-4 mr-1" />
                    Bo'shatish
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={releaseId !== null}
        onOpenChange={(open) => {
          if (!open) setReleaseId(null);
        }}
        title="Muzlatishni bo'shatishni tasdiqlang"
        description="Muzlatish bo'shatilgach, ushbu zonadan chiqim qaytadan ochiladi."
        confirmText="Bo'shatish"
        onConfirm={() => {
          if (releaseId !== null) releaseMutation.mutate(releaseId);
          setReleaseId(null);
        }}
      />
    </Card>
  );
}
