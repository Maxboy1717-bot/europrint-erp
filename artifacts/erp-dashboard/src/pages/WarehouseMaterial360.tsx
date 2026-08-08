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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehouseFeaturesApi } from "@/lib/api/warehouse-features";
import {
  materialLifeApi,
  type MaterialLifeView,
  type MaterialLifeAttrs,
  type SubstituteRow,
  type AgingAlertRow,
  type ListResponse,
} from "@/lib/api/material-life";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation("common");
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const matId = parseInt(params.id ?? "0", 10);

  const [data, setData] = useState<Material360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<
    "stock" | "movements" | "prices" | "suppliers" | "barcodes" | "aging" | "hazard" | "substitutes"
  >("stock");

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
    return <div className="p-10 text-center text-gray-500">{t("yuklanmoqda")}</div>;
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
          {t("materiallar")}
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
          {t("orqaga")}
        </button>
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-semibold">{t("material360")}</div>
          <h1 className="text-2xl font-bold text-gray-900">{material.name}</h1>
          <div className="text-sm text-gray-500 font-mono mt-1">
            {material.code} {material.nameRu ? `· ${material.nameRu}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{t("joriyStok")}</div>
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
        <KpiBox icon="📦" label={t("category")} value={material.category ?? "—"} />
        <KpiBox icon="🏷️" label={t("tur")} value={material.materialType ?? "—"} />
        <KpiBox icon="💰" label={t("birlikNarxi")} value={fmtMoney(material.unitPrice, material.currency)} />
        <KpiBox icon="⬇️" label={t("jamiKirim")} value={fmt(totals?.totalInflow, material.unit)} color="text-[var(--ep-green)]" />
        <KpiBox icon="⬆️" label={t("jamiChiqim")} value={fmt(totals?.totalOutflow, material.unit)} color="text-[var(--ep-red)]" />
        <KpiBox icon="🏭" label={t("omborlar")} value={String(totals?.distinctWarehouses ?? 0)} />
        <KpiBox icon="🔄" label={t("actions")} value={String(totals?.movementCount ?? 0)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-gray-200 mb-4 overflow-x-auto">
        {[
          { k: "stock",     l: `📍 Stok (${stockByWarehouse?.length ?? 0})` },
          { k: "movements", l: `🔄 Harakatlar (${recentMovements?.length ?? 0})` },
          { k: "prices",    l: `💰 Narx tarixi (${priceHistory?.length ?? 0})` },
          { k: "suppliers", l: `🚛 Ta'minotchilar (${suppliers?.length ?? 0})` },
          { k: "barcodes",  l: `📊 Barkodlar (${barcodes?.length ?? 0})` },
          { k: "aging",       l: `⏳ Yaroqlilik/aging` },
          { k: "hazard",      l: `☣️ Xavfli zaxira` },
          { k: "substitutes", l: `🔁 Almashtiruvchilar` },
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
                <Th>{t("ombor")}</Th><Th>{t("code")}</Th><Th>{t("tur")}</Th>
                <Th align="right">{t("mavjud")}</Th><Th align="right">{t("band")}</Th><Th align="right">{t("total")}</Th>
                <Th>{t("updated")}</Th>
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
                <tr><Td colSpan={7} className="text-center text-gray-400 py-6">{t("hechQaysiOmbordaStokYoq")}</Td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "movements" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>{t("raqam")}</Th><Th>{t("date")}</Th><Th>{t("type")}</Th><Th>{t("status28")}</Th>
                <Th align="right">{t("quantity")}</Th><Th align="right">{t("price")}</Th><Th>{t("kim1")}</Th>
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
                <tr><Td colSpan={7} className="text-center text-gray-400 py-6">{t("harakatlarYoq")}</Td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "prices" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>{t("date")}</Th><Th align="right">{t("price")}</Th><Th>{t("valyuta")}</Th><Th>{t("taminotchi")}</Th>
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
                <tr><Td colSpan={4} className="text-center text-gray-400 py-6">{t("narxTarixiYoq")}</Td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "suppliers" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>{t("taminotchi")}</Th><Th align="right">{t("oxirgiNarx")}</Th>
                <Th>{t("oxirgiYetkazibBerish")}</Th><Th align="right">{t("marotaba")}</Th>
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
                <tr><Td colSpan={4} className="text-center text-gray-400 py-6">{t("taminotchilarYoq")}</Td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "barcodes" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>{t("barkod")}</Th><Th>{t("type")}</Th><Th>{t("partiya1")}</Th>
                <Th align="right">{t("quantity")}</Th><Th>{t("status28")}</Th><Th>{t("Yaratilgan")}</Th>
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
                <tr><Td colSpan={6} className="text-center text-gray-400 py-6">{t("barkodlarYoq")}</Td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "aging" && <AgingTab unit={material.unit} />}
        {tab === "hazard" && <HazardTab matId={matId} />}
        {tab === "substitutes" && <SubstitutesTab matId={matId} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * MATERIAL-LIFE TABLAR (W4-MATERIAL-LIFE) — ADDITIVE (Q-46)
 * Mavjud Material360 tablar (stock/movements/prices/suppliers/barcodes) o'zgarmaydi.
 * F1 (isLoading→skeleton) + F2 (mutation onError→toast) majburiy.
 * ───────────────────────────────────────────────────────────────────────────*/

function TabSkeleton() {
  return (
    <div className="p-4 space-y-2">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

function TabError({ msg }: { msg?: string }) {
  return (
    <div className="p-8 text-center text-[var(--ep-red)]">
      {msg || "Yuklanmadi"}
    </div>
  );
}

/** ⏳ Yaroqlilik/aging — yosh-ogohlantirishidagi partiyalar (EP-WMS-126). */
function AgingTab({ unit }: { unit: string }) {
  const { data, isLoading, isError, error } = useQuery<ListResponse<AgingAlertRow>>({
    queryKey: ["/api/wms/material-life/aging-alerts"],
    queryFn: () => materialLifeApi.getAgingAlerts(),
  });

  if (isLoading) return <TabSkeleton />;
  if (isError) return <TabError msg={(error as Error)?.message} />;
  const rows = Array.isArray(data?.items) ? data!.items : [];

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          <Th>Material</Th><Th>Ombor</Th>
          <Th align="right">Qoldiq</Th><Th align="right">Yosh (kun)</Th>
          <Th align="right">Chegara (kun)</Th><Th>Holat</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const over = r.ageDays >= r.ageAlertDays;
          return (
            <tr key={r.stockId} className="border-t border-gray-100">
              <Td className="font-semibold">{r.materialName ?? `#${r.materialId}`}</Td>
              <Td mono>{r.warehouseId != null ? `WH-${r.warehouseId}` : "—"}</Td>
              <Td align="right" mono>{fmt(r.quantity, unit)}</Td>
              <Td align="right" mono className={over ? "text-[var(--ep-red)] font-bold" : ""}>{r.ageDays}</Td>
              <Td align="right" mono className="text-gray-500">{r.ageAlertDays}</Td>
              <Td>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  over ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {over ? "Eskirgan" : "Ogohlantirish"}
                </span>
              </Td>
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr><Td colSpan={6} className="text-center text-gray-400 py-6">Yosh-ogohlantirishidagi partiyalar yo'q</Td></tr>
        )}
      </tbody>
    </table>
  );
}

/** ☣️ Xavfli zaxira — hazard_class o'rnatilgan materiallar (EP-WMS-128). */
function HazardTab({ matId }: { matId: number }) {
  const { data, isLoading, isError, error } = useQuery<ListResponse<MaterialLifeView>>({
    queryKey: ["/api/wms/material-life/hazard-stock"],
    queryFn: () => materialLifeApi.getHazardStock(),
  });

  if (isLoading) return <TabSkeleton />;
  if (isError) return <TabError msg={(error as Error)?.message} />;
  const rows = Array.isArray(data?.items) ? data!.items : [];

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          <Th>Material</Th><Th>Xavf-sinfi</Th><Th>Saqlash sharti</Th>
          <Th>Egalik</Th><Th>Vtorichka</Th><Th>Namuna</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.materialId} className={`border-t border-gray-100 ${r.materialId === matId ? "bg-amber-50" : ""}`}>
            <Td className="font-semibold">{r.name ?? `#${r.materialId}`}</Td>
            <Td>
              <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800">
                {r.hazardClass ?? "—"}
              </span>
            </Td>
            <Td>{r.storageCondition ?? "—"}</Td>
            <Td><Pill>{r.ownerType === "customer" ? "Mijoz-moli" : "Bizniki"}</Pill></Td>
            <Td>{r.isRecyclable ? "Ha" : "—"}</Td>
            <Td>{r.isSample ? "Ha" : "—"}</Td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><Td colSpan={6} className="text-center text-gray-400 py-6">Xavfli materiallar yo'q</Td></tr>
        )}
      </tbody>
    </table>
  );
}

/** 🔁 Almashtiruvchilar — analog (substitute) CRUD + atribut tahrir (EP-WMS-101/123). */
function SubstitutesTab({ matId }: { matId: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const subKey = ["/api/wms/material-life", matId, "substitutes"];
  const lifeKey = ["/api/wms/material-life", matId, "life"];

  const subQuery = useQuery<ListResponse<SubstituteRow>>({
    queryKey: subKey,
    queryFn: () => materialLifeApi.listSubstitutes(matId),
  });
  const lifeQuery = useQuery<MaterialLifeView>({
    queryKey: lifeKey,
    queryFn: () => materialLifeApi.getLife(matId),
  });

  // ── Analog qo'shish formasi (REAL saqlash — Q-43)
  const [subId, setSubId] = useState("");
  const [priority, setPriority] = useState("");
  const [notes, setNotes] = useState("");

  const addMut = useMutation({
    mutationFn: () =>
      materialLifeApi.addSubstitute(matId, {
        substituteId: parseInt(subId, 10),
        priority: priority ? parseInt(priority, 10) : undefined,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subKey });
      setSubId(""); setPriority(""); setNotes("");
      toast({ title: "Analog qo'shildi" });
    },
    onError: (e) => toast({ title: "Xatolik", description: (e as Error)?.message, variant: "destructive" }),
  });

  // ── Analog o'chirish (ConfirmDialog — Q-14)
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const delMut = useMutation({
    mutationFn: (id: number) => materialLifeApi.removeSubstitute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subKey });
      setConfirmId(null);
      toast({ title: "Analog o'chirildi" });
    },
    onError: (e) => {
      setConfirmId(null);
      toast({ title: "Xatolik", description: (e as Error)?.message, variant: "destructive" });
    },
  });

  // ── Atribut tahrir (PATCH /:id — Q-43 REAL saqlash)
  const life = lifeQuery.data;
  const [editOpen, setEditOpen] = useState(false);
  const [attrs, setAttrs] = useState<MaterialLifeAttrs>({});

  const openEdit = () => {
    if (!life) return;
    setAttrs({
      ownerType: (life.ownerType === "customer" ? "customer" : "own"),
      hazardClass: life.hazardClass,
      storageCondition: life.storageCondition,
      ageAlertDays: life.ageAlertDays,
      isRecyclable: life.isRecyclable,
      palletUnitQty: life.palletUnitQty,
      isSample: life.isSample,
    });
    setEditOpen(true);
  };

  const patchMut = useMutation({
    mutationFn: () => materialLifeApi.updateLife(matId, attrs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lifeKey });
      setEditOpen(false);
      toast({ title: "Atributlar saqlandi" });
    },
    onError: (e) => toast({ title: "Xatolik", description: (e as Error)?.message, variant: "destructive" }),
  });

  if (subQuery.isLoading || lifeQuery.isLoading) return <TabSkeleton />;
  if (subQuery.isError) return <TabError msg={(subQuery.error as Error)?.message} />;
  const subs = Array.isArray(subQuery.data?.items) ? subQuery.data!.items : [];

  return (
    <div className="p-4 space-y-6">
      {/* ── Atribut paneli + tahrir tugma */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-gray-900">Hayot-tsikli atributlari</div>
          <button
            onClick={openEdit}
            disabled={!life}
            className="px-3 py-1.5 bg-[var(--ep-yellow)] text-white rounded text-sm font-semibold disabled:opacity-50"
          >
            ✏️ Tahrirlash
          </button>
        </div>
        {life ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
            <AttrBox label="Egalik" value={life.ownerType === "customer" ? "Mijoz-moli" : "Bizniki"} />
            <AttrBox label="Xavf-sinfi" value={life.hazardClass ?? "—"} />
            <AttrBox label="Saqlash sharti" value={life.storageCondition ?? "—"} />
            <AttrBox label="Yosh chegarasi (kun)" value={life.ageAlertDays != null ? String(life.ageAlertDays) : "—"} />
            <AttrBox label="Vtorichka" value={life.isRecyclable ? "Ha" : "Yo'q"} />
            <AttrBox label="Poddon birligi" value={life.palletUnitQty != null ? String(life.palletUnitQty) : "—"} />
            <AttrBox label="Namuna" value={life.isSample ? "Ha" : "Yo'q"} />
          </div>
        ) : (
          <div className="text-gray-400 text-sm">{(lifeQuery.error as Error)?.message ?? "Atributlar topilmadi"}</div>
        )}
      </div>

      {/* ── Yangi analog qo'shish */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-sm font-bold text-gray-900 mb-3">Yangi analog qo'shish</div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Analog material ID</label>
            <input
              type="number" value={subId} onChange={e => setSubId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm w-36"
              placeholder="masalan 42"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prioritet</label>
            <input
              type="number" value={priority} onChange={e => setPriority(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm w-28"
              placeholder="100"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1">Izoh</label>
            <input
              type="text" value={notes} onChange={e => setNotes(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm w-full"
              placeholder="ixtiyoriy"
            />
          </div>
          <button
            onClick={() => addMut.mutate()}
            disabled={addMut.isPending || !subId || parseInt(subId, 10) <= 0}
            className="px-4 py-1.5 bg-[var(--ep-green)] text-white rounded text-sm font-semibold disabled:opacity-50"
          >
            {addMut.isPending ? "..." : "➕ Qo'shish"}
          </button>
        </div>
      </div>

      {/* ── Analoglar ro'yxati */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Analog material</Th><Th align="right">ID</Th><Th align="right">Prioritet</Th>
              <Th>Tasdiqlangan</Th><Th>Izoh</Th><Th align="right">Amal</Th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id} className="border-t border-gray-100">
                <Td className="font-semibold">{s.substituteName ?? `#${s.substituteId}`}</Td>
                <Td align="right" mono>{s.substituteId}</Td>
                <Td align="right" mono>{s.priority}</Td>
                <Td>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    s.isApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {s.isApproved ? "Ha" : "Kutilmoqda"}
                  </span>
                </Td>
                <Td>{s.notes ?? "—"}</Td>
                <Td align="right">
                  <button
                    onClick={() => setConfirmId(s.id)}
                    className="px-2 py-1 text-[var(--ep-red)] hover:bg-red-50 rounded text-xs font-semibold"
                  >
                    🗑️ O'chirish
                  </button>
                </Td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><Td colSpan={6} className="text-center text-gray-400 py-6">Analoglar yo'q</Td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── O'chirish tasdiqi (Q-14) */}
      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={open => { if (!open) setConfirmId(null); }}
        title="Analogni o'chirishni tasdiqlang"
        description="Bu analog juftlik o'chiriladi. Davom etilsinmi?"
        confirmText="O'chirish"
        cancelText="Bekor"
        variant="destructive"
        onConfirm={() => { if (confirmId) delMut.mutate(confirmId); }}
      />

      {/* ── Atribut tahrir dialogi (Q-43 REAL saqlash) */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5">
            <div className="text-lg font-bold text-gray-900 mb-4">Atributlarni tahrirlash</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Egalik">
                <select
                  value={attrs.ownerType ?? "own"}
                  onChange={e => setAttrs(a => ({ ...a, ownerType: e.target.value as "own" | "customer" }))}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm w-full"
                >
                  <option value="own">Bizniki</option>
                  <option value="customer">Mijoz-moli</option>
                </select>
              </Field>
              <Field label="Xavf-sinfi">
                <input
                  type="text" value={attrs.hazardClass ?? ""}
                  onChange={e => setAttrs(a => ({ ...a, hazardClass: e.target.value || null }))}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm w-full"
                  placeholder="flammable / toxic / —"
                />
              </Field>
              <Field label="Saqlash sharti">
                <input
                  type="text" value={attrs.storageCondition ?? ""}
                  onChange={e => setAttrs(a => ({ ...a, storageCondition: e.target.value || null }))}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm w-full"
                  placeholder="masalan +5..+25°C"
                />
              </Field>
              <Field label="Yosh chegarasi (kun)">
                <input
                  type="number" value={attrs.ageAlertDays ?? ""}
                  onChange={e => setAttrs(a => ({ ...a, ageAlertDays: e.target.value ? parseInt(e.target.value, 10) : null }))}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm w-full"
                />
              </Field>
              <Field label="Poddon birligi">
                <input
                  type="number" value={attrs.palletUnitQty ?? ""}
                  onChange={e => setAttrs(a => ({ ...a, palletUnitQty: e.target.value ? Number(e.target.value) : null }))}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm w-full"
                />
              </Field>
              <Field label="Vtorichka (qayta-ishlatilgan)">
                <select
                  value={attrs.isRecyclable ? "1" : "0"}
                  onChange={e => setAttrs(a => ({ ...a, isRecyclable: e.target.value === "1" }))}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm w-full"
                >
                  <option value="0">Yo'q</option>
                  <option value="1">Ha</option>
                </select>
              </Field>
              <Field label="Namuna">
                <select
                  value={attrs.isSample ? "1" : "0"}
                  onChange={e => setAttrs(a => ({ ...a, isSample: e.target.value === "1" }))}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm w-full"
                >
                  <option value="0">Yo'q</option>
                  <option value="1">Ha</option>
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 bg-gray-100 border border-gray-200 rounded text-sm"
              >
                Bekor
              </button>
              <button
                onClick={() => patchMut.mutate()}
                disabled={patchMut.isPending}
                className="px-4 py-2 bg-[var(--ep-yellow)] text-white rounded text-sm font-semibold disabled:opacity-50"
              >
                {patchMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttrBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded p-2 border border-gray-200">
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
      <div className="text-sm font-semibold text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
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
