/** @module PosMovementChiqim @description Route-level page component for barcode-driven outbound movements (chiqim). Owns all state, scan logic, validation, and submission. */

import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { barcodeApi, movementsApi, notificationsApi } from "../api/pos-monitor.api";
import { useBarcode } from "../hooks/useBarcode";
import PosBarcodeScanner from "../components/PosBarcodeScanner";

import {
  type MovementTypeCode, type ScannedLine, type Toast, type BarcodeResult,
  mkKey, playBeep,
} from "./PosMovementChiqimTypes";
import { ToastContainer, NoStockModal } from "./PosMovementChiqimHelpers";
import { MovementTypeSelector, ScanZone, ContextFields, BottomBar } from "./PosMovementChiqimLeft";
import { LinesPanel, SuccessScreen } from "./PosMovementChiqimRight";
import { useTranslation } from '@/lib/i18n';

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PosMovementChiqim() {
  const { t } = useTranslation("common");
  const [, navigate] = useLocation();

  // Movement type
  const [selectedType, setSelectedType] = useState<MovementTypeCode>("EXTERNAL_OUT");

  // Scanned lines
  const [lines, setLines] = useState<ScannedLine[]>([]);

  // Warehouse / employee / reason
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [notes, setNotes] = useState("");
  const [damagePhotos, setDamagePhotos] = useState<File[]>([]);

  // UI state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [scanFlash, setScanFlash] = useState<"success" | "error" | null>(null);
  const [noStockModal, setNoStockModal] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [submitted, setSubmitted] = useState<{ id: number; documentNumber?: string } | null>(null);

  const qtyInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Scan handler ───────────────────────────────────────────────────────────

  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    if (!fromWarehouseId.trim()) { addToast("Avval manba omborini tanlang", "error"); return; }
    if (scanning) return;

    setScanning(true);
    try {
      const scan = await barcodeApi.scan({ barcode: barcode.trim(), warehouseId: fromWarehouseId });
      const mc = scan && scan.found ? scan.materialCard : undefined;
      const result: BarcodeResult | null = mc
        ? {
            id: mc.id, materialCardId: mc.id, name: mc.xomAshyo, nameUz: mc.xomAshyo,
            code: mc.kod, sku: mc.kod, unit: mc.unitOfMeasure,
            currentQty: mc.currentStock, availableQty: mc.availableStock,
            materialType: mc.materialType, unitPrice: mc.unitPrice, lastPrice: mc.lastPurchasePrice,
          }
        : null;

      if (!result || (!result.id && !result.materialCardId)) {
        playBeep(false); setScanFlash("error"); setTimeout(() => setScanFlash(null), 600);
        addToast(`Barcode topilmadi: ${barcode}`, "error");
        void notificationsApi.getAll().catch(() => { /* noop */ });
        return;
      }

      const matId    = result.materialCardId ?? result.id ?? 0;
      const matName  = result.nameUz ?? result.name ?? "Noma'lum material";
      const matCode  = result.code ?? result.sku ?? "";
      const avail    = result.availableQty ?? result.currentQty ?? 0;
      const matType  = (result.materialType?.toLowerCase() ?? "consumable") as "asset" | "consumable";
      const price    = result.unitPrice ?? result.lastPrice ?? 0;

      if (matType === "asset" && avail <= 0) {
        playBeep(false); setScanFlash("error"); setTimeout(() => setScanFlash(null), 600);
        setNoStockModal(matName); return;
      }
      if (avail <= 0) addToast(`Qoldiq yo'q: ${matName}`, "warning");

      const existing = lines.find(l => l.materialCardId === matId);
      if (existing) {
        setLines(prev => prev.map(l => l.materialCardId === matId ? { ...l, quantity: l.quantity + 1 } : l));
        playBeep(true); setScanFlash("success"); setTimeout(() => setScanFlash(null), 600);
        addToast(`${matName} miqdori oshirildi`, "success"); return;
      }

      const newLine: ScannedLine = {
        _key: mkKey(), barcode: barcode.trim(), materialCardId: matId, materialName: matName,
        materialCode: matCode, availableQty: avail, materialType: matType,
        quantity: 1, unitPrice: price, batchId: result.batchId, batchNumber: result.batchNumber,
      };
      setLines(prev => [...prev, newLine]);
      playBeep(true); setScanFlash("success"); setTimeout(() => setScanFlash(null), 600);
      addToast(`${matName} qo'shildi`, "success");
      setTimeout(() => { const ref = qtyInputRefs.current[newLine._key]; if (ref) { ref.focus(); ref.select(); } }, 80);

    } catch {
      playBeep(false); setScanFlash("error"); setTimeout(() => setScanFlash(null), 600);
      addToast(`Barcode topilmadi: ${barcode}`, "error");
    } finally {
      setScanning(false);
    }
  }, [fromWarehouseId, scanning, lines, addToast]);

  useBarcode(async (m) => { await handleScan(m.barcode ?? m.code ?? ""); });

  // ── Line helpers ───────────────────────────────────────────────────────────

  function updateQty(key: string, val: string) {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    setLines(prev => prev.map(l => l._key === key ? { ...l, quantity: n } : l));
  }

  function removeLine(key: string) {
    setLines(prev => prev.filter(l => l._key !== key));
  }

  // ── Totals ─────────────────────────────────────────────────────────────────

  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
  const totalValue = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): string | null {
    if (lines.length === 0) return "Kamida bitta mahsulot skanerlangan bo'lishi shart";
    if (!fromWarehouseId.trim()) return "Manba omborini tanlang";
    if ((selectedType === "INTERNAL_ISSUE" || selectedType === "INTERNAL_TRANSFER") && !toWarehouseId.trim())
      return "Manzil omborini tanlang";
    if (selectedType === "INTERNAL_RETURN" && !returnReason.trim()) return "Qaytarish sababi kiritilishi shart";
    if (selectedType === "DAMAGE" && !notes.trim()) return "Zarar tavsifi kiritilishi shart";
    const assetNoStock = lines.find(l => l.materialType === "asset" && l.availableQty <= 0);
    if (assetNoStock) return `"${assetNoStock.materialName}" — qoldiq yo'q, harakatni olib tashlab yuboring`;
    return null;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (submit: boolean) => {
    const err = validate();
    if (err) { setGlobalError(err); return; }
    setGlobalError(""); setSubmitting(true);

    const payload: Record<string, unknown> = {
      movementTypeCode: selectedType, fromWarehouseId, notes: notes || undefined,
      lines: lines.map(l => ({ materialCardId: l.materialCardId, quantity: l.quantity, unitPrice: l.unitPrice, batchId: l.batchId })),
      submit,
    };
    if (selectedType === "INTERNAL_ISSUE" || selectedType === "INTERNAL_TRANSFER") payload.toWarehouseId = toWarehouseId;
    if (selectedType === "INTERNAL_ISSUE" && employeeId) payload.receivedByEmployeeId = parseInt(employeeId, 10);
    if (selectedType === "INTERNAL_RETURN") payload.returnReason = returnReason;

    try {
      const result = await movementsApi.create(payload) as { id: number; documentNumber?: string };
      setSubmitted(result ?? { id: 0 });
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, fromWarehouseId, toWarehouseId, employeeId, returnReason, notes, lines]);

  function resetForm() {
    setLines([]); setSubmitted(null); setFromWarehouseId("");
    setToWarehouseId(""); setNotes(""); setReturnReason("");
  }

  // ── Success screen ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <SuccessScreen
        documentNumber={submitted.documentNumber}
        selectedType={selectedType}
        onNewChiqim={resetForm}
        onGoToList={() => navigate("/pos-monitor/movements")}
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedTypeInfo = { label: "", color: "" };
  const found = [
    { code: "EXTERNAL_OUT", label: "Tashqi chiqim", color: "#EF4444" },
    { code: "INTERNAL_ISSUE", label: "Ichki berish", color: "#F59E0B" },
    { code: "INTERNAL_RETURN", label: "Ichki qaytarish", color: "#06B6D4" },
    { code: "INTERNAL_TRANSFER", label: "Ichki ko'chirish", color: "#8B5CF6" },
    { code: "DAMAGE", label: "Zarar", color: "#DC2626" },
  ].find(t => t.code === selectedType);
  if (found) { selectedTypeInfo.label = found.label; selectedTypeInfo.color = found.color; }

  return (
    <div className="pos-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {noStockModal && <NoStockModal materialName={noStockModal} onClose={() => setNoStockModal(null)} />}
      {showCamera && (
        <PosBarcodeScanner
          onResult={async r => { setShowCamera(false); if (r.barcode) await handleScan(r.barcode); }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="pos-btn pos-btn-ghost" style={{ padding: "6px 12px" }} onClick={() => navigate("/pos-monitor/movements")}>{t("orqaga")}</button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("chiqimBarcodeSkaner")}</h2>
          <div style={{ fontSize: 12, color: "var(--pos-text-muted)", marginTop: 2 }}>{t("faqatBarcodeSkanerOrqaliQolda")}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span className="pos-badge" style={{ background: `${selectedTypeInfo.color}18`, color: selectedTypeInfo.color, fontSize: 11 }}>
            {selectedTypeInfo.label}
          </span>
          {scanning && <span className="pos-badge pos-badge-blue pos-live" style={{ fontSize: 11 }}>{t("skanerlanyapti")}</span>}
        </div>
      </div>

      {/* Error banner */}
      {globalError && (
        <div className="pos-offline-banner" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)", color: "var(--pos-danger)", marginBottom: 16 }}>
          ⚠️ {globalError}
          <button className="pos-btn pos-btn-ghost" style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 11 }} onClick={() => setGlobalError("")}>✕</button>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "60fr 40fr", gap: 16, alignItems: "start" }}>
        {/* Left panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MovementTypeSelector selectedType={selectedType} onSelect={setSelectedType} />
          <ScanZone fromWarehouseId={fromWarehouseId} scanFlash={scanFlash} scanning={scanning} onCameraOpen={() => setShowCamera(true)} />
          <ContextFields
            selectedType={selectedType}
            returnReason={returnReason} onReturnReasonChange={setReturnReason}
            notes={notes} onNotesChange={setNotes}
            damagePhotos={damagePhotos} onDamagePhotosChange={setDamagePhotos}
          />
        </div>
        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LinesPanel lines={lines} totalItems={totalItems} totalValue={totalValue} qtyInputRefs={qtyInputRefs} onUpdateQty={updateQty} onRemoveLine={removeLine} />
        </div>
      </div>

      <BottomBar
        selectedType={selectedType}
        fromWarehouseId={fromWarehouseId} onFromWarehouseChange={setFromWarehouseId}
        toWarehouseId={toWarehouseId} onToWarehouseChange={setToWarehouseId}
        employeeName={employeeName} onEmployeeChange={(id, name) => { setEmployeeId(id); setEmployeeName(name); }}
        notes={notes} onNotesChange={setNotes}
        submitting={submitting} linesCount={lines.length}
        onSaveDraft={() => void handleSubmit(false)}
        onSubmit={() => void handleSubmit(true)}
      />

      {/* CSS animations */}
      <style>{`
        @keyframes chiqim-scan-beam {
          0%   { top: 20%; opacity: 0.9; }
          50%  { top: 75%; opacity: 1;   }
          100% { top: 20%; opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
