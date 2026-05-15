/**
 * PosLotTraceability.tsx
 * POS Monitor — partiya/lot traceability sahifasi.
 * URL: /pos-monitor/lots
 */
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { warehouseFeaturesApi } from "../api/pos-monitor.api";

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
      // NOTE: POS uses its own pos_session token, not access_token — keep raw fetch
      const movements = await fetch("/api/pos/movements?limit=100", {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem("pos_session") ?? "{}")?.token ?? ""}` }
      }).then(r => r.json()).catch(() => []);

      const allBarcodes: BarcodeRow[] = [];
      for (const m of (Array.isArray(movements) ? movements : []).slice(0, 50)) {
        try {
          const bcs = await warehouseFeaturesApi.listBarcodes(m.id) as BarcodeRow[];
          if (Array.isArray(bcs)) allBarcodes.push(...bcs);
        } catch { /* skip */ }
      }

      // Group by batch_number
      const lotMap = new Map<string, Lot>();
      for (const bc of allBarcodes) {
        const key = bc.batch_number || `(barkod-${bc.id})`;
        if (!lotMap.has(key)) {
          lotMap.set(key, {
            batchNumber: key,
            materialCardId: bc.material_card_id,
            quantity: 0,
            unit: bc.unit,
            warehouseId: bc.warehouse_id,
            barcodeCount: 0,
            firstSeen: bc.created_at,
            lastSeen: bc.created_at,
            status: bc.status,
          });
        }
        const lot = lotMap.get(key)!;
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
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>LOT TRACEABILITY</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1F2937" }}>{t("partiyalarTarixi")}</h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            Har bir partiya raqami uchun barcha barkodlar va kirim/chiqim tarixi
          </p>
        </div>
        <button onClick={load} style={{ padding: "8px 16px", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          {t("yangilash")}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "#FFF", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>JAMI PARTIYALAR</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{lots.length}</div>
        </div>
        <div style={{ background: "#FFF", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>JAMI BARKODLAR</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#3B82F6" }}>
            {lots.reduce((s, l) => s + l.barcodeCount, 0)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder={t("partiyaRaqamiQidirish")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13 }}
        />
      </div>

      <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>{t("yuklanmoqda")}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#9CA3AF" }}>
            <div style={{ fontSize: 48 }}>📦</div>
            <div style={{ marginTop: 8 }}>{t("partiyalarYoq")}</div>
          </div>
        ) : (
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead style={{ background: "#F9FAFB" }}>
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
                <tr key={l.batchNumber} style={{ borderTop: "1px solid #F3F4F6" }}>
                  <td style={{ ...td, fontFamily: "monospace", fontWeight: 700 }}>{l.batchNumber}</td>
                  <td style={td}>
                    <button onClick={() => l.materialCardId && navigate(`/pos-monitor/materials/360/${l.materialCardId}`)}
                            style={{ background: "none", border: "none", color: "#1E40AF", cursor: "pointer", fontSize: 13 }}>
                      #{l.materialCardId ?? "—"}
                    </button>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontFamily: "monospace" }}>{fmt(l.quantity)}</td>
                  <td style={td}>{l.unit ?? "—"}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#3B82F6" }}>{l.barcodeCount}</td>
                  <td style={td}>{fmtDate(l.firstSeen)}</td>
                  <td style={td}>{fmtDate(l.lastSeen)}</td>
                  <td style={td}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: l.status === "PRINTED" ? "#ECFDF5" : "#FEF3C7",
                      color: l.status === "PRINTED" ? "#065F46" : "#92400E",
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

const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13 };
