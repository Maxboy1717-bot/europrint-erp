/**
 * PosLotTraceability.tsx
 * POS Monitor — partiya/lot traceability sahifasi.
 * URL: /pos-monitor/lots
 */
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { warehouseFeaturesApi, movementsApi } from "../api/pos-monitor.api";

import { useTranslation } from '@/lib/i18n';
interface BarcodeRow {
  id: number;
  barcode: string;
  barcode_type: string;
  batch_number: string | null;
  quantity: number | null;
  unit: string | null;
  material_card_id: number | null;
  warehouse_id: number | null;
  movement_id: number | null;
  status: string;
  printed_at: string | null;
  created_at: string;
}

interface Lot {
  batchNumber: string;
  materialCardId: number | null;
  quantity: number;
  unit: string | null;
  warehouseId: number | null;
  barcodeCount: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
}

function fmt(n: number, max = 2): string {
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: max });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("uz-UZ"); } catch { return "—"; }
}

export default function PosLotTraceability() {
  const { t } = useTranslation('common');
  const [, navigate] = useLocation();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Lot ma'lumotini barkod print queue dan yig'amiz (batch_number bo'yicha)
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // §1.2: ERP SSO — posReq (movementsApi) httpOnly cookie bilan auth.
      const movements = await movementsApi.getAll({ limit: 100 }).catch(() => []);

      const allBarcodes: BarcodeRow[] = [];
      for (const m of (Array.isArray(movements) ? movements : []).slice(0, 50) as Array<{ id: number }>) {
        try {
          const bcs = await warehouseFeaturesApi.listBarcodes(m.id) as BarcodeRow[];
          if (Array.isArray(bcs)) allBarcodes.push(...bcs);
        } catch { /* skip */ }
      }

      // Group by batch_number
      const lotMap = new Map<string, Lot>();
      for (const bc of allBarcodes) {
        const key = bc.batch_number || `(barkod-${bc.id})`;
        let lot = lotMap.get(key);
        if (!lot) {
          lot = {
            batchNumber: key,
            materialCardId: bc.material_card_id,
            quantity: 0,
            unit: bc.unit,
            warehouseId: bc.warehouse_id,
            barcodeCount: 0,
            firstSeen: bc.created_at,
            lastSeen: bc.created_at,
            status: bc.status,
          };
          lotMap.set(key, lot);
        }
        lot.quantity += Number(bc.quantity ?? 0);
        lot.barcodeCount++;
        if (bc.created_at < lot.firstSeen) lot.firstSeen = bc.created_at;
        if (bc.created_at > lot.lastSeen) lot.lastSeen = bc.created_at;
      }

      const lotList = Array.from(lotMap.values()).sort((a, b) =>
        b.lastSeen.localeCompare(a.lastSeen)
      );
      setLots(lotList);
    } catch (e) {
      console.error(e);
      setLots([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = lots.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.batchNumber.toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--pos-bg)", padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)", fontWeight: 600 }}>LOT TRACEABILITY</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--pos-text)" }}>{t("partiyalarTarixi")}</h1>
          <p style={{ fontSize: 13, color: "var(--pos-text-muted)", marginTop: 4 }}>
            Har bir partiya raqami uchun barcha barkodlar va kirim/chiqim tarixi
          </p>
        </div>
        <button onClick={load} style={{ padding: "8px 16px", background: "var(--pos-bg)", border: "1px solid var(--pos-border)", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          {t("yangilash")}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "var(--pos-card)", borderRadius: 12, padding: 14, border: "1px solid var(--pos-border)" }}>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>JAMI PARTIYALAR</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{lots.length}</div>
        </div>
        <div style={{ background: "var(--pos-card)", borderRadius: 12, padding: 14, border: "1px solid var(--pos-border)" }}>
          <div style={{ fontSize: 11, color: "var(--pos-text-muted)" }}>JAMI BARKODLAR</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--pos-accent)" }}>
            {lots.reduce((s, l) => s + l.barcodeCount, 0)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder={t("partiyaRaqamiQidirish")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--pos-border)", borderRadius: 8, fontSize: 13 }}
        />
      </div>

      <div style={{ background: "var(--pos-card)", borderRadius: 12, border: "1px solid var(--pos-border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--pos-text-muted)" }}>{t("yuklanmoqda")}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--pos-text-muted)" }}>
            <div style={{ fontSize: 48 }}>📦</div>
            <div style={{ marginTop: 8 }}>{t("partiyalarYoq")}</div>
          </div>
        ) : (
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--pos-bg)" }}>
              <tr>
                <th style={th}>{t("partiya")}</th>
                <th style={th}>{t('Material')}</th>
                <th style={{ ...th, textAlign: "right" }}>{t("quantity")}</th>
                <th style={th}>{t("unit")}</th>
                <th style={{ ...th, textAlign: "right" }}>{t("barkodlar")}</th>
                <th style={th}>{t("pagination.first")}</th>
                <th style={th}>{t("pagination.last")}</th>
                <th style={th}>{t('status25')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.batchNumber} style={{ borderTop: "1px solid var(--pos-bg)" }}>
                  <td style={{ ...td, fontFamily: "monospace", fontWeight: 700 }}>{l.batchNumber}</td>
                  <td style={td}>
                    <button onClick={() => l.materialCardId && navigate(`/pos-monitor/materials/360/${l.materialCardId}`)}
                            style={{ background: "none", border: "none", color: "var(--pos-accent)", cursor: "pointer", fontSize: 13 }}>
                      #{l.materialCardId ?? "—"}
                    </button>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace" }}>{fmt(l.quantity)}</td>
                  <td style={td}>{l.unit ?? "—"}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "var(--pos-accent)" }}>{l.barcodeCount}</td>
                  <td style={td}>{fmtDate(l.firstSeen)}</td>
                  <td style={td}>{fmtDate(l.lastSeen)}</td>
                  <td style={td}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: l.status === "PRINTED" ? "#ECFDF5" : "#FEF3C7",
                      color: l.status === "PRINTED" ? "var(--pos-success)" : "#92400E",
                    }}>
                      {l.status}
                    </span>
                  </td>
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
