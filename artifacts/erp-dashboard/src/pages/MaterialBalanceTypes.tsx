/**
 * @module MaterialBalanceTypes
 * @description Shared TypeScript interfaces, API response shapes, and the
 * StatCard presentational component used across the Material Balance feature.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface Overview {
  totalMaterials: number;
  totalStockValue: number;
  lowStockAlerts: number;
  criticalStockCount: number;
}

export interface StockAlert {
  id: string;
  kod: string;
  xomAshyo: string;
  xomAshyoRu: string | null;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  unitOfMeasure: string;
  unitPrice: number | null;
  warehouseName: string | null;
  warehouseCode: string | null;
  severity: "critical" | "warning";
  deficit: number;
}

export interface AlertsResponse {
  success: boolean;
  data: StockAlert[];
  total: number;
  criticalCount: number;
  warningCount: number;
}

export interface InternalRequest {
  id: string;
  materialId: string;
  materialName: string;
  requestedBy: string;
  requesterName: string | null;
  quantity: number;
  unitOfMeasure: string;
  purpose: string | null;
  status: string;
  priority: string;
  requestedAt: string;
  approvedBy: string | null;
  approverName: string | null;
}

export interface InternalRequestsResponse {
  success: boolean;
  data: InternalRequest[];
  total: number;
}

export interface ProductionStock {
  materialId: string;
  kod: string;
  xomAshyo: string;
  currentStock: number;
  minStock: number;
  unitOfMeasure: string;
  unitPrice: number | null;
  warehouseName: string | null;
}

// ---------------------------------------------------------------------------
// MovementForm shape used by the dialog
// ---------------------------------------------------------------------------

export interface MovementForm {
  material: string;
  quantity: string;
  type: string;
}

// ---------------------------------------------------------------------------
// StatCard component
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  loading?: boolean;
  variant?: "default" | "warning" | "critical";
}

export function StatCard({ title, value, icon: Icon, loading, variant = "default" }: StatCardProps) {
  const colorClass =
    variant === "critical"
      ? "text-[var(--ep-red)] dark:text-red-400"
      : variant === "warning"
      ? "text-[var(--ep-yellow)] dark:text-yellow-400"
      : "text-foreground";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="p-2 rounded-md bg-muted">
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-20 mt-1 rounded-lg" />
          ) : (
            <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
