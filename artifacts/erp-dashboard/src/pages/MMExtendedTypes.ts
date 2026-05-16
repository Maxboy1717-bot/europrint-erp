/**
 * @module MMExtendedTypes
 * @description TypeScript interfaces, Zod schemas, type aliases, and constants
 * for the Materials Management Extended page.
 */

import { z } from "zod";
import type { LucideIcon } from "lucide-react";
import {
  Bot, DollarSign, Building2, Truck, Map, MapPin, Gauge, Users, Calendar,
} from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface MMVendor {
  id: number | string;
  name?: string;
  code?: string;
  status?: string;
  rating?: number | string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  category?: string;
  paymentTerms?: number | string;
  country?: string;
}

export interface PurchaseOrder {
  id: number | string;
  poNumber?: string;
  orderNumber?: string;
  vendorId?: number | string;
  vendorName?: string;
  status?: string;
  totalAmount?: number | string;
  createdAt?: string;
  orderDate?: string;
  deliveryDate?: string;
  expectedDate?: string;
  currency?: string;
}

export interface GoodsReceipt {
  id: number | string;
  receiptNumber?: string;
  poNumber?: string;
  vendorId?: number | string;
  vendorName?: string;
  status?: string;
  totalAmount?: number | string;
  receiptDate?: string;
  receivedAt?: string;
  createdAt?: string;
}

export interface MMRequisition {
  id: number | string;
  description?: string;
  status?: string;
  quantity?: number | string;
}

export interface MMVehicle {
  id: number | string;
  plateNumber?: string;
  model?: string;
  type?: string;
  status?: string;
  driverId?: number | string;
  driverName?: string;
  driverPhone?: string;
  fuelLevel?: number | string;
  mileage?: number | string;
  insuranceExpiry?: string;
  nextServiceDate?: string;
  lastServiceDate?: string;
  year?: number | string;
}

export interface MMDelivery {
  id: number | string;
  orderNo?: string;
  orderId?: string;
  customerName?: string;
  address?: string;
  vehicleId?: number | string;
  plateNumber?: string;
  driverName?: string;
  status?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  weight?: number | string;
  cost?: number | string;
  distance?: number | string;
  createdAt?: string;
}

export interface MMFuelLog {
  id: number | string;
  vehicleId?: number | string;
  plateNumber?: string;
  liters?: number | string;
  costPerLiter?: number | string;
  totalCost?: number | string;
  mileage?: number | string;
  date?: string;
  createdAt?: string;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const VendorSchema = z.object({
  name: z.string().min(1),
  vendorCode: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  paymentTerms: z.string().min(1),
});

export type VendorFormValues = z.infer<typeof VendorSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

export const URL_TAB_MAP: Record<string, string> = {
  "/mm/check-bot": "checkbot",
  "/mm/creditor-debts": "creditor",
  "/mm/supplier-portal": "portal",
  "/logistics/transport": "transport",
  "/logistics/route-planning": "routes",
  "/logistics/gps": "gps",
  "/logistics/fuel": "fuel",
  "/logistics/drivers": "drivers",
  "/logistics/vehicle-schedule": "schedule",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "checkbot":  { title: "Chek Bot",           icon: Bot },
  "creditor":  { title: tLabel('common.MMExtended.kreditorQarzlar', "Kreditor Qarzlar"),   icon: DollarSign },
  "portal":    { title: "Supplier Portal",    icon: Building2 },
  "transport": { title: "Transport Parki",    icon: Truck },
  "routes":    { title: tLabel('common.MMExtended.marshrutRejasi', "Marshrut Rejasi"),    icon: Map },
  "gps":       { title: "GPS Monitoring",     icon: MapPin },
  "fuel":      { title: "Yoqilg'i Nazorat",  icon: Gauge },
  "drivers":   { title: tLabel('common.MMExtended.haydovchilar', "Haydovchilar"),       icon: Users },
  "schedule":  { title: "Transport Jadvali", icon: Calendar },
};

// ─── Utility functions ────────────────────────────────────────────────────────

export function fmtMoney(val: unknown): string {
  const n = Number(val);
  if (!n) return "0 so'm";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M so'm`;
  return `${n.toLocaleString()} so'm`;
}
