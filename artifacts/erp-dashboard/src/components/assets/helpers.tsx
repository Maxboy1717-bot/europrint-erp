/**
 * @module helpers
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Laptop, Car, Building2, Armchair, HardDrive } from "lucide-react";

export const assetTypeLabels: Record<string, string> = {
  equipment: "assetTypeEquipment",
  vehicle: "assetTypeVehicle",
  building: "assetTypeBuilding",
  furniture: "assetTypeFurniture",
  it_equipment: "assetTypeIT",
};

export const conditionLabels: Record<string, string> = {
  excellent: "conditionExcellent",
  good: "conditionGood",
  fair: "conditionFair",
  poor: "conditionPoor",
};

export const assetStatusLabels: Record<string, string> = {
  active: "assetStatusActive",
  disposed: "assetStatusDisposed",
  under_repair: "assetStatusUnderRepair",
};

export const maintenanceTypeLabels: Record<string, string> = {
  preventive: "maintTypePreventive",
  corrective: "maintTypeCorrective",
  predictive: "maintTypePredictive",
  emergency: "maintTypeEmergency",
};

export const maintenanceStatusLabels: Record<string, string> = {
  scheduled: "maintStatusScheduled",
  in_progress: "maintStatusInProgress",
  completed: "maintStatusCompleted",
  cancelled: "maintStatusCancelled",
};

export const disposalMethodLabels: Record<string, string> = {
  write_off: "disposalWriteOff",
  sale: "disposalSale",
  donation: "disposalDonation",
  scrap: "disposalScrap",
};

export const depreciationMethodLabels: Record<string, string> = {
  straight_line: "depMethodStraightLine",
  declining_balance: "depMethodDeclining",
};

export type TFn = (key: string) => string;

export function getAssetTypeIcon(type: string) {
  switch (type) {
    case "it_equipment": return <Laptop className="h-4 w-4 text-[var(--ep-blue)]" />;
    case "vehicle": return <Car className="h-4 w-4 text-[var(--ep-green)]" />;
    case "building": return <Building2 className="h-4 w-4 text-[var(--ep-purple)]" />;
    case "furniture": return <Armchair className="h-4 w-4 text-[var(--ep-yellow)]" />;
    default: return <HardDrive className="h-4 w-4 text-muted-foreground" />;
  }
}

export function getConditionBadge(condition: string, t: TFn) {
  switch (condition) {
    case "excellent": return <Badge variant="outline" className="bg-green-500/20 text-[var(--ep-green)] border-green-500/40">{t(conditionLabels[condition])}</Badge>;
    case "good": return <Badge variant="outline" className="bg-blue-500/20 text-[var(--ep-blue)] border-blue-500/40">{t(conditionLabels[condition])}</Badge>;
    case "fair": return <Badge variant="outline" className="bg-amber-500/20 text-[var(--ep-yellow)] border-amber-500/40">{t(conditionLabels[condition])}</Badge>;
    case "poor": return <Badge variant="outline" className="bg-red-500/20 text-[var(--ep-red)] border-red-500/40">{t(conditionLabels[condition])}</Badge>;
    default: return <Badge variant="outline">{condition}</Badge>;
  }
}

export function getAssetStatusBadge(status: string, t: TFn) {
  switch (status) {
    case "active": return <Badge variant="outline" className="bg-green-500/20 text-[var(--ep-green)] border-green-500/40">{t(assetStatusLabels[status])}</Badge>;
    case "disposed": return <Badge variant="outline" className="bg-gray-500/20 text-muted-foreground border-gray-500/40">{t(assetStatusLabels[status])}</Badge>;
    case "under_repair": return <Badge variant="outline" className="bg-amber-500/20 text-[var(--ep-yellow)] border-amber-500/40">{t(assetStatusLabels[status])}</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export function getMaintenanceStatusBadge(status: string, t: TFn) {
  switch (status) {
    case "scheduled": return <Badge variant="outline" className="bg-blue-500/20 text-[var(--ep-blue)] border-blue-500/40">{t(maintenanceStatusLabels[status])}</Badge>;
    case "in_progress": return <Badge variant="outline" className="bg-amber-500/20 text-[var(--ep-yellow)] border-amber-500/40">{t(maintenanceStatusLabels[status])}</Badge>;
    case "completed": return <Badge variant="outline" className="bg-green-500/20 text-[var(--ep-green)] border-green-500/40">{t(maintenanceStatusLabels[status])}</Badge>;
    case "cancelled": return <Badge variant="outline" className="bg-gray-500/20 text-muted-foreground border-gray-500/40">{t(maintenanceStatusLabels[status])}</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}
