/**
 * @module PPEquipmentPage
 * @description PP uskuna (equipment) katalogi. GET /api/equipment + POST /api/equipment.
 * Rol: super_admin, director, production_manager, technologist, maintenance.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
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

// ── Types ────────────────────────────────────────────────────────────────────

interface EquipmentItem {
  id: string;
  name: string;
  type: string | null;
  manufacturer: string | null;
  model: string | null;
  location: string | null;
  status: string;
  is_active: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const EQUIPMENT_TYPES = ["press", "laminator", "cutter", "binder", "folder", "printer", "conveyor", "other"];
const EQUIPMENT_STATUSES = ["active", "maintenance", "inactive"] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:      { label: "Faol",        color: "#10B981", icon: <CheckCircle2 size={12} /> },
  maintenance: { label: "Ta'mirda",    color: "#F59E0B", icon: <AlertTriangle size={12} /> },
  inactive:    { label: "Nofaol",      color: "#94A3B8", icon: <Wrench size={12} /> },
};

// ── CreateEquipmentDialog ────────────────────────────────────────────────────

interface CreateEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateEquipmentDialog({ open, onClose }: CreateEquipmentDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"active" | "maintenance" | "inactive">("active");

  function reset() {
    setName(""); setCode(""); setType(""); setManufacturer(""); setModel(""); setLocation(""); setStatus("active");
  }

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/equipment", {
        name:         name.trim(),
        code:         code.trim() || undefined,
        type:         type || undefined,
        manufacturer: manufacturer.trim() || undefined,
        model:        model.trim() || undefined,
        location:     location.trim() || undefined,
        status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Uskuna qo'shildi" });
      reset();
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent style={{ maxWidth: 460 }}>
        <DialogHeader>
          <DialogTitle>Yangi uskuna qo'shish</DialogTitle>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <Label htmlFor="eq-name">Nomi *</Label>
            <Input
              id="eq-name"
              data-testid="input-equipment-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ofset mashina #1"
              maxLength={255}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <Label htmlFor="eq-code">Kod / inventar</Label>
              <Input
                id="eq-code"
                data-testid="input-equipment-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="EQ-001"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="eq-type">Tur</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="eq-type" data-testid="select-equipment-type">
                  <SelectValue placeholder="Turni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <Label htmlFor="eq-manufacturer">Ishlab chiqaruvchi</Label>
              <Input
                id="eq-manufacturer"
                data-testid="input-equipment-manufacturer"
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                placeholder="Heidelberg"
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="eq-model">Model</Label>
              <Input
                id="eq-model"
                data-testid="input-equipment-model"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="Speedmaster XL75"
                maxLength={100}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
            <div>
              <Label htmlFor="eq-location">Joylashuv (sex)</Label>
              <Input
                id="eq-location"
                data-testid="input-equipment-location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ofset Sex"
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="eq-status">Holat</Label>
              <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
                <SelectTrigger id="eq-status" data-testid="select-equipment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter style={{ marginTop: 8 }}>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Bekor qilish</Button>
          <Button
            data-testid="btn-create-equipment"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? "Saqlanmoqda..." : "Qo'shish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function PPEquipmentPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("__all__");

  const equipQ = useQuery<EquipmentItem[]>({
    queryKey: ["/api/equipment"],
    queryFn: () => apiRequest("GET", "/api/equipment"),
    select: selectArray,
  });

  const items = equipQ.data ?? [];
  const filtered = statusFilter === "__all__"
    ? items
    : items.filter(e => e.status === statusFilter);

  const activeCount = items.filter(e => e.status === "active").length;
  const maintCount  = items.filter(e => e.status === "maintenance").length;

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A202C", margin: 0 }}>
            PP Uskunalar katalogi
          </h1>
          <p style={{ fontSize: 13, color: "#718096", margin: "4px 0 0" }}>
            Ishlab chiqarish uskunalari ro'yxati
          </p>
        </div>
        <Button
          data-testid="btn-open-create-equipment"
          onClick={() => setCreateOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={15} /> Yangi uskuna
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <EqKpiCard color="#EFF6FF" iconColor="#3B82F6" label="Jami uskunalar" value={items.length} />
        <EqKpiCard color="#F0FDF4" iconColor="#10B981" label="Faol" value={activeCount} />
        <EqKpiCard color="#FFFBEB" iconColor="#F59E0B" label="Ta'mirda" value={maintCount} />
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger style={{ width: 180 }} data-testid="filter-equipment-status">
            <SelectValue placeholder="Barcha holatlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Barcha holatlar</SelectItem>
            {EQUIPMENT_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {statusFilter !== "__all__" && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter("__all__")} data-testid="btn-clear-eq-filter">
            Tozalash
          </Button>
        )}
      </div>

      {/* Table */}
      {equipQ.isLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Yuklanmoqda...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Uskunalar topilmadi</div>
      ) : (
        <div style={{
          background: "#fff", borderRadius: 14,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Nomi", "Tur", "Ishlab chiqaruvchi / Model", "Joylashuv", "Holat"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748B" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const cfg = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.inactive;
                return (
                  <tr
                    key={e.id}
                    data-testid={`equipment-row-${e.id}`}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: i % 2 === 0 ? "#fff" : "#FAFAFA",
                    }}
                  >
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#1E293B" }}>
                      {e.name}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {e.type ? (
                        <Badge variant="secondary" style={{ fontSize: 11 }}>{e.type}</Badge>
                      ) : <span style={{ color: "#CBD5E1" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#475569" }}>
                      {[e.manufacturer, e.model].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748B" }}>
                      {e.location || "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ color: cfg.color }}>{cfg.icon}</span>
                        <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateEquipmentDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

// ── EqKpiCard ────────────────────────────────────────────────────────────────

function EqKpiCard({ color, iconColor, label, value }: {
  color: string; iconColor: string; label: string; value: number;
}) {
  return (
    <div style={{
      background: color, borderRadius: 12, padding: "16px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}>
        <Wrench size={18} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1A202C", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
