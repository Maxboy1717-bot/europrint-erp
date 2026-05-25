/** @module TelegramMiniAppScreens @description Read-only screen components for the Telegram Mini App: HistoryScreen and ApprovalsScreen. Action screens (ApprovalDetail, Request) live in TelegramMiniAppActions. */

import React from "react";
import type {
  Screen,
  User,
  AppColors,
  HistoryItem,
  PendingApproval,
} from "./TelegramMiniAppTypes";
import { PRIORITY_COLORS } from "./TelegramMiniAppTypes";
import { AppLayout, StatusBadge, EmptyState } from "./TelegramMiniAppHelpers";
import { useTranslation } from '@/lib/i18n';

// Re-export action screens so callers only need one import path
export { ApprovalDetailScreen, RequestScreen } from "./TelegramMiniAppActions";
export type { ApprovalDetailScreenProps, RequestScreenProps } from "./TelegramMiniAppActions";

// ─── Shared style factory ─────────────────────────────────────────────────────

function makeCardStyle(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? "#1f2937" : "#f9fafb",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 10,
  };
}

// ─── HistoryScreen ────────────────────────────────────────────────────────────

interface HistoryScreenProps {
  screen: Screen;
  colors: AppColors;
  isDark: boolean;
  user: User | null;
  historyItems: HistoryItem[];
  onBack: () => void;
}

export function HistoryScreen({
  screen,
  colors,
  isDark,
  user,
  historyItems,
  onBack,
}: HistoryScreenProps) {
  const { t } = useTranslation("common");
  const cardStyle = makeCardStyle(isDark);

  return (
    <AppLayout
      screen={screen}
      onBack={onBack}
      title={t("harakatlarTarixi")}
      colors={colors}
      isDark={isDark}
      user={user}
    >
      <div style={{ padding: "0 16px 16px" }}>
        {historyItems.length === 0 ? (
          <EmptyState icon="📋" text="Harakatlar yo'q" />
        ) : (
          (Array.isArray(historyItems) ? historyItems : []).map((item) => (
            <div key={item.id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontWeight: 700 }}>{item.requestNumber}</span>
                <StatusBadge status={item.status} />
              </div>
              <div style={{ fontSize: 12, color: colors.hint, marginBottom: 4 }}>
                {new Date(item.createdAt).toLocaleString("uz-UZ")}
              </div>
              {(Array.isArray(item.lines) ? item.lines : []).slice(0, 2).map((l, i) => (
                <div key={`line-${i}`} style={{ fontSize: 13, marginTop: 2 }}>
                  {l.name} — {l.requestedQty} {l.unit}
                  {l.issuedQty ? ` (berildi: ${l.issuedQty})` : ""}
                </div>
              ))}
              {(Array.isArray(item.lines) ? item.lines : []).length > 2 && (
                <div style={{ fontSize: 12, color: colors.hint }}>
                  +{item.lines.length - 2} ta boshqa...
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}

// ─── ApprovalsScreen ──────────────────────────────────────────────────────────

interface ApprovalsScreenProps {
  screen: Screen;
  colors: AppColors;
  isDark: boolean;
  user: User | null;
  pendingApprovals: PendingApproval[];
  onBack: () => void;
  onSelect: (a: PendingApproval) => void;
}

export function ApprovalsScreen({
  screen,
  colors,
  isDark,
  user,
  pendingApprovals,
  onBack,
  onSelect,
}: ApprovalsScreenProps) {
  const { t } = useTranslation("common");
  const cardStyle = makeCardStyle(isDark);

  return (
    <AppLayout
      screen={screen}
      onBack={onBack}
      title={t("kutilayotganSorovlar")}
      colors={colors}
      isDark={isDark}
      user={user}
    >
      <div style={{ padding: "0 16px 16px" }}>
        {pendingApprovals.length === 0 ? (
          <EmptyState icon="✅" text="Kutilayotgan so'rov yo'q" />
        ) : (
          (Array.isArray(pendingApprovals) ? pendingApprovals : []).map((a) => (
            <button
              key={a.id}
              style={{
                ...cardStyle,
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                display: "block",
              }}
              onClick={() => onSelect(a)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 15 }}>{a.requestNumber}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: PRIORITY_COLORS[a.priority] ?? "#888",
                  }}
                >
                  {a.priority !== "normal" ? "⚡ " : ""}
                  {a.priority?.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 13, color: colors.hint, marginBottom: 4 }}>
                👤 {a.requestedByName} · {a.departmentCode}
              </div>
              <div style={{ fontSize: 12, color: colors.hint }}>
                📦 {(Array.isArray(a.lines) ? a.lines : []).length} ta material ·{" "}
                {new Date(a.createdAt).toLocaleDateString("uz-UZ")}
              </div>
            </button>
          ))
        )}
      </div>
    </AppLayout>
  );
}
