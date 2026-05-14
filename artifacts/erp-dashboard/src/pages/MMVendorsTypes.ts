/**
 * @module MMVendorsTypes
 * @description Shared interfaces, Zod schemas, derived types, and constants for the
 * MMVendors feature. No JSX — pure TypeScript.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Domain model
// ---------------------------------------------------------------------------

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  nameRu: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  currency: string | null;
  isActive: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Form schema & derived type
// ---------------------------------------------------------------------------

export const vendorFormSchema = z.object({
  vendorCode: z.string().min(1, "Vendor kodi kerak"),
  name: z.string().min(1, "Nomi kerak"),
  nameRu: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Noto'g'ri email formati").optional().or(z.literal("")),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  currency: z.string().default("UZS"),
  isActive: z.boolean().default(true),
});

export type VendorFormData = z.infer<typeof vendorFormSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const VENDOR_QUERY_KEY = "/api/mm/vendors" as const;

export const VENDOR_FORM_DEFAULTS: VendorFormData = {
  vendorCode: "",
  name: "",
  nameRu: "",
  address: "",
  phone: "",
  email: "",
  taxId: "",
  paymentTerms: "",
  currency: "UZS",
  isActive: true,
};

export const PAYMENT_TERMS_OPTIONS = [
  { value: "PREPAID", label: "Oldindan to'lov" },
  { value: "NET15",   label: "NET15" },
  { value: "NET30",   label: "NET30" },
  { value: "NET60",   label: "NET60" },
  { value: "NET90",   label: "NET90" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "UZS", label: "UZS" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "RUB", label: "RUB" },
] as const;
