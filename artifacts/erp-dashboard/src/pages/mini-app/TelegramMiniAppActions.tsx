/** @module TelegramMiniAppActions @description Action-oriented screen components for the Telegram Mini App: ApprovalDetailScreen (manager approve/reject) and RequestScreen (cart submission). */

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import type {
  Screen,
  User,
  AppColors,
  PendingApproval,
  RequestItem,
} from "./TelegramMiniAppTypes";
import { PRIORITY_COLORS } from "./TelegramMiniAppTypes";
import { AppLayout, StatusBadge, EmptyState, LoadingSpinner } from "./TelegramMiniAppHelpers";

// ─── Shared style factories ───────────────────────────────────────────────────

function makeCardStyle(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? "#1f2937" : "#f9fafb",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 10,
  };
}

function makeBtnStyle(
  variant: "primary" | "danger" | "secondary",
  colors: AppColors,
  isDark: boolean,
): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    width: "100%",
    background:
      variant === "primary"
        ? colors.button
        : variant === "danger"
          ? "#ef4444"
          : isDark
            ? "#374151"
            : "#e5e7eb",
    color:
      variant === "primary" ? colors.buttonText : variant === "danger" ? "#fff" : colors.text,
  };
}

function makeInputStyle(colors: AppColors, isDark: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1.5px solid ${isDark ? "#374151" : "#d1d5db"}`,
    background: isDark ? "#111827" : "#fff",
    color: colors.text,
    fontSize: 14,
    boxSizing: "border-box",
  };
}

// ─── ApprovalDetailScreen ─────────────────────────────────────────────────────

export interface ApprovalDetailScreenProps {
  screen: Screen;
  colors: AppColors;
  isDark: boolean;
  user: User | null;
  approval: PendingApproval;
  rejectReason: string;
  showRejectInput: boolean;
  onRejectReasonChange: (v: string) => void;
  onShowRejectInput: (v: boolean) => void;
  onBack: () => void;
  approveMutation: UseMutationResult<unknown, Error, number>;
  rejectMutation: UseMutationResult<unknown, Error, { id: number; reason: string }>;
}

export function ApprovalDetailScreen({
  screen,
  colors,
  isDark,
  user,
  approval,
  rejectReason,
  showRejectInput,
  onRejectReasonChange,
  onShowRejectInput,
  onBack,
  approveMutation,
  rejectMutation,
}: ApprovalDetailScreenProps) {
  const cardStyle = makeCardStyle(isDark);
  const btnStyle = (v: "primary" | "danger" | "secondary") => makeBtnStyle(v, colors, isDark);
  const inputStyle = makeInputStyle(colors, isDark);

  return (
    <AppLayout
      screen={screen}
      onBack={onBack}
      title="So'rov tafsiloti"
      colors={colors}
      isDark={isDark}
      user={user}
    >
      <div style={{ padding: "0 16px 100px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{approval.requestNumber}</span>
            <StatusBadge status={approval.status} />
          </div>
          <div style={{ color: colors.hint, fontSize: 12, marginBottom: 4 }}>
            {approval.requestedByName} · {approval.departmentCode}
          </div>
          <div style={{ color: colors.hint, fontSize: 12 }}>
            {new Date(approval.createdAt).toLocaleString("uz-UZ")}
          </div>
          {approval.priority !== "normal" && (
            <div style={{ marginTop: 8, fontWeight: 600, color: PRIORITY_COLORS[approval.priority] ?? "#888", fontSize: 12 }}>
              ⚡ {approval.priority.toUpperCase()} ustuvorlik
            </div>
          )}
        </div>

        <h3 style={{ margin: "16px 0 8px", fontSize: 15, fontWeight: 600 }}>Materiallar</h3>
        {(Array.isArray(approval.lines) ? approval.lines : []).map((line, i) => (
          <div key={`line-${i}`} style={cardStyle}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{line.name}</div>
            {line.nameRu && (
              <div style={{ fontSize: 12, color: colors.hint, marginBottom: 4 }}>{line.nameRu}</div>
            )}
            <div style={{ fontSize: 13, color: colors.hint }}>
              {line.requestedQty} {line.unit}
            </div>
          </div>
        ))}

        {showRejectInput ? (
          <div style={{ marginTop: 16 }}>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: "none" } as React.CSSProperties}
              placeholder="Rad etish sababi..."
              value={rejectReason}
              onChange={(e) => onRejectReasonChange(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={{ ...btnStyle("secondary"), flex: 1 }} onClick={() => onShowRejectInput(false)}>Bekor</button>
              <button
                style={{ ...btnStyle("danger"), flex: 1 }}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: approval.id, reason: rejectReason })}
              >
                {rejectMutation.isPending ? "..." : "Rad et"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: colors.bg, borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb"}` }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...btnStyle("danger"), flex: 1 }} onClick={() => onShowRejectInput(true)}>❌ Rad etish</button>
              <button
                style={{ ...btnStyle("primary"), flex: 1 }}
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(approval.id)}
              >
                {approveMutation.isPending ? "..." : "✅ Tasdiqlash"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ─── RequestScreen ────────────────────────────────────────────────────────────

export interface RequestScreenProps {
  screen: Screen;
  colors: AppColors;
  isDark: boolean;
  user: User | null;
  cartItems: RequestItem[];
  requestNotes: string;
  onNotesChange: (v: string) => void;
  onRemoveItem: (materialId: number) => void;
  onQtyChange: (materialId: number, delta: number) => void;
  onSubmit: () => void;
  isPending: boolean;
  onBack: () => void;
}

export function RequestScreen({
  screen,
  colors,
  isDark,
  user,
  cartItems,
  requestNotes,
  onNotesChange,
  onRemoveItem,
  onQtyChange,
  onSubmit,
  isPending,
  onBack,
}: RequestScreenProps) {
  const cardStyle = makeCardStyle(isDark);
  const btnStyle = (v: "primary" | "danger" | "secondary") => makeBtnStyle(v, colors, isDark);
  const inputStyle = makeInputStyle(colors, isDark);

  return (
    <AppLayout
      screen={screen}
      onBack={onBack}
      title="Material so'rov"
      colors={colors}
      isDark={isDark}
      user={user}
    >
      <div style={{ padding: "0 16px 120px" }}>
        {cartItems.length === 0 ? (
          <EmptyState icon="📦" text="So'rov uchun barcode skanerlang" />
        ) : (
          <>
            {(Array.isArray(cartItems) ? cartItems : []).map((item) => (
              <div key={item.materialId} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                    {item.nameRu && <div style={{ fontSize: 12, color: colors.hint }}>{item.nameRu}</div>}
                  </div>
                  <button
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 18, padding: 0 }}
                    onClick={() => onRemoveItem(item.materialId)}
                  >✕</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <button
                    style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${isDark ? "#374151" : "#d1d5db"}`, background: "none", cursor: "pointer", color: colors.text, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => onQtyChange(item.materialId, -1)}
                  >−</button>
                  <span style={{ fontWeight: 700, minWidth: 30, textAlign: "center" }}>{item.qty}</span>
                  <button
                    style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${isDark ? "#374151" : "#d1d5db"}`, background: "none", cursor: "pointer", color: colors.text, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => onQtyChange(item.materialId, 1)}
                  >+</button>
                  <span style={{ color: colors.hint, fontSize: 13 }}>{item.unit}</span>
                </div>
              </div>
            ))}
            <textarea
              style={{ ...inputStyle, minHeight: 70, resize: "none", marginTop: 8 } as React.CSSProperties}
              placeholder="Izoh (ixtiyoriy)..."
              value={requestNotes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </>
        )}
      </div>

      {cartItems.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: colors.bg, borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb"}` }}>
          <button style={btnStyle("primary")} disabled={isPending} onClick={onSubmit}>
            {isPending ? <LoadingSpinner color={colors.buttonText} size={16} /> : "📤"}
            {isPending ? " Yuborilmoqda..." : ` So'rov yuborish (${cartItems.length} ta material)`}
          </button>
        </div>
      )}
    </AppLayout>
  );
}
