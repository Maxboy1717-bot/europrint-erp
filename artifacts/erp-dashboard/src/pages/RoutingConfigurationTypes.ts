/**
 * @module RoutingConfigurationTypes
 * @description Shared TypeScript interfaces, Zod validation schemas, and
 * default form-state constants for the Routing Configuration feature.
 * No JSX — safe to import from both .ts and .tsx modules.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface Routing {
  id: string;
  routingNumber: string;
  productId: string;
  version: string;
  status: string;
  effectiveFrom: string | null;
}

export interface Operation {
  id: string;
  routingId: string;
  operationNumber: string;
  operationName: string;
  workCenterId: string;
  sequence: number;
  setupTime: number;
  machineTime: number;
  laborTime: number;
  description: string | null;
}

export interface Product {
  id: string;
  code: string;
  name: string;
}

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
}

/** Combined query-result shapes returned by React Query */
export type RoutingWithProduct = { routing: Routing; product: Product };
export type OperationWithWorkCenter = { operation: Operation; workCenter: WorkCenter };

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const routingFormSchema = z.object({
  productId: z.string().min(1, "Mahsulotni tanlang"),
  routingNumber: z
    .string()
    .min(1, "Marshrut raqamini kiriting")
    .max(50, "Raqam 50 belgidan oshmasligi kerak"),
  version: z
    .string()
    .min(1, "Versiyani kiriting")
    .max(20, "Versiya 20 belgidan oshmasligi kerak"),
  status: z.string().min(1, "Statusni tanlang"),
  effectiveFrom: z.string().min(1, "Boshlanish sanasini kiriting"),
});

export const operationFormSchema = z.object({
  operationNumber: z
    .string()
    .min(1, "Operatsiya raqamini kiriting")
    .max(50, "Raqam 50 belgidan oshmasligi kerak"),
  operationName: z
    .string()
    .min(1, "Operatsiya nomini kiriting")
    .max(200, "Nom 200 belgidan oshmasligi kerak"),
  workCenterId: z.string().min(1, "Ish markazini tanlang"),
  sequence: z
    .number()
    .min(1, "Tartib raqami kamida 1 bo'lishi kerak")
    .max(9999, "Tartib raqami 9999 dan oshmasligi kerak"),
  setupTime: z.number().min(0, "Sozlash vaqti 0 dan kam bo'lmasligi kerak"),
  machineTime: z.number().min(0, "Mashina vaqti 0 dan kam bo'lmasligi kerak"),
  laborTime: z.number().min(0, "Ish vaqti 0 dan kam bo'lmasligi kerak"),
  description: z.string().max(1000, "Tavsif 1000 belgidan oshmasligi kerak"),
});

// ---------------------------------------------------------------------------
// Inferred form-state types
// ---------------------------------------------------------------------------

export type RoutingFormState = z.infer<typeof routingFormSchema>;
export type OperationFormState = z.infer<typeof operationFormSchema>;

// ---------------------------------------------------------------------------
// Default form values (factory functions so each call gets a fresh object)
// ---------------------------------------------------------------------------

export const defaultRoutingForm = (): RoutingFormState => ({
  productId: "",
  routingNumber: "",
  version: "1.0",
  status: "active",
  effectiveFrom: new Date().toISOString().split("T")[0],
});

export const defaultOperationForm = (): OperationFormState => ({
  operationNumber: "",
  operationName: "",
  workCenterId: "",
  sequence: 10,
  setupTime: 0,
  machineTime: 0,
  laborTime: 0,
  description: "",
});

// ---------------------------------------------------------------------------
// Pure helper utilities (no side-effects, no hooks)
// ---------------------------------------------------------------------------

/** Returns operations for a given routing sorted by sequence. */
export function getRoutingOperations(
  operations: OperationWithWorkCenter[],
  routingId: string
): OperationWithWorkCenter[] {
  return (Array.isArray(operations) ? operations : [])
    .filter((item) => item.operation.routingId === routingId)
    .sort((a, b) => a.operation.sequence - b.operation.sequence);
}

/** Returns a human-readable product label or falls back to the raw id. */
export function getProductName(products: Product[], productId: string): string {
  const product = (Array.isArray(products) ? products : []).find(
    (p) => p.id === productId
  );
  return product ? `${product.name} (${product.code})` : productId;
}

/** Returns a human-readable work-center label or falls back to the raw id. */
export function getWorkCenterName(
  workCenters: WorkCenter[],
  wcId: string
): string {
  const wc = (Array.isArray(workCenters) ? workCenters : []).find(
    (w) => w.id === wcId
  );
  return wc ? wc.name : wcId;
}
