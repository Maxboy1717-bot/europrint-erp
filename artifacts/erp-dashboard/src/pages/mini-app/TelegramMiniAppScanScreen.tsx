/** @module TelegramMiniAppScanScreen @description Scan screen component for the Telegram Mini App: barcode input, camera mode, material search, scan result card, and bottom navigation bar. */

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import type { Screen, User, AppColors, MaterialResult, PendingApproval } from "./TelegramMiniAppTypes";
import { AppLayout, LoadingSpinner, NavBtn } from "./TelegramMiniAppHelpers";
import { useTranslation } from '@/lib/i18n';

interface ScanScreenProps {
  screen: Screen;
  colors: AppColors;
  isDark: boolean;
  user: User | null;

  // Warehouse selector
  warehouses: Array<{ id: string; name: string }>;
  selectedWarehouseId: string;
  onWarehouseChange: (id: string) => void;

  // Camera
  isCameraMode: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onStartCamera: () => void;
  onStopCamera: () => void;

  // Barcode input
  barcodeInput: string;
  onBarcodeChange: (v: string) => void;
  onBarcodeScan: () => void;

  // Search
  searchQuery: string;
  onSearchChange: (v: string) => void;
  searchResults: MaterialResult[];

  // Scan mutation
  scanMutation: UseMutationResult<unknown, Error, string>;
  scanResult: MaterialResult | null;
  onClearScanResult: () => void;
  onAddToCart: (m: MaterialResult) => void;

  // Navigation
  cartCount: number;
  pendingApprovals: PendingApproval[];
  isManager: boolean;
  onNav: (s: Screen) => void;
  onNavHistory: () => void;
  onNavApprovals: () => void;

  // Toast
  toast: { msg: string; type: "success" | "error" | "info" } | null;
}

export function ScanScreen({
  screen,
  colors,
  isDark,
  user,
  warehouses,
  selectedWarehouseId,
  onWarehouseChange,
  isCameraMode,
  videoRef,
  onStartCamera,
  onStopCamera,
  barcodeInput,
  onBarcodeChange,
  onBarcodeScan,
  searchQuery,
  onSearchChange,
  searchResults,
  scanMutation,
  scanResult,
  onClearScanResult,
  onAddToCart,
  cartCount,
  pendingApprovals,
  isManager,
  onNav,
  onNavHistory,
  onNavApprovals,
  toast,
}: ScanScreenProps) {
  const { t } = useTranslation("common");
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1.5px solid ${isDark ? "#374151" : "#d1d5db"}`,
    background: isDark ? "#111827" : "#fff",
    color: colors.text,
    fontSize: 14,
    boxSizing: "border-box",
  };

  const cardStyle: React.CSSProperties = {
    background: isDark ? "#1f2937" : "#f9fafb",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 10,
  };

  const secBtnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "12px 16px", borderRadius: 10, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: 14, width: "100%",
    background: isDark ? "#374151" : "#e5e7eb", color: colors.text,
  };

  return (
    <AppLayout screen={screen} title={t("posSkanerlash")} colors={colors} isDark={isDark} user={user}>
      <div style={{ padding: "0 16px 100px" }}>
        {warehouses.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <select
              style={{ ...inputStyle }}
              value={selectedWarehouseId}
              onChange={(e) => onWarehouseChange(e.target.value)}
            >
              <option value="">{t("barchaOmborlar")}</option>
              {(Array.isArray(warehouses) ? warehouses : []).map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        {isCameraMode ? (
          <div style={{ marginBottom: 12 }}>
            <video
              ref={videoRef}
              style={{ width: "100%", borderRadius: 12, aspectRatio: "4/3", objectFit: "cover", background: "#000" }}
            />
            <button style={{ ...secBtnStyle, marginTop: 8 }} onClick={onStopCamera}>
              {t("kameraniYopish")}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder={t("barcodeKiriting")}
                value={barcodeInput}
                onChange={(e) => onBarcodeChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && barcodeInput.trim()) onBarcodeScan(); }}
              />
              <button
                style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: colors.button, color: colors.buttonText, cursor: "pointer", fontWeight: 600 }}
                onClick={onBarcodeScan}
                disabled={!barcodeInput.trim() || scanMutation.isPending}
              >
                🔍
              </button>
            </div>
            <button style={{ ...secBtnStyle, marginBottom: 12 }} onClick={onStartCamera}>
              {t("kameraBilanSkanerlash")}
            </button>
          </>
        )}

        <input
          style={{ ...inputStyle, marginBottom: 8 }}
          placeholder={t("materialNomiBoyichaQidirish")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        {scanMutation.isPending && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <LoadingSpinner color={colors.button} />
          </div>
        )}

        {scanResult && !scanMutation.isPending && (
          <div style={{ ...cardStyle, border: `2px solid ${colors.button}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{scanResult.name}</div>
                {scanResult.nameRu && <div style={{ fontSize: 13, color: colors.hint }}>{scanResult.nameRu}</div>}
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: colors.hint, fontSize: 16 }} onClick={onClearScanResult}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: scanResult.stock > 0 ? "#059669" : "#dc2626" }}>
                📦 {scanResult.stock} {scanResult.unit}
              </span>
              <span style={{ color: colors.hint, fontFamily: "monospace" }}>#{scanResult.barcode}</span>
            </div>
            <button
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, width: "100%", background: colors.button, color: colors.buttonText }}
              onClick={() => { onAddToCart(scanResult); onClearScanResult(); onNav("request"); }}
            >
              {t("sorovgaQoshish")}
            </button>
          </div>
        )}

        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: colors.hint, marginBottom: 6 }}>{searchResults.length} ta material topildi</div>
            {(Array.isArray(searchResults) ? searchResults : []).map((m) => (
              <div key={m.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{m.name}</div>
                    {m.nameRu && <div style={{ fontSize: 12, color: colors.hint }}>{m.nameRu}</div>}
                    <div style={{ fontSize: 12, color: colors.hint, marginTop: 2 }}>📦 {m.stock} {m.unit} · #{m.barcode}</div>
                  </div>
                  <button
                    style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: colors.button, color: colors.buttonText, cursor: "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                    onClick={() => { onAddToCart(m); onSearchChange(""); }}
                  >
                    {t("qoshish1")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && (
          <div style={{ textAlign: "center", padding: 20, color: colors.hint, fontSize: 14 }}>
            {t("materialTopilmadi1")}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: colors.bg, borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`, display: "flex", justifyContent: "space-around", padding: "8px 0 max(8px, env(safe-area-inset-bottom))" }}>
        <NavBtn icon="📷" label={t("skan")} active={screen === "scan"} onClick={() => onNav("scan")} color={colors.button} hint={colors.hint} text={colors.text} />
        <NavBtn icon={`📤${cartCount > 0 ? ` (${cartCount})` : ""}`} label={t("sorov")} active={screen === "request"} onClick={() => onNav("request")} color={colors.button} hint={colors.hint} text={colors.text} />
        <NavBtn icon="📋" label={t("tarix")} active={screen === "history"} onClick={onNavHistory} color={colors.button} hint={colors.hint} text={colors.text} />
        {isManager && (
          <NavBtn
            icon={`✅${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ""}`}
            label={t("verify")}
            active={screen === "approvals"}
            onClick={onNavApprovals}
            color={colors.button} hint={colors.hint} text={colors.text}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 16, left: 16, right: 16, zIndex: 9999, padding: "12px 16px", borderRadius: 10, background: toast.type === "success" ? "#059669" : toast.type === "error" ? "#dc2626" : "#2563eb", color: "#fff", fontWeight: 600, fontSize: 14, textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}
    </AppLayout>
  );
}
