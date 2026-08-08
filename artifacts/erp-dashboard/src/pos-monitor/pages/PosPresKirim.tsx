/**
 * PosPresKirim — "Pres-kirim" (press-station fast intake) tez-kiritish oqimi.
 *
 * VISION-3340 #59 (vizyon 10-ombor SB0570): kg → barkod → ICHKI KIRIM harakati
 * BITTA tez oqimda. Har bir blok alohida mavjud edi (Web-Serial tarozi og'irligi,
 * barkod generatsiya+chop, harakat yaratish) — bu sahifa ularni bitta tez-kiritish
 * ekraniga BIRLASHTIRADI (composition; yangi backend YO'Q — mavjud endpointlar
 * o'zgarishsiz qayta ishlatiladi, Q-46).
 *
 * Reuse (takror qurilmadi):
 *   • PosQtyKeypad      — tarozi (Web Serial) yoki ekran-klaviatura  (PosMovementKirimBarcode.tsx)
 *   • BarcodeLabelModal — barkod etiket ko'rinishi + chop            (PosMovementKirimBarcode.tsx)
 *   • MaterialSearch    — material tanlash combobox                  (PosMovementKirimHelpers.tsx)
 *   • barcodeApi.generate  → POST /api/pos/barcode/generate
 *   • barcodeApi.printLabel → POST /api/pos/barcode/print
 *   • movementsApi.create   → POST /api/pos/movements
 *
 * Harakat turi = WASTE_IN (ichki chiqindi/qoldiq — makulatura — kirim; KIRIM
 * kategoriyasi, stockSign +1; pos_movement_types seed'da mavjud). Bu tur
 * EXTERNAL_IN barkod/narx server-darvozasini ISHGA TUSHIRMAYDI — shuning uchun
 * tez, narxsiz, ta'minotchisiz pres-stansiya qabuliga mos.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  barcodeApi,
  movementsApi,
  warehousesApi,
  type InboundBarcodeResult,
} from "../api/pos-monitor.api";
import type { WarehouseOption } from "./PosMovementKirimTypes";
import { PosQtyKeypad, BarcodeLabelModal } from "./PosMovementKirimBarcode";
import { MaterialSearch } from "./PosMovementKirimHelpers";

/** Ichki chiqindi/qoldiq (makulatura) kirim — KIRIM kategoriyasi, +1 qoldiq. */
const PRES_MOVEMENT_TYPE = "WASTE_IN";

type CreatedMovement = { id: number; documentNumber?: string };

export default function PosPresKirim() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // ── Forma holati ─────────────────────────────────────────────────────────────
  const [warehouseId, setWarehouseId]   = useState("");
  const [materialId, setMaterialId]     = useState("");
  const [materialName, setMaterialName] = useState("");
  const [weight, setWeight]             = useState(""); // kg (tarozi yoki klaviatura)
  const [keypadOpen, setKeypadOpen]     = useState(false);

  // ── Barkod modal holati ─────────────────────────────────────────────────────
  const [barcodeResult, setBarcodeResult] = useState<InboundBarcodeResult | null>(null);
  const [barcodeOpen, setBarcodeOpen]     = useState(false);

  // ── Muvaffaqiyat ─────────────────────────────────────────────────────────────
  const [created, setCreated] = useState<CreatedMovement | null>(null);

  const weightNum = parseFloat(weight) || 0;
  const matIdNum  = parseInt(materialId, 10) || 0;
  const whIdNum   = parseInt(warehouseId, 10) || 0;

  // ── Omborlar ro'yxati (F1 loading) ───────────────────────────────────────────
  const { data: whRaw, isLoading: whLoading } = useQuery({
    queryKey: ["pos-pres-kirim-warehouses"],
    queryFn: () => warehousesApi.getAll(),
  });
  const warehouses = useMemo<WarehouseOption[]>(
    () => (Array.isArray(whRaw) ? (whRaw as WarehouseOption[]) : []),
    [whRaw],
  );

  // Standart ombor: makulatura/chiqindi/qog'oz ombori bo'lsa — o'sha; aks holda birinchisi.
  useEffect(() => {
    if (warehouseId || warehouses.length === 0) return;
    const preferred = warehouses.find(w => {
      const code = (w.code ?? "").toUpperCase();
      return code.includes("WASTE") || code.includes("SCRAP") || code.includes("PAPER") || code.includes("MAKUL");
    });
    setWarehouseId(String((preferred ?? warehouses[0]).id));
  }, [warehouses, warehouseId]);

  const canSubmit = matIdNum > 0 && whIdNum > 0 && weightNum > 0;

  // ── (1) Barkod generatsiya — POST /api/pos/barcode/generate ──────────────────
  const generateMut = useMutation({
    mutationFn: () =>
      barcodeApi.generate({
        materialCardId: matIdNum,
        warehouseId: whIdNum,
        quantity: weightNum,
        unit: "kg",
      }),
    onSuccess: (res) => {
      setBarcodeResult(res);
      setBarcodeOpen(true);
    },
    onError: (e) =>
      toast({
        title: t("PosPresKirim.barkodXato", "Barkod yaratishda xatolik"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      }),
  });

  // ── (2) Etiket chop — POST /api/pos/barcode/print ────────────────────────────
  const printMut = useMutation({
    mutationFn: () =>
      barcodeApi.printLabel({
        materialCardId: matIdNum,
        copies: 1,
        showPrice: false,
      }),
    onError: (e) =>
      toast({
        title: t("PosPresKirim.chopXato", "Etiket chop etishda xatolik"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      }),
  });

  // ── (3) Harakat yaratish — POST /api/pos/movements (WASTE_IN) ────────────────
  const createMut = useMutation({
    mutationFn: () =>
      movementsApi.create({
        movementTypeCode: PRES_MOVEMENT_TYPE,
        toWarehouseId: warehouseId,
        notes: t("PosPresKirim.izoh", "Pres-kirim (tez qabul)"),
        lines: [
          {
            materialCardId: matIdNum,
            quantity: weightNum,
            barcode: barcodeResult?.barcode || undefined,
          },
        ],
        submit: true,
        // Double-tap/retry himoyasi (Savdo-sity H-8 naqshi) — bir kirim ikki marta yaratilmasin.
        idempotencyKey: crypto.randomUUID(),
      }) as Promise<CreatedMovement>,
    onSuccess: (res) => {
      setBarcodeOpen(false);
      setBarcodeResult(null);
      setCreated(res ?? { id: 0 });
      toast({ title: t("PosPresKirim.qabulQilindi", "Pres-kirim qabul qilindi") });
    },
    onError: (e) =>
      toast({
        title: t("PosPresKirim.saqlashXato", "Harakat yaratishda xatolik"),
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      }),
  });

  const finalizing = printMut.isPending || createMut.isPending;

  // Modaldagi "Chop etish": real chop endpoint (best-effort — printer offline bo'lsa ham
  // qabul yo'qolmaydi, sibling PosMovementKirim naqshi) → so'ng harakat yaratish.
  const handlePrintAndSave = async () => {
    if (finalizing) return;
    try {
      await printMut.mutateAsync();
    } catch {
      /* onError toast ko'rsatildi — qabulni yo'qotmaymiz, davom etamiz */
    }
    createMut.mutate();
  };

  const resetForNext = () => {
    setCreated(null);
    setMaterialId("");
    setMaterialName("");
    setWeight("");
    // warehouseId saqlanadi — bir xil pres-stansiya uchun tez takror qabul.
  };

  // ── Muvaffaqiyat ekrani ───────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="pos-fade-in">
        <div className="pos-card" style={{ textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "var(--pos-success)" }}>
            {t("PosPresKirim.qabulQilindi", "Pres-kirim qabul qilindi")}
          </h3>
          {created.documentNumber && (
            <div className="pos-mono" style={{ fontSize: 16, color: "var(--pos-text-muted)", marginBottom: 16 }}>
              {t("hujjatRaqami1", "Hujjat raqami: ")}
              <strong style={{ color: "var(--pos-text)" }}>{created.documentNumber}</strong>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
            <button className="pos-btn pos-btn-success" style={{ minWidth: 160, justifyContent: "center", padding: "12px 20px" }} onClick={resetForNext}>
              ♻️ {t("PosPresKirim.yanaQabul", "Yana qabul qilish")}
            </button>
            <button className="pos-btn pos-btn-ghost" onClick={() => navigate("/pos-monitor/movements")}>
              {t("harakatlarRoyxatiga1", "Harakatlar ro'yxatiga")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tez-kiritish ekrani ────────────────────────────────────────────────────────
  return (
    <div className="pos-fade-in">
      {/* Topbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 12px" }} onClick={() => navigate("/pos-monitor/movements/new")}>
          {t("orqaga", "Orqaga")}
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            ♻️ {t("PosPresKirim.sarlavha", "Pres-kirim — Tez qabul")}
          </h2>
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 2 }}>
            {t("PosPresKirim.tavsif", "Og'irlik (kg) → barkod → ichki kirim — bir tez oqimda")}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span className="pos-badge pos-badge-green" style={{ fontSize: 11 }}>{PRES_MOVEMENT_TYPE}</span>
        </div>
      </div>

      <div className="pos-card" style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Ombor */}
        <div style={{ marginBottom: 16 }}>
          <label className="_preslbl">{t("manzilOmbori", "Manzil ombori")}</label>
          <select
            className="pos-input"
            value={warehouseId}
            onChange={e => setWarehouseId(e.target.value)}
            disabled={whLoading}
          >
            <option value="">{whLoading ? t("yuklanmoqda", "Yuklanmoqda...") : t("omborTanlang", "Ombor tanlang")}</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.code ? `${w.code} — ${w.name ?? ""}` : (w.name ?? w.id)}
              </option>
            ))}
          </select>
        </div>

        {/* Material */}
        <div style={{ marginBottom: 16 }}>
          <label className="_preslbl">{t("material", "Material")}</label>
          <MaterialSearch
            value={materialId}
            name={materialName}
            onChange={(id, name) => { setMaterialId(id); setMaterialName(name); }}
          />
        </div>

        {/* Og'irlik (tarozi / klaviatura) */}
        <div style={{ marginBottom: 20 }}>
          <label className="_preslbl">{t("PosPresKirim.ogirlikKg", "Og'irlik (kg)")}</label>
          <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            <div
              className="pos-mono"
              style={{
                flex: 1, fontSize: 30, fontWeight: 700, textAlign: "right", padding: "10px 16px",
                background: "color-mix(in srgb, var(--pos-success) 6%, transparent)",
                border: "1px solid color-mix(in srgb, var(--pos-success) 30%, transparent)",
                borderRadius: 12, color: "var(--pos-text)", minHeight: 56, display: "flex",
                alignItems: "center", justifyContent: "flex-end",
              }}
            >
              {weight || "0"}
              <span style={{ fontSize: 15, color: "var(--pos-text-muted)", marginLeft: 8 }}>kg</span>
            </div>
            <button
              type="button"
              className="pos-btn pos-btn-success"
              style={{ padding: "0 18px", fontSize: 15, justifyContent: "center", whiteSpace: "nowrap" }}
              onClick={() => setKeypadOpen(true)}
            >
              ⚖️ {t("PosPresKirim.olcha", "O'lchash")}
            </button>
          </div>
          {weight !== "" && weightNum <= 0 && (
            <div style={{ fontSize: 11, color: "var(--pos-danger)", marginTop: 6 }}>
              {t("PosPresKirim.ogirlikMusbat", "Og'irlik 0 dan katta bo'lishi shart")}
            </div>
          )}
        </div>

        {/* Tasdiqlash — barkod yaratib qabul qilish */}
        <button
          className="pos-btn pos-btn-success"
          style={{
            width: "100%", justifyContent: "center", padding: "16px", fontSize: 16, fontWeight: 700,
            ...(!canSubmit || generateMut.isPending ? { opacity: 0.5, cursor: "not-allowed" } : {}),
          }}
          disabled={!canSubmit || generateMut.isPending}
          onClick={() => generateMut.mutate()}
        >
          {generateMut.isPending
            ? `⏳ ${t("PosPresKirim.barkodYaratilmoqda", "Barkod yaratilmoqda...")}`
            : `🏷️ ${t("PosPresKirim.barkodQabul", "Barkod yaratib qabul qilish")}`}
        </button>

        {!canSubmit && (
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginTop: 10, textAlign: "center" }}>
            {t("PosPresKirim.yordam", "Ombor + material tanlang va og'irlikni o'lchang")}
          </div>
        )}
      </div>

      {/* Og'irlik kiritish — tarozi-avto yoki ekran-klaviatura (reuse) */}
      <PosQtyKeypad
        open={keypadOpen}
        title={materialName || t("PosPresKirim.ogirlikKg", "Og'irlik (kg)")}
        unit="kg"
        initial={weight}
        onConfirm={(v) => setWeight(v)}
        onClose={() => setKeypadOpen(false)}
      />

      {/* Barkod etiket ko'rinishi + chop → so'ng harakat yaratish (reuse) */}
      <BarcodeLabelModal
        open={barcodeOpen}
        result={barcodeResult}
        loading={false}
        error=""
        onPrint={handlePrintAndSave}
        onRegenerate={() => generateMut.mutate()}
        onClose={() => { if (!finalizing) { setBarcodeOpen(false); setBarcodeResult(null); } }}
      />

      <style>{`
        ._preslbl { font-size: 11px; color: var(--pos-text-muted); margin-bottom: 6px; display: block; font-weight: 600; letter-spacing: 0.3px; }
      `}</style>
    </div>
  );
}
