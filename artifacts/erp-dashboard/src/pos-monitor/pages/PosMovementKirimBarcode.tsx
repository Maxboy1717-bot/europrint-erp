/**
 * PosMovementKirimBarcode — KIRIM ekrani uchun yangi POS-uslubidagi komponentlar (spec 2026-06-27):
 *
 *  (1) PosQtyKeypad — miqdor/og'irlik kiritish:
 *        • tarozi ulangan bo'lsa → AVTO-og'irlik (Web Serial scale, ulanmagan → fallback);
 *        • tarozi yo'q → katta EKRAN-RAQAMLI-KLAVIATURA (do'kon-kassasi uslubi, katta tugma).
 *  (2) BarcodeLabelModal — "Barkod yaratish va chop etish": POST /api/pos/barcode/generate
 *        natijasini (barkod + etiket o'lcham) ko'rsatadi va printerga yuboradi
 *        (POS Monitor printeridan "tug'iladi", ERP'dan EMAS). Barkodsiz Saqlash BLOK.
 *
 * Faqat FE/interfeys — mavjud KIRIM ma'lumot-oqimi (movement → karantin) buzilmaydi (Q-46).
 * pos-theme token + yashil-KIRIM rangi.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import type { InboundBarcodeResult } from "../api/pos-monitor.api";

const KIRIM_GREEN = "#10B981";

// ════════════════════════════════════════════════════════════════════════════
//  (1) PosQtyKeypad — tarozi-avto yoki ekran-klaviatura
// ════════════════════════════════════════════════════════════════════════════

interface QtyKeypadProps {
  open: boolean;
  /** Sarlavha (masalan material nomi). */
  title?: string;
  /** Joriy qiymat (string — bo'sh bo'lishi mumkin). */
  initial: string;
  /** Birlik (kg / dona / litr ...) — tarozi faqat kg uchun avto. */
  unit?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

/** navigator.serial mavjudligini (tarozi ulanishi mumkinligini) aniqlaydi. */
function hasSerial(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

/**
 * Web Serial tarozisidan bitta og'irlik o'qishga urinadi. Tarozilar odatda
 * "ST,GS,+  12.345kg\r\n" kabi ASCII oqim yuboradi — birinchi raqamni ajratamiz.
 * Ulanmasa/qo'llab-quvvatlanmasa null qaytaradi (graceful, Q-40).
 */
async function readScaleWeight(signal: AbortSignal): Promise<number | null> {
  const nav = navigator as unknown as {
    serial?: { requestPort(): Promise<SerialPortLike> };
  };
  if (!nav.serial) return null;
  let port: SerialPortLike | null = null;
  try {
    port = await nav.serial.requestPort();
    await port.open({ baudRate: 9600 });
    const reader = port.readable.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    const deadline = Date.now() + 4000;
    try {
      while (Date.now() < deadline && !signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const m = buf.match(/-?\d+(?:\.\d+)?/);
        if (m && /[\r\n]/.test(buf)) {
          const n = parseFloat(m[0]);
          if (Number.isFinite(n)) { reader.releaseLock(); return n; }
        }
      }
    } finally {
      try { reader.releaseLock(); } catch { /* noop */ }
    }
    return null;
  } catch {
    return null;
  } finally {
    try { await port?.close(); } catch { /* noop */ }
  }
}

interface SerialPortLike {
  open(o: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: { getReader(): { read(): Promise<{ value?: Uint8Array; done: boolean }>; releaseLock(): void } };
}

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"];

export function PosQtyKeypad({ open, title, initial, unit, onConfirm, onClose }: QtyKeypadProps) {
  const { t } = useTranslation("common");
  const [val, setVal] = useState(initial || "");
  const [scaleBusy, setScaleBusy] = useState(false);
  const [scaleMsg, setScaleMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { if (open) { setVal(initial || ""); setScaleMsg(""); } }, [open, initial]);
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const press = useCallback((k: string) => {
    setScaleMsg("");
    if (k === "⌫") { setVal(v => v.slice(0, -1)); return; }
    if (k === ".") { setVal(v => (v.includes(".") ? v : (v === "" ? "0." : v + "."))); return; }
    setVal(v => {
      const next = v === "0" ? k : v + k;
      return next.replace(/^0+(\d)/, "$1");
    });
  }, []);

  const readScale = useCallback(async () => {
    if (scaleBusy) return;
    setScaleBusy(true);
    setScaleMsg(t("PosMovementKirim.taroziOqilmoqda", "Tarozidan o'qilmoqda..."));
    const ac = new AbortController();
    abortRef.current = ac;
    const w = await readScaleWeight(ac.signal);
    setScaleBusy(false);
    if (w === null) {
      setScaleMsg(t("PosMovementKirim.taroziUlanmadi", "Tarozi ulanmadi — qo'lda kiriting"));
      return;
    }
    setVal(String(w));
    setScaleMsg(`${t("PosMovementKirim.taroziOqildi", "Tarozidan o'qildi")}: ${w} ${unit ?? "kg"}`);
  }, [scaleBusy, unit, t]);

  if (!open) return null;
  const scaleApplicable = (unit ?? "").toLowerCase().includes("kg") || (unit ?? "") === "";

  return (
    <div className="pos-modal-overlay" onMouseDown={onClose}>
      <div className="pos-modal" style={{ minWidth: 340, maxWidth: 420 }} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--pos-text-muted)", fontWeight: 600 }}>
              {t("PosMovementKirim.miqdorKiriting", "Miqdor kiriting")}
            </div>
            {title && <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>}
          </div>
          <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 10px" }} onClick={onClose}>✕</button>
        </div>

        {/* Display */}
        <div className="pos-mono" style={{
          fontSize: 38, fontWeight: 700, textAlign: "right", padding: "12px 18px",
          background: "rgba(16,185,129,0.06)", border: `1px solid rgba(16,185,129,0.30)`,
          borderRadius: 12, marginBottom: 14, minHeight: 60, color: "var(--pos-text)",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {val || "0"}{unit ? <span style={{ fontSize: 16, color: "var(--pos-text-muted)", marginLeft: 8 }}>{unit}</span> : null}
        </div>

        {/* Scale row */}
        {scaleApplicable && (
          <div style={{ marginBottom: 12 }}>
            <button
              className="pos-btn"
              style={{
                width: "100%", justifyContent: "center", padding: "12px",
                background: hasSerial() ? "linear-gradient(135deg,#10B981,#059669)" : "rgba(163,177,198,0.14)",
                color: hasSerial() ? "#fff" : "var(--pos-text-muted)", fontSize: 14,
              }}
              onClick={readScale}
              disabled={scaleBusy || !hasSerial()}
              title={hasSerial() ? "" : (t("PosMovementKirim.taroziQollabQuvvatlanmaydi", "Bu qurilmada tarozi ulanishi yo'q"))}
            >
              {scaleBusy ? "⏳ " : "⚖️ "}
              {hasSerial()
                ? (t("PosMovementKirim.tarozidanOgirlikOlish", "Tarozidan og'irlik olish"))
                : (t("PosMovementKirim.taroziYoqQoldaKiriting", "Tarozi yo'q — qo'lda kiriting"))}
            </button>
            {scaleMsg && <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginTop: 6, textAlign: "center" }}>{scaleMsg}</div>}
          </div>
        )}

        {/* Numeric keyboard — katta tugmalar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {KEYS.map(k => (
            <button
              key={k}
              onClick={() => press(k)}
              style={{
                padding: "18px 0", fontSize: 22, fontWeight: 700, borderRadius: 12,
                border: "1px solid var(--pos-border)", background: "var(--pos-card)",
                color: k === "⌫" ? "var(--pos-danger)" : "var(--pos-text)", cursor: "pointer",
                boxShadow: "2px 2px 6px rgba(163,177,198,0.20),-1px -1px 4px rgba(255,255,255,0.7)",
                fontFamily: "'JetBrains Mono', monospace", transition: "all 0.12s",
              }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
            >
              {k}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="pos-btn pos-btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={() => setVal("")}>
            {t("PosMovementKirim.tozalash", "Tozalash")}
          </button>
          <button
            className="pos-btn pos-btn-success"
            style={{ flex: 2, justifyContent: "center", padding: "12px", fontSize: 15 }}
            onClick={() => { onConfirm(val.replace(/\.$/, "")); onClose(); }}
          >
            ✓ {t("tasdiqlash", "Tasdiqlash")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  (2) BarcodeLabelModal — barkod yaratish + etiket chop etish
// ════════════════════════════════════════════════════════════════════════════

interface BarcodeLabelModalProps {
  open: boolean;
  /** Yaratilgan barkod natijasi (null = hali yaratilmagan / yuklanmoqda). */
  result: InboundBarcodeResult | null;
  loading: boolean;
  error: string;
  onPrint: () => void;
  onClose: () => void;
  onRegenerate: () => void;
}

/** CODE128 barkodni HTML/CSS chiziqlar bilan vizual ko'rsatish (deterministik, kutubxonasiz). */
function BarcodeBars({ value }: { value: string }) {
  // Har belgidan barqaror "kenglik" naqshi hosil qilamiz (faqat ko'rinish uchun).
  const bars: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    bars.push(1 + (c % 3), 1 + ((c >> 2) % 3), 1 + ((c >> 4) % 2));
  }
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 64, justifyContent: "center", padding: "0 8px" }}>
      {bars.map((w, i) => (
        <div key={i} style={{ width: w * 2, height: "100%", background: i % 2 === 0 ? "#0F172A" : "transparent" }} />
      ))}
    </div>
  );
}

export function BarcodeLabelModal({ open, result, loading, error, onPrint, onClose, onRegenerate }: BarcodeLabelModalProps) {
  const { t } = useTranslation("common");
  if (!open) return null;
  const dim = result?.label.dimensions;

  return (
    <div className="pos-modal-overlay" onMouseDown={onClose}>
      <div className="pos-modal" style={{ minWidth: 380, maxWidth: 460 }} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: KIRIM_GREEN }}>
            🏷️ {t("PosMovementKirim.barkodEtiket", "Barkod etiketi")}
          </h3>
          <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 10px" }} onClick={onClose}>✕</button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--pos-text-muted)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            {t("PosMovementKirim.barkodYaratilmoqda", "Barkod yaratilmoqda...")}
          </div>
        )}

        {!loading && error && (
          <div className="pos-offline-banner" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)", color: "var(--pos-danger)" }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && result && (
          <>
            {/* Etiket preview — o'lcham ombor turiga moslashgan */}
            <div style={{
              border: "2px dashed var(--pos-border)", borderRadius: 12, padding: 16,
              marginBottom: 14, background: "#fff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 6 }}>
                <span className="pos-mono">{result.label.warehouseCode}</span>
                <span>{result.label.barcodeType}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, textAlign: "center", marginBottom: 4 }}>
                {result.label.materialName}
              </div>
              {result.label.materialCode && (
                <div className="pos-mono" style={{ fontSize: 11, color: "var(--pos-text-muted)", textAlign: "center", marginBottom: 6 }}>
                  {result.label.materialCode}
                  {result.label.quantity != null ? ` · ${result.label.quantity} ${result.label.unit}` : ""}
                </div>
              )}
              <BarcodeBars value={result.barcode} />
              <div className="pos-mono" style={{ fontSize: 13, fontWeight: 600, textAlign: "center", marginTop: 6, letterSpacing: 1 }}>
                {result.barcode}
              </div>
            </div>

            {dim && (
              <div style={{ fontSize: 12, color: "var(--pos-text-muted)", textAlign: "center", marginBottom: 16 }}>
                {t("PosMovementKirim.etiketOlchami", "Etiket o'lchami")}:{" "}
                <strong className="pos-mono">{dim.widthMm}×{dim.heightMm} mm</strong>{" "}
                ({dim.template}, {dim.dpi} dpi)
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="pos-btn pos-btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={onRegenerate}>
                🔁 {t("PosMovementKirim.qaytaYaratish", "Qayta yaratish")}
              </button>
              <button className="pos-btn pos-btn-success" style={{ flex: 2, justifyContent: "center", padding: "12px", fontSize: 15 }} onClick={onPrint}>
                🖨️ {t("PosMovementKirim.chopEtish", "Chop etish")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
