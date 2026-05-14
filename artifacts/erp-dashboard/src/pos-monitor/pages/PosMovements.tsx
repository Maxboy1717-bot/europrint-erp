/**
 * POS Harakatlar — Kitchen Display uslubida
 * IMAPOS Kitchen Display bilan o'xshash karta layouti.
 * Har bir harakat — alohida karta.  Start/Finish tugmalari.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { movementsApi } from "../api/pos-monitor.api";

interface Movement {
  id: number;
  movementNumber?: string;
  movementType: string;
  status: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  totalAmount?: number;
  createdAt: string;
  supplierName?: string;
  createdBy?: number;
}

// ── Status configuration ──────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; headerBg: string; headerText: string; tab: string }> = {
  draft:         { label: "Qoralama",      headerBg: "#8B7355", headerText: "#FFF",     tab: "new" },
  karantin:      { label: "Karantin",      headerBg: "#F59E0B", headerText: "#FFF",     tab: "new" },
  qc_pending:    { label: "QC Navbat",     headerBg: "#7C3AED", headerText: "#FFF",     tab: "process" },
  qc_approved:   { label: "QC O'tdi",      headerBg: "#2563EB", headerText: "#FFF",     tab: "process" },
  qc_rework:     { label: "QC Qayta",      headerBg: "#DC2626", headerText: "#FFF",     tab: "process" },
  qc_rejected:   { label: "QC Rad",        headerBg: "#6B7280", headerText: "#FFF",     tab: "done" },
  pending:       { label: "Tasdiq Kutish", headerBg: "#D97706", headerText: "#FFF",     tab: "process" },
  approved:      { label: "Tasdiqlandi",   headerBg: "#059669", headerText: "#FFF",     tab: "process" },
  ai_processing: { label: "AI Ishlaydi",   headerBg: "#0891B2", headerText: "#FFF",     tab: "process" },
  completed:     { label: "Yakunlandi",    headerBg: "#047857", headerText: "#FFF",     tab: "done" },
  cancelled:     { label: "Bekor",         headerBg: "#9CA3AF", headerText: "#FFF",     tab: "done" },
};

const TYPE_ICON: Record<string, string> = {
  EXTERNAL_IN:        "📥",
  EXTERNAL_OUT:       "📤",
  INTERNAL_ISSUE:     "📦",
  INTERNAL_RETURN:    "↩️",
  INTERNAL_TRANSFER:  "🔄",
  DAMAGE:             "⚠️",
  INVENTORY_ADJUST:   "📊",
  INVENTORY_ADJ_PLUS: "➕",
  INVENTORY_ADJ_MINUS:"➖",
};

const TYPE_LABEL: Record<string, string> = {
  EXTERNAL_IN:        "Tashqi Kirim",
  EXTERNAL_OUT:       "Tashqi Chiqim",
  INTERNAL_ISSUE:     "Bo'limga Berish",
  INTERNAL_RETURN:    "Qaytarish",
  INTERNAL_TRANSFER:  "Ko'chirish",
  DAMAGE:             "Zarar Akti",
  INVENTORY_ADJUST:   "Inventarizatsiya",
  INVENTORY_ADJ_PLUS: "Qo'shish",
  INVENTORY_ADJ_MINUS:"Ayirish",
};

// Time elapsed badge (like kitchen display timer)
function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    function calc() {
      const diff = Date.now() - new Date(createdAt).getTime();
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  const urgent = mins > 30;
  const warn   = mins > 10;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: urgent ? "rgba(220,38,38,0.25)" : warn ? "rgba(245,158,11,0.25)" : "rgba(0,0,0,0.2)",
      color: "#FFF", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontFamily: "monospace", fontWeight: 700,
    }}>
      🕐 {elapsed}
    </span>
  );
}

// Single movement card (kitchen display style)
function MovementCard({
  mov, onAction, onPrint, actionLoading,
}: {
  mov: Movement;
  onAction: (id: number, status: string) => void;
  onPrint: (id: number) => void;
  actionLoading: number | null;
}) {
  const cfg = STATUS_CFG[mov.status] ?? STATUS_CFG.draft;
  const isDone = mov.status === "completed" || mov.status === "cancelled";

  // Determine next action based on current status
  function getAction(): { label: string; newStatus: string; bg: string } | null {
    switch (mov.status) {
      case "draft":        return { label: "Yuborish",    newStatus: "pending",   bg: "#8B7355" };
      case "karantin":     return { label: "QC Yuborish", newStatus: "qc_pending", bg: "#7C3AED" };
      case "qc_pending":   return { label: "QC O'tkazish",newStatus: "qc_approved",bg: "#2563EB" };
      case "qc_approved":  return { label: "Tasdiqlash",  newStatus: "pending",   bg: "#D97706" };
      case "pending":      return { label: "Tasdiqlash",  newStatus: "approved",  bg: "#059669" };
      case "approved":     return { label: "Yakunlash",   newStatus: "completed", bg: "#047857" };
      case "ai_processing":return { label: "Yakunlash",   newStatus: "completed", bg: "#047857" };
      default:             return null;
    }
  }

  const action = getAction();
  const warehouseLabel = mov.toWarehouseId ?? mov.fromWarehouseId ?? "—";
  const whCode = warehouseLabel.length > 6 ? warehouseLabel.slice(0, 6) : warehouseLabel;

  return (
    <div style={{
      background: "#FFF", borderRadius: 12, overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column",
      opacity: isDone ? 0.75 : 1, transition: "box-shadow 0.2s",
      border: "1px solid #E5E7EB",
    }}>
      {/* Card header */}
      <div style={{
        background: cfg.headerBg, color: cfg.headerText,
        padding: "10px 12px", display: "flex", alignItems: "center", gap: 8,
      }}>
        {/* Movement number */}
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>
          #{mov.movementNumber ?? String(mov.id).padStart(3, "0")}
        </span>
        {/* Elapsed */}
        <ElapsedBadge createdAt={mov.createdAt} />
        <div style={{ flex: 1 }} />
        {/* Warehouse badge */}
        <span style={{
          background: "rgba(255,255,255,0.25)", borderRadius: 20,
          padding: "2px 8px", fontSize: 11, fontWeight: 700,
        }}>
          {whCode}
        </span>
        {/* Avatar placeholder */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 14, flexShrink: 0,
        }}>
          👤
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "12px 14px", flex: 1 }}>
        {/* Movement type */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>{TYPE_ICON[mov.movementType] ?? "📋"}</span>
          <span style={{
            fontSize: 13, fontWeight: 600, color: "#1F2937",
            textDecoration: isDone && mov.status === "cancelled" ? "line-through" : "none",
            color: isDone && mov.status === "cancelled" ? "#9CA3AF" : "#1F2937",
          }}>
            {TYPE_LABEL[mov.movementType] ?? mov.movementType}
          </span>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: "#6B7280" }}>
          {mov.fromWarehouseId && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Kimdan</span>
              <span style={{ color: "#374151", fontWeight: 500 }}>{mov.fromWarehouseId}</span>
            </div>
          )}
          {mov.toWarehouseId && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Qayerga</span>
              <span style={{ color: "#374151", fontWeight: 500 }}>{mov.toWarehouseId}</span>
            </div>
          )}
          {mov.supplierName && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Ta'minotchi</span>
              <span style={{ color: "#374151", fontWeight: 500, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mov.supplierName}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span>Sana</span>
            <span style={{ color: "#374151", fontFamily: "monospace" }}>
              {new Date(mov.createdAt).toLocaleDateString("uz-UZ")}
            </span>
          </div>
          {(mov.totalAmount ?? 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Summa</span>
              <span style={{ color: "#059669", fontWeight: 700, fontFamily: "monospace" }}>
                {(mov.totalAmount ?? 0).toLocaleString("uz-UZ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div style={{
        padding: "10px 12px", borderTop: "1px solid #F3F4F6",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {/* Print */}
        <button
          style={{
            background: "none", border: "1px solid #E5E7EB", borderRadius: 8,
            padding: "6px 10px", cursor: "pointer", fontSize: 16, color: "#6B7280",
          }}
          onClick={() => onPrint(mov.id)}
          title="Chop etish"
        >
          🖨️
        </button>

        {/* Action button */}
        {action && !isDone ? (
          <button
            onClick={() => onAction(mov.id, action.newStatus)}
            disabled={actionLoading === mov.id}
            style={{
              flex: 1, background: action.bg, color: "#FFF",
              border: "none", borderRadius: 8, padding: "8px 0",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              opacity: actionLoading === mov.id ? 0.7 : 1,
            }}
          >
            {actionLoading === mov.id ? "⏳ Kuting..." : action.label}
          </button>
        ) : isDone ? (
          <div style={{
            flex: 1, textAlign: "center", color: mov.status === "completed" ? "#059669" : "#9CA3AF",
            fontSize: 13, fontWeight: 700,
          }}>
            {mov.status === "completed" ? "✅ Yakunlandi" : "❌ Bekor qilindi"}
          </div>
        ) : (
          <button
            onClick={() => window.location.assign(`/pos-monitor/movements/${mov.id}`)}
            style={{
              flex: 1, background: "#F3F4F6", color: "#374151",
              border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 0",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}
          >
            👁 Ko'rish
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function PosMovements() {
  const [, navigate] = useLocation();
  const { t }        = usePosI18n();
  const [movements, setMovements]       = useState<Movement[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<"all" | "new" | "process" | "done">("all");
  const [filterType, setFilterType]     = useState("");
  const [showFilter, setShowFilter]     = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await movementsApi.getAll();
      setMovements((Array.isArray(data) ? data : []) as Movement[]);
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void loadData();
    // Auto-refresh every 30 seconds (kitchen display style)
    pollRef.current = setInterval(() => { void loadData(); }, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadData]);

  const tabCounts = {
    new:     movements.filter(m => STATUS_CFG[m.status]?.tab === "new").length,
    process: movements.filter(m => STATUS_CFG[m.status]?.tab === "process").length,
    done:    movements.filter(m => STATUS_CFG[m.status]?.tab === "done").length,
  };

  const displayed = movements.filter(m => {
    if (activeTab !== "all" && STATUS_CFG[m.status]?.tab !== activeTab) return false;
    if (filterType && m.movementType !== filterType) return false;
    return true;
  });

  async function handleAction(id: number, newStatus: string) {
    setActionLoading(id);
    try {
      await movementsApi.updateStatus(id, newStatus);
      await loadData();
    } catch { /* noop */ } finally { setActionLoading(null); }
  }

  function handlePrint(id: number) {
    window.open(movementsApi.getPdf(id), "_blank");
  }

  const TYPES = ["EXTERNAL_IN","EXTERNAL_OUT","INTERNAL_ISSUE","INTERNAL_RETURN","INTERNAL_TRANSFER","DAMAGE"];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "0 0 32px 0" }}>

      {/* Top bar */}
      <div style={{
        background: "#FFF", borderBottom: "1px solid #E5E7EB",
        padding: "14px 20px", display: "flex", alignItems: "center",
        gap: 12, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10,
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937" }}>
          Harakatlar
        </h2>
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{movements.length} ta jami</span>
        <div style={{ flex: 1 }} />
        <button
          className="pos-btn pos-btn-ghost"
          style={{ fontSize: 12 }}
          onClick={() => setShowFilter(f => !f)}
        >
          🔽 Tur bo'yicha filtr
        </button>
        <button
          className="pos-btn pos-btn-ghost"
          style={{ fontSize: 12 }}
          onClick={() => void loadData()}
        >
          🔄 Yangilash
        </button>
        <button
          onClick={() => navigate("/pos-monitor/movements/new")}
          style={{
            background: "#F59E0B", color: "#FFF", border: "none",
            borderRadius: 8, padding: "8px 16px", fontWeight: 700,
            fontSize: 13, cursor: "pointer",
          }}
        >
          ➕ Yangi Harakat
        </button>
      </div>

      {/* Filter row */}
      {showFilter && (
        <div style={{
          background: "#FFF", borderBottom: "1px solid #E5E7EB",
          padding: "10px 20px", display: "flex", gap: 8, flexWrap: "wrap",
        }}>
          <button
            onClick={() => setFilterType("")}
            style={{
              padding: "5px 14px", borderRadius: 20, border: "1px solid #E5E7EB",
              background: !filterType ? "#F59E0B" : "#F9FAFB",
              color: !filterType ? "#FFF" : "#374151",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}
          >
            Barchasi
          </button>
          {TYPES.map(tp => (
            <button
              key={tp}
              onClick={() => setFilterType(tp)}
              style={{
                padding: "5px 14px", borderRadius: 20, border: "1px solid #E5E7EB",
                background: filterType === tp ? "#F59E0B" : "#F9FAFB",
                color: filterType === tp ? "#FFF" : "#374151",
                fontWeight: 600, fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {TYPE_ICON[tp]} {TYPE_LABEL[tp]}
            </button>
          ))}
        </div>
      )}

      {/* Tabs — All Order / New / Process / Done */}
      <div style={{
        background: "#FFF", borderBottom: "1px solid #E5E7EB",
        padding: "0 20px", display: "flex", gap: 4,
      }}>
        {([
          ["all",     "Hammasi",       movements.length],
          ["new",     "Yangi",         tabCounts.new],
          ["process", "Jarayonda",     tabCounts.process],
          ["done",    "Yakunlangan",   tabCounts.done],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "12px 4px", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === key ? 700 : 500,
              color: activeTab === key ? "#1F2937" : "#9CA3AF",
              borderBottom: activeTab === key ? "2px solid #F59E0B" : "2px solid transparent",
              display: "flex", alignItems: "center", gap: 6, marginRight: 12,
            }}
          >
            {label}
            {count > 0 && (
              <span style={{
                background: key === "new" ? "#F59E0B" : key === "process" ? "#059669" : "#6B7280",
                color: "#FFF", borderRadius: 20, padding: "1px 7px",
                fontSize: 11, fontWeight: 700,
              }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px" }}>

        {/* Skeleton while loading */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{
                background: "#FFF", borderRadius: 12, overflow: "hidden",
                border: "1px solid #E5E7EB", animation: "pos-pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 80}ms`,
              }}>
                <div style={{ height: 52, background: "#E5E7EB" }} />
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ height: 14, width: "60%", borderRadius: 4, background: "#F3F4F6" }} />
                  <div style={{ height: 12, width: "80%", borderRadius: 4, background: "#F3F4F6" }} />
                  <div style={{ height: 12, width: "50%", borderRadius: 4, background: "#F3F4F6" }} />
                </div>
                <div style={{ height: 50, borderTop: "1px solid #F3F4F6", background: "#FAFAFA" }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
              Harakatlar yo'q
            </div>
            <div style={{ fontSize: 13, marginBottom: 24 }}>
              {activeTab === "all" ? "Hali hech qanday harakat yaratilmagan" : "Bu toifada harakatlar yo'q"}
            </div>
            <button
              onClick={() => navigate("/pos-monitor/movements/new")}
              style={{
                background: "#F59E0B", color: "#FFF", border: "none",
                borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer",
              }}
            >
              ➕ Yangi harakat yaratish
            </button>
          </div>
        )}

        {/* Cards grid */}
        {!loading && displayed.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {displayed.map(mov => (
              <MovementCard
                key={mov.id}
                mov={mov}
                onAction={handleAction}
                onPrint={handlePrint}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
