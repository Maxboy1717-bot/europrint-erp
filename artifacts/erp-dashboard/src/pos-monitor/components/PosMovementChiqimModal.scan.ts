/**
 * @module PosMovementChiqimModal.scan
 * @description Hook encapsulating scan + upsert state for PosMovementChiqimModal.
 * Split out so the parent component stays under 300 lines.
 */

import { useCallback, useRef, useState, type RefObject } from "react";
import { barcodeApi, notificationsApi } from "../api/pos-monitor.api";
import type { BarcodeResult, ScannedLine } from "./PosMovementChiqimModal.types";
import { mkKey, playBeep } from "./PosMovementChiqimModal.types";

export type ToastKind = "success" | "error" | "warning";

export interface ScanState {
  lines: ScannedLine[];
  setLines: React.Dispatch<React.SetStateAction<ScannedLine[]>>;
  scanning: boolean;
  scanFlash: "success" | "error" | null;
  lastMsg: { text: string; type: ToastKind } | null;
  noStockMat: string | null;
  setNoStockMat: (v: string | null) => void;
  qtyRefs: RefObject<Record<string, HTMLInputElement | null>>;
  handleScan: (barcode: string) => Promise<void>;
}

export function useChiqimScan(fromWarehouseId: string): ScanState {
  const [lines, setLines] = useState<ScannedLine[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanFlash, setScanFlash] = useState<"success" | "error" | null>(null);
  const [lastMsg, setLastMsg] = useState<{ text: string; type: ToastKind } | null>(null);
  const [noStockMat, setNoStockMat] = useState<string | null>(null);

  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const lastMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMsg = useCallback((text: string, type: ToastKind) => {
    if (lastMsgTimer.current) clearTimeout(lastMsgTimer.current);
    setLastMsg({ text, type });
    lastMsgTimer.current = setTimeout(() => setLastMsg(null), 3500);
  }, []);

  const flashScan = useCallback((kind: "success" | "error") => {
    setScanFlash(kind);
    setTimeout(() => setScanFlash(null), 500);
  }, []);

  const upsertScannedLine = useCallback(
    (result: BarcodeResult, barcode: string) => {
      const matId = result.materialCardId ?? result.id ?? 0;
      const matName = result.nameUz ?? result.name ?? "Noma'lum material";
      const matCode = result.code ?? result.sku ?? "";
      const avail = result.availableQty ?? result.currentQty ?? 0;
      const matType = (result.materialType?.toLowerCase() ?? "consumable") as "asset" | "consumable";
      const price = result.unitPrice ?? result.lastPrice ?? 0;

      if (matType === "asset" && avail <= 0) {
        playBeep(false);
        flashScan("error");
        setNoStockMat(matName);
        return;
      }
      let added = false;
      setLines((prev) => {
        const existing = prev.find((l) => l.materialCardId === matId);
        if (existing) {
          return prev.map((l) =>
            l.materialCardId === matId ? { ...l, quantity: l.quantity + 1 } : l
          );
        }
        added = true;
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
        setTimeout(() => {
          const ref = qtyRefs.current[newLine._key];
          if (ref) {
            ref.focus();
            ref.select();
          }
        }, 80);
        return [...prev, newLine];
      });
      playBeep(true);
      flashScan("success");
      showMsg(added ? `${matName} qo'shildi` : `${matName} miqdori oshirildi`, "success");
    },
    [flashScan, showMsg]
  );

  const handleScan = useCallback(
    async (barcode: string) => {
      if (!barcode.trim() || scanning) return;
      if (!fromWarehouseId.trim()) {
        showMsg("Avval manba omborini kiriting", "error");
        return;
      }
      setScanning(true);
      try {
        const result = (await barcodeApi.scan({
          barcode: barcode.trim(),
          warehouseId: fromWarehouseId,
        })) as BarcodeResult | null;

        if (!result || (!result.id && !result.materialCardId)) {
          playBeep(false);
          flashScan("error");
          showMsg(`Barcode topilmadi: ${barcode}`, "error");
          void notificationsApi.getAll().catch(() => {
            /* noop */
          });
          return;
        }
        upsertScannedLine(result, barcode);
      } catch {
        playBeep(false);
        flashScan("error");
        showMsg(`Barcode topilmadi: ${barcode}`, "error");
      } finally {
        setScanning(false);
      }
    },
    [fromWarehouseId, scanning, upsertScannedLine, flashScan, showMsg]
  );

  return {
    lines,
    setLines,
    scanning,
    scanFlash,
    lastMsg,
    noStockMat,
    setNoStockMat,
    qtyRefs,
    handleScan,
  };
}
