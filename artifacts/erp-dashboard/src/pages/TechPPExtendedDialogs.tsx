/**
 * TechPPExtendedDialogs.tsx
 * Shared small UI primitives used across TechPPExtended tab panels.
 * (No modal dialogs exist in this page — this file provides reusable
 * micro-components that would otherwise clutter the main file.)
 */
import { Card, CardContent } from "@/components/ui/card";

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}
export function StatCard({ label, value, sub, color = "text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-sm font-medium mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  message?: string;
}
export function EmptyState({ message = "Ma'lumot kiritilmagan" }: EmptyStateProps) {
  return (
    <div className="text-center py-10 text-muted-foreground text-sm">{message}</div>
  );
}
