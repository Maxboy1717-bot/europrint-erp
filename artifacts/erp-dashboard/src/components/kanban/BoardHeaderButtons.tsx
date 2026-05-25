/**
 * @module BoardHeaderButtons
 * @description Neumorphic button primitives and shadow constants for BoardHeader.
 * Split from BoardHeader.tsx (Rule 16).
 */

// ── Neumorphic shadows ───────────────────────────────────────────────────────
export const SHADOW          = "6px 6px 16px rgba(163,177,198,0.50), -4px -4px 12px rgba(255,255,255,0.80)";
export const BTN_SHADOW      = "3px 3px 8px rgba(163,177,198,0.40), -2px -2px 6px rgba(255,255,255,0.80)";
export const BTN_SHADOW_HOVER = "5px 5px 12px rgba(163,177,198,0.55), -3px -3px 8px rgba(255,255,255,0.90)";
export const INPUT_SHADOW    = "inset 2px 2px 6px rgba(163,177,198,0.30), inset -2px -2px 6px rgba(255,255,255,0.70)";

// ── NeuBtn (text + icon pill button) ────────────────────────────────────────
interface NeuBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  title?: string;
  testId?: string;
}

export function NeuBtn({ children, onClick, active = false, danger = false, title, testId }: NeuBtnProps) {
  const activeShadow = `3px 3px 8px ${danger ? "rgba(240,128,128,0.4)" : "rgba(91,155,213,0.4)"}`;
  return (
    <button
      onClick={onClick} title={title} data-testid={testId}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 12,
        border: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 500,
        background: active ? (danger ? "#F08080" : "#5B9BD5") : "#FFFFFF",
        color: active ? "#FFFFFF" : (danger ? "#C05050" : "#718096"),
        boxShadow: active ? activeShadow : BTN_SHADOW,
        transition: "all 0.18s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW_HOVER; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = active ? activeShadow : BTN_SHADOW; }}
    >
      {children}
    </button>
  );
}

// ── IconBtn (square icon button with optional badge) ─────────────────────────
interface IconBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  title?: string;
  testId?: string;
}

export function IconBtn({ children, onClick, badge, title, testId }: IconBtnProps) {
  return (
    <button
      onClick={onClick} title={title} data-testid={testId}
      className="relative"
      style={{
        width: 40, height: 40, borderRadius: 12,
        border: "none", cursor: "pointer",
        background: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: BTN_SHADOW, transition: "all 0.18s", color: "#718096",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW_HOVER; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = BTN_SHADOW; }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          className="absolute flex items-center justify-center text-white rounded-full"
          style={{ top: -4, right: -4, width: 16, height: 16, background: "#F08080", fontSize: 9, fontWeight: 700 }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
