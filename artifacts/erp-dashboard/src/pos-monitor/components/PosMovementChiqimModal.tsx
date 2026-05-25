/**
 * @module PosMovementChiqimModal
 * @description Barcode-driven outbound movement modal. Composes section
 *   components from `PosMovementChiqimModal.sections.tsx`, the lines view from
 *   `PosMovementChiqimModal.lines.tsx`, and the scan hook from
 *   `PosMovementChiqimModal.scan.ts`. Split to respect the 300-line file budget.
 */

import { useCallback, useState } from "react";
import { movementsApi } from "../api/pos-monitor.api";
import { useBarcode } from "../hooks/useBarcode";
import PosBarcodeScanner from "./PosBarcodeScanner";
import { useTranslation } from "@/lib/i18n";
import type { ModalProps } from "./PosMovementChiqimModal.types";
import { TYPE_COLORS } from "./PosMovementChiqimModal.types";
import {
  NoStockAlert,
  ModalHeader,
  ScanZone,
  SuccessPanel,
  ModalFooter,
} from "./PosMovementChiqimModal.sections";
import { ContextFields } from "./PosMovementChiqimModal.fields";
import { LinesList } from "./PosMovementChiqimModal.lines";
import { useChiqimScan } from "./PosMovementChiqimModal.scan";

export default function PosMovementChiqimModal({
  movementType,
  fromWarehouseId: initialFromWarehouse = "",
  onClose,
  onSuccess,
}: ModalProps) {
  const { t } = useTranslation("common");
  const [fromWarehouseId, setFromWarehouseId] = useState(initialFromWarehouse);
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: number; documentNumber?: string } | null>(null);

  const {
    lines,
    setLines,
    scanning,
    scanFlash,
    lastMsg,
    noStockMat,
    setNoStockMat,
    qtyRefs,
    handleScan,
  } = useChiqimScan(fromWarehouseId);

  const color = TYPE_COLORS[movementType];
  const needsToWarehouse = movementType === "INTERNAL_ISSUE" || movementType === "INTERNAL_TRANSFER";
  const needsReturnReason = movementType === "INTERNAL_RETURN";
  const needsDamageDesc = movementType === "DAMAGE";

  useBarcode(async (m) => {
    await handleScan(m.barcode ?? m.code ?? "");
  });

  const updateQty = useCallback(
    (key: string, val: string) => {
      const n = parseFloat(val);
      if (isNaN(n) || n < 0) return;
      setLines((prev) => prev.map((l) => (l._key === key ? { ...l, quantity: n } : l)));
    },
    [setLines]
  );

  const removeLine = useCallback(
    (key: string) => {
      setLines((prev) => prev.filter((l) => l._key !== key));
    },
    [setLines]
  );

  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);

  const handleSubmit = useCallback(
    async (submit: boolean) => {
      if (lines.length === 0) {
        setError("Kamida bitta mahsulot skanerlang");
        return;
      }
      if (!fromWarehouseId.trim()) {
        setError("Manba omborini kiriting");
        return;
      }
      if (needsToWarehouse && !toWarehouseId.trim()) {
        setError("Manzil omborini kiriting");
        return;
      }
      if (needsReturnReason && !returnReason.trim()) {
        setError("Qaytarish sababi kiritilishi shart");
        return;
      }
      if (needsDamageDesc && !notes.trim()) {
        setError("Zarar tavsifi kiritilishi shart");
        return;
      }

      setError("");
      setSubmitting(true);
      try {
        const payload: Record<string, unknown> = {
          movementTypeCode: movementType,
          fromWarehouseId,
          notes: notes || undefined,
          lines: lines.map((l) => ({
            materialCardId: l.materialCardId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            batchId: l.batchId,
          })),
          submit,
        };
        if (needsToWarehouse) payload.toWarehouseId = toWarehouseId;
        if (needsReturnReason) payload.returnReason = returnReason;

        const result = (await movementsApi.create(payload)) as { id: number; documentNumber?: string };
        setDone(result ?? { id: 0 });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
      } finally {
        setSubmitting(false);
      }
    },
    [
      lines,
      fromWarehouseId,
      toWarehouseId,
      returnReason,
      notes,
      movementType,
      needsToWarehouse,
      needsReturnReason,
      needsDamageDesc,
    ]
  );

  return (
    <>
      {showCamera && (
        <PosBarcodeScanner
          onResult={async (r) => {
            setShowCamera(false);
            if (r.barcode) await handleScan(r.barcode);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {noStockMat && (
        <NoStockAlert matName={noStockMat} t={t} onClose={() => setNoStockMat(null)} />
      )}

      <div className="pos-modal-overlay" style={{ zIndex: 400 }} onClick={onClose}>
        <div
          className="pos-modal"
          style={{
            width: 680,
            maxWidth: "96vw",
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader movementType={movementType} color={color} t={t} onClose={onClose} />

          <div
            style={{
              overflowY: "auto",
              flex: 1,
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {lastMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  background:
                    lastMsg.type === "success"
                      ? "rgba(16,185,129,0.12)"
                      : lastMsg.type === "warning"
                        ? "rgba(245,158,11,0.12)"
                        : "rgba(239,68,68,0.10)",
                  color:
                    lastMsg.type === "success"
                      ? "var(--pos-success)"
                      : lastMsg.type === "warning"
                        ? "#B45309"
                        : "var(--pos-danger)",
                  border: `1px solid ${
                    lastMsg.type === "success"
                      ? "rgba(16,185,129,0.25)"
                      : lastMsg.type === "warning"
                        ? "rgba(245,158,11,0.25)"
                        : "rgba(239,68,68,0.25)"
                  }`,
                }}
              >
                {lastMsg.text}
              </div>
            )}

            <ScanZone
              scanning={scanning}
              scanFlash={scanFlash}
              fromWarehouseId={fromWarehouseId}
              onOpenCamera={() => setShowCamera(true)}
              t={t}
            />

            <LinesList
              lines={lines}
              qtyRefs={qtyRefs}
              totalItems={totalItems}
              onUpdateQty={updateQty}
              onRemoveLine={removeLine}
              t={t}
            />

            <ContextFields
              fromWarehouseId={fromWarehouseId}
              toWarehouseId={toWarehouseId}
              notes={notes}
              returnReason={returnReason}
              needsToWarehouse={needsToWarehouse}
              needsReturnReason={needsReturnReason}
              needsDamageDesc={needsDamageDesc}
              setFromWarehouseId={setFromWarehouseId}
              setToWarehouseId={setToWarehouseId}
              setNotes={setNotes}
              setReturnReason={setReturnReason}
              t={t}
            />

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--pos-danger)",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {done && <SuccessPanel done={done} onClose={() => onSuccess(done.id)} t={t} />}
          </div>

          {!done && (
            <ModalFooter
              submitting={submitting}
              linesEmpty={lines.length === 0}
              onCancel={onClose}
              onDraft={() => void handleSubmit(false)}
              onSubmit={() => void handleSubmit(true)}
              t={t}
            />
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
