/**
 * WarehouseMaterial360.tsx
 * ERP — Material 360° to'liq profili
 * URL: /wms/material/360/:id
 *
 * Bitta material uchun:
 *   - Asosiy ma'lumot
 *   - Stok har omborda alohida (per-warehouse listing)
 *   - Oxirgi 50 ta harakat
 *   - Narx tarixi
 *   - Ta'minotchilar
 *   - Auto-yaratilgan barkodlar
 *   - Yig'indi statistika (kirim/chiqim/net)
 */
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { warehouseFeaturesApi } from "@/lib/api/warehouse-features";

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
    warehouseType: string; available: number; reserved: number; total: number;
    lastUpdated: string | null;
  }>;
  recentMovements: Array<{
    movementId: number; movementNumber: string; movementType: string;
    status: string; quantity: number; unit: string; unitPrice: number;
    fromWarehouseId: number | null; toWarehouseId: number | null;
    createdAt: string; createdByName: string;
  }>;
  priceHistory: Array<{
    id: number; unitPrice: number; currency: string;
    supplierName: string | null; purchaseDate: string | null; createdAt: string;
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
  EXTERNAL_IN:       { bg: "bg-emerald-100", text: "text-emerald-800", label: "Tashqi Kirim" },
  EXTERNAL_OUT:      { bg: "bg-amber-100",   text: "text-amber-800",   label: "Tashqi Chiqim" },
  INTERNAL_ISSUE:    { bg: "bg-blue-100",    text: "text-blue-800",    label: "Bo'limga Berish" },
  INTERNAL_RETURN:   { bg: "bg-green-100",   text: "text-green-800",   label: "Qaytarish" },
  INTERNAL_TRANSFER: { bg: "bg-violet-100",  text: "text-violet-800",  label: "Ko'chirish" },
  DAMAGE:            { bg: "bg-red-100",     text: "text-red-800",     label: "Zarar" },
  INVENTORY_ADJUST:  { bg: "bg-gray-100",    text: "text-gray-800",    label: "Tuzatish" },
};

function fmt(n: number | null | undefined, unit?: string): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0" + (unit ? " " + unit : "");
  return v.toLocaleString("uz-UZ", { maximumFractionDigits: 2 }) + (unit ? " " + unit : "");
}

function fmtMoney(n: number | null | undefined, currency = "UZS"): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0 " + currency;
  return v.toLocaleString("uz-UZ", { maximumFractionDigits: 0 }) + " " + currency;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("uz-UZ"); } catch { return "—"; }
}

export default function WarehouseMaterial360() {
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
    return <div className="p-10 text-center text-gray-500">⏳ Yuklanmoqda...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center">
        <div className="text-5xl">⚠️</div>
        <div className="mt-3 text-[var(--ep-red)]">{error || "Material topilmadi"}</div>
        <button
          onClick={() => navigate("/inventory/materials")}
          className="mt-4 px-4 py-2 bg-[var(--ep-yellow)] text-white rounded"
        >
          ← Materiallar
        </button>
      </div>
    );
  }

  const { material, stockByWarehouse, recentMovements, priceHistory, suppliers, barcodes, totals } = data;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => navigate("/inventory/materials")}
          className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded text-sm hover:bg-gray-200"
        >
          ← Orqaga
        </button>
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-semibold">MATERIAL 360°</div>
          <h1 className="text-2xl font-bold text-gray-900">{material.name}</h1>
          <div className="text-sm text-gray-500 font-mono mt-1">
            {material.code} {material.nameRu ? `· ${material.nameRu}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Joriy stok</div>
          <div className={`text-2xl font-bold ${
            (material.currentStock ?? 0) < (material.minStock ?? 0) ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"
          }`}>
            {fmt(material.currentStock, material.unit)}
          </div>
          <div className="text-xs text-gray-500">min: {fmt(material.minStock)} · max: {material.maxStock ? fmt(material.maxStock) : "—"}</div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <KpiBox icon="📦" label="Kategoriya" value={material.category ?? "—"} />
        <KpiBox icon="🏷️" label="Tur" value={material.materialType ?? "—"} />
        <KpiBox icon="💰" label="Birlik narxi" value={fmtMoney(material.unitPrice, material.currency)} />
        <KpiBox icon="⬇️" label="Jami kirim" value={fmt(totals?.totalInflow, material.unit)} color="text-[var(--ep-green)]" />
        <KpiBox icon="⬆️" label="Jami chiqim" value={fmt(totals?.totalOutflow, material.unit)} color="text-[var(--ep-red)]" />
        <KpiBox icon="🏭" label="Omborlar" value={String(totals?.distinctWarehouses ?? 0)} />
        <KpiBox icon="🔄" label="Harakatlar" value={String(totals?.movementCount ?? 0)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-gray-200 mb-4 overflow-x-auto">
        {[
          { k: "stock",     l: `📍 Stok (${stockByWarehouse?.length ?? 0})` },
          { k: "movements", l: `🔄 Harakatlar (${recentMovements?.length ?? 0})` },
          { k: "prices",    l: `💰 Narx tarixi (${priceHistory?.length ?? 0})` },
          { k: "suppliers", l: `🚛 Ta'minotchilar (${suppliers?.length ?? 0})` },
          { k: "barcodes",  l: `📊 Barkodlar (${barcodes?.length ?? 0})` },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`px-4 py-2 text-sm whitespace-nowrap -mb-0.5 transition ${
              tab === t.k ? "border-b-2 border-amber-500 font-bold text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {tab === "stock" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Ombor</Th><Th>Kod</Th><Th>Tur</Th>
                <Th align="right">Mavjud</Th><Th align="right">Band</Th><Th align="right">Jami</Th>
                <Th>Yangilangan</Th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(stockByWarehouse) ? stockByWarehouse : []).map(s => (
                <tr key={s.warehouseId} className="border-t border-gray-100">
                  <Td>{s.warehouseName}</Td>
                  <Td mono>{s.warehouseCode}</Td>
                  <Td><Pill>{s.warehouseType}</Pill></Td>
                  <Td align="right" mono className={s.available > 0 ? "text-[var(--ep-green)] font-semibold" : "text-gray-400"}>
                    {fmt(s.available, material.unit)}
                  </Td>
                  <Td align="right" mono className="text-gray-500">{fmt(s.reserved, material.unit)}</Td>
                  <Td align="right" mono className="font-semibold">{fmt(s.total, material.unit)}</Td>
                  <Td>{fmtDate(s.lastUpdated)}</Td>
                </tr>
              ))}
              {(stockByWarehouse ?? []).length === 0 && (
                <tr><Td colSpan={7} className="text-center text-gray-400 py-6">Hech qaysi omborda stok yo'q</Td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "movements" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Raqam</Th><Th>Sana</Th><Th>Turi</Th><Th>Holat</Th>
                <Th align="right">Miqdor</Th><Th align="right">Narx</Th><Th>Kim</Th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(recentMovements) ? recentMovements : []).map(m => {
                const cfg = MOVEMENT_COLOR[m.movementType] ?? { bg: "bg-gray-100", text: "text-gray-700", label: m.movementType };
                return (
                  <tr key={m.movementId} className="border-t border-gray-100">
                    <Td mono className="font-semibold">{m.movementNumber}</Td>
                    <Td>{fmtDate(m.createdAt)}</Td>
                    <Td><span className={`px-2 py-1 rounded text-xs font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span></Td>
                    <Td><Pill>{m.status}</Pill></Td>
                    <Td align="right" mono>{fmt(m.quantity, m.unit)}</Td>
                    <Td align="right" mono>{fmtMoney(m.unitPrice)}</Td>
                    <Td>{(m.createdByName ?? "").trim() || "—"}</Td>
                  </tr>
                );
              })}
              {(recentMovements ?? []).length === 0 && (
                <tr><Td colSpan={7} className="text-center text-gray-400 py-6">Harakatlar yo'q</Td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "prices" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Sana</Th><Th align="right">Narx</Th><Th>Valyuta</Th><Th>Ta'minotchi</Th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(priceHistory) ? priceHistory : []).map(p => (
                <tr key={p.id} className="border-t border-gray-100">
                  <Td>{fmtDate(p.purchaseDate ?? p.createdAt)}</Td>
                  <Td align="right" mono className="font-semibold">{fmtMoney(p.unitPrice, p.currency)}</Td>
                  <Td mono>{p.currency}</Td>
                  <Td>{p.supplierName ?? "—"}</Td>
                </tr>
              ))}
              {(priceHistory ?? []).length === 0 && (
                <tr><Td colSpan={4} className="text-center text-gray-400 py-6">Narx tarixi yo'q</Td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "suppliers" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Ta'minotchi</Th><Th align="right">Oxirgi narx</Th>
                <Th>Oxirgi yetkazib berish</Th><Th align="right">Marotaba</Th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(suppliers) ? suppliers : []).map(s => (
                <tr key={s.name} className="border-t border-gray-100">
                  <Td className="font-semibold">{s.name}</Td>
                  <Td align="right" mono>{fmtMoney(s.lastPrice)}</Td>
                  <Td>{fmtDate(s.lastDate)}</Td>
                  <Td align="right" mono>{s.occurrences}</Td>
                </tr>
              ))}
              {(suppliers ?? []).length === 0 && (
                <tr><Td colSpan={4} className="text-center text-gray-400 py-6">Ta'minotchilar yo'q</Td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "barcodes" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Barkod</Th><Th>Turi</Th><Th>Partiya</Th>
                <Th align="right">Miqdor</Th><Th>Holat</Th><Th>Yaratilgan</Th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(barcodes) ? barcodes : []).map(b => (
                <tr key={b.id} className="border-t border-gray-100">
                  <Td mono className="font-semibold">{b.barcode}</Td>
                  <Td><Pill>{b.barcodeType}</Pill></Td>
                  <Td mono>{b.batchNumber ?? "—"}</Td>
                  <Td align="right" mono>{b.quantity != null ? fmt(b.quantity, material.unit) : "—"}</Td>
                  <Td>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      b.status === "PRINTED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {b.status}
                    </span>
                  </Td>
                  <Td>{fmtDate(b.createdAt)}</Td>
                </tr>
              ))}
              {(barcodes ?? []).length === 0 && (
                <tr><Td colSpan={6} className="text-center text-gray-400 py-6">Barkodlar yo'q</Td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KpiBox({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-lg">{icon}</div>
      <div className="text-[10px] text-gray-500 mt-1 uppercase">{label}</div>
      <div className={`text-base font-bold mt-1 ${color ?? "text-gray-900"}`}>{value}</div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-3 py-2 text-${align ?? "left"} text-xs font-semibold text-gray-600 uppercase border-b border-gray-200`}>
      {children}
    </th>
  );
}

function Td({ children, align, mono, colSpan, className }: {
  children: React.ReactNode; align?: "left" | "right"; mono?: boolean;
  colSpan?: number; className?: string;
}) {
  return (
    <td colSpan={colSpan} className={`px-3 py-2 text-${align ?? "left"} ${mono ? "font-mono" : ""} ${className ?? ""}`}>
      {children}
    </td>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 bg-blue-50 text-[var(--ep-blue)] rounded text-xs font-bold">
      {children}
    </span>
  );
}
