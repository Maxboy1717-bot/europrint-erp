/**
 * PosReservations.tsx
 * POS Monitor — Bron qilingan stoklar
 * URL: /pos-monitor/reservations
 */
import { useCallback, useEffect, useState } from "react";
import { stockApi } from "../api/pos-monitor.api";

import { useTranslation } from '@/lib/i18n';
interface Reservation {
  id: number;
  material_card_id: number;
  material_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  reserved_qty: number;
  unit?: string;
  reserved_for?: string; // sales_order, production_order, etc.
  reference_id?: number;
  status: string;
  reserved_at?: string;
  expires_at?: string;
}

function fmt(n: number, max = 2): string {
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: max });
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("uz-UZ"); } catch { return "—"; }
}

export default function PosReservations() {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Backend endpoint kerak: /api/pos/reservations
      // Hozircha — stock_reservations dan o'qiymiz
      // §1.2: ERP SSO — stockApi (posReq) httpOnly cookie bilan auth.
      const r = await stockApi.getAll().catch(() => []);
      // Stock dan reserved_qty ni filterlab olamiz
      const reserved = (Array.isArray(r) ? r : []).filter((s: { reservedQty?: number }) =>
        (s.reservedQty ?? 0) > 0
      ).map((s: Record<string, unknown>, i: number) => ({
        id: i + 1,
        material_card_id: Number(s.materialCardId ?? 0),
        material_name: s.materialName as string ?? `#${s.materialCardId}`,
        warehouse_id: Number(s.warehouseId ?? 0),
        warehouse_name: s.warehouseName as string ?? "",
        reserved_qty: Number(s.reservedQty ?? 0),
        unit: s.unit as string ?? "",
        status: "ACTIVE",
      }));
      setItems(reserved as Reservation[]);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalReserved = items.reduce((s, i) => s + (i.reserved_qty ?? 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--pos-bg)", padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600 }}>BRON QILINGAN STOK</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{t('reservationPanel')}</h1>
          <p style={{ fontSize: 13, color: "var(--pos-text-muted)", marginTop: 4 }}>
            {t("buyurtmaYokiIshlabChiqarishUchun")}
          </p>
        </div>
        <button onClick={load} style={{ padding: "8px 16px", background: "var(--pos-bg)", border: "1px solid var(--pos-border)", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          🔄
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "var(--pos-card)", borderRadius: 12, padding: 14, border: "1px solid var(--pos-border)" }}>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>JAMI BRON</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{items.length}</div>
        </div>
        <div style={{ background: "var(--pos-card)", borderRadius: 12, padding: 14, border: "1px solid var(--pos-border)" }}>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>JAMI MIQDOR</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--pos-warning)" }}>{fmt(totalReserved)}</div>
        </div>
      </div>

      <div style={{ background: "var(--pos-card)", borderRadius: 12, border: "1px solid var(--pos-border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--pos-text-muted)" }}>{t("yuklanmoqda")}</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--pos-text-muted)" }}>
            <div style={{ fontSize: 48 }}>🔓</div>
            <div style={{ marginTop: 8 }}>{t("bronQilinganStokYoq")}</div>
          </div>
        ) : (
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--pos-bg)" }}>
              <tr>
                <th style={th}>{t('Material')}</th>
                <th style={th}>{t("ombor")}</th>
                <th style={{ ...th, textAlign: "right" }}>{t("bronMiqdor")}</th>
                <th style={th}>{t("unit")}</th>
                <th style={th}>{t("Maqsad")}</th>
                <th style={th}>{t('status26')}</th>
                <th style={th}>{t("tugaydi")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} style={{ borderTop: "1px solid var(--pos-bg)" }}>
                  <td style={td}>{it.material_name}</td>
                  <td style={td}>{it.warehouse_name ?? `#${it.warehouse_id}`}</td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--pos-warning)" }}>
                    {fmt(it.reserved_qty)}
                  </td>
                  <td style={td}>{it.unit ?? "—"}</td>
                  <td style={td}>{it.reserved_for ?? "—"}</td>
                  <td style={td}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: it.status === "ACTIVE" ? "#FEF3C7" : "var(--pos-bg)",
                      color: it.status === "ACTIVE" ? "#92400E" : "var(--pos-text-muted)",
                    }}>{it.status}</span>
                  </td>
                  <td style={td}>{fmtDate(it.expires_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600, textTransform: "uppercase" };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13 };
