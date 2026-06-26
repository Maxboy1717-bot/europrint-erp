/**
 * @module WarehouseBinsPage
 * @description WMS ombor bin/yacheykalar sahifasi. GET /api/warehouse/bins + POST /api/warehouse/bins.
 * Rol: WH_READ (ko'rish), WH_WRITE (yaratish) — warehouse_manager, super_admin, director, ERP_MANAGER.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Grid3X3, Warehouse, Layers, Plus } from "lucide-react";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// ── Types ───────────────────────────────────────────────────────────────────

interface WarehouseBin {
  id: string;
  binCode: string;
  row: string | null;
  shelf: string | null;
  level: string | null;
  binType: string;
  maxWeight: number;
  maxVolume: number;
  currentOccupancy: number;
  isActive: boolean;
  zoneId: string | null;
  warehouseId: string | null;
  zoneName: string | null;
  zoneType: string | null;
  warehouseName: string | null;
  occupancyPct: number;
}

interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface ZoneItem {
  id: string;
  code: string;
  name: string;
  zoneType: string;
  warehouseId: string | null;
  warehouseName: string | null;
  binCount: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const BIN_TYPES = ["storage", "receiving", "shipping", "quarantine", "return"];

function occupancyColor(pct: number): string {
  if (pct >= 90) return "var(--ep-red)";
  if (pct >= 70) return "var(--ep-yellow)";
  return "var(--ep-green)";
}

function OccupancyBar({ pct }: { pct: number }) {
  const color = occupancyColor(pct);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        flex: 1, height: 6, background: "var(--ep-border)", borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.min(pct, 100)}%`, height: "100%",
          background: color, borderRadius: 99, transition: "width 0.3s",
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 32 }}>
        {pct}%
      </span>
    </div>
  );
}

// ── CreateBinDialog ──────────────────────────────────────────────────────────

interface CreateBinDialogProps {
  open: boolean;
  onClose: () => void;
  warehouses: WarehouseItem[];
  zones: ZoneItem[];
}

function CreateBinDialog({ open, onClose, warehouses, zones }: CreateBinDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [warehouseId, setWarehouseId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [binCode, setBinCode] = useState("");
  const [binType, setBinType] = useState("storage");
  const [maxWeight, setMaxWeight] = useState("500");
  const [maxVolume, setMaxVolume] = useState("2.0");

  const filteredZones = zoneId === "" && warehouseId
    ? zones.filter(z => z.warehouseId === warehouseId)
    : zones;

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/warehouse/bins", {
        warehouse_id: warehouseId ? parseInt(warehouseId, 10) : undefined,
        zone_id:      zoneId      ? parseInt(zoneId, 10)      : undefined,
        bin_code:     binCode || undefined,
        bin_type:     binType,
        max_weight:   parseFloat(maxWeight) || 500,
        max_volume:   parseFloat(maxVolume) || 2.0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/warehouse/bins"] });
      toast({ title: "Bin yaratildi" });
      onClose();
      setWarehouseId(""); setZoneId(""); setBinCode("");
      setBinType("storage"); setMaxWeight("500"); setMaxVolume("2.0");
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent style={{ maxWidth: 440 }}>
        <DialogHeader>
          <DialogTitle>Yangi Bin (yacheyka) qo'shish</DialogTitle>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <Label htmlFor="bin-warehouse">Ombor</Label>
            <Select value={warehouseId} onValueChange={v => { setWarehouseId(v); setZoneId(""); }}>
              <SelectTrigger id="bin-warehouse" data-testid="select-warehouse">
                <SelectValue placeholder="Omborni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bin-zone">Zona</Label>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger id="bin-zone" data-testid="select-zone">
                <SelectValue placeholder="Zonani tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(warehouseId
                  ? zones.filter(z => z.warehouseId === warehouseId)
                  : filteredZones
                ).map(z => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.code} — {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bin-code">Bin kodi (ixtiyoriy)</Label>
            <Input
              id="bin-code"
              data-testid="input-bin-code"
              value={binCode}
              onChange={e => setBinCode(e.target.value)}
              placeholder="BIN-A01-R1-S2-L3"
            />
          </div>

          <div>
            <Label htmlFor="bin-type">Tur</Label>
            <Select value={binType} onValueChange={setBinType}>
              <SelectTrigger id="bin-type" data-testid="select-bin-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BIN_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <Label htmlFor="max-weight">Max og'irlik (kg)</Label>
              <Input
                id="max-weight"
                data-testid="input-max-weight"
                type="number"
                min={0}
                step={50}
                value={maxWeight}
                onChange={e => setMaxWeight(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="max-volume">Max hajm (m³)</Label>
              <Input
                id="max-volume"
                data-testid="input-max-volume"
                type="number"
                min={0}
                step={0.5}
                value={maxVolume}
                onChange={e => setMaxVolume(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter style={{ marginTop: 8 }}>
          <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
          <Button
            data-testid="btn-create-bin"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saqlanmoqda..." : "Yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function WarehouseBinsPage() {
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const binsQ = useQuery<WarehouseBin[]>({
    queryKey: ["/api/warehouse/bins", filterWarehouse, filterZone],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterWarehouse) params.set("warehouse_id", filterWarehouse);
      if (filterZone)      params.set("zone_id", filterZone);
      const qs = params.toString();
      return apiRequest("GET", `/api/warehouse/bins${qs ? "?" + qs : ""}`);
    },
    select: selectArray,
  });

  const whQ = useQuery<WarehouseItem[]>({
    queryKey: ["/api/warehouse/warehouses"],
    queryFn: () => apiRequest("GET", "/api/warehouse/warehouses"),
    select: selectArray,
  });

  const zoneQ = useQuery<ZoneItem[]>({
    queryKey: ["/api/warehouse/zones"],
    queryFn: () => apiRequest("GET", "/api/warehouse/zones"),
    select: selectArray,
  });

  const bins       = binsQ.data  ?? [];
  const warehouses = whQ.data    ?? [];
  const zones      = zoneQ.data  ?? [];

  const activeBins = bins.filter(b => b.isActive).length;
  const highOccupancy = bins.filter(b => b.occupancyPct >= 80).length;

  const filteredZones = filterWarehouse
    ? zones.filter(z => z.warehouseId === filterWarehouse)
    : zones;

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ep-text)", margin: 0 }}>
            Ombor Binlari (Yacheykalar)
          </h1>
          <p style={{ fontSize: 13, color: "var(--ep-muted)", margin: "4px 0 0" }}>
            Ombor joylashuv tuzilmasi — zonalar va binlar
          </p>
        </div>
        <Button
          data-testid="btn-open-create-bin"
          onClick={() => setCreateOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={15} /> Yangi bin
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <KpiCard icon={<Grid3X3 size={18} color="var(--ep-blue)" />} label="Jami binlar" value={bins.length} color="var(--ep-blue-soft)" />
        <KpiCard icon={<Warehouse size={18} color="var(--ep-green)" />} label="Faol binlar" value={activeBins} color="var(--ep-green-soft)" />
        <KpiCard icon={<Layers size={18} color="var(--ep-yellow)" />} label="80%+ band" value={highOccupancy} color="var(--ep-yellow-soft)" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Select value={filterWarehouse || "__all__"} onValueChange={v => { setFilterWarehouse(v === "__all__" ? "" : v); setFilterZone(""); }}>
          <SelectTrigger style={{ width: 220 }} data-testid="filter-warehouse">
            <SelectValue placeholder="Barcha omborlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Barcha omborlar</SelectItem>
            {warehouses.map(w => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterZone || "__all__"} onValueChange={v => setFilterZone(v === "__all__" ? "" : v)}>
          <SelectTrigger style={{ width: 200 }} data-testid="filter-zone">
            <SelectValue placeholder="Barcha zonalar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Barcha zonalar</SelectItem>
            {filteredZones.map(z => (
              <SelectItem key={z.id} value={z.id}>{z.code} — {z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(filterWarehouse || filterZone) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterWarehouse(""); setFilterZone(""); }}
            data-testid="btn-clear-filters"
          >
            Tozalash
          </Button>
        )}
      </div>

      {/* Table */}
      {binsQ.isLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ep-subtle)" }}>Yuklanmoqda...</div>
      ) : binsQ.isError ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ep-subtle)" }}>
          <div style={{ color: "var(--ep-red)", fontWeight: 600, marginBottom: 8 }}>
            Binlarni yuklashda xatolik
          </div>
          <Button variant="outline" size="sm" onClick={() => binsQ.refetch()} data-testid="btn-retry-bins">
            Qayta urinib ko'rish
          </Button>
        </div>
      ) : bins.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ep-subtle)" }}>
          Binlar topilmadi
        </div>
      ) : (
        <div style={{
          background: "var(--ep-surface)", borderRadius: 14,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--ep-bg)", borderBottom: "1px solid var(--ep-border)" }}>
                {["Bin kodi", "Ombor", "Zona", "Tur", "Qator/Shelf/Daraja", "Band (%)", "Holat"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--ep-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bins.map((b, i) => (
                <tr
                  key={b.id}
                  data-testid={`bin-row-${b.id}`}
                  style={{
                    borderBottom: "1px solid var(--ep-border)",
                    background: i % 2 === 0 ? "var(--ep-surface)" : "var(--ep-bg)",
                    transition: "background 0.15s",
                  }}
                >
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "var(--ep-text)" }}>
                    {b.binCode || "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ep-muted)" }}>
                    {b.warehouseName || "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--ep-muted)" }}>
                    {b.zoneName || "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge variant="secondary" style={{ fontSize: 11 }}>
                      {b.binType}
                    </Badge>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ep-muted)" }}>
                    {[b.row, b.shelf, b.level].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td style={{ padding: "10px 14px", minWidth: 120 }}>
                    <OccupancyBar pct={Number(b.occupancyPct ?? 0)} />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge variant={b.isActive ? "default" : "secondary"} style={{ fontSize: 11 }}>
                      {b.isActive ? "Faol" : "Nofaol"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateBinDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        warehouses={warehouses}
        zones={zones}
      />
    </div>
  );
}

// ── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{
      background: color, borderRadius: 12, padding: "16px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: "var(--ep-surface)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ep-text)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--ep-muted)", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
