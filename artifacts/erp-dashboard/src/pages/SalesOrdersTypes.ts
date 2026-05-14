/**
 * @module SalesOrdersTypes
 * @description Shared TypeScript interfaces, types, and helper functions for SalesOrders module.
 * No JSX — pure TypeScript only.
 */

import type { SalesOrder } from "@shared/schema";

/** Shape of a CRM contact record returned by /api/crm/contacts */
export interface CustomerRecord {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  companyName?: string;
  contactPerson?: string;
}

/** Shape of a CRM deal record returned by /api/crm/deals */
export interface DealRecord {
  id: string;
  title: string;
}

/** Returns the display name for a customer given their id and the customers list */
export function getCustomerName(
  customerId: string | null,
  customers: CustomerRecord[]
): string {
  if (!customerId) return "-";
  const customer = (Array.isArray(customers) ? customers : []).find(
    (c) => c.id === customerId
  );
  return customer?.companyName || customer?.contactPerson || customer?.company || "-";
}

/** Derive aggregate counts for the stats grid */
export interface SalesOrderStats {
  total: number;
  inProcess: number;
  fullyDelivered: number;
  fullyBilled: number;
}

export function computeStats(salesOrders: SalesOrder[]): SalesOrderStats {
  const list = Array.isArray(salesOrders) ? salesOrders : [];
  return {
    total: list.length,
    inProcess: list.filter((o) => o.overallStatus === "IN_PROCESS").length,
    fullyDelivered: list.filter((o) => o.deliveryStatus === "FULLY_DELIVERED").length,
    fullyBilled: list.filter((o) => o.billingStatus === "FULLY_BILLED").length,
  };
}
