/**
 * @module ThreeBasketsPanel
 * @description React UI component.
 */

import { useState } from "react";
import { Inbox, Clock, Send, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { KanbanTranslations } from "./types";

// ── Soya konstantalari ─────────────────────────────────────────────────────
const PANEL_SHADOW  = "6px 6px 20px rgba(163,177,198,0.45), -4px -4px 12px rgba(255,255,255,0.80)";
const COL_SHADOW    = "4px 4px 14px rgba(163,177,198,0.40), -3px -3px 8px rgba(255,255,255,0.80)";
const CARD_SHADOW   = "3px 3px 8px rgba(163,177,198,0.40), -2px -2px 6px rgba(255,255,255,0.80)";
const CARD_SHADOW_H = "5px 5px 12px rgba(163,177,198,0.55), -3px -3px 8px rgba(255,255,255,0.90)";
const BTN_SHADOW    = "2px 2px 6px rgba(163,177,198,0.35), -1px -1px 4px rgba(255,255,255,0.80)";

// ── Rang konfiguratsiyasi ──────────────────────────────────────────────────
const ACCENT = {
  incoming: "#5B9BD5",
  pending:  "#F5C96A",
  outgoing: "#6DC5A0",
} as const;

function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Tip aniqlamalari ───────────────────────────────────────────────────────
type BasketKey = "incoming" | "pending" | "outgoing" | "archived";

interface BasketItem {
  id: number;
  subject: string;
  from: string;
  time: string;
  overdue?: boolean;
  basket: BasketKey;
}

interface ColAction {
  label: string;
  target: BasketKey;
  testPrefix: string;
}

const INITIAL_ITEMS: BasketItem[] = [
  { id: 1, subject: "Yangi shartnoma loyhasi",     from: "Sardor T.",  time: "09:15",       overdue: false, basket: "incoming" },
  { id: 2, subject: "Moliyaviy hisobot so'rovi",   from: "Nilufar R.", time: "Kecha 17:30", overdue: true,  basket: "incoming" },
  { id: 3, subject: "QC tekshirish natijasi",      from: "Bobur X.",   time: "03.04",       overdue: false, basket: "pending"  },
  { id: 4, subject: "Yangi uskunalar buyurtma",    from: "Jasur K.",   time: "05.04",       overdue: false, basket: "outgoing" },
  { id: 5, subject: "HR bo'limiga hisobot",        from: "Lola Y.",    time: "07.04",       overdue: false, basket: "outgoing" },
];

// ── Savat ustuni ───────────────────────────────────────────────────────────
function BasketColumn({
  columnKey, title, icon: Icon, items, actions, onMove, emptyLabel,
}: {
  columnKey: BasketKey;
  title: string;
  icon: React.ElementType;
  items: BasketItem[];
  actions: ColAction[];
  onMove: (id: number, to: BasketKey) => void;
  emptyLabel: string;
}) {
  const accent = ACCENT[columnKey as keyof typeof ACCENT] ?? ACCENT.incoming;

  return (
    <div
      style={{
        flex: 1, minWidth: 0,
        background: "#FFFFFF", borderRadius: 18,
        padding: "0 0 10px",
        boxShadow: COL_SHADOW,
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Rangli chiziq */}
      <div style={{
        height: 4, borderRadius: "18px 18px 0 0",
        background: `linear-gradient(to right, ${accent}, ${hexToRgba(accent, 0.20)})`,
      }} />

      {/* Sarlavha */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px 8px" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: hexToRgba(accent, 0.13),
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon style={{ width: 14, height: 14, color: accent }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#2D3748", textTransform: "uppercase", letterSpacing: "0.04em", flex: 1, minWidth: 0 }}>
          {title}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: accent,
          background: hexToRgba(accent, 0.13),
          padding: "2px 7px", borderRadius: 7, flexShrink: 0,
        }}>
          {items.length}
        </span>
      </div>

      {/* Kartalar */}
      <div style={{ flex: 1, padding: "0 10px" }}>
        {items.length === 0 ? (
          <div style={{
            minHeight: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1.5px dashed ${hexToRgba(accent, 0.35)}`,
            borderRadius: 10, color: "#A0AEC0", fontSize: 11,
          }}>
            {emptyLabel}
          </div>
        ) : items.map(item => (
          <div
            key={item.id}
            data-testid={`basket-item-${item.id}`}
            style={{
              background: "#FFFFFF", borderRadius: 12,
              padding: "10px 12px", marginBottom: 8,
              boxShadow: item.overdue
                ? `${CARD_SHADOW}, 0 0 0 1.5px rgba(240,128,128,0.40)`
                : CARD_SHADOW,
              transition: "box-shadow 0.18s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = CARD_SHADOW_H}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = item.overdue
              ? `${CARD_SHADOW}, 0 0 0 1.5px rgba(240,128,128,0.40)` : CARD_SHADOW}
          >
            {/* Sarlavha */}
            <p style={{ fontSize: 12, fontWeight: 600, color: "#2D3748", marginBottom: 4, lineHeight: 1.4 }}>
              {item.subject}
            </p>

            {/* Kimdan + vaqt */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 10, color: "#A0AEC0" }}>{item.from}</span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: item.overdue ? "#C05050" : "#A0AEC0",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                {item.overdue && <AlertCircle style={{ width: 9, height: 9 }} />}
                {item.time}
              </span>
            </div>

            {/* Harakat tugmalari */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {actions.map(a => {
                const btnAccent = a.target === "archived"
                  ? ACCENT.outgoing
                  : (ACCENT[a.target as keyof typeof ACCENT] ?? accent);
                return (
                  <button
                    key={a.target}
                    data-testid={`${a.testPrefix}-${item.id}`}
                    onClick={() => onMove(item.id, a.target)}
                    style={{
                      fontSize: 10, fontWeight: 600,
                      padding: "3px 9px", borderRadius: 7,
                      border: "none", cursor: "pointer",
                      background: hexToRgba(btnAccent, 0.10),
                      color: btnAccent,
                      boxShadow: BTN_SHADOW,
                      transition: "background 0.15s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = hexToRgba(btnAccent, 0.22)}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = hexToRgba(btnAccent, 0.10)}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Asosiy komponent ───────────────────────────────────────────────────────
interface ThreeBasketsProps {
  t: KanbanTranslations;
}

export function ThreeBasketsPanel({ t }: ThreeBasketsProps) {
  const [items, setItems]       = useState<BasketItem[]>(INITIAL_ITEMS);
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();

  function moveItem(id: number, to: BasketKey) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, basket: to } : it));
    const labelMap: Record<BasketKey, string> = {
      incoming: t.baskets.incoming,
      pending:  t.baskets.pending,
      outgoing: t.baskets.outgoing,
      archived: t.baskets.archive,
    };
    toast({ title: `✓ ${labelMap[to]}` });
  }

  const visible      = items.filter(it => it.basket !== "archived");
  const byKey        = (k: BasketKey) => visible.filter(it => it.basket === k);
  const overdueCount = byKey("incoming").filter(it => it.overdue).length;

  type ColDef = {
    key: "incoming" | "pending" | "outgoing";
    icon: React.ElementType;
    actions: ColAction[];
  };

  const cols: ColDef[] = [
    {
      key: "incoming", icon: Inbox,
      actions: [
        { label: t.baskets.moveToPending,  target: "pending",  testPrefix: "move-to-pending"  },
        { label: t.baskets.moveToOutgoing, target: "outgoing", testPrefix: "move-to-outgoing" },
      ],
    },
    {
      key: "pending", icon: Clock,
      actions: [
        { label: t.baskets.moveToIncoming, target: "incoming", testPrefix: "move-to-incoming" },
        { label: t.baskets.moveToOutgoing, target: "outgoing", testPrefix: "move-to-outgoing" },
      ],
    },
    {
      key: "outgoing", icon: Send,
      actions: [
        { label: `${t.baskets.archive} ✓`, target: "archived", testPrefix: "archive" },
      ],
    },
  ];

  const titles: Record<string, string> = {
    incoming: t.baskets.incoming,
    pending:  t.baskets.pending,
    outgoing: t.baskets.outgoing,
  };

  return (
    <div
      data-testid="card-three-baskets"
      style={{
        margin:       "12px 16px 16px",
        background:   "#FFFFFF",
        borderRadius: 20,
        boxShadow:    PANEL_SHADOW,
        flexShrink:   0,
        overflow:     "hidden",
      }}
    >
      {/* ── Panel sarlavhasi (bosiladigan) ────────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "12px 18px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{
          width: 4, height: 20, borderRadius: 4,
          background: "var(--ep-primary)", flexShrink: 0,
        }} />

        <Inbox style={{ width: 16, height: 16, color: "#5B9BD5", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2D3748", flex: 1 }}>
          {t.baskets.title}
        </span>

        {/* Sanoq badgelari */}
        {(["incoming","pending","outgoing"] as const).map(k => (
          <span key={k} style={{
            fontSize: 10, fontWeight: 700,
            color: ACCENT[k], background: hexToRgba(ACCENT[k], 0.12),
            padding: "1px 7px", borderRadius: 6,
          }}>
            {byKey(k).length}
          </span>
        ))}

        {/* Kechikkan ogohlantirish */}
        {overdueCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#C05050",
            background: "rgba(240,128,128,0.12)",
            padding: "2px 8px", borderRadius: 6,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <AlertCircle style={{ width: 9, height: 9 }} />
            {overdueCount} {t.baskets.overdueLabel}
          </span>
        )}

        <span style={{ fontSize: 10, color: "#A0AEC0", marginLeft: 4, whiteSpace: "nowrap" }}>
          {t.baskets.incoming} → {t.baskets.pending} → {t.baskets.outgoing}
        </span>

        {collapsed
          ? <ChevronDown style={{ width: 15, height: 15, color: "#A0AEC0", flexShrink: 0 }} />
          : <ChevronUp   style={{ width: 15, height: 15, color: "#A0AEC0", flexShrink: 0 }} />}
      </button>

      {/* ── Panel kontenti ────────────────────────────────────── */}
      {!collapsed && (
        <>
          <div style={{ height: 1, background: "rgba(163,177,198,0.15)", margin: "0 16px" }} />

          <div style={{ display: "flex", gap: 10, padding: "12px 14px 0" }}>
            {cols.map(col => (
              <BasketColumn
                key={col.key}
                columnKey={col.key}
                title={titles[col.key]}
                icon={col.icon}
                items={byKey(col.key)}
                actions={col.actions}
                onMove={moveItem}
                emptyLabel={t.baskets.empty}
              />
            ))}
          </div>

          {/* 24h qoidasi */}
          <p style={{
            fontSize: 10, color: "#A0AEC0",
            textAlign: "center", padding: "10px 16px 14px",
          }}>
            {t.baskets.rule24h}
            {overdueCount > 0 && (
              <span style={{ color: "#C05050", fontWeight: 600, marginLeft: 4 }}>
                · {t.baskets.overdueLabel} ({overdueCount}+)
              </span>
            )}
          </p>
        </>
      )}
    </div>
  );
}
