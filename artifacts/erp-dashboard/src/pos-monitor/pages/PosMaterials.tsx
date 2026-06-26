/**
 * POS Materiallar — Menu Grid uslubida
 * IMAPOS pizza menu bilan o'xshash karta grid layouti.
 * Har bir material — alohida karta (rasm o'rniga kategoriya ikonkasi).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { usePosI18n } from "../i18n/usePosI18n";
import { materialsApi, barcodeApi } from "../api/pos-monitor.api";
import PosBarcodeScanner from "../components/PosBarcodeScanner";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from '@/lib/i18n/tLabel';
interface MaterialRow {
  id: string | number;
  code: string | null;
  name: string | null;
  category: string | null;
  unit: string | null;
  material_type: string | null;
  available_qty: string | null;
  warehouse_id: string | null;
  last_purchase_price: string | null;
}

// ── Category → icon & color ───────────────────────────────────────────────
// Real DB qiymatlari (material_cards.category):
// INK, PAPER, PLATE, FILM, ASSET, OFFICE, va boshqalar
const CAT_CONFIG: Record<string, { icon: string; bg: string; text: string; label: string }> = {
  // EuroPrint asosiy kategoriyalar (chop etish ishlab chiqarishi)
  "INK":         { icon: "🖋️", bg: "#FAF5FF", text: "#581C87", label: "Bo'yoq" },
  "PAPER":       { icon: "📄", bg: "#FEF3C7", text: "#92400E", label: "Qog'oz" },
  "PLATE":       { icon: "🟫", bg: "#FFFBEB", text: "#78350F", label: "Plastina" },
  "FILM":        { icon: "🎞️", bg: "#EDE9FE", text: "#4C1D95", label: "Plyonka" },
  "ASSET":       { icon: "🧰", bg: "#F0FDF4", text: "#14532D", label: "Aktiv" },
  "OFFICE":      { icon: "📎", bg: "var(--pos-accent-soft)", text: "var(--pos-accent)", label: "Ofis" },
  "CARDBOARD":   { icon: "📦", bg: "#FEF3C7", text: "#92400E", label: "Karton" },
  "CARTON":      { icon: "📦", bg: "#FEF3C7", text: "#92400E", label: "Karton" },
  "GLUE":        { icon: "🧴", bg: "#FDF4FF", text: "#701A75", label: "Yelim" },
  "CHEMICAL":    { icon: "⚗️", bg: "#ECFDF5", text: "#064E3B", label: "Kimyo" },
  "SOLVENT":     { icon: "🧪", bg: "#ECFDF5", text: "#064E3B", label: "Erituvchi" },
  "PACKAGING":   { icon: "📮", bg: "#FFF7ED", text: "#7C2D12", label: "Qadoqlash" },
  "TOOL":        { icon: "🔧", bg: "#F1F5F9", text: "var(--pos-text)", label: "Asbob" },
  "SPARE":       { icon: "⚙️", bg: "#F1F5F9", text: "var(--pos-text)", label: "Ehtiyot qism" },
  "CONSUMABLE":  { icon: "🧴", bg: "#FFFBEB", text: "#78350F", label: "Iste'mol" },

  // Eski o'zbekcha nomlar (mavjud bo'lsa)
  "QOGOZ":       { icon: "📄", bg: "#FEF3C7", text: "#92400E", label: "Qog'oz" },
  "KARTON":      { icon: "📦", bg: "#FEF3C7", text: "#92400E", label: "Karton" },
  "PLASTIK":     { icon: "🔷", bg: "#EDE9FE", text: "#4C1D95", label: "Plastik" },
  "METAL":       { icon: "⚙️", bg: "#F1F5F9", text: "var(--pos-text)", label: "Metal" },
  "HIMIYA":      { icon: "⚗️", bg: "#ECFDF5", text: "#064E3B", label: "Kimyo" },
  "YOQILGI":     { icon: "⛽", bg: "#FFF7ED", text: "#7C2D12", label: "Yoqilg'i" },
  "ELEKTR":      { icon: "🔌", bg: "var(--pos-accent-soft)", text: "var(--pos-accent)", label: "Elektr" },
  "ASBOB":       { icon: "🔧", bg: "#F0FDF4", text: "#14532D", label: "Asboblar" },
  "OFIS":        { icon: "📎", bg: "#FAF5FF", text: "#581C87", label: "Ofis" },

  // Default
  "default":     { icon: "📋", bg: "var(--pos-bg)", text: "var(--pos-text-muted)", label: "Boshqa" },
};

function getCatCfg(cat: string | null): typeof CAT_CONFIG["default"] {
  if (!cat) return CAT_CONFIG["default"];
  const up = cat.toUpperCase();

  // 1) To'liq moslik
  if (CAT_CONFIG[up]) return CAT_CONFIG[up];

  // 2) Qismli moslik (kategoriya kalit so'zni o'z ichiga oladi)
  const key = Object.keys(CAT_CONFIG).find(
    k => k !== "default" && up.includes(k),
  );
  return key ? CAT_CONFIG[key] : CAT_CONFIG["default"];
}

// Stock badge
function StockBadge({ qty, unit }: { qty: number; unit: string | null }) {
  const color = qty <= 0 ? "var(--pos-danger)" : qty < 10 ? "#D97706" : "var(--pos-success)";
  return (
    <span style={{
      display: "inline-block", background: color + "15",
      color, borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 700,
    }}>
      {qty % 1 === 0 ? qty : qty.toFixed(2)} {unit ?? ""}
    </span>
  );
}

// ── Material card ─────────────────────────────────────────────────────────
function MaterialCard({ mat, onClick, on360 }: { mat: MaterialRow; onClick: () => void; on360: () => void }) {
  const { t } = useTranslation("common");
  const catCfg = getCatCfg(mat.category);
  const qty = parseFloat(mat.available_qty ?? "0");
  const price = parseFloat(mat.last_purchase_price ?? "0");
  const isLow = qty <= 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--pos-card)", borderRadius: 12, border: "1px solid var(--pos-border)",
        overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column",
        transition: "box-shadow 0.15s, transform 0.15s",
        opacity: isLow ? 0.7 : 1,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
        (e.currentTarget as HTMLDivElement).style.transform = "";
      }}
    >
      {/* Icon area (replaces food photo) */}
      <div style={{
        background: catCfg.bg, display: "flex", alignItems: "center",
        justifyContent: "center", height: 90, fontSize: 40,
        position: "relative",
      }}>
        {catCfg.icon}
        {isLow && (
          <div style={{
            position: "absolute", bottom: 6, right: 6,
            background: "var(--pos-danger)", color: "var(--pos-card)", borderRadius: 4,
            fontSize: 9, fontWeight: 700, padding: "1px 5px",
          }}>
            TUGAGAN
          </div>
        )}
      </div>

      {/* Info area */}
      <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: "var(--pos-text)",
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          lineHeight: 1.4,
        }}>
          {mat.name ?? mat.code ?? `#${mat.id}`}
        </div>
        <div style={{ fontSize: 10, color: "var(--pos-text-muted)", fontFamily: "monospace" }}>
          {mat.code ?? "—"}
        </div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <StockBadge qty={qty} unit={mat.unit} />
          {price > 0 && (
            <span style={{ fontSize: 11, color: "var(--pos-success)", fontWeight: 700 }}>
              {price.toLocaleString("uz-UZ", { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
        {/* 360 profile tugma */}
        <button
          onClick={e => { e.stopPropagation(); on360(); }}
          style={{
            marginTop: 6, padding: "5px 8px", borderRadius: 6,
            background: "var(--pos-accent-soft)", border: "1px solid #BFDBFE", color: "var(--pos-accent)",
            fontSize: 10, fontWeight: 700, cursor: "pointer", textAlign: "center",
          }}
          title={tLabel('common.PosMaterials.material360ProfiliHarOmborda', "Material 360° profili (har omborda stok, harakatlar, narxlar)")}
        >
          {t("k360Profil")}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function PosMaterials() {
  const [, navigate] = useLocation();
  const { t }        = usePosI18n();

  const [materials, setMaterials]     = useState<MaterialRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showScanner, setShowScanner] = useState(false);
  const [categories, setCategories]   = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMaterials = useCallback(async (q?: string, cat?: string) => {
    setLoading(true);
    try {
      const raw = await materialsApi.getAll({
        q:        q    || undefined,
        category: (cat && cat !== "all") ? cat : undefined,
        limit:    300,
      });
      const rows = (Array.isArray(raw) ? raw : []) as MaterialRow[];
      setMaterials(rows);
      // Extract unique categories
      if (!q && (!cat || cat === "all")) {
        const cats = [...new Set(rows.map(r => r.category).filter(Boolean))] as string[];
        setCategories(cats.sort());
      }
    } catch { setMaterials([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadMaterials(); }, [loadMaterials]);

  // Debounced search
  function handleSearch(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadMaterials(val, activeCategory);
    }, 300);
  }

  function handleCategory(cat: string) {
    setActiveCategory(cat);
    setSearch("");
    void loadMaterials(undefined, cat);
  }

  async function handleBarcodeScan(barcode: string) {
    try {
      const result = await barcodeApi.lookup(barcode) as { materialCardId?: number };
      if (result?.materialCardId) {
        navigate(`/pos-monitor/materials/${result.materialCardId}`);
      }
    } catch { /* noop */ }
  }

  const catTabList = [
    { key: "all", label: "Barchasi", icon: "🗂️" },
    ...categories.map(c => ({ key: c, label: getCatCfg(c).label, icon: getCatCfg(c).icon })),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--pos-bg)" }}>

      {/* Top toolbar */}
      <div style={{
        background: "var(--pos-card)", borderBottom: "1px solid var(--pos-border)",
        padding: "14px 20px", display: "flex", alignItems: "center",
        gap: 12, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10,
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--pos-text)" }}>
          {t("Materiallar")}
        </h2>
        <span style={{ fontSize: 12, color: "var(--pos-text-muted)" }}>{materials.length} ta</span>
        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--pos-text-muted)" }}>
            🔍
          </span>
          <input
            style={{
              border: "1px solid var(--pos-border)", borderRadius: 8, padding: "8px 12px 8px 32px",
              fontSize: 13, outline: "none", width: 220, color: "var(--pos-text)", background: "var(--pos-bg)",
            }}
            placeholder={t("kodNomYokiBarcode")}
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {/* Barcode scan */}
        <button
          onClick={() => setShowScanner(true)}
          style={{
            background: "var(--pos-bg)", border: "1px solid var(--pos-border)", borderRadius: 8,
            padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "var(--pos-text-muted)",
            fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {t("skan1")}
        </button>

        <button
          onClick={() => navigate("/pos-monitor/materials/new")}
          style={{
            background: "var(--pos-warning)", color: "var(--pos-card)", border: "none",
            borderRadius: 8, padding: "8px 16px", fontWeight: 700,
            fontSize: 13, cursor: "pointer",
          }}
        >
          {t("yangiMaterial1")}
        </button>
      </div>

      {/* Category tabs */}
      <div style={{
        background: "var(--pos-card)", borderBottom: "1px solid var(--pos-border)",
        padding: "0 20px", display: "flex", gap: 4, overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {catTabList.map(cat => (
          <button
            key={cat.key}
            onClick={() => handleCategory(cat.key)}
            style={{
              padding: "10px 4px", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: activeCategory === cat.key ? 700 : 500,
              color: activeCategory === cat.key ? "var(--pos-text)" : "var(--pos-text-muted)",
              borderBottom: activeCategory === cat.key ? "2px solid var(--pos-warning)" : "2px solid transparent",
              whiteSpace: "nowrap", marginRight: 12,
              display: "flex", alignItems: "center", gap: 5,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 15 }}>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px" }}>

        {/* Skeleton while loading */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} style={{
                background: "var(--pos-card)", borderRadius: 12, border: "1px solid var(--pos-border)",
                overflow: "hidden", animation: "pos-pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 50}ms`,
              }}>
                <div style={{ height: 90, background: "var(--pos-bg)" }} />
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ height: 12, borderRadius: 4, background: "var(--pos-bg)", width: "80%" }} />
                  <div style={{ height: 10, borderRadius: 4, background: "var(--pos-bg)", width: "50%" }} />
                  <div style={{ height: 16, borderRadius: 6, background: "var(--pos-bg)", width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && materials.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--pos-text-muted)" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--pos-text-muted)", marginBottom: 8 }}>
              {t("materialTopilmadi")}
            </div>
            <div style={{ fontSize: 13, marginBottom: 24 }}>
              {search ? `"${search}" bo'yicha natija yo'q` : "Hali material qo'shilmagan"}
            </div>
            {search && (
              <button
                onClick={() => handleSearch("")}
                style={{
                  background: "var(--pos-warning)", color: "var(--pos-card)", border: "none",
                  borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer",
                }}
              >
                {t("filterniTozalash")}
              </button>
            )}
          </div>
        )}

        {/* Material grid */}
        {!loading && materials.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {materials.map(mat => (
              <MaterialCard
                key={mat.id}
                mat={mat}
                onClick={() => navigate(`/pos-monitor/materials/${mat.id}`)}
                on360={() => navigate(`/pos-monitor/materials/360/${mat.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Barcode scanner modal */}
      {showScanner && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{ background: "var(--pos-card)", borderRadius: 16, padding: 24, width: 380, maxWidth: "95vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{t("barcodeSkan")}</h3>
              <button
                onClick={() => setShowScanner(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--pos-text-muted)" }}
              >
                ✕
              </button>
            </div>
            <PosBarcodeScanner
              onDetected={(code: string) => { setShowScanner(false); void handleBarcodeScan(code); }}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
