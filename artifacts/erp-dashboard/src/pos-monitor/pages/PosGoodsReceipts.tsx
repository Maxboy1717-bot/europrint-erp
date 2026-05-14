/**
 * PosGoodsReceipts.tsx
 * Qabul Aktlari (GRN — Goods Receipt Notes) — POS Monitor uchun.
 * URL: /pos-monitor/grn
 */
import { useEffect, useState } from "react";
import { warehouseFeaturesApi } from "../api/pos-monitor.api";

import { useTranslation } from '@/lib/i18n';
interface Grn {
  id: number; grnNumber: string; movementId: number | null;
  purchaseOrderId: string | null;
  supplierName: string; supplierTin: string | null;
  warehouseId: number | null; warehouseCode: string | null; warehouseName: string | null;
  receivedDate: string; waybillNumber: string | null; contractNumber: string | null;
  totalAmount: number; currency: string; status: string; notes: string | null;
  receivedByName: string; approvedByName: string | null; approvedAt: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:     { bg: "#F3F4F6", text: "#374151", label: "Qoralama" },
  APPROVED:  { bg: "#ECFDF5", text: "#065F46", label: "Tasdiqlangan" },
  REJECTED:  { bg: "#FEF2F2", text: "#991B1B", label: "Rad etilgan" },
  COMPLETED: { bg: "#EFF6FF", text: "#1E40AF", label: "Yakunlangan" },
};

function fmt(n: number): string {
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("uz-UZ"); } catch { return "—"; }
}

export default function PosGoodsReceipts() {
  const { t } = useTranslation('common');
  const [list, setList] = useState<Grn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const r = await warehouseFeaturesApi.listGrn({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 200,
      });
      setList((r as Grn[]) ?? []);
    } catch { setList([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [statusFilter]);

  const filtered = list.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.grnNumber.toLowerCase().includes(q)
        || g.supplierName.toLowerCase().includes(q)
        || (g.waybillNumber ?? "").toLowerCase().includes(q)
        || (g.contractNumber ?? "").toLowerCase().includes(q);
  });

  const totalAmount = filtered.reduce((s, g) => s + (g.totalAmount ?? 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>QABUL AKTLARI</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1F2937" }}>
            GRN — Goods Receipt Notes
          </h1>
        </div>
        <button
          onClick={() => void load()}
          style={{ padding: "8px 16px", background: "#F3F4F6", border: "1px solid #E5E7EB",
                   borderRadius: 8, cursor: "pointer", fontSize: 13 }}
        >
          🔄 Yangilash
        </button>
      </div>

      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "#FFF", borderRadius: 12, padding: 12, border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>JAMI GRN</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1F2937" }}>{filtered.length}</div>
        </div>
        <div style={{ background: "#FFF", borderRadius: 12, padding: 12, border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>JAMI SUMMA</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>{fmt(totalAmount)} UZS</div>
        </div>
        <div style={{ background: "#FFF", borderRadius: 12, padding: 12, border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>QORALAMA</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#374151" }}>
            {filtered.filter(g => g.status === "DRAFT").length}
          </div>
        </div>
        <div style={{ background: "#FFF", borderRadius: 12, padding: 12, border: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>TASDIQLANGAN</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>
            {filtered.filter(g => g.status === "APPROVED").length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Qidiruv: raqam, ta'minotchi, yuk xati..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 250, padding: "8px 12px", border: "1px solid #E5E7EB",
                   borderRadius: 8, fontSize: 13 }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13 }}
        >
          <option value="all">Barchasi</option>
          <option value="DRAFT">Qoralama</option>
          <option value="APPROVED">Tasdiqlangan</option>
          <option value="REJECTED">Rad etilgan</option>
          <option value="COMPLETED">Yakunlangan</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>⏳ Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <div style={{ marginTop: 8 }}>Qabul aktlari yo'q</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#F9FAFB" }}>
              <tr>
                <Th>GRN Raqam</Th>
                <Th>Sana</Th>
                <Th>Ta'minotchi</Th>
                <Th>Ombor</Th>
                <Th>Yuk xati</Th>
                <Th align="right">Summa</Th>
                <Th>{t('status24')}</Th>
                <Th>Qabul qiluvchi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => {
                const sc = STATUS_COLORS[g.status] ?? { bg: "#F3F4F6", text: "#374151", label: g.status };
                return (
                  <tr key={g.id} style={{ borderTop: "1px solid #F3F4F6" }}>
                    <Td mono><b>{g.grnNumber}</b></Td>
                    <Td>{fmtDate(g.receivedDate)}</Td>
                    <Td>
                      <div>{g.supplierName}</div>
                      {g.supplierTin && <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>{g.supplierTin}</div>}
                    </Td>
                    <Td mono>
                      {g.warehouseCode ?? "—"}
                      {g.warehouseName && <div style={{ fontSize: 10, color: "#9CA3AF" }}>{g.warehouseName}</div>}
                    </Td>
                    <Td mono>{g.waybillNumber ?? "—"}</Td>
                    <Td align="right" mono>
                      <b>{fmt(g.totalAmount)}</b> <span style={{ color: "#9CA3AF" }}>{g.currency}</span>
                    </Td>
                    <Td>
                      <span style={{ padding: "3px 8px", borderRadius: 6, background: sc.bg, color: sc.text,
                                     fontSize: 11, fontWeight: 700 }}>
                        {sc.label}
                      </span>
                    </Td>
                    <Td>{g.receivedByName.trim() || "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th style={{ padding: "10px 14px", textAlign: align ?? "left", fontSize: 11,
                 color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase" }}>
      {children}
    </th>
  );
}

function Td({ children, align, mono }: { children: React.ReactNode; align?: "left" | "right"; mono?: boolean }) {
  return (
    <td style={{ padding: "10px 14px", textAlign: align ?? "left",
                 fontFamily: mono ? "monospace" : "inherit", fontSize: 13 }}>
      {children}
    </td>
  );
}
