/**
 * @module PosMaterialCard
 * @description Material card component with category config for POS materials grid.
 * Split from PosMaterials.tsx (Rule 16).
 */

import { tLabel } from '@/lib/i18n/tLabel';
import { useTranslation } from '@/lib/i18n';

export interface MaterialRow {
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
const CAT_CONFIG: Record<string, { icon: string; bg: string; text: string; label: string }> = {
  "INK":         { icon: "🖋️", bg: "#FAF5FF", text: "#581C87", label: "Bo'yoq" },
  "PAPER":       { icon: "📄", bg: "#FEF3C7", text: "#92400E", label: "Qog'oz" },
  "PLATE":       { icon: "🟫", bg: "#FFFBEB", text: "#78350F", label: "Plastina" },
  "FILM":        { icon: "🎞️", bg: "#EDE9FE", text: "#4C1D95", label: "Plyonka" },
  "ASSET":       { icon: "🧰", bg: "#F0FDF4", text: "#14532D", label: "Aktiv" },
  "OFFICE":      { icon: "📎", bg: "#EFF6FF", text: "#1E40AF", label: "Ofis" },
  "CARDBOARD":   { icon: "📦", bg: "#FEF3C7", text: "#92400E", label: "Karton" },
  "CARTON":      { icon: "📦", bg: "#FEF3C7", text: "#92400E", label: "Karton" },
  "GLUE":        { icon: "🧴", bg: "#FDF4FF", text: "#701A75", label: "Yelim" },
  "CHEMICAL":    { icon: "⚗️", bg: "#ECFDF5", text: "#064E3B", label: "Kimyo" },
  "SOLVENT":     { icon: "🧪", bg: "#ECFDF5", text: "#064E3B", label: "Erituvchi" },
  "PACKAGING":   { icon: "📮", bg: "#FFF7ED", text: "#7C2D12", label: "Qadoqlash" },
  "TOOL":        { icon: "🔧", bg: "#F1F5F9", text: "#1E293B", label: "Asbob" },
  "SPARE":       { icon: "⚙️", bg: "#F1F5F9", text: "#1E293B", label: "Ehtiyot qism" },
  "CONSUMABLE":  { icon: "🧴", bg: "#FFFBEB", text: "#78350F", label: "Iste'mol" },
  "QOGOZ":       { icon: "📄", bg: "#FEF3C7", text: "#92400E", label: "Qog'oz" },
  "KARTON":      { icon: "📦", bg: "#FEF3C7", text: "#92400E", label: "Karton" },
  "PLASTIK":     { icon: "🔷", bg: "#EDE9FE", text: "#4C1D95", label: "Plastik" },
  "METAL":       { icon: "⚙️", bg: "#F1F5F9", text: "#1E293B", label: "Metal" },
  "HIMIYA":      { icon: "⚗️", bg: "#ECFDF5", text: "#064E3B", label: "Kimyo" },
  "YOQILGI":     { icon: "⛽", bg: "#FFF7ED", text: "#7C2D12", label: "Yoqilg'i" },
  "ELEKTR":      { icon: "🔌", bg: "#EFF6FF", text: "#1E40AF", label: "Elektr" },
  "ASBOB":       { icon: "🔧", bg: "#F0FDF4", text: "#14532D", label: "Asboblar" },
  "OFIS":        { icon: "📎", bg: "#FAF5FF", text: "#581C87", label: "Ofis" },
  "default":     { icon: "📋", bg: "#F9FAFB", text: "#374151", label: "Boshqa" },
};

export function getCatCfg(cat: string | null): typeof CAT_CONFIG["default"] {
  if (!cat) return CAT_CONFIG["default"];
  const up = cat.toUpperCase();
  if (CAT_CONFIG[up]) return CAT_CONFIG[up];
  const key = Object.keys(CAT_CONFIG).find(k => k !== "default" && up.includes(k));
  return key ? CAT_CONFIG[key] : CAT_CONFIG["default"];
}

function StockBadge({ qty, unit }: { qty: number; unit: string | null }) {
  const color = qty <= 0 ? "#DC2626" : qty < 10 ? "#D97706" : "#059669";
  return (
    <span style={{
      display: "inline-block", background: color + "15",
      color, borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 700,
    }}>
      {qty % 1 === 0 ? qty : qty.toFixed(2)} {unit ?? ""}
    </span>
  );
}

interface MaterialCardProps {
  mat: MaterialRow;
  onClick: () => void;
  on360: () => void;
}

export function MaterialCard({ mat, onClick, on360 }: MaterialCardProps) {
  const { t } = useTranslation("common");
  const catCfg = getCatCfg(mat.category);
  const qty = parseFloat(mat.available_qty ?? "0");
  const price = parseFloat(mat.last_purchase_price ?? "0");
  const isLow = qty <= 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: "#FFF", borderRadius: 12, border: "1px solid #E5E7EB",
        overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column",
        transition: "box-shadow 0.15s, transform 0.15s", opacity: isLow ? 0.7 : 1,
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
      <div style={{
        background: catCfg.bg, display: "flex", alignItems: "center",
        justifyContent: "center", height: 90, fontSize: 40, position: "relative",
      }}>
        {catCfg.icon}
        {isLow && (
          <div style={{
            position: "absolute", bottom: 6, right: 6, background: "#DC2626", color: "#FFF",
            borderRadius: 4, fontSize: 9, fontWeight: 700, padding: "1px 5px",
          }}>
            TUGAGAN
          </div>
        )}
      </div>
      <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: "#1F2937", overflow: "hidden",
          textOverflow: "ellipsis", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4,
        }}>
          {mat.name ?? mat.code ?? `#${mat.id}`}
        </div>
        <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>{mat.code ?? "—"}</div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <StockBadge qty={qty} unit={mat.unit} />
          {price > 0 && (
            <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>
              {price.toLocaleString("uz-UZ", { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); on360(); }}
          style={{
            marginTop: 6, padding: "5px 8px", borderRadius: 6,
            background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF",
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
