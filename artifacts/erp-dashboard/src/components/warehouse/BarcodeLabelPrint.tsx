/**
 * BarcodeLabelPrint.tsx
 * Material uchun chop etiladigan label — barkod + to'liq ma'lumot.
 *
 * Foydalanish:
 *   <BarcodeLabelPrint barcode="PAPER001-20260512-A3F1B2" data={{ materialName: "...", quantity: 100, ... }} />
 *
 * Print qilish: window.print() yoki "🖨️ Chop etish" tugma orqali.
 */
import React, { useEffect, useRef } from "react";

interface LabelData {
  barcode:        string;
  barcodeType?:   string;
  materialName:   string;
  materialCode?:  string;
  quantity:       number;
  unit:           string;
  batchNumber?:   string;
  supplierName?:  string;
  arrivalDate?:   string;
  expiryDate?:    string;
  warehouseCode?: string;
  movementNumber?: string;
  weightKg?:      number;
  certificateNumber?: string;
}

export function BarcodeLabelPrint({ data, onClose }: { data: LabelData; onClose?: () => void }) {
  const barcodeRef = useRef<HTMLDivElement>(null);

  // Code128 oddiy chiziq simulyatsiyasi
  // Real ishlab chiqarishda: JsBarcode/barcode.js kutubxonasi
  useEffect(() => {
    if (!barcodeRef.current) return;
    const code = data.barcode;
    // Har character uchun chiziq kengligi (oddiy code-128 simulyatsiyasi)
    const bars = code.split("").map((c, i) => {
      const w = (c.charCodeAt(0) % 4) + 1;
      const isBlack = i % 2 === 0;
      return { width: w, isBlack };
    });
    barcodeRef.current.innerHTML = bars.map(b =>
      `<span style="display:inline-block;width:${b.width}px;height:60px;background:${b.isBlack ? "#000" : "#FFF"}"></span>`
    ).join("");
  }, [data.barcode]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="barcode-label-modal">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .barcode-label-print, .barcode-label-print * { visibility: visible; }
          .barcode-label-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        .barcode-label-modal {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
      `}</style>

      <div style={{ background: "#FFF", borderRadius: 12, padding: 20, maxWidth: 500, width: "90%", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🏷️ Barcode Label</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePrint} style={{ padding: "6px 14px", background: "#10B981", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
              🖨️ Chop etish
            </button>
            {onClose && (
              <button onClick={onClose} style={{ padding: "6px 14px", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 6, cursor: "pointer" }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Printable Label */}
        <div className="barcode-label-print" style={{
          border: "2px solid #000", padding: 16, fontFamily: "monospace",
          background: "#FFF", width: "100%",
        }}>
          {/* Company header */}
          <div style={{ textAlign: "center", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #000" }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>EUROPRINT ERP</div>
            <div style={{ fontSize: 10, color: "#666" }}>Inventar Yorlig'i</div>
          </div>

          {/* Material info */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              {data.materialName}
            </div>
            {data.materialCode && (
              <div style={{ fontSize: 11, color: "#666" }}>Kod: <b>{data.materialCode}</b></div>
            )}
          </div>

          {/* Key info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, marginBottom: 12 }}>
            <InfoRow label="Miqdor" value={`${data.quantity} ${data.unit}`} bold />
            {data.weightKg != null && data.weightKg > 0 && (
              <InfoRow label="Og'irlik" value={`${data.weightKg} kg`} />
            )}
            {data.batchNumber && (
              <InfoRow label="Partiya №" value={data.batchNumber} bold colSpan={2} />
            )}
            {data.warehouseCode && (
              <InfoRow label="Ombor" value={data.warehouseCode} />
            )}
            {data.movementNumber && (
              <InfoRow label="Hujjat" value={data.movementNumber} />
            )}
            {data.supplierName && (
              <InfoRow label="Ta'minotchi" value={data.supplierName} colSpan={2} />
            )}
            {data.arrivalDate && (
              <InfoRow label="Kelish sanasi" value={data.arrivalDate} />
            )}
            {data.expiryDate && (
              <InfoRow label="Muddat" value={data.expiryDate} />
            )}
            {data.certificateNumber && (
              <InfoRow label="Sertifikat" value={data.certificateNumber} colSpan={2} />
            )}
          </div>

          {/* Barcode visualization */}
          <div style={{ borderTop: "1px solid #000", paddingTop: 12, textAlign: "center" }}>
            <div ref={barcodeRef} style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", marginBottom: 4 }} />
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", letterSpacing: 2 }}>
              {data.barcode}
            </div>
            <div style={{ fontSize: 9, color: "#666" }}>{data.barcodeType ?? "CODE128"}</div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 10, paddingTop: 6, borderTop: "1px dashed #999", fontSize: 9, color: "#666", textAlign: "center" }}>
            Yaratildi: {new Date().toLocaleString("uz-UZ")}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold, colSpan }: { label: string; value: string | number; bold?: boolean; colSpan?: number }) {
  return (
    <div style={{ gridColumn: colSpan ? `span ${colSpan}` : undefined, display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "#666" }}>{label}:</span>
      <span style={{ fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}
