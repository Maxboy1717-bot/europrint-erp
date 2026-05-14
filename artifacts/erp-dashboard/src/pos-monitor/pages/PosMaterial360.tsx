/**
 * PosMaterial360.tsx
 *
 * Material 360° profili — bitta material uchun TO'LIQ ma'lumot:
 *   • Asosiy ma'lumot kartochkasi
 *   • Stok har omborda alohida (jadval)
 *   • Oxirgi 50 ta harakat
 *   • FIFO partiyalar va narx tarixi
 *   • Ta'minotchilar ro'yxati
 *   • Auto-yaratilgan barkodlar
 *
 * URL: /pos-monitor/materials/360/:id
 */
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { warehouseFeaturesApi } from "../api/pos-monitor.api";

interface Material360 {
  material: {
    id: number; code: string; name: string; nameRu: string | null;
    category: string | null; materialType: string | null;
    unit: string; unitPrice: number; currency: string;
    currentStock: number; minStock: number; maxStock: number | null;
    description: string | null; supplierName: string | null;
    isActive: boolean; createdAt: string;
  };
  stockByWarehouse: Array<{
    warehouseId: number; warehouseCode: string; warehouseName: string;
    warehouseType: string; available: number; reserved: number;
    total: number; lastUpdated: string | null;
  }>;
  recentMovements: Array<{
    movementId: number; movementNumber: string; movementType: string;
    status: string; quantity: number; unit: string; unitPrice: number;
    fromWarehouseId: number | null; toWarehouseId: number | null;
    createdAt: string; createdByName: string;
  }>;
  priceHistory: Array<{
    id: number; unitPrice: number; currency: string;
    supplierName: string | null; purchaseDate: string | null;
    createdAt: string;
  }>;
  suppliers: Array<{ name: string; lastPrice: number; lastDate: string | null; occurrences: number }>;
  barcodes: Array<{
    id: number; barcode: string; barcodeType: string;
    batchNumber: string | null; quantity: number | null;
    status: string; createdAt: string;
  }>;
  totals: {
    totalInflow: number; totalOutflow: number; netChange: number;
    distinctWarehouses: number; movementCount: number;
  };
}

const MOVEMENT_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  EXTERNAL_IN:       { bg: "#ECFDF5", text: "#065F46", label: "Tashqi Kirim" },
  EXTERNAL_OUT:      { bg: "#FEF3C7", text: "#92400E", label: "Tashqi Chiqim" },
  INTERNAL_ISSUE:    { bg: "#EFF6FF", text: "#1E40AF", label: "Bo'limga Berish" },
  INTERNAL_RETURN:   { bg: "#F0FDF4", text: "#14532D", label: "Qaytarish" },
  INTERNAL_TRANSFER: { bg: "#F5F3FF", text: "#4C1D95", label: "Ko'chirish" },
  DAMAGE:            { bg: "#FEF2F2", text: "#991B1B", label: "Zarar" },
  INVENTORY_ADJUST:  { bg: "#F1F5F9", text: "#1E293B", label: "Tuzatish" },
};

function fmt(n: number, unit?: string): string {
  return `${n.toLocaleString("uz-UZ", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
}

function fmtMoney(n: number, currency = "UZS"): string {
  return `${n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 })} ${currency}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("uz-UZ"); } catch { return "—"; }
}

export default function PosMaterial360() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const matId = parseInt(params.id ?? "0", 10);

  const [data, setData] = useState<Material360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"stock" | "movements" | "prices" | "suppliers" | "barcodes">("stock");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const r = await warehouseFeaturesApi.getMaterialProfile(matId) as Material360;
        if (!cancelled) setData(r);
      } catch (e) {
        if (!cancelled) setError(String((e as Error).message ?? "Yuklanmadi"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [matId]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>⏳ Yuklanmoqda...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ marginTop: 12, color: "#DC2626" }}>{error || "Material topilmadi"}</div>
        <button
          onClick={() => navigate("/pos-monitor/materials")}
          style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, background: "#F59E0B", color: "#FFF", border: "none", cursor: "pointer" }}
        >
          ← Materiallar ro'yxatiga qaytish
        </button>
      </div>
    );
  }

  const { material, stockByWarehouse, recentMovements, priceHistory, suppliers, barcodes, totals } = data;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "20px 24px" }}>
      {/* Sarlavha */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate("/pos-monitor/materials")}
          style={{ padding: "6px 12px", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
        >
          ← Orqaga
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>MATERIAL 360°</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1F2937" }}>
            {material.name}
          </h1>
          <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace", marginTop: 2 }}>
            {material.code} {material.nameRu ? `· ${material.nameRu}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>Joriy stok</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: material.currentStock < material.minStock ? "#DC2626" : "#059669" }}>
            {fmt(material.currentStock, material.unit)}
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>min: {material.minStock} · max: {material.maxStock ?? "—"}</div>
        </div>
      </div>

      {/* Yuqori KPI kartlar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 24 }}>
        <KpiCard icon="📦" label="Kategoriya" value={material.category ?? "—"} />
        <KpiCard icon="🏷️" label="Tur" value={material.materialType ?? "—"} />
        <KpiCard icon="💰" label="Birlik narxi" value={fmtMoney(material.unitPrice, material.currency)} />
        <KpiCard icon="⬇️" label="Jami kirim" value={fmt(totals.totalInflow, material.unit)} color="#059669" />
        <KpiCard icon="⬆️" label="Jami chiqim" value={fmt(totals.totalOutflow, material.unit)} color="#DC2626" />
        <KpiCard icon="🏭" label="Omborlar soni" value={String(totals.distinctWarehouses)} />
        <KpiCard icon="🔄" label="Harakatlar" value={String(totals.movementCount)} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #E5E7EB", marginBottom: 16, overflowX: "auto" }}>
        {[
          { k: "stock",      l: `📍 Stok (${stockByWarehouse.length})` },
          { k: "movements",  l: `🔄 Harakatlar (${recentMovements.length})` },
          { k: "prices",     l: `💰 Narx tarixi (${priceHistory.length})` },
          { k: "suppliers",  l: `🚛 Ta'minotchilar (${suppliers.length})` },
          { k: "barcodes",   l: `📊 Barkodlar (${barcodes.length})` },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            style={{
              padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: tab === t.k ? 700 : 500,
              color: tab === t.k ? "#1F2937" : "#9CA3AF",
              borderBottom: tab === t.k ? "2px solid #F59E0B" : "2px solid transparent",
              marginBottom: -2, whiteSpace: "nowrap",
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "stock" && (
        <TableCard>
          <thead>
            <tr>
              <Th>Ombor</Th><Th>Kod</Th><Th>Tur</Th>
              <Th align="right">Mavjud</Th><Th align="right">Band</Th><Th align="right">Jami</Th>
              <Th>Yangilangan</Th>
            </tr>
          </thead>
          <tbody>
            {stockByWarehouse.map(s => (
              <tr key={s.warehouseId} style={{ borderTop: "1px solid #F3F4F6" }}>
                <Td>{s.warehouseName}</Td>
                <Td mono>{s.warehouseCode}</Td>
                <Td><Pill color="#EFF6FF" text="#1E40AF">{s.warehouseType}</Pill></Td>
                <Td align="right" mono color={s.available > 0 ? "#059669" : "#9CA3AF"}>
                  {fmt(s.available, material.unit)}
                </Td>
                <Td align="right" mono color="#9CA3AF">{fmt(s.reserved, material.unit)}</Td>
                <Td align="right" mono><b>{fmt(s.total, material.unit)}</b></Td>
                <Td>{fmtDate(s.lastUpdated)}</Td>
              </tr>
            ))}
            {stockByWarehouse.length === 0 && (
              <tr><Td colSpan={7} center color="#9CA3AF">Hech qaysi omborda stok yo'q</Td></tr>
            )}
          </tbody>
        </TableCard>
      )}

      {tab === "movements" && (
        <TableCard>
          <thead>
            <tr>
              <Th>Raqam</Th><Th>Sana</Th><Th>Turi</Th><Th>Holat</Th>
              <Th align="right">Miqdor</Th><Th align="right">Narx</Th><Th>Kim</Th>
            </tr>
          </thead>
          <tbody>
            {recentMovements.map(m => {
              const cfg = MOVEMENT_COLOR[m.movementType] ?? { bg: "#F3F4F6", text: "#374151", label: m.movementType };
              return (
                <tr key={m.movementId} style={{ borderTop: "1px solid #F3F4F6" }}>
                  <Td mono>{m.movementNumber}</Td>
                  <Td>{fmtDate(m.createdAt)}</Td>
                  <Td><Pill color={cfg.bg} text={cfg.text}>{cfg.label}</Pill></Td>
                  <Td><Pill color="#F3F4F6" text="#374151">{m.status}</Pill></Td>
                  <Td align="right" mono>{fmt(m.quantity, m.unit)}</Td>
                  <Td align="right" mono>{fmtMoney(m.unitPrice)}</Td>
                  <Td>{m.createdByName.trim() || "—"}</Td>
                </tr>
              );
            })}
            {recentMovements.length === 0 && (
              <tr><Td colSpan={7} center color="#9CA3AF">Harakatlar yo'q</Td></tr>
            )}
          </tbody>
        </TableCard>
      )}

      {tab === "prices" && (
        <TableCard>
          <thead>
            <tr>
              <Th>Sana</Th><Th align="right">Narx</Th>
              <Th>Valyuta</Th><Th>Ta'minotchi</Th>
            </tr>
          </thead>
          <tbody>
            {priceHistory.map(p => (
              <tr key={p.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                <Td>{fmtDate(p.purchaseDate ?? p.createdAt)}</Td>
                <Td align="right" mono><b>{fmtMoney(p.unitPrice, p.currency)}</b></Td>
                <Td mono>{p.currency}</Td>
                <Td>{p.supplierName ?? "—"}</Td>
              </tr>
            ))}
            {priceHistory.length === 0 && (
              <tr><Td colSpan={4} center color="#9CA3AF">Narx tarixi yo'q (yangi material)</Td></tr>
            )}
          </tbody>
        </TableCard>
      )}

      {tab === "suppliers" && (
        <TableCard>
          <thead>
            <tr>
              <Th>Ta'minotchi</Th><Th align="right">Oxirgi narx</Th>
              <Th>Oxirgi yetkazib berish</Th><Th align="right">Marotaba</Th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.name} style={{ borderTop: "1px solid #F3F4F6" }}>
                <Td><b>{s.name}</b></Td>
                <Td align="right" mono>{fmtMoney(s.lastPrice)}</Td>
                <Td>{fmtDate(s.lastDate)}</Td>
                <Td align="right" mono>{s.occurrences}</Td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr><Td colSpan={4} center color="#9CA3AF">Ta'minotchilar yo'q</Td></tr>
            )}
          </tbody>
        </TableCard>
      )}

      {tab === "barcodes" && (
        <TableCard>
          <thead>
            <tr>
              <Th>Barkod</Th><Th>Turi</Th><Th>Partiya</Th>
              <Th align="right">Miqdor</Th><Th>Holat</Th><Th>Yaratilgan</Th>
            </tr>
          </thead>
          <tbody>
            {barcodes.map(b => (
              <tr key={b.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                <Td mono><b>{b.barcode}</b></Td>
                <Td><Pill color="#EFF6FF" text="#1E40AF">{b.barcodeType}</Pill></Td>
                <Td mono>{b.batchNumber ?? "—"}</Td>
                <Td align="right" mono>{b.quantity != null ? fmt(b.quantity, material.unit) : "—"}</Td>
                <Td>
                  <Pill color={b.status === "PRINTED" ? "#ECFDF5" : "#FEF3C7"} text={b.status === "PRINTED" ? "#065F46" : "#92400E"}>
                    {b.status}
                  </Pill>
                </Td>
                <Td>{fmtDate(b.createdAt)}</Td>
              </tr>
            ))}
            {barcodes.length === 0 && (
              <tr><Td colSpan={6} center color="#9CA3AF">Barkodlar hali yaratilmagan</Td></tr>
            )}
          </tbody>
        </TableCard>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#FFF", borderRadius: 12, padding: "12px 14px", border: "1px solid #E5E7EB" }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color ?? "#1F2937", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        {children}
      </table>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th style={{
      padding: "10px 14px", textAlign: align ?? "left", fontSize: 11,
      color: "#9CA3AF", fontWeight: 600, background: "#F9FAFB",
      borderBottom: "1px solid #E5E7EB", textTransform: "uppercase",
    }}>
      {children}
    </th>
  );
}

function Td({ children, align, mono, color, center, colSpan }: {
  children: React.ReactNode; align?: "left" | "right" | "center";
  mono?: boolean; color?: string; center?: boolean; colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} style={{
      padding: "10px 14px",
      textAlign: align ?? (center ? "center" : "left"),
      fontFamily: mono ? "monospace" : "inherit",
      color: color ?? "#1F2937",
      fontSize: 13,
    }}>
      {children}
    </td>
  );
}

function Pill({ children, color, text }: { children: React.ReactNode; color: string; text: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 8px", borderRadius: 6,
      background: color, color: text, fontSize: 10, fontWeight: 700,
    }}>
      {children}
    </span>
  );
}
