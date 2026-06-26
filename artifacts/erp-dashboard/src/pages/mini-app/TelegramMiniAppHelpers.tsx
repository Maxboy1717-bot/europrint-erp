/** @module TelegramMiniAppHelpers @description Shared UI helper components for the Telegram Mini App: AppLayout, StatusBadge, EmptyState, LoadingSpinner, NavBtn. */

import React from "react";
import type { Screen, User, AppColors } from "./TelegramMiniAppTypes";
import { STATUS_LABELS, STATUS_COLORS } from "./TelegramMiniAppTypes";

// ─── AppLayout ────────────────────────────────────────────────────────────────

interface AppLayoutProps {
  children: React.ReactNode;
  screen: Screen;
  onBack?: () => void;
  title: string;
  colors: AppColors;
  isDark: boolean;
  user: User | null;
}

export function AppLayout({
  children,
  onBack,
  title,
  colors,
  isDark,
  user,
}: AppLayoutProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          borderBottom: `1px solid var(--ep-border)`,
          position: "sticky",
          top: 0,
          background: colors.bg,
          zIndex: 100,
        }}
      >
        {onBack && (
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              color: colors.text,
              fontSize: 18,
            }}
            onClick={onBack}
          >
            ←
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{title}</div>
          {user && (
            <div style={{ fontSize: 11, color: "var(--ep-muted)", marginTop: 1 }}>
              {user.firstName} {user.lastName} · {user.departmentName || user.departmentCode}
            </div>
          )}
        </div>
        <div style={{ fontSize: 22 }}>📦</div>
      </div>
      <div style={{ paddingTop: 4 }}>{children}</div>
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        background: `${STATUS_COLORS[status] || "#6b7280"}22`,
        color: STATUS_COLORS[status] || "#6b7280",
      }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ color: "var(--ep-muted)", fontSize: 15 }}>{text}</div>
    </div>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

export function LoadingSpinner({
  color = "#3b82f6",
  size = 24,
}: {
  color?: string;
  size?: number;
}) {
  const border = Math.max(2, size / 8);
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${border}px solid ${color}33`,
        borderTop: `${border}px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

// ─── NavBtn ───────────────────────────────────────────────────────────────────

interface NavBtnProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
  hint: string;
  text: string;
}

export function NavBtn({ icon, label, active, onClick, color, hint }: NavBtnProps) {
  return (
    <button
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px 12px",
        color: active ? color : hint,
        transition: "color 0.15s",
      }}
      onClick={onClick}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
    </button>
  );
}
