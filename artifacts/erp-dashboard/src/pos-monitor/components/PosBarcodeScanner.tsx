/**
 * @module PosBarcodeScanner
 * @description React UI component.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { barcodeApi } from "../api/pos-monitor.api";

declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  detect(image: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

interface ScanResult {
  barcode: string;
  material?: { id: number; name: string; sku: string; unit: string };
  found: boolean;
}

interface Props {
  onResult?: (result: ScanResult) => void;
  onDetected?: (code: string) => void;
  onClose?: () => void;
}

export default function PosBarcodeScanner({ onResult, onClose }: Props) {
  const { t } = usePosI18n();
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [manualInput, setManualInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [notFoundModal, setNotFoundModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const rafRef = useRef<number>(0);

  const playPing = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* noop */ }
  }, []);

  const doScan = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setScanning(true);
    try {
      const r = await barcodeApi.scan({ barcode });
      const mc = r && r.found ? r.materialCard : undefined;
      const result: ScanResult = mc
        ? { barcode, found: true, material: { id: mc.id, name: mc.xomAshyo, sku: mc.kod, unit: mc.unitOfMeasure } }
        : { barcode, found: false };

      if (result.found) { playPing(); }
      else { setNotFoundModal(true); }

      setLastResult(result);
      setHistory(prev => [barcode, ...(prev ?? []).slice(0, 4)]);
      onResult?.(result);
    } catch {
      setLastResult({ barcode, found: false });
      setNotFoundModal(true);
    } finally {
      setScanning(false);
    }
  }, [onResult, playPing]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!("BarcodeDetector" in window)) {
      setCameraError(t("barcode.cameraUnsupported") || "Bu brauzer kamera skanerni qo'llab-quvvatlamaydi.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      detectorRef.current = new BarcodeDetector({ formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "itf"] });
      setCameraActive(true);

      const scan = async () => {
        if (!videoRef.current || !detectorRef.current || !streamRef.current) return;
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            stopCamera();
            void doScan(barcodes[0].rawValue);
            return;
          }
        } catch { /* noop */ }
        rafRef.current = requestAnimationFrame(() => { void scan(); });
      };
      rafRef.current = requestAnimationFrame(() => { void scan(); });
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : String(err));
    }
  }, [doScan, stopCamera, t]);

  useEffect(() => {
    if (mode !== "camera") { stopCamera(); }
    return () => { stopCamera(); };
  }, [mode, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      void doScan(manualInput.trim());
      setManualInput("");
    }
  };

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal" style={{ minWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "var(--pos-text)", fontWeight: 600 }}>
            📷 {t("barcode.scan")}
          </h3>
          {onClose && (
            <button className="pos-btn pos-btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose}>✕</button>
          )}
        </div>

        {/* Mode tabs */}
        <div className="pos-tabs">
          <div className={`pos-tab ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")}>
            ⌨️ {t("barcode.manualInput")}
          </div>
          <div className={`pos-tab ${mode === "camera" ? "active" : ""}`} onClick={() => setMode("camera")}>
            📷 {t("barcode.scanCamera")}
          </div>
        </div>

        {mode === "manual" && (
          <form onSubmit={handleManualSubmit} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                className="pos-input"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder={t("barcodeYozing")}
                autoFocus
              />
              <button type="submit" className="pos-btn pos-btn-primary" disabled={scanning}>
                {scanning ? "..." : "Skan"}
              </button>
            </div>
          </form>
        )}

        {mode === "camera" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              position: "relative", background: "#000", border: "1px solid var(--pos-border)",
              borderRadius: 10, overflow: "hidden", height: 240,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraActive ? "block" : "none" }}
              />
              {!cameraActive && !cameraError && (
                <div style={{ textAlign: "center", color: "var(--pos-text-muted)", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div>{t("kameraTayyorEmas")}</div>
                </div>
              )}
              {cameraActive && (
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  border: "2px solid var(--pos-accent)", borderRadius: 10,
                  boxShadow: "inset 0 0 30px rgba(0,255,148,0.15)",
                }}>
                  <div style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                    width: 200, height: 100, border: "1px dashed rgba(0,255,148,0.5)", borderRadius: 6,
                  }} />
                </div>
              )}
            </div>
            {cameraError && (
              <div style={{ color: "var(--pos-danger)", fontSize: 12, marginTop: 6 }}>{cameraError}</div>
            )}
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              {!cameraActive ? (
                <button className="pos-btn pos-btn-primary" style={{ flex: 1 }} onClick={() => void startCamera()}>
                  {t("kameraniYoqish")}
                </button>
              ) : (
                <button className="pos-btn pos-btn-ghost" style={{ flex: 1 }} onClick={stopCamera}>
                  {t("kameraniOchirish")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Last result */}
        {lastResult && (
          <div style={{
            background: lastResult.found ? "rgba(0,255,148,0.08)" : "rgba(255,71,87,0.08)",
            border: `1px solid ${lastResult.found ? "rgba(0,255,148,0.3)" : "rgba(255,71,87,0.3)"}`,
            borderRadius: 10, padding: "12px 14px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: lastResult.found ? "var(--pos-success)" : "var(--pos-danger)" }}>
              {lastResult.found ? "✅ Material topildi" : "❓ Material topilmadi"}
            </div>
            {lastResult.material && (
              <div style={{ marginTop: 6, fontSize: 13 }}>
                <div><b>{lastResult.material.name}</b></div>
                <div style={{ color: "var(--pos-text-muted)" }}>SKU: {lastResult.material.sku} · {lastResult.material.unit}</div>
              </div>
            )}
            {!lastResult.found && (
              <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 4 }}>
                {t("barcode")}<span className="pos-mono">{lastResult.barcode}</span>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 8, fontWeight: 600 }}>
              {t("barcode.scanHistory")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(Array.isArray(history) ? history : []).map((b) => (
                <button
                  key={b}
                  className="pos-btn pos-btn-ghost"
                  style={{ fontSize: 11, padding: "3px 8px" }}
                  onClick={() => void doScan(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Not found modal */}
        {notFoundModal && (
          <div style={{
            background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.3)",
            borderRadius: 10, padding: 16, marginTop: 16,
          }}>
            <div style={{ fontWeight: 600, color: "var(--pos-danger)", marginBottom: 10 }}>
              ❓ {t("barcode.notFound")}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12 }} onClick={() => setNotFoundModal(false)}>
                ✏️ {t("barcode.manualInput")}
              </button>
              <button className="pos-btn pos-btn-ghost" style={{ fontSize: 12 }} onClick={() => setNotFoundModal(false)}>
                👤 {t("barcode.notifyAdmin")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
