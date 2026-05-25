/**
 * @module MovementTypeSelector
 * @description React UI component.
 */

import { usePosI18n } from "../i18n/usePosI18n";

export type MovementType =
  | "EXTERNAL_IN" | "EXTERNAL_OUT"
  | "INTERNAL_ISSUE" | "INTERNAL_RETURN" | "INTERNAL_TRANSFER"
  | "DAMAGE" | "INVENTORY_ADJ_PLUS" | "INVENTORY_ADJ_MINUS";

interface TypeOption {
  type: MovementType;
  icon: string;
  color: string;
  descKey: string;
}

const TYPES: TypeOption[] = [
  { type: "EXTERNAL_IN",         icon: "📥", color: "#00FF94", descKey: "movDesc.EXTERNAL_IN" },
  { type: "EXTERNAL_OUT",        icon: "📤", color: "#FF4757", descKey: "movDesc.EXTERNAL_OUT" },
  { type: "INTERNAL_ISSUE",      icon: "➡️", color: "#FFB800", descKey: "movDesc.INTERNAL_ISSUE" },
  { type: "INTERNAL_RETURN",     icon: "↩️", color: "#00D4FF", descKey: "movDesc.INTERNAL_RETURN" },
  { type: "INTERNAL_TRANSFER",   icon: "🔄", color: "#9B59B6", descKey: "movDesc.INTERNAL_TRANSFER" },
  { type: "DAMAGE",              icon: "💥", color: "#E74C3C", descKey: "movDesc.DAMAGE" },
  { type: "INVENTORY_ADJ_PLUS",  icon: "➕", color: "#2ECC71", descKey: "movDesc.INVENTORY_ADJ_PLUS" },
  { type: "INVENTORY_ADJ_MINUS", icon: "➖", color: "#E67E22", descKey: "movDesc.INVENTORY_ADJ_MINUS" },
];

interface MovementTypeSelectorProps {
  value?: MovementType;
  onChange: (type: MovementType) => void;
  disabled?: boolean;
}

export function MovementTypeSelector({ value, onChange, disabled }: MovementTypeSelectorProps) {
  const { t } = usePosI18n();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
      {TYPES.map(opt => {
        const active = value === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.type)}
            style={{
              padding: "16px 12px",
              background: active ? `${opt.color}22` : "var(--pos-card)",
              border: `2px solid ${active ? opt.color : "var(--pos-border)"}`,
              borderRadius: 10,
              cursor: disabled ? "not-allowed" : "pointer",
              textAlign: "center",
              transition: "all 0.15s",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{opt.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: active ? opt.color : "var(--pos-text)" }}>
              {t(`movType.${opt.type}`)}
            </div>
            <div style={{ fontSize: 10, color: "var(--pos-text-muted)", marginTop: 3 }}>
              {t(opt.descKey)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default MovementTypeSelector;
