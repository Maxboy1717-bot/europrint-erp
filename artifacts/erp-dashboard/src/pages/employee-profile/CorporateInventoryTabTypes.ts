/**
 * @module CorporateInventoryTabTypes
 * @description Types and constants for CorporateInventoryTab.
 */

import { Laptop, Smartphone, Shirt, Package, Monitor } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
export const DEVICE_TYPES = [
  { value: "phone",     label: "Telefon",      icon: Smartphone },
  { value: "laptop",    label: "Noutbuk",      icon: Laptop },
  { value: "tablet",    label: "Planshet",     icon: Monitor },
  { value: "uniform",   label: "Forma kiyim",  icon: Shirt },
  { value: "equipment", label: tLabel('common.CorporateInventoryTab.jihozlar', "Jihozlar"),     icon: Package },
  { value: "other",     label: "Boshqa",       icon: Package },
] as const;

export const CONDITIONS = [
  { value: "new",     label: tLabel('common.CorporateInventoryTab.yangi', "Yangi") },
  { value: "good",    label: "Yaxshi" },
  { value: "fair",    label: tLabel('common.CorporateInventoryTab.ortacha', "O'rtacha") },
  { value: "damaged", label: "Shikastlangan" },
] as const;

export const CONDITION_COLORS: Record<string, string> = {
  new:     "bg-blue-100 text-blue-800",
  good:    "bg-green-100 text-green-800",
  fair:    "bg-yellow-100 text-yellow-800",
  damaged: "bg-red-100 text-red-800",
};

export interface CorporateInventoryItem {
  id: number;
  userId: string;
  deviceName: string;
  deviceType: string;
  deviceTypeLabel: string;
  serialNumber: string;
  brand: string;
  condition: string;
  conditionLabel: string;
  issuedDate: string;
  returnedDate?: string | null;
  notes: string;
  employeeSignedAt?: string | null;
  returnChecked: boolean;
  createdAt: string;
}

export interface CorporateInventoryTabProps {
  employeeId: string;
  isHr: boolean;
}

export interface InventoryFormState {
  deviceName: string;
  deviceType: string;
  serialNumber: string;
  brand: string;
  condition: string;
  issuedDate: string;
  notes: string;
}

export const INITIAL_INVENTORY_FORM: InventoryFormState = {
  deviceName: "",
  deviceType: "laptop",
  serialNumber: "",
  brand: "",
  condition: "good",
  issuedDate: "",
  notes: "",
};
