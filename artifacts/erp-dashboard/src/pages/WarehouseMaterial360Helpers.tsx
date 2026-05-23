/**
 * @module WarehouseMaterial360Helpers
 * @description KpiBox, Th, Td, Pill helper components for WarehouseMaterial360.
 * Extracted from WarehouseMaterial360.tsx (Rule 16).
 */

import type { ReactNode } from "react";

export function KpiBox({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-lg">{icon}</div>
      <div className="text-[10px] text-gray-500 mt-1 uppercase">{label}</div>
      <div className={`text-base font-bold mt-1 ${color ?? "text-gray-900"}`}>{value}</div>
    </div>
  );
}

export function Th({ children, align }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-3 py-2 text-${align ?? "left"} text-xs font-semibold text-gray-600 uppercase border-b border-gray-200`}>
      {children}
    </th>
  );
}

export function Td({ children, align, mono, colSpan, className }: {
  children: ReactNode; align?: "left" | "right"; mono?: boolean;
  colSpan?: number; className?: string;
}) {
  return (
    <td colSpan={colSpan} className={`px-3 py-2 text-${align ?? "left"} ${mono ? "font-mono" : ""} ${className ?? ""}`}>
      {children}
    </td>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="px-2 py-1 bg-blue-50 text-[var(--ep-blue)] rounded text-xs font-bold">
      {children}
    </span>
  );
}
