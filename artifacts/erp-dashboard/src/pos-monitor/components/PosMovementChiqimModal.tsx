/**
 * @module PosMovementChiqimModal
 * @description React UI component.
 */

import { useState, useCallback, useRef } from "react";
import { barcodeApi, movementsApi, notificationsApi } from "../api/pos-monitor.api";
import { useBarcode } from "../hooks/useBarcode";
import PosBarcodeScanner from "./PosBarcodeScanner";
import { useTranslation } from '@/lib/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

type MovementTypeCode =
  | "EXTERNAL_OUT"
  | "INTERNAL_ISSUE"
  | "INTERNAL_RETURN"
  | "INTERNAL_TRANSFER"
  | "DAMAGE";

interface ScannedLine {
  _key: string;
  barcode: string;
  materialCardId: number;
  materialName: string;
  materialCode: string;
  availableQty: number;
  materialType: "asset" | "consumable";
  quantity: number;
  unitPrice: number;
  batchId?: number;
  batchNumber?: string;
}

interface BarcodeResult {
  id?: number;
  materialCardId?: number;
  name?: string;
  nameUz?: string;
  code?: string;
  sku?: string;
  currentQty?: number;
  availableQty?: number;
  materialType?: string;
  unitPrice?: number;
  lastPrice?: number;
  batchId?: number;
  batchNumber?: string;
}

interface Props {
  movementType: MovementTypeCode;
  fromWarehouseId?: string;
  onClose: () => void;
  onSuccess: (movementId: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<MovementTypeCode, string> = {
  EXTERNAL_OUT:      "Tashqi chiqim",
  INTERNAL_ISSUE:    "Ichki berish",
  INTERNAL_RETURN:   "Ichki qaytarish",
  INTERNAL_TRANSFER: "Ichki ko'chirish",
  DAMAGE:            "Zarar",
};

const TYPE_COLORS: Record<MovementTypeCode, string> = {
  EXTERNAL_OUT:      "#EF4444",
  INTERNAL_ISSUE:    "#F59E0B",
  INTERNAL_RETURN:   "#06B6D4",
  INTERNAL_TRANSFER: "#8B5CF6",
  DAMAGE:            "#DC2626",
};

let _keyCounter = 0;
function mkKey(): string { return `cm-${++_keyCounter}`; }

function playBeep(success: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 880 : 220;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch { /* noop */ }
}

// ─── Modal component ──────────────────────────────────────────────────────────

export default function PosMovementChiqimModal({
  movementType,
  fromWarehouseId: initialFromWarehouse = "",
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation("common");
  const [lines, setLines] = useState<ScannedLine[]>([]);
  const [fromWarehouseId, setFromWarehouseId] = useState(initialFromWarehouse);
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [returnReason, setReturnReason] = useState("");

  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanFlash, setScanFlash] = useState<"success" | "error" | null>(null);
  const [lastMsg, setLastMsg] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);
  const [noStockMat, setNoStockMat] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: number; documentNumber?: string } | null>(null);

  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const lastMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const color = TYPE_COLORS[movementType];
  const needsToWarehouse = movementType === "INTERNAL_ISSUE" || movementType === "INTERNAL_TRANSFER";
  const needsReturnReason = movementType === "INTERNAL_RETURN";
  const needsDamageDesc = movementType === "DAMAGE";

  function showMsg(text: string, type: "success" | "error" | "warning") {
    if (lastMsgTimer.current) clearTimeout(lastMsgTimer.current);
    setLastMsg({ text, type });
    lastMsgTimer.current = setTimeout(() => setLastMsg(null), 3500);
  }

  // ── Scan handler ─────────────────────────────────────────────────────────

  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode.trim() || scanning) return;
    if (!fromWarehouseId.trim()) {
      showMsg("Avval manba omborini kiriting", "error");
      return;
    }

    setScanning(true);
    try {
      const result = await barcodeApi.scan({
        barcode: barcode.trim(),
        warehouseId: fromWarehouseId,
      }) as BarcodeResult | null;

      if (!result || (!result.id && !result.materialCardId)) {
        playBeep(false);
        setScanFlash("error");
        setTimeout(() => setScanFlash(null), 500);
        showMsg(`Barcode topilmadi: ${barcode}`, "error");
        void notificationsApi.getAll().catch(() => {/* noop */});
        return;
      }

      const matId = result.materialCardId ?? result.id ?? 0;
      const matName = result.nameUz ?? result.name ?? "Noma'lum material";
      const matCode = result.code ?? result.sku ?? "";
      const avail = result.availableQty ?? result.currentQty ?? 0;
      const matType = (result.materialType?.toLowerCase() ?? "consumable") as "asset" | "consumable";
      const price = result.unitPrice ?? result.lastPrice ?? 0;

      if (matType === "asset" && avail <= 0) {
        playBeep(false);
        setScanFlash("error");
        setTimeout(() => setScanFlash(null), 500);
        setNoStockMat(matName);
        return;
      }

      // Duplicate → increment qty
      const existing = lines.find(l => l.materialCardId === matId);
      if (existing) {
        setLines(prev => prev.map(l =>
          l.materialCardId === matId ? { ...l, quantity: l.quantity + 1 } : l
        ));
        playBeep(true);
        setScanFlash("success");
        setTimeout(() => setScanFlash(null), 500);
        showMsg(`${matName} miqdori oshirildi`, "success");
        return;
      }

      const newLine: ScannedLine = {
        _key: mkKey(),
        barcode: barcode.trim(),
        materialCardId: matId,
        materialName: matName,
        materialCode: matCode,
        availableQty: avail,
        materialType: matType,
        quantity: 1,
        unitPrice: price,
        batchId: result.batchId,
        batchNumber: result.batchNumber,
      };

      setLines(prev => [...prev, newLine]);
      playBeep(true);
      setScanFlash("success");
      setTimeout(() => setScanFlash(null), 500);
      showMsg(`${matName} qo'shildi`, "success");

      setTimeout(() => {
        const ref = qtyRefs.current[newLine._key];
        if (ref) { ref.focus(); ref.select(); }
      }, 80);

    } catch {
      playBeep(false);
      setScanFlash("error");
      setTimeout(() => setScanFlash(null), 500);
      showMsg(`Barcode topilmadi: ${barcode}`, "error");
    } finally {
      setScanning(false);
    }
  }, [fromWarehouseId, scanning, lines]);

  // useBarcode hook only active while this modal is mounted
  useBarcode(async (m) => {
    await handleScan(m.barcode ?? m.code ?? "");
  });

  function updateQty(key: string, val: string) {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    setLines(prev => prev.map(l => l._key === key ? { ...l, quantity: n } : l));
  }

  function removeLine(key: string) {
    setLines(prev => prev.filter(l => l._key !== key));
  }

  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (submit: boolean) => {
    if (lines.length === 0) { setError("Kamida bitta mahsulot skanerlang"); return; }
    if (!fromWarehouseId.trim()) { setError("Manba omborini kiriting"); return; }
    if (needsToWarehouse && !toWarehouseId.trim()) { setError("Manzil omborini kiriting"); return; }
    if (needsReturnReason && !returnReason.trim()) { setError("Qaytarish sababi kiritilishi shart"); return; }
    if (needsDamageDesc && !notes.trim()) { setError("Zarar tavsifi kiritilishi shart"); return; }

    setError("");
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        movementTypeCode: movementType,
        fromWarehouseId,
        notes: notes || undefined,
        lines: lines.map(l => ({
          materialCardId: l.materialCardId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          batchId: l.batchId,
        })),
        submit,
      };
      if (needsToWarehouse) payload.toWarehouseId = toWarehouseId;
      if (needsReturnReason) payload.returnReason = returnReason;

      const result = await movementsApi.create(payload) as { id: number; documentNumber?: string };
      setDone(result ?? { id: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }, [lines, fromWarehouseId, toWarehouseId, returnReason, notes, movementType, needsToWarehouse, needsReturnReason, needsDamageDesc]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {showCamera && (
        <PosBarcodeScanner
          onResult={async r => {
            setShowCamera(false);
            if (r.barcode) await handleScan(r.barcode);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* No-stock inline alert */}
      {noStockMat && (
        <div className="pos-modal-overlay" style={{ zIndex: 9998 }} onClick={() => setNoStockMat(null)}>
          <div className="pos-modal" style={{ maxWidth: 340, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🚫</div>
            <div style={{ fontWeight: 700, color: "var(--pos-danger)", fontSize: 16, marginBottom: 8 }}>{t("qoldiqYoq")}</div>
            <div style={{ color: "var(--pos-text-muted)", fontSize: 13, marginBottom: 16 }}>
              <strong>{noStockMat}</strong> {t("ombordaQoldiqYoq")}
            </div>
            <button className="pos-btn pos-btn-danger" onClick={() => setNoStockMat(null)}>OK</button>
          </div>
        </div>
      )}

      <div className="pos-modal-overlay" style={{ zIndex: 400 }} onClick={onClose}>
        <div
          className="pos-modal"
          style={{ width: 680, maxWidth: "96vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--pos-border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 20 }}>📤</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{t("tezkorChiqim")}</div>
              <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>{t("barcodeSkanerOrqali")}</div>
            </div>
            <span
              className="pos-badge"
              style={{ background: `${color}18`, color, fontSize: 11, marginLeft: 8 }}
            >
              {TYPE_LABELS[movementType]}
            </span>
            <button className="pos-btn pos-btn-ghost" style={{ marginLeft: "auto", padding: "4px 8px" }} onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Feedback message */}
            {lastMsg && (
              <div style={{
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                background: lastMsg.type === "success"
                  ? "rgba(16,185,129,0.12)"
                  : lastMsg.type === "warning"
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(239,68,68,0.10)",
                color: lastMsg.type === "success"
                  ? "var(--pos-success)"
                  : lastMsg.type === "warning"
                    ? "#B45309"
                    : "var(--pos-danger)",
                border: `1px solid ${lastMsg.type === "success"
                  ? "rgba(16,185,129,0.25)"
                  : lastMsg.type === "warning"
                    ? "rgba(245,158,11,0.25)"
                    : "rgba(239,68,68,0.25)"}`,
              }}>
                {lastMsg.text}
              </div>
            )}

            {/* Scan zone */}
            <div
              style={{
                background: "var(--ep-primary)",
                borderRadius: 12,
                minHeight: 120,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: `2px solid ${
                  scanFlash === "success"
                    ? "var(--pos-success)"
                    : scanFlash === "error"
                      ? "var(--pos-danger)"
                      : "rgba(59,130,246,0.3)"
                }`,
                transition: "border-color 0.15s",
                boxShadow: scanFlash === "success"
                  ? "0 0 20px rgba(16,185,129,0.20)"
                  : scanFlash === "error"
                    ? "0 0 20px rgba(239,68,68,0.20)"
                    : undefined,
              }}
            >
              {/* Scan beam */}
              <div style={{
                position: "absolute", left: 30, right: 30,
                height: 2,
                background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.8), rgba(59,130,246,1), rgba(59,130,246,0.8), transparent)",
                boxShadow: "0 0 6px rgba(59,130,246,0.5)",
                animation: "chiqim-modal-beam 2s ease-in-out infinite",
              }} />
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.8)", zIndex: 1, padding: "20px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>
                  {scanning ? "⏳" : "📷"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {scanning ? "Skanerlanyapti..." : "Barcode skanerlang yoki kamerani oching"}
                </div>
                {!fromWarehouseId && (
                  <div style={{ fontSize: 11, color: "rgba(255,200,0,0.8)", marginTop: 4 }}>
                    {t("manbaOmboriniKiriting")}
                  </div>
                )}
              </div>
              <button
                className="pos-btn pos-btn-primary"
                style={{ position: "absolute", right: 12, bottom: 12, fontSize: 12 }}
                disabled={!fromWarehouseId}
                onClick={() => setShowCamera(true)}
              >
                {t("kamera")}
              </button>
            </div>

            {/* Lines */}
            {lines.length > 0 && (
              <div style={{
                border: "1px solid var(--pos-border)",
                borderRadius: 10,
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "8px 12px",
                  background: "rgba(248,250,252,0.8)",
                  borderBottom: "1px solid var(--pos-border)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--pos-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                  <span>{t("skanerlanganMahsulotlar")}</span>
                  <span>{lines.length} ta · {totalItems.toLocaleString("uz-UZ")} dona</span>
                </div>
                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                  {lines.map((line, idx) => (
                    <div
                      key={line._key}
                      className="pos-slide-in"
                      style={{
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        borderBottom: idx < lines.length - 1 ? "1px solid rgba(226,232,240,0.6)" : "none",
                        background: idx % 2 ? "rgba(248,250,252,0.4)" : "transparent",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {line.materialName}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                          <span className="pos-mono" style={{ fontSize: 10, color: "var(--pos-text-muted)" }}>
                            {line.barcode}
                          </span>
                          <span
                            className={`pos-badge ${line.availableQty > 0 ? "pos-badge-green" : "pos-badge-red"}`}
                            style={{ fontSize: 9 }}
                          >
                            {line.availableQty}
                          </span>
                          {line.batchNumber && (
                            <span className="pos-badge pos-badge-blue" style={{ fontSize: 9 }}>
                              {line.batchNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        ref={el => { qtyRefs.current[line._key] = el; }}
                        className="pos-input pos-mono"
                        type="number"
                        min="0.001"
                        step="any"
                        value={line.quantity}
                        onChange={e => updateQty(line._key, e.target.value)}
                        style={{ width: 64, textAlign: "center", padding: "5px 6px", fontSize: 13 }}
                      />
                      <button
                        className="pos-btn pos-btn-ghost"
                        style={{ padding: "5px 7px", color: "var(--pos-danger)", flexShrink: 0 }}
                        onClick={() => removeLine(line._key)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                  {t("manbaOmbori")}
                </label>
                <input className="pos-input" value={fromWarehouseId}
                  onChange={e => setFromWarehouseId(e.target.value)} placeholder={t("omborId")} />
              </div>

              {needsToWarehouse && (
                <div>
                  <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    {t("manzilOmbori")}
                  </label>
                  <input className="pos-input" value={toWarehouseId}
                    onChange={e => setToWarehouseId(e.target.value)} placeholder={t("omborId")} />
                </div>
              )}
            </div>

            {needsReturnReason && (
              <div>
                <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                  {t("qaytarishSababi")}
                </label>
                <textarea className="pos-input" rows={2} value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder={t("qaytarishSababi1")} style={{ resize: "vertical" }} />
              </div>
            )}

            {needsDamageDesc && (
              <div>
                <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                  {t("zararTavsifi")}
                </label>
                <textarea className="pos-input" rows={2} value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t("zararTuriVaSababi")} style={{ resize: "vertical" }} />
              </div>
            )}

            {!needsDamageDesc && !needsReturnReason && (
              <div>
                <label style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                  {t("Izoh")}
                </label>
                <input className="pos-input" value={notes}
                  onChange={e => setNotes(e.target.value)} placeholder={t("qoshimchaIzoh")} />
              </div>
            )}

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--pos-danger)",
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Success state */}
            {done && (
              <div style={{
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 10, padding: "16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, color: "var(--pos-success)", fontSize: 15, marginBottom: 4 }}>
                  {t("chiqimYaratildi")}
                </div>
                {done.documentNumber && (
                  <div className="pos-mono" style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 12 }}>
                    {done.documentNumber}
                  </div>
                )}
                <button className="pos-btn pos-btn-success" onClick={() => onSuccess(done.id)}>
                  {t("close2")}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {!done && (
            <div style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--pos-border)",
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              flexShrink: 0,
              background: "var(--pos-card)",
            }}>
              <button className="pos-btn pos-btn-ghost" onClick={onClose} disabled={submitting}>
                {t("cancel")}
              </button>
              <button
                className="pos-btn pos-btn-ghost"
                style={{ minWidth: 130, justifyContent: "center" }}
                disabled={submitting || lines.length === 0}
                onClick={() => void handleSubmit(false)}
              >
                {submitting ? "⏳..." : "💾 Qoralama"}
              </button>
              <button
                className="pos-btn pos-btn-danger"
                style={{ minWidth: 130, justifyContent: "center" }}
                disabled={submitting || lines.length === 0}
                onClick={() => void handleSubmit(true)}
              >
                {submitting ? "⏳ Yuborilmoqda..." : "🚀 Yuborish"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes chiqim-modal-beam {
          0%   { top: 25%; opacity: 0.8; }
          50%  { top: 72%; opacity: 1;   }
          100% { top: 25%; opacity: 0.8; }
        }
      `}</style>
    </>
  );
}
