/**
 * @module QuickCreateModalTypes
 * @description Shared types + option lists + entity label/icon maps for the
 * QuickCreateModal page. JSX-free where reasonable — icons remain in a .tsx
 * map to keep this file importable from .ts callers.
 */
import { tLabel } from "@/lib/i18n/tLabel";

export interface DuplicateEntry {
  id: number;
  name?: string;
  title?: string;
}

export const SOURCE_OPTIONS = [
  { value: "CALL",     label: tLabel("crm.source.call",     "Qo'ng'iroq") },
  { value: "WEBFORM",  label: tLabel("crm.source.webform",  "Veb-forma") },
  { value: "TELEGRAM", label: "Telegram" },
  { value: "EMAIL",    label: "Email" },
  { value: "WEB",      label: tLabel("crm.source.web",      "Veb-sayt") },
  { value: "INBOUND",  label: tLabel("crm.source.inbound",  "Kiruvchi") },
  { value: "PARTNER",  label: tLabel("crm.source.partner",  "Hamkor") },
  { value: "OTHER",    label: tLabel("crm.source.other",    "Boshqa") },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "UZS", label: tLabel("crm.currency.uzs", "UZS — So'm") },
  { value: "USD", label: tLabel("crm.currency.usd", "USD — Dollar") },
  { value: "EUR", label: tLabel("crm.currency.eur", "EUR — Yevro") },
  { value: "RUB", label: tLabel("crm.currency.rub", "RUB — Rubl") },
] as const;

export interface QuickCreateFormState {
  title: string;
  phone: string;
  email: string;
  stir: string;
  source: string;
  description: string;
  amount: string;
  currency: string;
  // SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3 §2.1 (2026-08-06 fix): a deal must be
  // traceable to a company (CRM-FK-01, QuickDealSchema.companyId is required) — this
  // modal never collected one, so every "quick create deal" attempt was rejected.
  companyId: string;
}

export const INITIAL_FORM_STATE: QuickCreateFormState = {
  title: "",
  phone: "",
  email: "",
  stir: "",
  source: "",
  description: "",
  amount: "",
  currency: "UZS",
  companyId: "",
};
