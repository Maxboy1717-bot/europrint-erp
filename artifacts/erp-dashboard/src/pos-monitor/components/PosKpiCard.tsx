/**
 * Canonical POS-style KPI card — emoji icon, inline styles, no shadcn dependency.
 * Used across POS Monitor pages (PosMaterial360, PosKpiDashboard, etc.)
 *
 * Usage:
 *   import { PosKpiCard } from '@/pos-monitor/components/PosKpiCard';
 *   <PosKpiCard icon="📦" label="JAMI" value="142" />
 */

export interface PosKpiCardProps {
  icon: string;
  label: string;
  value: string;
  color?: string;
}

export function PosKpiCard({ icon, label, value, color }: PosKpiCardProps) {
  return (
    <div style={{ background: "#FFF", borderRadius: 12, padding: "12px 14px", border: "1px solid #E5E7EB" }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color ?? "#1F2937", marginTop: 2 }}>{value}</div>
    </div>
  );
}
