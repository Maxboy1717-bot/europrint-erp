/**
 * @module WarehouseZonesPage
 * @description WMS ombor zonalari sahifasi. GET /api/warehouse/zones + POST /api/warehouse/zones.
 * Rol: WH_READ (ko'rish), WH_WRITE (yaratish) — warehouse_manager, super_admin, director, ERP_MANAGER.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Warehouse, Grid3X3, Plus } from "lucide-react";
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

interface ZoneItem {
  id: string;
  code: string;
  name: string;
  nameRu: string | null;
  zoneType: string;
  capacity: number;
  isActive: boolean;
  warehouseId: string | null;
  warehouseName: string | null;
  binCount: number;
}

interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ZONE_TYPES = ["storage", "receiving", "shipping", "quarantine", "return", "production"];

const ZONE_TYPE_COLOR: Record<string, string> = {
  storage:    "var(--ep-blue)",
  receiving:  "var(--ep-green)",
  shipping:   "var(--ep-purple)",
  quarantine: "var(--ep-red)",
  return:     "var(--ep-yellow)",
  production: "var(--ep-cyan)",
};

// ── CreateZoneDialog ─────────────────────────────────────────────────────────

interface CreateZoneDialogProps {
  open: boolean;
  onClose: () => void;
  warehouses: WarehouseItem[];
}

function CreateZoneDialog({ open, onClose, warehouses }: CreateZoneDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [warehouseId, setWarehouseId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [zoneType, setZoneType] = useState("storage");
  const [capacity, setCapacity] = useState("500");

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/warehouse/zones", {
        warehouse_id: warehouseId ? parseInt(warehouseId, 10) : undefined,
        code:         code.trim() || undefined,
        name:         name.trim() || "Zona",
        zone_type:    zoneType,
        capacity:     parseFloat(capacity) || 500,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/warehouse/zones"] });
      toast({ title: "Zona yaratildi" });
      onClose();
      setWarehouseId(""); setCode(""); setName(""); setZoneType("storage"); setCapacity("500");
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent style={{ maxWidth: 420 }}>
        <DialogHeader>
          <DialogTitle>Yangi Zona qo'shish</DialogTitle>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <Label htmlFor="zone-warehouse">Ombor</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger id="zone-warehouse" data-testid="select-zone-warehouse">
                <SelectValue placeholder="Omborni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
            <div>
              <Label htmlFor="zone-code">Kod</Label>
              <Input
                id="zone-code"
                data-testid="input-zone-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="A"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="zone-name">Nomi *</Label>
              <Input
                id="zone-name"
                data-testid="input-zone-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="A-Zona (Kirish)"
                maxLength={200}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="zone-type">Zona turi</Label>
            <Select value={zoneType} onValueChange={setZoneType}>
              <SelectTrigger id="zone-type" data-testid="select-zone-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="zone-capacity">Sig'im (m³)</Label>
            <Input
              id="zone-capacity"
              data-testid="input-zone-capacity"
              type="number"
              min={0}
              step={50}
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter style={{ marginTop: 8 }}>
          <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
          <Button
            data-testid="btn-create-zone"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? "Saqlanmoqda..." : "Yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function WarehouseZonesPage() {
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const zonesQ = useQuery<ZoneItem[]>({
    queryKey: ["/api/warehouse/zones", filterWarehouse],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterWarehouse) params.set("warehouse_id", filterWarehouse);
      const qs = params.toString();
      return apiRequest("GET", `/api/warehouse/zones${qs ? "?" + qs : ""}`);
    },
    select: selectArray,
  });

  const whQ = useQuery<WarehouseItem[]>({
    queryKey: ["/api/warehouse/warehouses"],
    queryFn: () => apiRequest("GET", "/api/warehouse/warehouses"),
    select: selectArray,
  });

  const zones      = zonesQ.data ?? [];
  const warehouses = whQ.data   ?? [];

  const activeZones = zones.filter(z => z.isActive).length;
  const totalBins   = zones.reduce((s, z) => s + (z.binCount ?? 0), 0);

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ep-text)", margin: 0 }}>
            Ombor Zonalari
          </h1>
          <p style={{ fontSize: 13, color: "var(--ep-muted)", margin: "4px 0 0" }}>
            Receiving · Storage · Shipping · Quarantine zonalari
          </p>
        </div>
        <Button
          data-testid="btn-open-create-zone"
          onClick={() => setCreateOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={15} /> Yangi zona
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <ZoneKpiCard icon={<Layers size={18} color="var(--ep-purple)" />} label="Jami zonalar" value={zones.length} color="var(--ep-purple-soft)" />
        <ZoneKpiCard icon={<Warehouse size={18} color="var(--ep-green)" />} label="Faol zonalar" value={activeZones} color="var(--ep-green-soft)" />
        <ZoneKpiCard icon={<Grid3X3 size={18} color="var(--ep-blue)" />} label="Jami binlar" value={totalBins} color="var(--ep-blue-soft)" />
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <Select value={filterWarehouse || "__all__"} onValueChange={v => setFilterWarehouse(v === "__all__" ? "" : v)}>
          <SelectTrigger style={{ width: 220 }} data-testid="filter-zone-warehouse">
            <SelectValue placeholder="Barcha omborlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Barcha omborlar</SelectItem>
            {warehouses.map(w => (
              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filterWarehouse && (
          <Button variant="ghost" size="sm" onClick={() => setFilterWarehouse("")} data-testid="btn-clear-zone-filter">
            Tozalash
          </Button>
        )}
      </div>

      {/* Zones grid */}
      {zonesQ.isLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ep-subtle)" }}>Yuklanmoqda...</div>
      ) : zonesQ.isError ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ep-subtle)" }}>
          <div style={{ color: "var(--ep-red)", fontWeight: 600, marginBottom: 8 }}>
            Zonalarni yuklashda xatolik
          </div>
          <Button variant="outline" size="sm" onClick={() => zonesQ.refetch()} data-testid="btn-retry-zones">
            Qayta urinib ko'rish
          </Button>
        </div>
      ) : zones.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--ep-subtle)" }}>Zonalar topilmadi</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {zones.map(z => {
            const accent = ZONE_TYPE_COLOR[z.zoneType] ?? "var(--ep-muted)";
            return (
              <div
                key={z.id}
                data-testid={`zone-card-${z.id}`}
                style={{
                  background: "var(--ep-surface)", borderRadius: 14, padding: "18px 20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  borderLeft: `4px solid ${accent}`,
                  display: "flex", flexDirection: "column", gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ep-text)" }}>
                      {z.code ? `${z.code} — ` : ""}{z.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ep-muted)", marginTop: 2 }}>
                      {z.warehouseName ?? "Ombor ko'rsatilmagan"}
                    </div>
                  </div>
                  <Badge
                    variant={z.isActive ? "default" : "secondary"}
                    style={{ fontSize: 10, flexShrink: 0 }}
                  >
                    {z.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent,
                  }}>
                    {z.zoneType}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ep-muted)", padding: "3px 8px", background: "var(--ep-bg)", borderRadius: 6 }}>
                    Sig'im: {z.capacity} m³
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Grid3X3 size={12} color="var(--ep-subtle)" />
                  <span style={{ fontSize: 12, color: "var(--ep-muted)" }}>
                    {z.binCount} ta bin
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateZoneDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        warehouses={warehouses}
      />
    </div>
  );
}

// ── ZoneKpiCard ──────────────────────────────────────────────────────────────

function ZoneKpiCard({ icon, label, value, color }: {
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
